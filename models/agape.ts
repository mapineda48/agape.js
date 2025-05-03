import { text, jsonb, timestamp, pgSchema } from 'drizzle-orm/pg-core';
import config from '#lib/db/schema';

export const schema = pgSchema(config.name);

export const agape = schema.table('agape', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
