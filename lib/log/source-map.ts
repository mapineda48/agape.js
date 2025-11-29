import path from "node:path";
import fs from "fs-extra";
import { SourceMapConsumer } from "source-map";
import { parse } from "stacktrace-parser";

// Intentamos localizar la carpeta de source-maps
// En producción (dist), suelen estar en dist/web/source-map (si corremos desde root)
// o en web/source-map (si corremos desde dist)
const possibleDirs = [
  path.resolve("dist/web/source-map"),
  path.resolve("web/source-map"),
  path.resolve("source-map"), // Fallback original
];

const sourceMapsDir =
  possibleDirs.find((d) => fs.existsSync(d)) || possibleDirs[0];

export default async function parseStackWeb(stack: string) {
  const lines: string[] = [];
  const frames = parse(stack);

  if (frames.length === 0) {
    // Si no se pudo parsear nada, devolvemos el stack original
    console.log(stack);
    return;
  }

  for (const frame of frames) {
    // frame: { file, methodName, lineNumber, column }
    if (!frame.file || !frame.lineNumber || !frame.column) {
      lines.push(
        `  at ${frame.methodName || "<unknown>"} (${
          frame.file || "<unknown>"
        }:${frame.lineNumber || "?"}:${frame.column || "?"})`
      );
      continue;
    }

    let relPath = frame.file;
    try {
      // Intentamos extraer el pathname si es una URL
      if (relPath.startsWith("http:") || relPath.startsWith("https:")) {
        const url = new URL(relPath);
        relPath = url.pathname;
      }
    } catch (e) {
      // Ignoramos error de URL inválida
    }

    // Quitamos slash inicial si existe para path.join
    if (relPath.startsWith("/")) {
      relPath = relPath.slice(1);
    }

    const mapPath = path.join(sourceMapsDir, relPath) + ".map";

    if (!(await fs.exists(mapPath))) {
      lines.push(
        `  at ${frame.methodName || "<unknown>"} (${frame.file}:${
          frame.lineNumber
        }:${frame.column})`
      );
      continue;
    }

    try {
      const rawMap = await fs.readFile(mapPath, "utf8");
      const consumer = await new SourceMapConsumer(rawMap);
      const orig = consumer.originalPositionFor({
        line: frame.lineNumber,
        column: frame.column,
      });

      if (orig && orig.source) {
        const source = orig.source.replace(/\.\.\/\.\.\/\.\.\//g, ""); // Limpieza de rutas relativas
        const name = orig.name || frame.methodName || "";

        if (name) {
          lines.push(`  at ${name} (${source}:${orig.line}:${orig.column})`);
        } else {
          lines.push(`  at ${source}:${orig.line}:${orig.column}`);
        }
      } else {
        lines.push(
          `  at ${frame.methodName || "<unknown>"} (${frame.file}:${
            frame.lineNumber
          }:${frame.column})`
        );
      }
      consumer.destroy();
    } catch (err) {
      // Si falla el sourcemap, mostramos el original
      lines.push(
        `  at ${frame.methodName || "<unknown>"} (${frame.file}:${
          frame.lineNumber
        }:${frame.column})`
      );
    }
  }

  console.log(lines.join("\n"));
}
