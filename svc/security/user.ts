import { eq, sql, and, ilike, desc, asc, count } from "drizzle-orm";
import { db } from "#lib/db";
import securityUser from "#models/security/user";
import { verifyPassword, hashPassword } from "#lib/security/password";
import employee, { employeeJobPosition } from "#models/hr/employee";
import person from "#models/core/person";
import jobPosition from "#models/hr/job_position";
import { securityRole, securityUserRole } from "#models/security/role";
import type { IContext } from "#lib/context";
import { BusinessRuleError } from "#lib/error";
import DateTime from "#lib/utils/data/DateTime";
import MailManager from "#lib/services/mail/MailManager";
import { getSystemConfig } from "#svc/config/systemConfig";
import { contactMethod } from "#models/core/contactMethod";
import crypto from "node:crypto";
import {
  generatePasswordResetEmailHtml,
  generatePasswordResetEmailSubject,
  generatePasswordChangedEmailHtml,
  generatePasswordChangedEmailSubject,
} from "#lib/services/mail/template/passwordReset";
import type {
  RequestPasswordResetInput,
  RequestPasswordResetByEmailInput,
  RequestPasswordResetResult,
  ResetPasswordInput,
  ResetPasswordResult,
  ValidatePasswordResetTokenResult,
} from "#utils/dto/security/passwordReset";

// ============================================================================
// Types
// ============================================================================

export interface ISecurityUser {
  id: number;
  employeeId: number;
  username: string;
  isActive: boolean;
  isLocked: boolean;
  lockReason: string | null;
  lockedUntil: DateTime | null;
  failedLoginAttempts: number;
  lastFailedLogin: DateTime | null;
  twoFactorEnabled: boolean;
  mustChangePassword: boolean;
  lastLogin: DateTime | null;
  lastLoginIp: string | null;
  loginCount: number;
  createdAt: DateTime;
  updatedAt: DateTime | null;
  // Employee info
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  // Roles
  roles: { id: number; code: string; name: string }[];
}

export interface ISecurityUserListItem {
  id: number;
  employeeId: number;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  isActive: boolean;
  isLocked: boolean;
  lastLogin: DateTime | null;
  loginCount: number;
  roleCount: number;
  createdAt: DateTime;
}

export interface IListSecurityUsersParams {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  isLocked?: boolean;
  includeTotalCount?: boolean;
}

export interface IListSecurityUsersResult {
  users: ISecurityUserListItem[];
  totalCount?: number;
}

