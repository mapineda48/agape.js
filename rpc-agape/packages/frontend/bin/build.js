const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");

const isDev = process.argv.includes("--dev");

if (isDev) {
  writePaths();

  fs.watch(path.resolve("src/app"), (event, filename) => {
    if (!filename) {
      return;
    }

    if (event !== "rename") {
      return;
    }

    writePaths();
  });

  require("react-scripts/scripts/start");
} else {
  writePaths();
  require("react-scripts/scripts/build");
}

function writePaths() {
  fs.outputFileSync(
    "src/router/paths.js",
    `export default [${glob
      .sync("**/*.tsx", { cwd: path.resolve("src", "app") })
      .map((path) => {
        const file = path.replace(/\\/g, "/");

        let route =
          "/" +
          path
            .replace(/\\/g, "/")
            .replace(".tsx", "")
            .replace(/index$/, "")
            .toLowerCase();

        return `["${route}", () => import("app/${file}")]`;
      })
      .join(",")}]`
  );
}
