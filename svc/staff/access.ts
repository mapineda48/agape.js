import { eq, sql } from "drizzle-orm";
import { db } from "#lib/db";
import accessUser from "#models/access/employee";
import { verifyPassword } from "#lib/access/password";
import employee from "#models/staff/employee";
import person from "#models/core/person";
import type { IWebSession } from "#lib/access/session";

export async function findUser(
  username: string,
  password: string
): Promise<IWebSession | null> {
  const [record] = await db
    .select({
      id: accessUser.id,
      passwordHash: accessUser.password,
      avatarUrl: employee.avatarUrl,
      fullName: sql<string>`${person.firstName} || ' ' || ${person.lastName}`,
    })
    .from(accessUser)
    .innerJoin(employee, eq(employee.id, accessUser.employeeId))
    .innerJoin(person, eq(person.id, employee.id))
    .where(eq(accessUser.username, username));

  if (!record) return null;

  const isValid = await verifyPassword(password, record.passwordHash);

  if (!isValid) return null;

  return {
    id: record.id,
    fullName: record.fullName,
    avatarUrl: record.avatarUrl,
  };
}
