import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import applyMigrations from "./migrations/applyMigrations.js";
import Schema from "./schema.js";


let _db: Database | null = null;

/**
 * Returns the initialized database instance.
 * Throws a descriptive error if the database has not been initialized yet.
 *
 * Prefer this over the legacy `db` export for better error messages and type safety.
 */
export function getDb(): Database {
  if (!_db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return _db;
}

/**
 * Legacy export for backwards compatibility.
 * Prefer `getDb()` for new code — it provides a clear error if uninitialized.
 *
 * @deprecated Use `getDb()` instead.
 */
export { _db as db };

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
  config: DatabaseConfig = {},
) {
  if (_db) {
    throw new Error("Database already initialized");
  }

  const tenant = config.tenant || `agape_app_${config.env}_demo`;

  Schema.setSchemaName(tenant);

  const pool = new Pool({ connectionString });

  await applyMigrations(pool, tenant, config.skipSeeds);

  // If root user configuration is provided, verify and sync the root user
  // await syncRootUserPg(
  //   pool,
  //   tenant,
  //   config.rootUser?.username,
  //   config.rootUser?.password,
  // );

  // Initialize the Drizzle ORM instance
  _db = drizzle(pool);

  return _db;
}

/**
 * Types
 */
type Database = ReturnType<typeof drizzle>;
