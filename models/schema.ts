import { pgSchema } from "drizzle-orm/pg-core";
import Config from "../lib/db/schema/config";

export default pgSchema(Config.schemaName);