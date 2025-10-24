import { text, jsonb, timestamp, pgSchema } from 'drizzle-orm/pg-core';
import config from '../lib/db/config';

export const schema = pgSchema(config.schema);

/**
 * Modelo Agape
 * Representa una entidad clave-valor genérica para configuraciones o datos globales.
 */
export const agape = schema.table('agape', {
    /** Clave única de la entidad */
    key: text('key').primaryKey(),
    /** Valor en formato JSON */
    value: jsonb('value').notNull(),
    /** Fecha de creación */
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow(),
    /** Fecha de última actualización */
    updateAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
});