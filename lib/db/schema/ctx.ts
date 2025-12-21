import context from "../../context";
import { type PgSchema } from "drizzle-orm/pg-core";
import Config from "./config";
import schemaCtx, { schema } from ".";

/**
 * Table factory wrapper with transparent multi-schema support.
 *
 * This helper allows defining Drizzle tables in a way that:
 * - Works normally in single-tenant mode
 * - Automatically resolves the correct PostgreSQL schema
 *   in a schema-per-tenant multitenant setup
 *
 * Why this exists:
 * Drizzle ORM does not currently support switching schemas
 * dynamically in a transparent way. This wrapper bridges that gap
 * by resolving and caching schema-bound table instances per request.
 *
 * How it works:
 * - In single-tenant mode, the factory is executed once and returned directly.
 * - In multitenant mode:
 *   - The factory is executed lazily using the current tenant schema.
 *   - The resulting table instance is cached in ctx.session.
 *   - A Proxy is returned to preserve the table "shape" and identity
 *     expected by Drizzle (symbols, prototype, property descriptors, etc).
 *
 * Important:
 * The Proxy fully forwards reflection and introspection operations
 * (ownKeys, has, getPrototypeOf, etc). This is critical because
 * Drizzle relies on object identity, symbols, and prototype checks
 * to determine whether an object is a valid table.
 *
 * @param factory A function that receives a PgSchema and returns a Drizzle table
 * @returns A schema-aware table instance (or Proxy in multitenant mode)
 */
function ctx<T extends object>(factory: (schema: PgSchema<string>) => T) {
    if (!Config.multitenant) {
        const table = factory(schema);
        return table;
    }

    function tableCtx() {
        const current = context.session.get(factory);

        if (current) {
            return current;
        }

        const schema = schemaCtx();

        const table = factory(schema);

        context.session.set(factory, table);

        return table;
    }

    const proxy = new Proxy({} as T, {
        get(_, prop, receiver) {
            return Reflect.get(tableCtx(), prop, receiver)
        },

        set(_, prop, value, receiver) {
            return Reflect.set(tableCtx(), prop, value, receiver);
        },

        has(_, prop) {
            return Reflect.has(tableCtx(), prop);
        },

        ownKeys() {
            return Reflect.ownKeys(tableCtx());
        },

        getOwnPropertyDescriptor(_, prop) {
            return Reflect.getOwnPropertyDescriptor(tableCtx(), prop);
        },

        getPrototypeOf() {
            return Reflect.getPrototypeOf(tableCtx());
        },
    });

    return proxy;
}

export default ctx;