import fs from "fs-extra";
import path from "node:path";
import { glob } from "glob";
import { name, version, type, dependencies, imports } from "../package.json";

/**
 * He creado un script scripts/fix-import-extensions.js que:

  Recorre todos los .js bajo dist/.
  Detecta import, export from y import(...) con rutas relativas sin extensión.
  Aplica el algoritmo de resolución de Node (busca .js, .cjs, .mjs o index.js en carpetas).
  Sustituye el specifier añadiendo la extensión correcta.
  Mantiene la estructura de directorios intacta.
 */


// Extensions Node ESM will accept (in order)
const exts = [".js", ".cjs", ".mjs"];

/**
 * Resolve a relative import specifier to include its proper extension.
 * Returns the new specifier (e.g. './foo.js' or './bar/index.js'), or null if not a relative path or not found.
 */
function resolveImport(spec: string, basedir: string) {
    if (!spec.startsWith(".") && !spec.startsWith("/")) return null;

    const fullPath = path.resolve(basedir, spec);
    // Try as file
    for (const ext of exts) {
        if (fs.existsSync(fullPath + ext)) {
            return spec + ext;
        }
    }
    // Try as directory with index
    for (const ext of exts) {
        const idx = path.join(fullPath, "index" + ext);
        if (fs.existsSync(idx)) {
            return path.posix.join(spec, "index" + ext);
        }
    }
    return null;
}

// Patterns for different import syntaxes
const importFromRe = /(import\s+[^'"\n]+?\s+from\s+)['"]([^'"]+)['"]/g;
const exportFromRe = /(export\s+[^'"\n]+?\s+from\s+)['"]([^'"]+)['"]/g;
const dynamicImportRe = /(import\()\s*['"]([^'"]+)['"](\s*\))/g;

// Walk and process all .js files in distDir
const files = glob
    .sync("**/*.js", { cwd: path.resolve("dist") })
    .map((file) => path.resolve("dist", file));

files.forEach((file) => {
    let code = fs.readFileSync(file, "utf8");
    const dir = path.dirname(file);

    // import ... from '...';
    code = code.replace(importFromRe, (match, p1, spec) => {
        const resolved = resolveImport(spec, dir);
        if (resolved) {
            const newSpec = resolved.replace(/\\/g, "/");
            return `${p1}'${newSpec}'`;
        }
        return match;
    });
    // export ... from '...';
    code = code.replace(exportFromRe, (match, p1, spec) => {
        const resolved = resolveImport(spec, dir);
        if (resolved) {
            const newSpec = resolved.replace(/\\/g, "/");
            return `${p1}'${newSpec}'`;
        }
        return match;
    });
    // dynamic import('...')
    code = code.replace(dynamicImportRe, (match, p1, spec, p3) => {
        const resolved = resolveImport(spec, dir);
        if (resolved) {
            const newSpec = resolved.replace(/\\/g, "/");
            return `${p1}'${newSpec}'${p3}`;
        }
        return match;
    });

    fs.writeFileSync(file, code, "utf8");
});
console.log(`✔️  Fixed import extensions in ${files.length} files.`);


/**
 * Crear Packages JSON de produccion con la configuracion minima
 */

fs.outputJSONSync("dist/package.json", {
    name,
    version,
    type,
    dependencies,
    scripts: {
        start: "node bin/index.js"
    },
    imports: Object.fromEntries(
        Object.entries(imports).map(([key, path]) => [key, path.replace(".ts", ".js")])
    )
}, { spaces: 2 })