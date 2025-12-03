import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import applyMigrations from "./migrations/applyMigrations";
import logger from "#lib/log/logger";
import Config from "./config";

export let db: Database = null as any;

/**
 * Configuration options for the database initialization.
 */
interface DatabaseConfig {
  /**
   * Tenant identifier.
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
  config: DatabaseConfig = {}
) {
  if (db) {
    throw new Error("Database already initialized");
  }

  if (!config.tenant) {
    throw new Error("Tenant is required");
  }

  const schemaName = prepareOrmSchema(config);

  const pool = new Pool({ connectionString });

  if (!config.dev) {
    // Apply database migrations to ensure schema is up-to-date.
    await applyMigrations(schemaName, pool, config.skipSeeds);
  } else {
    logger
      .scope("Database")
      .info(
        "Development mode: skipping migrations - Remember to use 'pnpm drizzle-kit push'"
      );
  }

  // Initialize the Drizzle ORM instance
  db = drizzle(pool);

  // If root user configuration is provided, verify and sync the root user
  if (config.rootUser) {
    const { verifyRootUser } = await import("./root");

    await verifyRootUser(config.rootUser.username, config.rootUser.password);
  }

  return db;
}

function prepareOrmSchema(config: DatabaseConfig) {
  const isTS = process.argv.some(
    (a) => a.endsWith(".ts") || a.endsWith(".cjs")
  );

  const env = !config.dev ? "production" : isTS ? "development" : "test";

  const schemaName = `agape_app_${env}_${config.tenant}`;

  Config.setSchemaName(schemaName);

  return schemaName;
}

/**
 * Types
 */
type Database = ReturnType<typeof drizzle>;
