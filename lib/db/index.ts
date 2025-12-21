import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import applyMigrations from "./migrations/applyMigrations";
import logger from "#lib/log/logger";
import Config from "./schema/config";
import { syncRootUserPg } from "./migrations/syncRootUserPg";

export let db: Database = null as any;

/**
 * Configuration options for the database initialization.
 */
interface DatabaseConfig {
  /**
   * Tenant identifier.
   */
  tenants: string[];

  /**
   * If true, runs migrations in development mode (if applicable).
   */
  env?: string;

  /**
   * If true, skips seed migrations in development mode (if applicable).
   */
  skipSeeds?: boolean;

  /**
   * Configuration for the root (super user) synchronization.
   * If provided, the system will attempt to sync the root user credentials on startup.
   */
  rootUser?: {
    username: string;
    password?: string;
  };
}

/**
 * Initializes the database connection, applies migrations, and optionally syncs the root user.
 *
 * @param connectionString - The PostgreSQL connection string.
 * @param config - Optional configuration for development mode and root user sync.
 */
export default async function initDatabase(
  connectionString: string,
  config: DatabaseConfig = { tenants: [] }
) {
  if (db) {
    throw new Error("Database already initialized");
  }

  const tenants = config.tenants.length ? config.tenants : [`agape_app_${config.env}_demo`];

  const enabledMultitenant = tenants.length > 1;

  logger.scope("Database").info(`Multitenant enabled: ${enabledMultitenant}`);

  Config.setSchemaName(tenants[0], enabledMultitenant);

  const pool = new Pool({ connectionString });

  await Promise.all(tenants.map((schema) => applyMigrations(pool, schema, config.skipSeeds)));

  // If root user configuration is provided, verify and sync the root user
  await Promise.all(tenants.map((schema) => syncRootUserPg(
    pool,
    schema,
    config.rootUser?.username,
    config.rootUser?.password
  )));

  // Initialize the Drizzle ORM instance
  db = drizzle(pool);

  return db;
}

/**
 * Types
 */
type Database = ReturnType<typeof drizzle>;
