#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

/**
 * CLI:
 *  node scripts/collect-jsdoc-scope.mjs --tag scope --out scope-index.json
 *  node scripts/collect-jsdoc-scope.mjs --tag scope --out scope-index.json --pretty
 */

function parseArgs(argv) {
    const args = { tag: "scope", out: "scope-index.json", pretty: false };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--tag") args.tag = argv[++i] ?? args.tag;
        else if (a === "--out") args.out = argv[++i] ?? args.out;
        else if (a === "--pretty") args.pretty = true;
        else if (a === "--help" || a === "-h") args.help = true;
    }
    return args;
}

function usage() {
    console.log(`
Usage:
  node scripts/collect-jsdoc-scope.mjs [--tag scope] [--out file.json] [--pretty]

Example:
  node scripts/collect-jsdoc-scope.mjs --tag scope --out scope-index.json --pretty
`);
}

function readTsConfig(tsconfigPath) {
    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    if (configFile.error) {
        throw new Error(
            ts.formatDiagnosticsWithColorAndContext([configFile.error], {
                getCanonicalFileName: (f) => f,
                getCurrentDirectory: ts.sys.getCurrentDirectory,
                getNewLine: () => ts.sys.newLine,
            })
        );
    }

    const configDir = path.dirname(tsconfigPath);
    const parsed = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        configDir,
    /*existingOptions*/ {},
        tsconfigPath
    );

    if (parsed.errors?.length) {
        throw new Error(
            ts.formatDiagnosticsWithColorAndContext(parsed.errors, {
                getCanonicalFileName: (f) => f,
                getCurrentDirectory: ts.sys.getCurrentDirectory,
                getNewLine: () => ts.sys.newLine,
            })
        );
    }

    return parsed;
}

function getNodeName(node) {
    // function foo() {}
    if (ts.isFunctionDeclaration(node) && node.name) return node.name.text;

    // class A { method() {} }
    if (ts.isMethodDeclaration(node) && node.name) {
        if (ts.isIdentifier(node.name)) return node.name.text;
        if (ts.isStringLiteral(node.name)) return node.name.text;
        return node.name.getText();
    }

    // const foo = () => {}
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
        return node.name.text;
    }

    return "(anonymous)";
}

function getKind(node) {
    if (ts.isFunctionDeclaration(node)) return "function";
    if (ts.isMethodDeclaration(node)) return "method";
    if (ts.isVariableDeclaration(node)) return "variable-function";
    return "unknown";
}

function hasCallableInitializer(varDecl) {
    const init = varDecl.initializer;
    return (
        init &&
        (ts.isArrowFunction(init) ||
            ts.isFunctionExpression(init) ||
            ts.isCallExpression(init)) // por si usas wrapper factories (opcional)
    );
}

function collectScopesFromSourceFile(sourceFile, tagName, program) {
    const checker = program.getTypeChecker();
    const out = [];

    function considerNode(node) {
        // Nos interesan:
        // - function declarations
        // - class methods
        // - const foo = () => {}
        const isCandidate =
            ts.isFunctionDeclaration(node) ||
            ts.isMethodDeclaration(node) ||
            (ts.isVariableDeclaration(node) && hasCallableInitializer(node));

        if (!isCandidate) return;

        const tags = ts.getJSDocTags(node);
        const scopeTags = tags.filter((t) => t.tagName?.text === tagName);
        if (!scopeTags.length) return;

        // Tomamos el primer @scope, pero si quieres soportar múltiples, se puede
        const scopeValueRaw = scopeTags[0].comment;
        const scopeValue =
            typeof scopeValueRaw === "string"
                ? scopeValueRaw.trim()
                : Array.isArray(scopeValueRaw)
                    ? scopeValueRaw.map((p) => p.text).join("").trim()
                    : "";

        if (!scopeValue) return;

        const pos = node.getStart(sourceFile, /*includeJsDocComment*/ false);
        const { line } = sourceFile.getLineAndCharacterOfPosition(pos);

        out.push({
            scope: scopeValue,
            name: getNodeName(node),
            kind: getKind(node),
            line: line + 1,
        });
    }

    function visit(node) {
        considerNode(node);
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return out;
}

async function main() {
    const args = parseArgs(process.argv);
    if (args.help) {
        usage();
        process.exit(0);
    }

    const root = process.cwd();
    const tsconfigPath = path.join(root, "tsconfig.app.json");

    // Lee tsconfig y arma el Program
    const parsed = readTsConfig(tsconfigPath);

    const program = ts.createProgram({
        rootNames: parsed.fileNames,
        options: parsed.options,
    });

    const result = {
        tag: `@${args.tag}`,
        generatedAt: new Date().toISOString(),
        scopes: {}, // scope -> entries[]
    };

    for (const sf of program.getSourceFiles()) {
        // Ignora d.ts y node_modules (por si entran)
        if (sf.isDeclarationFile) continue;
        if (sf.fileName.includes("node_modules")) continue;

        const entries = collectScopesFromSourceFile(sf, args.tag, program);
        if (!entries.length) continue;

        const relFile = path
            .relative(root, sf.fileName)
            .replaceAll(path.sep, "/");

        for (const e of entries) {
            const key = e.scope;
            if (!result.scopes[key]) result.scopes[key] = [];

            result.scopes[key].push({
                file: relFile,
                name: e.name,
                kind: e.kind,
                line: e.line,
            });
        }
    }

    // Opcional: ordena para diffs limpios
    for (const k of Object.keys(result.scopes)) {
        result.scopes[k].sort((a, b) => {
            if (a.file !== b.file) return a.file.localeCompare(b.file);
            return a.line - b.line;
        });
    }

    const outPath = path.join(root, args.out);
    const json = JSON.stringify(result, null, args.pretty ? 2 : 0) + "\n";
    await fs.writeFile(outPath, json, "utf8");

    const scopesCount = Object.keys(result.scopes).length;
    const entriesCount = Object.values(result.scopes).reduce(
        (acc, arr) => acc + arr.length,
        0
    );

    console.log(
        `OK: wrote ${args.out} (${scopesCount} scopes, ${entriesCount} tagged symbols)`
    );
}

main().catch((err) => {
    console.error(err?.stack || String(err));
    process.exit(1);
});
