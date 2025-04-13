import * as glob from 'glob';
import path from 'node:path';

const res = Object.fromEntries(
    glob.sync("**/*.ts", { cwd: path.resolve("agape") })
        .filter(r => r !== "index.ts")
        .map(r => r.replace("\\", "/"))
        .map(r => [r.replace(".ts", ""), r])
        .map(([mod, path]) => [mod.endsWith("/index") ? mod.replace("/index", "") : mod, path])
        .map(([mod, path]) => ["@agape/" + mod, "@agape/" + path]));

export default res;