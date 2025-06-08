import { glob } from "glob";
import fs from "fs-extra";
import path from "node:path";
import escapeRegExp from "#utils/escapeRegExp";

const migrationsDir = path.join(import.meta.dirname, "migrations");

export default async function getMigrations(tenantId: string) {
    // Load and sort migration files
    const schemaName = `agape_app_${tenantId}`;
    const { default: orm } = await import("./orm");

    const migrationFiles = await glob("**/*.sql", {
        cwd: migrationsDir,
    }).then((files) => files.sort());

    // Build regex to replace placeholder schema for tenant
    const schemaRegex = new RegExp(
        `\\b${escapeRegExp(orm.schema)}\\b`,
        "g"
    );

    // Map each file to a loader function
    const tasks = migrationFiles.map((fileName) => [
        fileName,
        async () => {
            const filePath = path.join(migrationsDir, fileName);
            const rawSql = await fs.readFile(filePath, "utf8");
            return rawSql.replace(schemaRegex, schemaName);
        },
    ] as const);

    const migrationSqlMap = Object.fromEntries(
        await Promise.all(tasks)
    );

    // Update ORM schema for subsequent imports
    orm.schema = schemaName;

    // Importante cargar los despues de actualizar el singleton de la configuracion con el schema correspondiente para mantener la consistencia del ORM con la base de datos
    const { agape } = await import("#models/agape");

    return { schemaName, migrationFiles, migrationSqlMap, agape } as const;
}