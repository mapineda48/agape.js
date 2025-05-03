import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './lib/db/migrations',

  schema: './models',


  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://postgres:mypassword@localhost",
    
  },


});
