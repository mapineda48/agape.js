import { threadId } from "node:worker_threads";
import path from "node:path";
import { createHash } from "node:crypto";
import fs from "fs-extra";
import type { Pool } from "pg";
import logger from "#lib/log/logger";
import { glob } from "node:fs/promises";

export default async function applyMigrations(
  pg: Pool,
  schema: string,
  skipSeeds = false,
  attempt = 0
) {
  const { migrations, migrationSqlMap } = await loadMigrations(skipSeeds);

  if (attempt >= 5) {
    throw new Error(
      "No fue posible sincronizar el ORM con la base de datos, por favor validar los logs..."
    );
  }

  const lockKey = stringToPgBigInt(schema);
  logger
    .scope("Database")
    .info(
      `Migrations: Lock acquired for schema ${schema} with key ${lockKey} threadId: ${threadId}`
    );

  const acquired = await lock(pg, lockKey);

  try {
    if (!acquired) {
      throw new Error(
        "No se pudo obtener el bloqueo advisory para migraciones"
      );
    }

    logger.scope("Database").warn("Warning: Migration process started");

    // Ensure schema exists
    await ensureSchema(pg, schema);

    // Get pending migrations
    const pendingMigrations: string[] = [];
    const appliedMigrations = await fetchAppliedMigrations(pg, schema);

    if (appliedMigrations.length > migrations.length) {
      throw new Error(
        "No es posible sincronizar el ORM, tiene migraciones más nuevas que las soportadas por este cliente"
      );
    }

    // Determine pending migrations
    pendingMigrations.push(...migrations.slice(appliedMigrations.length));

    if (!pendingMigrations.length) {
      logger.scope("Database").info("Migrations: Already synchronized");
      return;
    }

    // Run pending migrations
    for (const migrationName of pendingMigrations) {
      const query = await migrationSqlMap[migrationName]();

      // Replace schema placeholder with actual schema
      const sql = query.replace(/\{schema\}/g, schema);

      await pg.query(sql);
      logger.scope("Database").info(`Migration applied: ${migrationName}`);
    }

    await saveAppliedMigrations(schema, pg, migrations);

    logger.scope("Database").info("Migrations: Successfully installed");
  } catch (error) {
    logger.scope("Database").error("Error:", error);

    logger
      .scope("Database")
      .error("Migrations: Installation failed... retrying in 1 second");

    // Wait 1 second before retry
    await delay(1000);

    return applyMigrations(pg, schema, skipSeeds, attempt + 1);
  } finally {
    await unlock(pg, lockKey);
    logger
      .scope("Database")
      .info(
        `Migrations: Lock released for schema ${schema} with key ${lockKey} threadId: ${threadId}`
      );
  }
}

async function ensureSchema(pg: Pool, schemaName: string) {
  const exists = await schemaExists(pg, schemaName);
  if (!exists) {
    await pg.query(`CREATE SCHEMA "${schemaName}"`);
    logger.scope("Database").info(`Schema created: ${schemaName}`);
  }
}

async function lock(pg: Pool, lockKey: bigint) {
  const {
    rows: [{ acquired } = {}],
  } = await pg.query<{ acquired: boolean }>(
    "SELECT pg_try_advisory_lock($1)::bool AS acquired;",
    [lockKey]
  );

  return acquired;
}

async function unlock(pg: Pool, lockKey: bigint) {
  const {
    rows: [{ released } = {}],
  } = await pg.query<{ released: boolean }>(
    "SELECT pg_advisory_unlock($1) AS released;",
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

  const {
    rows: [{ exists } = {}],
  } = await pg.query<{ exists: boolean }>(query, [schemaName]);

  return exists;
}

export async function saveAppliedMigrations(
  schemaName: string,
  pg: Pool,
  migrationFiles: string[]
) {
  const json = JSON.stringify(migrationFiles);

  await pg.query(
    `
    INSERT INTO "${schemaName}"."agape" (key, value)
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
    logger
      .scope("Database")
      .info(`Migrations: Schema does not exist: ${schemaName}`);

    return [];
  }

  // Check if agape table exists
  const tableExists = await tableExistsInSchema(pg, schemaName, "agape");
  if (!tableExists) {
    return [];
  }

  logger.scope("Database").info(`Migrations: Schema exists: ${schemaName}`);

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

async function tableExistsInSchema(
  pg: Pool,
  schemaName: string,
  tableName: string
) {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = $1
      AND table_name = $2
    ) AS exists;
  `;

  const {
    rows: [{ exists } = {}],
  } = await pg.query<{ exists: boolean }>(query, [schemaName, tableName]);

  return exists;
}

async function loadMigrations(skipSeeds = false) {
  const migrationsDir = path.join(import.meta.dirname, "scripts");

  const allSqlFiles = await Array.fromAsync(
    glob("*.sql", { cwd: migrationsDir })
  );

  // Filter out seed files if skipSeeds is enabled
  const sqlFiles = skipSeeds
    ? allSqlFiles.filter((fileName) => !fileName.includes("_seed_"))
    : allSqlFiles;

  // Map each file to a loader function
  const tasks = sqlFiles.sort().map((fileName) => {
    const migrationName = fileName.replace(/\.sql$/, "");
    return [
      migrationName,
      async () => {
        const filePath = path.join(migrationsDir, fileName);
        return fs.readFile(filePath, "utf8");
      },
    ] as const;
  });

  const migrationSqlMap = Object.fromEntries(tasks);
  const migrations = Object.keys(migrationSqlMap).sort();

  return { migrations, migrationSqlMap } as const;
}

export async function deleteSchema(schemaName: string, pg: Pool) {
  logger.scope("Database").info(`Deleting schema: ${schemaName}`);

  await pg.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
}

export function stringToPgBigInt(str: string): bigint {
  const hash = createHash("sha256").update(str).digest();

  // Tomamos 8 bytes (64 bits)
  let n = BigInt("0x" + hash.subarray(0, 8).toString("hex"));

  // Forzamos que el bit más alto sea 0 → número siempre positivo y dentro de rango PG BIGINT
  n = n & BigInt("0x7FFFFFFFFFFFFFFF");

  return n;
}

function delay(ms = 1000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
