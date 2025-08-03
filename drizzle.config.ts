import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './lib/db/migrations',

  schema: ['./models/**/*.ts'],

  schemaFilter: ["agape_app_demo_development"],

  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://postgres:mypassword@localhost",
    
  },
});