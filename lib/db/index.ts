import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { Pool } from "pg";
import applyMigrations from "./migrations";

export let db: Database = null as any;

export default async function initDatabase(connectionString: string, dev = false) {
    const pool = new Pool({ connectionString });

    await applyMigrations(pool, dev);

    db = drizzle(pool);
}


/**
 * Types
 */
type Database = ReturnType<typeof drizzle>;