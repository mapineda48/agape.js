import path from "node:path";
import { cwd, svc, toPublicUrl } from "./path";
import { pathToFileURL } from "node:url";

const namespace = "@agape";

const virtualModule: { [endpoint: string]: string } = {};

for await (const src of svc) {
    const filename = path.join(cwd, src);

    const module = await import(pathToFileURL(filename).href);

    const moduleUrl = toPublicUrl(src);

    const resolvedId = "\0" + path.posix.join(namespace, moduleUrl);

    const js = ['import makeRcp from "@/lib/rpc";'];

    for (const [exportName, fn] of Object.entries(module)) {
        if (typeof fn !== "function") {
            continue
        };

        if (exportName === "default") {
            const endpoint = path.posix.join("/", moduleUrl);

            js.push(`export default makeRcp("${endpoint}");`);
            continue;
        }

        const endpoint = path.posix.join("/", moduleUrl, exportName);

        js.push(`export const ${exportName} = makeRcp("${endpoint}");`);
    }

    virtualModule[resolvedId] = js.join("\n");
}

console.log(JSON.stringify(virtualModule));