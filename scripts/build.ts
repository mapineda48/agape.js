import { execSync } from "child_process";
import fs from "fs-extra";
import { name, dependencies, version } from "../package.json";

if (process.argv.includes("build")) {
    require("next/dist/bin/next");
} else {
    fs.removeSync("dist");

    execSync(`tsc -p tsconfig.node.json `, { stdio: "inherit" });
    execSync(`ts-node ./scripts/browser.js`, { stdio: "inherit" });
    execSync(`ts-node -r module-alias/register --transpile-only "${__filename}" build`, { stdio: "inherit" });

    fs.copySync(".next", "dist/.next", { overwrite: true });
    fs.removeSync(".next");

    fs.outputJSONSync("dist/package.json", {
        name,
        version,
        dependencies,
        scripts: {
            start: "node -r module-alias/register server.js"
        },
        _moduleAliases: {
            ["@dist"]: "./agape"
        }
    })
}



