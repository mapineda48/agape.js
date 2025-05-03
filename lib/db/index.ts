import { drizzle } from "drizzle-orm/singlestore/driver";

export default drizzle("postgresql://postgres:mypassword@localhost")

// import { eq, sql } from 'drizzle-orm';
// import { drizzle } from 'drizzle-orm/node-postgres';
// import { Client } from 'pg';
// import { glob } from "glob";
// import path from "node:path";
// import { agape } from "#models/agape";


// const db = drizzle("postgresql://postgres:mypassword@localhost");

// const migrationsSQL = path.join(import.meta.dirname, "migrations");

// const matches = await glob("**/*.sql", { cwd: migrationsSQL });

// console.log(matches);



// try {
//     await db.execute(sql`CREATE SCHEMA "drizzle-orm";`)
//     console.log("Proceso Iniciado");

//     //await db.insert(agape).values({ key: "migrations", value: [] });


//     const [res] = await db.select().from(agape).where(eq(agape.key, "migrations"))


//     console.log(res);

//     await db.execute(sql`DROP SCHEMA "drizzle-orm";`)

// } catch {
//     console.log("Proceso bloqueado");
// }
