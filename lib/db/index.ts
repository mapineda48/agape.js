import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import applyMigrations from "./migrations";
import { verifyRootUser } from "./root";

export let db: Database = null as any;

/**
 * Configuration options for the database initialization.
 */
interface DatabaseConfig {
  /**
   * If true, runs migrations in development mode (if applicable).
   */
  dev?: boolean;
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
  const pool = new Pool({ connectionString });

  // Apply database migrations to ensure schema is up-to-date.
  await applyMigrations(pool, config.dev || false);

  // Initialize the Drizzle ORM instance
  db = drizzle(pool);

  // If root user configuration is provided, verify and sync the root user
  if (config.rootUser) {
    await verifyRootUser(config.rootUser.username, config.rootUser.password);
  }
}

/**
 * Types
 */
type Database = ReturnType<typeof drizzle>;
