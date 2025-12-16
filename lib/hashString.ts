import { createHash } from "node:crypto";

export default function hashString(value: string, length: number = 60): string {
    return createHash("sha256")
        .update(value, "utf8")
        .digest("hex")
        .slice(0, length);
}