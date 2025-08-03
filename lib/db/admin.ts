import { eq, sql } from "drizzle-orm";
import { hashPassword, verifyPassword } from "#lib/access/password";
import accessUser from "#models/access/employee";
import person from "#models/core/person";
import employee, { employeeRole } from "#models/staff/employee";
import role from "#models/staff/role";
import { db } from ".";
import logger from "#lib/log/logger";

const CODE_SUPER_USER_ROLE = "SP";

export async function verifyRootUser(username: string, password: string) {
    if (!username || !password) {
        return
    }

    // Attempt non-blocking advisory lock
    const lockResult = await db.execute(
        sql`SELECT pg_try_advisory_lock(123456789111) AS acquired;`
    );
    const acquired = lockResult.rows[0].acquired as boolean;

    if (!acquired) {
        logger.log("[root-user] Omita sincronización por concurrencia");
        return;
    }

    try {
        logger.log("[root-user] Iniciando sincronización del usuario administrador");

        const current = await findAccessByRoleCode(CODE_SUPER_USER_ROLE);

        if (!current) {
            await InsertAdminUser(username, password);
            return;
        }

        const isPassword = await verifyPassword(password, current.password);

        if (current.username === username && isPassword) {
            logger.log("[root-user] Usuario administrador ya se encuentra sincronizado");

            return;
        }

        const auth: IUpdate = {};

        if (current.username !== username) {
            auth.username = username;
        }

        if (!isPassword) {
            auth.password = await hashPassword(password);
        }

        await db.update(accessUser).set(auth).where(eq(accessUser.id, current.id));

        logger.log("[root-user] Usuario administrador ha sido sincronizado");
    }
    catch (error) {
        logger.error(
            "[root-user] No fue posible sincronizar el usuario administrador", error
        );
    }
    finally {
        await db.execute(
            sql`SELECT pg_advisory_unlock(123456789111);`
        );
    }
}

async function findAccessByRoleCode(code: string) {
    const [result] = await db
        .select({
            id: accessUser.id,
            username: accessUser.username,
            password: accessUser.password,
        })
        .from(role)
        .where(eq(role.code, code))
        .innerJoin(employeeRole, eq(employeeRole.roleId, role.id))
        .innerJoin(employee, eq(employee.id, employeeRole.employeeId))
        .innerJoin(accessUser, eq(accessUser.employeeId, employee.id));

    return result;
}

async function InsertAdminUser(username: string, password: string) {
    const [personRecord] = await db.insert(person).values({
        firstName: "Miguel",
        lastName: "Pineda",
        birthdate: new Date(),
        email: "root@agape.com",
        phone: "000000000000"
    }).returning();

    const [roleRecord] = await db.insert(role).values({
        code: CODE_SUPER_USER_ROLE,
        name: "super user",
        description: "super user",
        isActive: false
    }).returning();

    const [employeeRecord] = await db.insert(employee).values({
        personId: personRecord.id,
        hireDate: new Date(),
        isActive: true,
        avatarUrl: "/admin.jpg"
    }).returning();

    await db.insert(employeeRole).values({
        employeeId: employeeRecord.id,
        roleId: roleRecord.id
    });

    await db.insert(accessUser).values({
        employeeId: employeeRecord.id,
        username: username,
        password: await hashPassword(password),
    });
}



interface IUpdate {
    username?: string,
    password?: string
}