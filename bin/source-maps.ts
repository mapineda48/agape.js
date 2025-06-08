import * as glob from "glob";
import path from "node:path";
import fs from "fs-extra";


const maps = await glob.glob("**/*.map", { cwd: path.resolve("dist/web") });

const entries = maps.map(r => ({
    src: path.resolve("dist/web", r),
    dest: path.resolve("dist/web-source-maps", r),
}));

const tasks = entries.map(({ src, dest }) => fs.move(src, dest));

await Promise.all(tasks);

console.log("ready!!")