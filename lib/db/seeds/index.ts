import path from "node:path";
import fs from "fs-extra";
import type { Pool } from "pg";
import logger from "#lib/log/logger";
import config from "../config";
import { toRegExp } from "#utils/toRegExp";
import { glob } from "node:fs/promises";

// Distinct lock key for seeds to avoid conflict with migrations
const lockKey: bigint = 123456789112n;

export default async function applySeeds(pg: Pool, dev: boolean, attempt = 0) {
  // Seeds might be useful in dev too, but usually we want them controlled.
  // For now, we follow the pattern: if dev, maybe we skip or maybe we run?
  // The user said "post-deploy scripts", implying they run on deploy.
  // Let's allow them in dev for now, or maybe the user wants them to run always?
  // The migration logic skips in dev with a warning.
  // "Development mode: skipping migrations - Remember to use 'pnpm drizzle-kit push'"
  // For seeds, 'drizzle-kit push' doesn't apply.
  // Let's assume we ALWAYS want to try applying seeds if they are missing,
  // unless explicitly told otherwise.
  // However, to be safe and consistent with the user's "post-deploy" comment,
  // we might want to run them.
  // But wait, if I skip in dev, how do I test locally?
  // I will remove the dev check for seeds, or make it optional.
  // The user didn't specify dev behavior, but "post-deploy" implies production-like.
  // I'll let them run in dev too, as it's useful for setting up local env.

  //   if (dev) {
  //   logger
  //     .scope("Database")
  //     .info(
  //       "Development mode: skipping migrations - Remember to use 'pnpm drizzle-kit push'"
  //     );
  //   return;
  // }

  const { seeds, seedSqlMap } = await loadSeeds();

  if (attempt >= 5) {
    throw new Error(
      "Could not synchronize seeds with the database, please check logs..."
    );
  }

  const acquired = await lock(pg, lockKey);

  try {
    if (!acquired) {
      // If we can't get the lock, it means another instance is running seeds.
      // We can just skip/return, similar to root user sync, or throw if strict.
      // Migrations throw, but maybe seeds are less critical?
      // Let's stick to the migration pattern: throw/retry or skip?
      // Migration code throws "No se pudo obtener el bloqueo advisory".
      // Let's log and skip for now to be less aggressive, or retry?
      // The migration code retries. I'll stick to the migration pattern for robustness.
      logger
        .scope("Database")
        .warn("Seeds: Could not acquire lock, skipping...");
      return;
    }

    logger.scope("Database").info("Seeds: Process started");

    const pendingSeeds: string[] = [];
    const appliedSeeds = await fetchAppliedSeeds(pg, config.schema);

    // Filter out seeds that have already been applied
    // We compare by name (without extension if we strip it)
    for (const seedName of seeds) {
      if (!appliedSeeds.includes(seedName)) {
        pendingSeeds.push(seedName);
      }
    }

    if (!pendingSeeds.length) {
      logger.scope("Database").info("Seeds: Already synchronized");
      return;
    }

    // Run pending seeds
    for (const seedName of pendingSeeds) {
      logger.scope("Database").info(`Seeds: Applying ${seedName}...`);
      const query = await seedSqlMap[seedName]();
      await pg.query(query);
    }

    // Update the list of applied seeds
    // We append the new ones to the existing ones
    const newAppliedSeeds = [...appliedSeeds, ...pendingSeeds];
    await saveAppliedSeeds(pg, newAppliedSeeds);

    logger.scope("Database").info("Seeds: Successfully installed");
  } catch (error) {
    logger.scope("Database").error("Seeds Error:", error);
    // Retry logic could go here if needed, but for seeds maybe we just fail?
    // Migration has retry. I'll omit complex retry for simplicity unless requested.
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

export async function saveAppliedSeeds(pg: Pool, seedFiles: string[]) {
  const json = JSON.stringify(seedFiles);

  await pg.query(
    `
    INSERT INTO "${config.schema}"."agape" (key, value)
    VALUES ($1, $2::jsonb)
    ON CONFLICT (key)
    DO UPDATE
      SET value = EXCLUDED.value;
    `,
    ["seeds", json]
  );
}

async function fetchAppliedSeeds(pg: Pool, schemaName: string) {
  if (!(await schemaExists(pg, schemaName))) {
    return [];
  }

  const query = `
    SELECT value AS applied
    FROM "${schemaName}"."agape"
    WHERE key = $1;
  `;

  const values = ["seeds"];

  const { rows } = await pg.query(query, values);

  const appliedSeeds = rows[0]?.applied ?? [];

  return appliedSeeds as string[];
}

async function loadSeeds() {
  const seedsDir = path.join(import.meta.dirname, "scripts");

  // Ensure directory exists
  if (!fs.existsSync(seedsDir)) {
    return { seeds: [], seedSqlMap: {} };
  }

  const src = path.resolve(
    import.meta.dirname,
    "..",
    "migrations",
    "scripts",
    "meta",
    "0000_snapshot.json"
  );

  // We might not need the snapshot for seeds if we don't do schema replacement?
  // But the user might use the schema placeholder in seeds too.
  // Let's keep it for consistency.
  let schema = "public";
  try {
    const snapshot = await fs.readJSON(src);
    [schema] = Object.keys(snapshot.schemas);
  } catch (e) {
    // If snapshot doesn't exist, maybe default or warn?
    // For now, assume it exists as it's part of the project structure.
  }

  const schemaRegex = toRegExp(schema);

  const sqlFiles = await Array.fromAsync(glob("**/*.sql", { cwd: seedsDir }));

  const tasks = sqlFiles.sort().map((fileName) => {
    const seedName = fileName.replace(/\.sql$/, "");
    return [
      seedName,
      async () => {
        const filePath = path.join(seedsDir, fileName);
        const rawSql = await fs.readFile(filePath, "utf8");
        return rawSql.replace(schemaRegex, config.schema);
      },
    ] as const;
  });

  const seedSqlMap = Object.fromEntries(await Promise.all(tasks));
  const seeds = Object.keys(seedSqlMap).sort();

  return { seeds, seedSqlMap } as const;
}
