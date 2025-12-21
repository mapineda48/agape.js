import ctx from "../../context";
import { type PgSchema, pgSchema } from "drizzle-orm/pg-core";
import Config from "./config";

const schema = pgSchema<string>(Config.schemaName);

function schemaCtx() {
    if (!ctx.tenant) {
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

/**
 * Es una envoltura que permite agregar soporte a multiples schemas en el mismo contexto, dado que la aplicacion es multitenant por esquema.
 * Esto debido a que drizzle no soporta multiples schemas en el mismo contexto o no lo hace de forma transparente.
 * 
 * @param factory 
 * @returns 
 */
function table<T extends object>(factory: (schema: PgSchema<string>) => T) {

    if (!Config.multitenant) {
        const table = factory(schema);

        return table;
    }

    console.log("Multitenant enabled");

    function tableCtx() {
        const current = ctx.session.get(factory);

        if (current) {
            return current;
        }

        const schema = schemaCtx();

        const table = factory(schema);

        ctx.session.set(factory, table);

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

export default table;