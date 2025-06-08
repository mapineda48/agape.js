import { text, jsonb, timestamp, pgSchema } from 'drizzle-orm/pg-core';
import config from '#lib/db/orm';

export const schema = pgSchema(config.schema);

export const agape = schema.table('agape', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow(),
  updateAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
});