import { defineConfig } from "drizzle-kit";
import Schema from "./lib/db/schema";

Schema.setSchemaName("agape_app_migrations");

export default defineConfig({
  out: "./lib/db/migrations/scripts",

  schema: ["./models/**/*.ts"],

  schemaFilter: [Schema.schemaName],

  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres:mypassword@localhost",
  },
});