export interface IUpsertSecurityUser {
  id?: number;
  employeeId: number;
  username: string;
  password?: string; // Solo requerido al crear, opcional al actualizar
  isActive?: boolean;
  roleIds?: number[];
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Obtiene los permisos combinados de todos los roles de un usuario.
 */
async function getUserPermissions(userId: number): Promise<string[]> {
  const roles = await db
    .select({
      permissions: securityRole.permissions,
    })
    .from(securityUserRole)
    .innerJoin(securityRole, eq(securityRole.id, securityUserRole.roleId))
    .where(eq(securityUserRole.userId, userId));

  // Combinar todos los arrays de permisos en uno solo y eliminar duplicados
  const allPermissions = roles.flatMap((r) => r.permissions);
  return Array.from(new Set(allPermissions));
}

/**
 * Busca un usuario por credenciales y retorna la sesión si es válida.
 *
 * @param username - Nombre de usuario
 * @param password - Contraseña en texto plano
 * @returns Sesión del usuario o null si las credenciales son inválidas
 * @permission security.user.read
 */
export async function findUserByCredentials(
  username: string,
  password: string
): Promise<IUserSession | null> {
  const [record] = await db
    .select({
      id: securityUser.id,
      employeeId: securityUser.employeeId,
      passwordHash: securityUser.passwordHash,
      avatarUrl: employee.avatarUrl,
      fullName: sql<string>`${person.firstName} || ' ' || ${person.lastName}`,
    })
    .from(securityUser)
    .innerJoin(employee, eq(employee.id, securityUser.employeeId))
    .innerJoin(person, eq(person.id, employee.id))
    .where(eq(securityUser.username, username));

  if (!record) return null;

  const isValid = await verifyPassword(password, record.passwordHash);

  if (!isValid) return null;

  const permissions = await getUserPermissions(record.id);

  // Obtener el primer cargo del empleado (priorizando el primario)
  const [firstJobPosition] = await db
    .select({
      name: jobPosition.name,
    })
    .from(employeeJobPosition)
    .innerJoin(jobPosition, eq(jobPosition.id, employeeJobPosition.jobPositionId))
    .where(eq(employeeJobPosition.employeeId, record.employeeId))
    .orderBy(desc(employeeJobPosition.isPrimary))
    .limit(1);

  return {
    id: record.id,
    fullName: record.fullName,
    avatarUrl: record.avatarUrl,
    jobPositionName: firstJobPosition?.name ?? null,
    permissions,
    tenant: "agape_app_development_demo",
  };
}

/**
 * Busca un usuario por ID y retorna la sesión.
 *
 * @param id - ID del usuario
 * @returns Sesión del usuario o null si no se encuentra
 * @permission security.user.read
 */
export async function findUserById(id: number): Promise<IUserSession | null> {
  const [record] = await db
    .select({
      id: securityUser.id,
      employeeId: securityUser.employeeId,
      passwordHash: securityUser.passwordHash,
      avatarUrl: employee.avatarUrl,
      fullName: sql<string>`${person.firstName} || ' ' || ${person.lastName}`,
    })
    .from(securityUser)
    .innerJoin(employee, eq(employee.id, securityUser.employeeId))
    .innerJoin(person, eq(person.id, employee.id))
    .where(eq(securityUser.id, id));

  if (!record) return null;

  const permissions = await getUserPermissions(record.id);

  // Obtener el primer cargo del empleado (priorizando el primario)
  const [firstJobPosition] = await db
    .select({
      name: jobPosition.name,
    })
    .from(employeeJobPosition)
    .innerJoin(jobPosition, eq(jobPosition.id, employeeJobPosition.jobPositionId))
    .where(eq(employeeJobPosition.employeeId, record.employeeId))
    .orderBy(desc(employeeJobPosition.isPrimary))
    .limit(1);

  return {
    id: record.id,
    fullName: record.fullName,
    avatarUrl: record.avatarUrl,
    jobPositionName: firstJobPosition?.name ?? null,
    permissions,
    tenant: "agape_app_development_demo",
  };
}

// ============================================================================
// Security User CRUD Operations
// ============================================================================

/**
 * Lista usuarios de seguridad con filtros y paginación.
 *
 * @param params Parámetros de búsqueda
 * @returns Lista de usuarios con información básica
 * @permission security.user.read
 */
export async function listSecurityUsers(
  params: IListSecurityUsersParams = {}
): Promise<IListSecurityUsersResult> {
  const {
    pageIndex = 0,
    pageSize = 20,
    search,
    isActive,
    isLocked,
    includeTotalCount = false,
  } = params;

  const conditions = [];

  if (search) {
    conditions.push(
      sql`(${ilike(securityUser.username, `%${search}%`)} OR
          ${ilike(person.firstName, `%${search}%`)} OR
          ${ilike(person.lastName, `%${search}%`)})`
    );
  }

  if (isActive !== undefined) {
    conditions.push(eq(securityUser.isActive, isActive));
  }

  if (isLocked !== undefined) {
    conditions.push(eq(securityUser.isLocked, isLocked));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get users with pagination
  const usersQuery = db
    .select({
      id: securityUser.id,
      employeeId: securityUser.employeeId,
      username: securityUser.username,
      fullName: sql<string>`${person.firstName} || ' ' || ${person.lastName}`,
      avatarUrl: employee.avatarUrl,
      isActive: securityUser.isActive,
      isLocked: securityUser.isLocked,
      lastLogin: securityUser.lastLogin,
      loginCount: securityUser.loginCount,
      createdAt: securityUser.createdAt,
      roleCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${securityUserRole}
        WHERE ${securityUserRole.userId} = ${securityUser.id}
      )`,
    })
    .from(securityUser)
    .innerJoin(employee, eq(employee.id, securityUser.employeeId))
    .innerJoin(person, eq(person.id, employee.id))
    .where(whereClause)
    .orderBy(desc(securityUser.createdAt))
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  const users = await usersQuery;

  // Get total count if requested
  let totalCount: number | undefined;
  if (includeTotalCount) {
    const [countResult] = await db
      .select({ count: count() })
      .from(securityUser)
      .innerJoin(employee, eq(employee.id, securityUser.employeeId))
      .innerJoin(person, eq(person.id, employee.id))
      .where(whereClause);
    totalCount = countResult?.count ?? 0;
  }

  return { users, totalCount };
}

/**
 * Obtiene un usuario de seguridad por ID del empleado.
 *
 * @param employeeId ID del empleado
 * @returns Usuario de seguridad con todos sus datos, o null si no existe
 * @permission security.user.read
 */
export async function getSecurityUserByEmployeeId(
  employeeId: number
): Promise<ISecurityUser | null> {
  const [record] = await db
    .select({
      id: securityUser.id,
      employeeId: securityUser.employeeId,
      username: securityUser.username,
      isActive: securityUser.isActive,
      isLocked: securityUser.isLocked,
      lockReason: securityUser.lockReason,
      lockedUntil: securityUser.lockedUntil,
      failedLoginAttempts: securityUser.failedLoginAttempts,
      lastFailedLogin: securityUser.lastFailedLogin,
      twoFactorEnabled: securityUser.twoFactorEnabled,
      mustChangePassword: securityUser.mustChangePassword,
      lastLogin: securityUser.lastLogin,
      lastLoginIp: securityUser.lastLoginIp,
      loginCount: securityUser.loginCount,
      createdAt: securityUser.createdAt,
      updatedAt: securityUser.updatedAt,
      firstName: person.firstName,
      lastName: person.lastName,
      avatarUrl: employee.avatarUrl,
    })
    .from(securityUser)
    .innerJoin(employee, eq(employee.id, securityUser.employeeId))
    .innerJoin(person, eq(person.id, employee.id))
    .where(eq(securityUser.employeeId, employeeId));

  if (!record) return null;

  // Get roles
  const roles = await db
    .select({
      id: securityRole.id,
      code: securityRole.code,
      name: securityRole.name,
    })
    .from(securityUserRole)
    .innerJoin(securityRole, eq(securityRole.id, securityUserRole.roleId))
    .where(eq(securityUserRole.userId, record.id));

  return {
    ...record,
    roles,
  };
}

/**
 * Crea o actualiza un usuario de seguridad.
 *
 * @param payload Datos del usuario
 * @returns Usuario creado o actualizado
 * @permission security.user.manage
 */
export async function upsertSecurityUser(
  payload: IUpsertSecurityUser
): Promise<ISecurityUser> {
  const { id, employeeId, username, password, isActive = true, roleIds = [] } = payload;

  // Validar username
  const normalizedUsername = username.trim().toLowerCase();
  if (normalizedUsername.length < 3) {
    throw new BusinessRuleError("El nombre de usuario debe tener al menos 3 caracteres");
  }
  if (!/^[a-z0-9._-]+$/.test(normalizedUsername)) {
    throw new BusinessRuleError(
      "El nombre de usuario solo puede contener letras minúsculas, números, puntos, guiones y guiones bajos"
    );
  }

  // Verificar que el empleado existe
  const [emp] = await db
    .select({ id: employee.id })
    .from(employee)
    .where(eq(employee.id, employeeId));

  if (!emp) {
    throw new BusinessRuleError("El empleado especificado no existe");
  }

  // Verificar username único (excepto para el mismo usuario)
  const existingUsername = await db
    .select({ id: securityUser.id })
    .from(securityUser)
    .where(
      and(
        eq(securityUser.username, normalizedUsername),
        id ? sql`${securityUser.id} != ${id}` : sql`1=1`
      )
    );

  if (existingUsername.length > 0) {
    throw new BusinessRuleError("El nombre de usuario ya está en uso");
  }

  // Verificar que el empleado no tenga ya un usuario (excepto para el mismo)
  const existingEmployee = await db
    .select({ id: securityUser.id })
    .from(securityUser)
    .where(
      and(
        eq(securityUser.employeeId, employeeId),
        id ? sql`${securityUser.id} != ${id}` : sql`1=1`
      )
    );

  if (existingEmployee.length > 0) {
    throw new BusinessRuleError("Este empleado ya tiene un usuario de acceso asignado");
  }

  let userId: number;

  if (id) {
    // Update
    const updateData: Record<string, unknown> = {
      username: normalizedUsername,
      isActive,
    };

    if (password) {
      updateData.passwordHash = await hashPassword(password);
      updateData.passwordChangedAt = new DateTime();
    }

    const [updated] = await db
      .update(securityUser)
      .set(updateData)
      .where(eq(securityUser.id, id))
      .returning({ id: securityUser.id });

    if (!updated) {
      throw new BusinessRuleError("Usuario no encontrado");
    }

    userId = updated.id;
  } else {
    // Create - password es requerido
    if (!password) {
      throw new BusinessRuleError("La contraseña es requerida para crear un usuario");
    }

    if (password.length < 6) {
      throw new BusinessRuleError("La contraseña debe tener al menos 6 caracteres");
    }

    const passwordHash = await hashPassword(password);

    const [created] = await db
      .insert(securityUser)
      .values({
        employeeId,
        username: normalizedUsername,
        passwordHash,
        isActive,
        mustChangePassword: true, // Forzar cambio de contraseña en primer login
      })
      .returning({ id: securityUser.id });

    userId = created.id;
  }

  // Update roles
  await db.transaction(async (tx) => {
    // Remove existing roles
    await tx.delete(securityUserRole).where(eq(securityUserRole.userId, userId));

    // Add new roles
    if (roleIds.length > 0) {
      await tx.insert(securityUserRole).values(
        roleIds.map((roleId) => ({
          userId,
          roleId,
        }))
      );
    }
  });

  // Return updated user
  const result = await getSecurityUserByEmployeeId(employeeId);
  if (!result) {
    throw new BusinessRuleError("Error al obtener el usuario creado");
  }

  return result;
}

/**
 * Activa o desactiva un usuario de seguridad.
 *
 * @param id ID del usuario
 * @param isActive Nuevo estado
 * @returns Resultado de la operación
 * @permission security.user.manage
 */
export async function toggleSecurityUserActive(
  id: number,
  isActive: boolean
): Promise<{ success: boolean; message: string }> {
  const [existing] = await db
    .select({ id: securityUser.id })
    .from(securityUser)
    .where(eq(securityUser.id, id));

  if (!existing) {
    return { success: false, message: "Usuario no encontrado" };
  }

  await db
    .update(securityUser)
    .set({ isActive })
    .where(eq(securityUser.id, id));

  return {
    success: true,
    message: isActive ? "Usuario activado" : "Usuario desactivado",
  };
}

/**
 * Bloquea o desbloquea un usuario de seguridad.
 *
 * @param id ID del usuario
 * @param isLocked Si debe estar bloqueado
 * @param lockReason Razón del bloqueo
 * @param lockedUntil Hasta cuándo está bloqueado (opcional, bloqueo temporal)
 * @returns Resultado de la operación
 * @permission security.user.manage
 */
export async function toggleSecurityUserLock(
  id: number,
  isLocked: boolean,
  lockReason?: string,
  lockedUntil?: DateTime
): Promise<{ success: boolean; message: string }> {
  const [existing] = await db
    .select({ id: securityUser.id })
    .from(securityUser)
    .where(eq(securityUser.id, id));

  if (!existing) {
    return { success: false, message: "Usuario no encontrado" };
  }

  await db
    .update(securityUser)
    .set({
      isLocked,
      lockReason: isLocked ? (lockReason || "Bloqueado por administrador") : null,
      lockedUntil: isLocked ? lockedUntil : null,
      failedLoginAttempts: isLocked ? undefined : 0, // Reset intentos al desbloquear
    })
    .where(eq(securityUser.id, id));

  return {
    success: true,
    message: isLocked ? "Usuario bloqueado" : "Usuario desbloqueado",
  };
}

/**
 * Resetea la contraseña de un usuario.
 *
 * @param id ID del usuario
 * @param newPassword Nueva contraseña
 * @param mustChangePassword Si debe cambiar la contraseña en el próximo login
 * @returns Resultado de la operación
 * @permission security.user.manage
 */
export async function resetSecurityUserPassword(
  id: number,
  newPassword: string,
  mustChangePassword: boolean = true
): Promise<{ success: boolean; message: string }> {
  if (newPassword.length < 6) {
    return { success: false, message: "La contrasena debe tener al menos 6 caracteres" };
  }

  const [existing] = await db
    .select({ id: securityUser.id })
    .from(securityUser)
    .where(eq(securityUser.id, id));

  if (!existing) {
    return { success: false, message: "Usuario no encontrado" };
  }

  const passwordHash = await hashPassword(newPassword);

  await db
    .update(securityUser)
    .set({
      passwordHash,
      passwordChangedAt: new DateTime(),
      mustChangePassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    })
    .where(eq(securityUser.id, id));

  return {
    success: true,
    message: "Contrasena actualizada exitosamente",
  };
}

/**
 * Desbloquea un usuario y resetea los intentos fallidos.
 *
 * @param id ID del usuario
 * @returns Resultado de la operación
 * @permission security.user.manage
 */
export async function unlockSecurityUser(
  id: number
): Promise<{ success: boolean; message: string }> {
  return toggleSecurityUserLock(id, false);
}

/**
 * Solicita un cambio de contrasena por correo.
 *
 * @permission security.user.manage
 */
export async function requestPasswordReset(
  input: RequestPasswordResetInput
): Promise<RequestPasswordResetResult> {
  const { userId, resetUrl, email } = input;

  if (!resetUrl) {
    throw new BusinessRuleError("Se requiere un enlace de restablecimiento valido");
  }

  const [record] = await db
    .select({
      id: securityUser.id,
      employeeId: securityUser.employeeId,
      firstName: person.firstName,
      lastName: person.lastName,
      isActive: securityUser.isActive,
      isLocked: securityUser.isLocked,
    })
    .from(securityUser)
    .innerJoin(employee, eq(employee.id, securityUser.employeeId))
    .innerJoin(person, eq(person.id, employee.id))
    .where(eq(securityUser.id, userId));

  if (!record) {
    throw new BusinessRuleError("Usuario no encontrado");
  }

  if (!record.isActive || record.isLocked) {
    throw new BusinessRuleError("El usuario no esta disponible para cambio de contrasena");
  }

  const [emailRecord] = await db
    .select({ email: contactMethod.value })
    .from(contactMethod)
    .where(
      and(
        eq(contactMethod.userId, record.employeeId),
        eq(contactMethod.type, "email"),
        eq(contactMethod.isPrimary, true),
        eq(contactMethod.isActive, true)
      )
    );

  if (!emailRecord?.email) {
    throw new BusinessRuleError("El empleado no tiene un correo registrado");
  }

  const normalizedInputEmail = email?.trim().toLowerCase() ?? "";
  const normalizedStoredEmail = emailRecord.email.trim().toLowerCase();

  if (normalizedInputEmail && normalizedInputEmail !== normalizedStoredEmail) {
    return {
      success: true,
      message: "Si el correo coincide, enviaremos un enlace de restablecimiento",
    };
  }

  const token = crypto.randomUUID();
  const expiresAt = new DateTime(Date.now() + 15 * 60 * 1000);

  await db
    .update(securityUser)
    .set({
      passwordResetToken: token,
      passwordResetExpires: expiresAt,
    })
    .where(eq(securityUser.id, record.id));

  const systemConfig = await getSystemConfig();
  const companyName = systemConfig.companyName || "Agape";
  const employeeName = `${record.firstName} ${record.lastName}`.trim();
  const resetLink = new URL(resetUrl);
  resetLink.searchParams.set("token", token);

  await MailManager.sendMail({
    to: emailRecord.email,
    subject: generatePasswordResetEmailSubject(companyName),
    html: generatePasswordResetEmailHtml({
      employeeName,
      resetUrl: resetLink.toString(),
      companyName,
      supportEmail: systemConfig.companyEmail || undefined,
    }),
  });

  return {
    success: true,
    message: `Enlace de restablecimiento enviado a ${emailRecord.email}`,
    recipientEmail: emailRecord.email,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Solicita el enlace de cambio validando el correo del empleado.
 *
 * @permission public.security.password.request
 */
export async function requestPasswordResetByEmail(
  input: RequestPasswordResetByEmailInput
): Promise<RequestPasswordResetResult> {
  const { email, resetUrl } = input;

  if (!email?.trim()) {
    return {
      success: true,
      message: "Si el correo coincide, enviaremos un enlace de restablecimiento",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  const record = await db
    .select({
      id: securityUser.id,
      employeeId: securityUser.employeeId,
      firstName: person.firstName,
      lastName: person.lastName,
      isActive: securityUser.isActive,
      isLocked: securityUser.isLocked,
      email: contactMethod.value,
    })
    .from(contactMethod)
    .innerJoin(employee, eq(employee.id, contactMethod.userId))
    .innerJoin(person, eq(person.id, employee.id))
    .innerJoin(securityUser, eq(securityUser.employeeId, employee.id))
    .where(
      and(
        eq(contactMethod.type, "email"),
        eq(contactMethod.isPrimary, true),
        eq(contactMethod.isActive, true),
        eq(securityUser.isActive, true),
        eq(securityUser.isLocked, false)
      )
    )
    .then((rows) =>
      rows.find((row) => row.email?.trim().toLowerCase() === normalizedEmail)
    );

  if (!record) {
    return {
      success: true,
      message: "Si el correo coincide, enviaremos un enlace de restablecimiento",
    };
  }

  return requestPasswordReset({
    userId: record.id,
    resetUrl,
    email: record.email ?? undefined,
  });
}

/**
 * Valida un token de cambio de contrasena.
 *
 * @permission public.security.password.validate
 */
export async function validatePasswordResetToken(
  token: string
): Promise<ValidatePasswordResetTokenResult> {
  if (!token) {
    return { success: false, message: "Token no proporcionado" };
  }

  const [record] = await db
    .select({
      id: securityUser.id,
      expiresAt: securityUser.passwordResetExpires,
    })
    .from(securityUser)
    .where(eq(securityUser.passwordResetToken, token));

  if (!record) {
    return { success: false, message: "Token invalido" };
  }

  if (!record.expiresAt) {
    return { success: false, message: "Token expirado" };
  }

  const now = new DateTime();
  if (record.expiresAt.isBefore(now)) {
    return { success: false, message: "Token expirado" };
  }

  return {
    success: true,
    message: "Token valido",
    userId: record.id,
    expiresAt: record.expiresAt.toISOString(),
  };
}

/**
 * Cambia la contrasena usando un token.
 *
 * @permission public.security.password.reset
 */
export async function resetPasswordWithToken(
  input: ResetPasswordInput
): Promise<ResetPasswordResult> {
  const { token, newPassword } = input;

  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: "La contrasena debe tener al menos 6 caracteres" };
  }

  const [record] = await db
    .select({
      id: securityUser.id,
      employeeId: securityUser.employeeId,
      expiresAt: securityUser.passwordResetExpires,
      firstName: person.firstName,
      lastName: person.lastName,
    })
    .from(securityUser)
    .innerJoin(employee, eq(employee.id, securityUser.employeeId))
    .innerJoin(person, eq(person.id, employee.id))
    .where(eq(securityUser.passwordResetToken, token));

  if (!record) {
    return { success: false, message: "Token invalido" };
  }

  if (!record.expiresAt || record.expiresAt.isBefore(new DateTime())) {
    return { success: false, message: "Token expirado" };
  }

  const passwordHash = await hashPassword(newPassword);

  await db
    .update(securityUser)
    .set({
      passwordHash,
      passwordChangedAt: new DateTime(),
      mustChangePassword: false,
      passwordResetToken: null,
      passwordResetExpires: null,
    })
    .where(eq(securityUser.id, record.id));

  const [emailRecord] = await db
    .select({ email: contactMethod.value })
    .from(contactMethod)
    .where(
      and(
        eq(contactMethod.userId, record.employeeId),
        eq(contactMethod.type, "email"),
        eq(contactMethod.isPrimary, true),
        eq(contactMethod.isActive, true)
      )
    );

  if (emailRecord?.email) {
    const systemConfig = await getSystemConfig();
    const companyName = systemConfig.companyName || "Agape";
    const employeeName = `${record.firstName} ${record.lastName}`.trim();

    await MailManager.sendMail({
      to: emailRecord.email,
      subject: generatePasswordChangedEmailSubject(companyName),
      html: generatePasswordChangedEmailHtml({
        employeeName,
        companyName,
        supportEmail: systemConfig.companyEmail || undefined,
      }),
    });
  }

  return {
    success: true,
    message: "Contrasena actualizada exitosamente",
  };
}

export interface IUserSession extends Omit<IContext, "session"> {
  fullName: string;
  avatarUrl: string | null;
  /** Nombre del primer cargo del empleado (null si no tiene cargos asignados) */
  jobPositionName: string | null;
}