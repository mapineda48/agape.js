const fs = require("fs-extra");
const { dependencies: backend } = require("../package.json");
const { dependencies: frontend } = require("../../agape-web/package.json");
const { name, version } = require("../../../packages.json");

fs.removeSync("dist/browser");

fs.copySync("../agape-web/.next", "dist/.next", { overwrite: true });
fs.copySync("../agape-web/public", "dist/public", { overwrite: true });

fs.copySync("../agape-web/server.js", "dist/index.js", {
  overwrite: true,
});

fs.outputFileSync("dist/server/index.js", `module.exports = require("./lib");`);

fs.outputJSONSync(
  "dist/package.json",
  {
    name,
    version,
    private: true,
    scripts: {
      start: "node -r module-alias/register index.js",
    },
    dependencies: {
      ...frontend,
      ...backend,
      ["module-alias"]: "2.2.3",
      // https://www.npmjs.com/package/source-map-support
    },
    _moduleAliases: {
      ["agape-backend"]: "./server", // Application's root
    },
  },
  { spaces: 2 }
);

fs.moveSync("dist", "../../dist", { overwrite: true });
