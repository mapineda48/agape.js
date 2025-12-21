import { Kysely, PostgresDialect, CamelCasePlugin } from "kysely";
import { Pool } from "pg";
import type { Database } from "#models/database";
import applyMigrations from "./migrations/applyMigrations";
import logger from "#lib/log/logger";

export let db: Kysely<Database> = null as any;

/**
 * Configuration options for the database initialization.
 */
interface DatabaseConfig {
  /**
   * Tenant identifier (schema name).
   */
  tenant?: string;

  /**
   * If true, runs migrations in development mode (if applicable).
   */
  dev?: boolean;

  /**
   * If true, skips seed migrations in development mode (if applicable).
   */
  skipSeeds?: boolean;
}

/**
 * Initializes the database connection with Kysely.
 *
 * @param connectionString - The PostgreSQL connection string.
 * @param config - Optional configuration for development mode and tenant.
 */
export default async function initDatabase(
  connectionString: string,
  config: DatabaseConfig = {}
) {
  if (db) {
    throw new Error("Database already initialized");
  }

  if (!config.tenant) {
    throw new Error("Tenant is required");
  }

  const schemaName = config.tenant;

  const pool = new Pool({ connectionString });

  if (!config.dev) {
    // Apply database migrations to ensure schema is up-to-date.
    await applyMigrations(pool, schemaName, config.skipSeeds);
  } else {
    logger
      .scope("Database")
      .info("Development mode: skipping migrations");
  }

  // Initialize the Kysely ORM instance
  db = new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
    plugins: [new CamelCasePlugin()],
  }).withSchema(schemaName);

  return db;
}
