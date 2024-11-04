import fs from "fs-extra";
import { dependencies as backend } from "./package.json";
import { dependencies as frontend } from "../frontend/package.json";
import { name, version } from "../../package.json";

fs.outputJSONSync(
  "dist/package.json",
  {
    name,
    version,
    private: true,
    scripts: {
      start: "node -r module-alias/register bin/index.js",
      cluster: "node -r module-alias/register bin/cluster.js",
    },
    dependencies: {
      ...frontend,
      ...backend,
      ["module-alias"]: "2.2.3",
      // https://www.npmjs.com/package/source-map-support
    },
    _moduleAliases: {
      backend: ".", // Application's root
    },
  },
  { spaces: 2 }
);

fs.outputFileSync("dist/service/auth.js", 'module.exports = require("../lib/auth/server");');
fs.moveSync("../frontend/dist", "dist/lib/spa", { overwrite: true });

fs.copySync("dist", "../../dist", { overwrite: true });
