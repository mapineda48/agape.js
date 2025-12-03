import initDatabase from "#lib/db";
import { afterAll, it } from "vitest";
import { sql } from "drizzle-orm";

const db = await initDatabase("postgresql://postgres:mypassword@localhost", {
  tenant: "vitest",
  dev: false,
  skipSeeds: true,
});

afterAll(async () => {
  await db.$client.end();
});

it("DB responde select 1 as foo", async () => {
  const result = await db.execute(sql`select 1 as foo`);
  // NodePgDatabase -> QueryResult
  // @ts-ignore si toca
  expect(result.rows[0].foo).toBe(1);
});
