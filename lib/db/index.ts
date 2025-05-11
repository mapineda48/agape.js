import { drizzle } from "drizzle-orm/node-postgres";
import { glob } from "glob";
import fs from "fs-extra";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import { Pool } from "pg";
import escapeRegExp from "#utils/escapeRegExp";
import logger from "#logger";

const migrationsDir = path.join(import.meta.dirname, "migrations");

export let db: Database = null as any;

export default async function initDatabase(connectionString: string, tenantId: string, isDev = false) {
  await verifyMigrations(connectionString, tenantId, isDev);
}

export async function verifyMigrations(connectionString: string, tenantId: string, isDev = false, attempt = 0) {
  db = createClient(connectionString);
  
  // Skip migrations in development mode
  if (isDev) {
    logger.log("[database] Modo desarrollo: omitiendo migraciones - Recuerde usar el comando 'pnpm drizzle-kit-push'");
    return;
  }

  if (attempt >= 5) {
    throw new Error(
      "No fue posible sincronizar el ORM con la base de datos, por favor validar los logs..."
    );
  }

  const pendingMigrations: string[] = [];
  const [schemaName, migrationFiles, migrationSqlMap] =
    await loadMigrations(tenantId);

  logger.log(`[database] Esquema de PostgreSQL: "${schemaName}"`);

  const { agape } = await import("#models/agape");

  if (await schemaExists(schemaName)) {
    // Fetch applied migrations
    const [{ applied: appliedMigrations }]: any = await db
      .select({ applied: agape.value })
      .from(agape)
      .where(eq(agape.key, "migrations"));

    if (appliedMigrations.length > migrationFiles.length) {
      throw new Error(
        "No es posible sincronizar el ORM, tiene migraciones más nuevas que las soportadas por este cliente"
      );
    }

    // Determine pending migrations
    pendingMigrations.push(
      ...migrationFiles.slice(appliedMigrations.length)
    );
  } else {
    // Schema doesn't exist: apply all migrations
    pendingMigrations.push(...migrationFiles);
  }

  if (!pendingMigrations.length) {
    logger.log("[database] Migraciones: Actualizado");
    return;
  }

  try {
    // Attempt non-blocking advisory lock
    const lockResult = await db.execute(
      sql`SELECT pg_try_advisory_lock(123456789) AS acquired;`
    );
    const acquired = lockResult.rows[0].acquired as boolean;

    if (!acquired) {
      throw new Error(
        "No se pudo obtener el bloqueo advisory para migraciones"
      );
    }

    logger.warning("[database] Advertencia: Proceso Migraciones Iniciado");

    // Run pending migrations
    for (const fileName of pendingMigrations) {
      const migrationSql = await migrationSqlMap[fileName]();
      await db.execute(migrationSql);
    }

    // Record applied migrations
    await db
      .insert(agape)
      .values({ key: "migrations", value: migrationFiles })
      .onConflictDoUpdate({
        target: agape.key,
        set: { value: migrationFiles },
      });

    logger.log("[database] Migraciones: Instaladas completamente");


  } catch (err) {
    logger.error("[database] Error en migraciones:", err);

    // Wait 1 second before retry
    await delay(1000);

    logger.error(
      "[database] Migraciones: Fallida instalación de migraciones... reintentando en 1 segundo"
    );
    return verifyMigrations(
      connectionString,
      tenantId,
      isDev,
      attempt + 1
    );
  } finally {
    // Release advisory lock
    await db.execute(
      sql`SELECT pg_advisory_unlock(123456789);`
    );
  }
}

async function loadMigrations(tenantId: string) {
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

  return [schemaName, migrationFiles, migrationSqlMap] as const;
}

export async function schemaExists(
  schemaName: string
): Promise<boolean> {
  // Check if schema exists in the database
  const result = await db.execute(
    sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.schemata
        WHERE schema_name = ${schemaName}
      ) AS exists;
    `
  );
  return result.rows[0].exists as boolean;
}

function delay(ms = 1000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createClient(connectionString: string) {
  // Create database client
  const pool = new Pool({ connectionString });
  return drizzle(pool);
}

/**
 * Types
 */
type Database = ReturnType<typeof createClient>;
