const path = require("path");
const fs = require("fs-extra");
const { glob } = require("glob");
const { toPosix, toServiceEndpoint, LoadRoutePaths } = require("../lib/rpc");
const { exec, execSync } = require("child_process");
const makeRcp = require.resolve("../lib/rpc/call/browser.js");

buildBrowser().catch((err) => {
  throw err;
});

async function buildBrowser() {
  const paths = await LoadRoutePaths();
  await Promise.all(paths.map((ts) => toBrowser(ts)));

  await authRPC();
}

async function authRPC() {
  await fs.outputFile(
    "agape/access/index.js",
    `export * from "../../lib/auth/browser";`
  );
}

async function toBrowser(filename) {
  if (
    !filename.endsWith(".ts") ||
    filename.endsWith(".d.ts") ||
    filename.includes("auth")
  ) {
    return;
  }

  //console.log(filename);

  const ts = path.resolve("agape", filename);
  const js = path.resolve("agape", filename.replace(".ts", ".js"));

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
  const agapeModule = toServiceEndpoint(toPosix(filename));

  Object.entries(module)
    .filter(([, value]) => typeof value === "function")
    .forEach(([exportName]) => {
      const endpoint = path.posix.join(
        agapeModule,
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
