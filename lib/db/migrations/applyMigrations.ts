import path from "node:path";
import fs from "fs-extra";
import type { Pool } from "pg";
import logger from "#lib/log/logger";
import { toRegExp } from "#utils/toRegExp";
import { glob } from "node:fs/promises";

const lockKey: bigint = 123456789n;

export default async function applyMigrations(
  schema: string,
  pg: Pool,
  skipSeeds = false,
  attempt = 0
) {
  const { migrations, migrationSqlMap } = await loadMigrations(
    schema,
    skipSeeds
  );

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

    logger.scope("Database").warn("Warning: Migration process started");

    // Obtener migracion para iniciar el proceso de sincronizacion automatico
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
    for (const sql of pendingMigrations) {
      const query = await migrationSqlMap[sql]();

      await pg.query(query);
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

    return applyMigrations(schema, pg, skipSeeds, attempt + 1);
  } finally {
    if (acquired) {
      await unlock(pg, lockKey);
    }
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

async function loadMigrations(schemaName: string, skipSeeds = false) {
  const migrationsDir = path.join(import.meta.dirname, "scripts");

  const src = path.resolve(
    import.meta.dirname,
    "scripts",
    "meta",
    "0000_snapshot.json"
  );
  const snapshot = await fs.readJSON(src);

  const [schema] = Object.keys(snapshot.schemas);

  // Build regex to replace placeholder schema for tenant
  const schemaRegex = toRegExp(schema);

  const sqlFiles = await Array.fromAsync(
    glob("**/*.sql", { cwd: migrationsDir })
  );

  if (skipSeeds) {
    sqlFiles.filter((fileName) => !fileName.includes("_seed_"));
  }

  // Map each file to a loader function
  const tasks = sqlFiles.sort().map((fileName) => {
    const migrationName = fileName.replace(/\.sql$/, "");
    return [
      migrationName,
      async () => {
        const filePath = path.join(migrationsDir, fileName);
        const rawSql = await fs.readFile(filePath, "utf8");
        return rawSql.replace(schemaRegex, schemaName);
      },
    ] as const;
  });

  const migrationSqlMap = Object.fromEntries(await Promise.all(tasks));
  const migrations = Object.keys(migrationSqlMap).sort();

  return { migrations, migrationSqlMap } as const;
}

export async function deleteSchema(schemaName: string, pg: Pool) {
  await pg.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
}

function delay(ms = 1000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
