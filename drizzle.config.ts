import { defineConfig } from "drizzle-kit";
import Config from "./lib/db/schema/config";

const schemaName = "agape_app_development_demo";

Config.setSchemaName(schemaName);

export default defineConfig({
  out: "./lib/db/migrations/scripts",

  schema: ["./models/**/*.ts"],

  schemaFilter: [Config.schemaName],

  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres:mypassword@localhost",
  },
});
