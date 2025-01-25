const path = require("path");
const fs = require("fs-extra");
const { glob } = require("glob");
const { toPosix, toServiceEndpoint } = require("../lib/rpc");
const { exec, execSync } = require("child_process");
const makeRcp = require.resolve("../lib/rpc/call/browser.js");

const src = path.resolve("service");
const watch = process.argv.includes("--watch");
const isChild = process.argv.includes("--ts");

if (isChild) {
  const [, , , filename] = process.argv;
  console.log(filename);

  toBrowser(filename)
    .catch(() => {})
    .finally(() => {
      process.exit();
    });
} else {
  if (watch) {
    fs.watch(src, { recursive: true }, (event, filename) => {
      if (!filename.endsWith(".ts")) {
        return;
      }

      //console.log({ event, filename });

      exec(
        `node -r ts-node/register ${__filename} --ts service/${toPosix(
          filename
        )}`
      );
    });
  }

  buildBrowser().catch((err) => {
    throw err;
  });
}

async function buildBrowser() {
  const paths = await glob("service/**/*.ts");
  await Promise.all(paths.map((ts) => toBrowser(ts)));
  
  await authRPC();
}

async function authRPC() {
  await fs.outputFile(
    "dist/browser/service/auth/index.js",
    `export * from "../../../../lib/auth/browser"`
  );
}

async function toBrowser(filename) {
  if (!filename.endsWith(".ts") || filename.endsWith(".d.ts")) {
    return;
  }

  const ts = path.resolve(filename);
  const js = path.resolve("dist/browser", filename.replace(".ts", ".js"));

  if (!(await fs.exists(ts)) && (await fs.exists(js))) {
    await fs.remove(js);
    return;
  }

  const jsData = [];

  jsData.push(
    `import makeRcp from "${toPosix(
      path.relative(path.dirname(js), makeRcp)
    )}"\n`
  );

  const module = await import(ts);
  const serviceModule = toServiceEndpoint(toPosix(filename));

  Object.entries(module)
    .filter(([, value]) => typeof value === "function")
    .forEach(([exportName]) => {
      const endpoint = path.posix.join(
        serviceModule,
        exportName !== "default" ? exportName : ""
      );

      jsData.push(
        exportName !== "default"
          ? `export const ${exportName} = makeRcp("${endpoint}");`
          : `export default makeRcp("${endpoint}");`
      );
    });

  return fs.outputFile(js, jsData.join("\n"));
}
