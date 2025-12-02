import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./lib/db/migrations/scripts",

  schema: ["./models/**/*.ts"],

  schemaFilter: ["agape_app_development_demo"],

  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres:mypassword@localhost",
  },
});
