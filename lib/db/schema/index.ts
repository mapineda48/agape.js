import ctx from "../../context";
import { type PgSchema, pgSchema } from "drizzle-orm/pg-core";
import Config from "./config";

/**
 * Base schema instance.
 *
 * This represents the default (non-tenant) schema and is used when:
 * - multitenancy is disabled
 */
export const schema = pgSchema<string>(Config.schemaName);

/**
 * Resolves the current schema for the active execution context.
 *
 * In a multitenant environment, each tenant maps to a PostgreSQL schema.
 * Since Drizzle does not natively support dynamically switching schemas
 * within the same runtime context, we manually resolve and cache
 * the correct PgSchema per request/session.
 *
 * Resolution rules:
 * - If no tenant is present, return the default schema.
 * - If a tenant is present, return (and cache) the PgSchema for that tenant.
 *
 * The resolved schema is cached in ctx.session to guarantee:
 * - Referential stability (same object instance per request)
 * - Correct identity checks inside Drizzle
 */
export default function schemaCtx() {
    if (!Config.multitenant) {
        return schema;
    }

    const current = ctx.session.get(schema) as PgSchema<string>;

    if (current) {
        return current;
    }

    const schemaCtx = pgSchema(ctx.tenant);

    ctx.session.set(schema, schemaCtx);

    return schemaCtx;
}