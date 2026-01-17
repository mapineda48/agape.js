import { eq } from "drizzle-orm";
import MailManager from "#lib/services/mail/MailManager";
import crypto from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_password_reset_${uuid}`,
    env: "vitest",
    skipSeeds: true,
  });
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/schema/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

async function createSecurityUserWithEmail(email: string) {
  const { upsertDocumentType } = await import("#svc/core/documentType");
  const { upsertEmployee } = await import("#svc/hr/employee");
  const { upsertSecurityUser } = await import("#svc/security/user");
  const { upsertContactMethod } = await import("#svc/core/contactMethod");

  const unique = crypto.randomUUID();
  const shortId = unique.slice(0, 6);
  const [docType] = await upsertDocumentType({
    name: `Doc ${shortId}`,
    code: `DOC${shortId}`,
    isEnabled: true,
    appliesToPerson: true,
    appliesToCompany: false,
  });

  const employee = await upsertEmployee({
    user: {
      documentTypeId: docType.id,
      documentNumber: `DOC-${shortId}`,
      person: {
        firstName: "Reset",
        lastName: "User",
      },
    },
    isActive: true,
  });

  await upsertContactMethod({
    userId: employee.id,
    type: "email",
    value: email,
    isPrimary: true,
    isActive: true,
    isVerified: true,
  });

  const securityUser = await upsertSecurityUser({
    employeeId: employee.id,
    username: `user_${unique.slice(0, 8)}`,
    password: "Secret123",
    isActive: true,
    roleIds: [],
  });

  return { employeeId: employee.id, securityUserId: securityUser.id };
}

describe("security password reset", () => {
  it("issues token and sends email when email matches", async () => {
    const sendMailSpy = vi.spyOn(MailManager, "sendMail").mockResolvedValue();
    const { requestPasswordResetByEmail } = await import("./user");
    const { db } = await import("#lib/db");
    const securityUserModel = (await import("#models/security/user")).default;

    const { securityUserId } = await createSecurityUserWithEmail("reset@test.com");

    const result = await requestPasswordResetByEmail({
      email: "reset@test.com",
      resetUrl: "http://localhost/auth/reset",
    });

    const [record] = await db
      .select({
        token: securityUserModel.passwordResetToken,
        expires: securityUserModel.passwordResetExpires,
      })
      .from(securityUserModel)
      .where(eq(securityUserModel.id, securityUserId));

    expect(result.success).toBe(true);
    expect(sendMailSpy).toHaveBeenCalledTimes(1);
    expect(record?.token).toBeTruthy();
    expect(record?.expires).toBeTruthy();

    sendMailSpy.mockRestore();
  });

  it("ignores request when email does not match", async () => {
    const sendMailSpy = vi.spyOn(MailManager, "sendMail").mockResolvedValue();
    const { requestPasswordResetByEmail } = await import("./user");
    const { db } = await import("#lib/db");
    const securityUserModel = (await import("#models/security/user")).default;

    const { securityUserId } = await createSecurityUserWithEmail("match@test.com");

    const result = await requestPasswordResetByEmail({
      email: "nomatch@test.com",
      resetUrl: "http://localhost/auth/reset",
    });

    const [record] = await db
      .select({ token: securityUserModel.passwordResetToken })
      .from(securityUserModel)
      .where(eq(securityUserModel.id, securityUserId));

    expect(result.success).toBe(true);
    expect(sendMailSpy).not.toHaveBeenCalled();
    expect(record?.token).toBeNull();

    sendMailSpy.mockRestore();
  });

  it("validates token and rejects expired token", async () => {
    const sendMailSpy = vi.spyOn(MailManager, "sendMail").mockResolvedValue();
    const { requestPasswordReset, validatePasswordResetToken } = await import("./user");
    const { db } = await import("#lib/db");
    const securityUserModel = (await import("#models/security/user")).default;
    const { default: DateTime } = await import("#utils/data/DateTime");

    const { securityUserId } = await createSecurityUserWithEmail("valid@test.com");

    await requestPasswordReset({
      userId: securityUserId,
      resetUrl: "http://localhost/auth/reset",
    });

    const [record] = await db
      .select({ token: securityUserModel.passwordResetToken })
      .from(securityUserModel)
      .where(eq(securityUserModel.id, securityUserId));

    const validResult = await validatePasswordResetToken(record?.token ?? "");

    await db
      .update(securityUserModel)
      .set({ passwordResetExpires: new DateTime(Date.now() - 5 * 60 * 1000) })
      .where(eq(securityUserModel.id, securityUserId));

    const expiredResult = await validatePasswordResetToken(record?.token ?? "");

    expect(validResult.success).toBe(true);
    expect(expiredResult.success).toBe(false);

    sendMailSpy.mockRestore();
  });

  it("resets password with token and clears it", async () => {
    const sendMailSpy = vi.spyOn(MailManager, "sendMail").mockResolvedValue();
    const { requestPasswordReset, resetPasswordWithToken } = await import("./user");
    const { db } = await import("#lib/db");
    const securityUserModel = (await import("#models/security/user")).default;

    const { securityUserId } = await createSecurityUserWithEmail("reset2@test.com");

    await requestPasswordReset({
      userId: securityUserId,
      resetUrl: "http://localhost/auth/reset",
    });

    const [record] = await db
      .select({ token: securityUserModel.passwordResetToken })
      .from(securityUserModel)
      .where(eq(securityUserModel.id, securityUserId));

    const result = await resetPasswordWithToken({
      token: record?.token ?? "",
      newPassword: "NewSecret123",
    });

    const [updated] = await db
      .select({
        token: securityUserModel.passwordResetToken,
        mustChange: securityUserModel.mustChangePassword,
      })
      .from(securityUserModel)
      .where(eq(securityUserModel.id, securityUserId));

    expect(result.success).toBe(true);
    expect(updated?.token).toBeNull();
    expect(updated?.mustChange).toBe(false);
    expect(sendMailSpy).toHaveBeenCalledTimes(2);

    sendMailSpy.mockRestore();
  });
});
