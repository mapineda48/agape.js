import path from "node:path";
import fs from "fs-extra";
import type { Pool } from "pg";
import logger from "#lib/log/logger";
import config from "./config";
import { toRegExp } from "#utils/toRegExp";
import { glob } from "node:fs/promises";


const lockKey: bigint = 123456789n;

export default async function applyMigrations(pg: Pool, dev: boolean, attempt = 0) {
    // if (dev) {
    //     logger.log("[database] Modo desarrollo: omitiendo migraciones - Recuerde usar el comando 'pnpm drizzle-kit push'");
    //     return;
    // }

    const { migrations, migrationSqlMap } = await loadMigrations();

    if (attempt >= 5) {
        throw new Error(
            "No fue posible sincronizar el ORM con la base de datos, por favor validar los logs..."
        );
    }

    // libera solo si tú lo tienes; devuelve true si se liberó
    const acquired = await lock(pg, lockKey);

    try {
        if (!acquired) {
            throw new Error(
                "No se pudo obtener el bloqueo advisory para migraciones"
            );
        }

        logger.warning("[database] Advertencia: Proceso Migraciones Iniciado");

        // Obtener migracion para iniciar el proceso de sincronizacion automatico
        const pendingMigrations: string[] = [];
        const appliedMigrations = await fetchAppliedMigrations(pg, config.schema);

        if (appliedMigrations.length > migrations.length) {
            throw new Error(
                "No es posible sincronizar el ORM, tiene migraciones más nuevas que las soportadas por este cliente"
            );
        }

        // Determine pending migrations
        pendingMigrations.push(
            ...migrations.slice(appliedMigrations.length)
        );

        if (!pendingMigrations.length) {
            logger.log("[database] Migraciones: Ya estan sincronizado");
            return;
        }

        // Run pending migrations
        for (const sql of pendingMigrations) {
            const query = await migrationSqlMap[sql]();

            await pg.query(query);
        }

        await saveAppliedMigrations(pg, migrations);

        logger.log("[database] Migraciones: Instaladas completamente");
    } catch (error) {
        logger.error("[database] ", error);

        logger.error(
            "[database] Migraciones: Fallida instalación de migraciones... reintentando en 1 segundo"
        );

        // Wait 1 second before retry
        await delay(1000);

        return applyMigrations(pg, dev, attempt + 1)
    } finally {
        if (acquired) {
            await unlock(pg, lockKey)
        }
    }
}


async function lock(pg: Pool, lockKey: bigint) {
    const { rows: [{ acquired } = {}] } = await pg.query<{ acquired: boolean; }>(
        'SELECT pg_try_advisory_lock($1)::bool AS acquired;',
        [lockKey]
    );

    return acquired;
}

async function unlock(pg: Pool, lockKey: bigint) {
    const { rows: [{ released } = {}] } = await pg.query<{ released: boolean }>(
        'SELECT pg_advisory_unlock($1) AS released;',
        [lockKey]
    );

    return released;
}

export async function schemaExists(pg: Pool, schemaName: string) {
    var query = `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.schemata
        WHERE schema_name = $1
      ) AS exists;
    `;

    const { rows: [{ exists } = {}] } = await pg.query<{ exists: boolean }>(
        query,
        [schemaName]
    );

    return exists;
}

export async function saveAppliedMigrations(pg: Pool, migrationFiles: string[]) {
    const json = JSON.stringify(migrationFiles);

    await pg.query(`
    INSERT INTO "${config.schema}"."agape" (key, value)
    VALUES ($1, $2::jsonb)
    ON CONFLICT (key)
    DO UPDATE
      SET value = EXCLUDED.value;
    `,
        ["migrations", json]
    );
}

async function fetchAppliedMigrations(pg: Pool, schemaName: string) {
    if (!(await schemaExists(pg, schemaName))) {
        logger.log(`[database] Migraciones: No existe schema: ${schemaName}`);

        return [];
    }

    logger.log(`[database] Migraciones: Existe schema: ${schemaName}`);

    const query = `
    SELECT value AS applied
    FROM "${schemaName}"."agape"
    WHERE key = $1;
  `;

    const values = ["migrations"];

    const { rows } = await pg.query(query, values);

    // si existe un registro, devuelve el valor, si no, null
    const appliedMigrations = rows[0]?.applied ?? [];

    return appliedMigrations as string[];
}

async function loadMigrations() {
    const migrationsDir = path.join(import.meta.dirname, "migrations");

    const src = path.resolve(import.meta.dirname, "migrations", "meta", "0000_snapshot.json")
    const snapshot = await fs.readJSON(src)

    const [schema] = Object.keys(snapshot.schemas);

    // Build regex to replace placeholder schema for tenant
    const schemaRegex = toRegExp(schema);

    const sql = await Array.fromAsync(glob("**/*.sql", { cwd: migrationsDir }))

    // Map each file to a loader function
    const tasks = sql.sort().map((fileName) => [
        fileName,
        async () => {
            const filePath = path.join(migrationsDir, fileName);
            const rawSql = await fs.readFile(filePath, "utf8");
            return rawSql.replace(schemaRegex, config.schema);
        },
    ] as const);

    const migrationSqlMap = Object.fromEntries(
        await Promise.all(tasks)
    );

    return { migrations: sql, migrationSqlMap } as const;
}

function delay(ms = 1000): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}