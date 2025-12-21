import initDatabase from "#lib/db";
import { afterAll, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { deleteSchema } from "./migrations/applyMigrations";

const db = await initDatabase("postgresql://postgres:mypassword@localhost", {
  tenants: ["vitest"],
  env: "vitest",
  skipSeeds: true,
});

afterAll(async () => {
  const { default: config } = await import("./schema/config");
  await deleteSchema(config.schemaName, db.$client);

  await db.$client.end();
});

it("Check database connection is alive", async () => {
  const result = await db.execute(sql`select 1 as foo`);

  expect(result.rows[0].foo).toBe(1);
});

it("Check migrations were applied", async () => {
  const { default: config } = await import("./schema/config");

  const result = await db.execute<{ value: string[] }>(
    sql.raw(`
      SELECT value 
      FROM "${config.schemaName}"."agape" 
      WHERE key = 'migrations'
    `)
  );

  const migrations = result.rows[0]?.value ?? [];

  expect(migrations).toBeInstanceOf(Array);
  expect(migrations.length).toBeGreaterThan(0);
});
