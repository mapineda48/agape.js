import { pgSchema } from "drizzle-orm/pg-core";
import Config from "./config";

/**
 * Base schema instance.
 *
 * This represents the default (non-tenant) schema and is used when:
 * - multitenancy is disabled
 */
export const schema = pgSchema<string>(Config.schemaName);