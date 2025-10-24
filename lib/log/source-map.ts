import path from 'node:path';
import fs from "fs-extra";
import { SourceMapConsumer } from 'source-map';

const sourceMapsDir = path.resolve("source-map");

export default async function parseStackWeb(stack: string) {
    const lines: string[] = [];

    for (const line of stack.split('\n')) {
        const m = line.match(
            /^\s*at\s+(?:(.*?)\s+\()?(?:https?:\/\/[^\/]+)?\/?([^():]+\.js):(\d+):(\d+)\)?$/
        );

        if (!m) {
            lines.push(line)
            continue;
        }

        // si coincide, desempacamos:
        const fnName = m[1] || '';
        const relPath = m[2];                  // ej. 'assets/index-DzMj0szI.js' o 'node_modules/.../file.js'
        const lineNum = parseInt(m[3], 10);
        const colNum = parseInt(m[4], 10);

        // construimos la ruta al sourcemap:
        const mapPath = path.join(
            sourceMapsDir,      // tu carpeta base de .map
            ...relPath.split('/'),
        ) + '.map';

        if (!await fs.exists(mapPath)) {
            lines.push(line);
            continue;
        }

        try {
            const rawMap = fs.readFileSync(mapPath, 'utf8');
            const consumer = await new SourceMapConsumer(rawMap);
            const orig = consumer.originalPositionFor({ line: lineNum, column: colNum });

            if (orig && orig.source) {
                const source = orig.source.replace(/\.\.\/\.\.\/\.\.\//g, '');

                if (fnName) {
                    lines.push(`  at ${fnName} (${source}:${orig.line}:${orig.column})`);
                } else {
                    lines.push(`  at (${source}:${orig.line}:${orig.column})`);
                }
            } else {
                lines.push(line);  // si no resolvió, mostramos el original
            }
            consumer.destroy();
        } catch (err) {
            //console.error(`Error leyendo sourcemap ${mapPath}:`, err);
            lines.push(line);
        }
    }

    console.log(lines.join('\n'));
}