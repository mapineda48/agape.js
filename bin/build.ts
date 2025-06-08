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


// Extensiones que Node ESM acepta (en orden de preferencia)
const exts = [".js", ".cjs", ".mjs"];

// Para simplificar, calculamos el root de dist
const distRoot = path.resolve("dist");

/**
 * Intenta resolver un specifier:
 * 1) Si es relativo o absoluto, como antes
 * 2) Si coincide con un alias de package.json → lo mapea y aplica mismas comprobaciones
 */
function resolveImport(spec, basedir) {
    if (spec === ".") {
        const base = path.resolve(basedir, spec);

        for (const ext of exts) {
            const idx = path.join(base, "index" + ext);
            if (fs.existsSync(idx)) return "./index" + ext;
        }

        return null;
    }

    // 1) Rutas relativas / absolutas
    if (spec.startsWith(".") || spec.startsWith("/")) {
        const base = path.resolve(basedir, spec);
        for (const ext of exts) {
            if (fs.existsSync(base + ext)) return spec + ext;
        }
        for (const ext of exts) {
            const idx = path.join(base, "index" + ext);
            if (fs.existsSync(idx)) return path.posix.join(spec, "index" + ext);
        }
        return null;
    }

    // 2) Alias (package.json → imports)
    for (const [aliasPattern, targetPattern] of Object.entries(imports)) {
        // => Alias con wildcard "#utils/*": "./lib/utils/*.ts"
        if (aliasPattern.endsWith("/*") && targetPattern.endsWith("/*.ts")) {
            const aliasPrefix = aliasPattern.replace("/*", "");      // "#utils"
            const targetPrefix = targetPattern.replace("/*.ts", ""); // "./lib/utils"
            if (spec === aliasPrefix || spec.startsWith(aliasPrefix + "/")) {
                // Suffix puede ser "" o "/foo/bar"
                const suffix = spec.slice(aliasPrefix.length);
                // Ruta sin extensión: "./lib/utils" + "/foo/bar"
                const relPath = path.join(targetPrefix, suffix);
                // Comprobamos ficheros en dist/
                for (const ext of exts) {
                    const full = path.resolve(distRoot, relPath + ext);
                    if (fs.existsSync(full)) return spec + ext;
                }
                // Comprobamos posibles index
                for (const ext of exts) {
                    const idx = path.resolve(distRoot, relPath, "index" + ext);
                    if (fs.existsSync(idx)) return spec + "/index" + ext;
                }
            }
        }
        // => Alias estático (sin wildcard) "#session": "./lib/access/session.ts"
        // if (!aliasPattern.includes("*") && spec === aliasPattern) {
        //   const withoutExt = targetPattern.replace(/\.(t|j)s$/, ""); // "./lib/access/session"
        //   for (const ext of exts) {
        //     const full = path.resolve(distRoot, withoutExt + ext);
        //     if (fs.existsSync(full)) return spec + ext;
        //   }
        // }
    }

    // Nada
    return null;
}

// Expresiones para detectar imports/exports dinámicos
const importFromRe = /(import\s+[^'"\n]+?\s+from\s+)['"]([^'"]+)['"]/g;
const exportFromRe = /(export\s+[^'"\n]+?\s+from\s+)['"]([^'"]+)['"]/g;
const dynamicImportRe = /(import\()\s*['"]([^'"]+)['"](\s*\))/g;

// Recorremos todos los .js en dist/
const files = glob
    .sync("**/*.js", { cwd: distRoot, ignore: ["www/**/*.js"] })
    .map(f => path.join(distRoot, f));

files.forEach(file => {
    let code = fs.readFileSync(file, "utf8");
    const dir = path.dirname(file);

    // import ... from '...'
    code = code.replace(importFromRe, (all, p1, spec) => {
        const r = resolveImport(spec, dir);
        return r ? `${p1}'${r.replace(/\\/g, "/")}'` : all;
    });
    // export ... from '...'
    code = code.replace(exportFromRe, (all, p1, spec) => {
        const r = resolveImport(spec, dir);
        return r ? `${p1}'${r.replace(/\\/g, "/")}'` : all;
    });
    // import('...')
    code = code.replace(dynamicImportRe, (all, p1, spec, p3) => {
        const r = resolveImport(spec, dir);
        return r ? `${p1}'${r.replace(/\\/g, "/")}'${p3}` : all;
    });

    fs.writeFileSync(file, code, "utf8");
});


console.log(`✔️  Fixed import extensions in ${files.length} files.`);


/**
 * Migrations
 */

await fs.copy("lib/db/migrations", "dist/lib/db/migrations");

/**
 * Source Maps
 */
const maps = await glob.glob("**/*.map", { cwd: path.resolve("dist/web") });

const entries = maps.map(r => ({
    src: path.resolve("dist/web", r),
    dest: path.resolve("dist/web-source-maps", r),
}));

const tasks = entries.map(({ src, dest }) => fs.move(src, dest));

await Promise.all(tasks);

/**
 * Crear Packages JSON de produccion con la configuracion minima
 */

fs.outputJSONSync("dist/package.json", {
    name,
    version,
    type,
    dependencies,
    scripts: {
        start: "node bin/cluster.js"
    },
    imports: Object.fromEntries(
        Object.entries(imports).map(([key, path]) => [key, path.replace("*.ts", "*").replace(".ts", ".js")])
    )
}, { spaces: 2 })