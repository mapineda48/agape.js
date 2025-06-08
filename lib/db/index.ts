import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { Pool } from "pg";
import logger from "#logger";
import getMigrations from "./migrations";

export let db: Database = null as any;

export default async function initDatabase(connectionString: string, tenantId: string, isDev = false) {
    await initMigrations(connectionString, tenantId, isDev);
}

export async function initMigrations(connectionString: string, tenantId: string, isDev = false, attempt = 0) {
    // Create database client
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

    try {
        // Obtener migracion para iniciar el proceso de sincronizacion automatico
        const pendingMigrations: string[] = [];
        const { schemaName, migrationFiles, migrationSqlMap, agape } = await getMigrations(tenantId);

        logger.log(`[database] Esquema de PostgreSQL: "${schemaName}"`);

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

        logger.error(
            "[database] Migraciones: Fallida instalación de migraciones... reintentando en 1 segundo"
        );

        // Wait 1 second before retry
        await delay(1000);
        return initMigrations(
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

export async function schemaExists(schemaName: string): Promise<boolean> {
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