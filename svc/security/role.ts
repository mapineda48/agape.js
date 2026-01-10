/**
 * Security Role Service
 *
 * Provides CRUD operations for managing security roles and their permissions.
 * Only users with `security.role.manage` permission can modify roles.
 */

import { eq, and, sql, count } from "drizzle-orm";
import { db } from "#lib/db";
import {
    securityRole,
    securityUserRole,
} from "#models/security/role";
import securityUser from "#models/security/user";
import { BusinessRuleError } from "#lib/error";

// ============================================================================
// Types
// ============================================================================

export interface IRole {
    id: number;
    code: string;
    name: string;
    description: string | null;
    permissions: string[];
    isSystemRole: boolean;
    isActive: boolean;
}

export interface IUpsertRole {
    id?: number;
    code: string;
    name: string;
    description?: string | null;
    permissions: string[];
    isActive?: boolean;
}

export interface IListRolesParams {
    activeOnly?: boolean;
    includeSystemRoles?: boolean;
}

export interface IRoleWithUsers extends IRole {
    userCount: number;
}

export interface IUserRoleAssignment {
    userId: number;
    roleId: number;
}

// ============================================================================
// Role CRUD Operations
// ============================================================================

/**
 * Lists all security roles.
 *
 * @param params Filter parameters
 * @returns List of roles with user counts
 * @permission security.role.read
 */
export async function listRoles(
    params: IListRolesParams = {}
): Promise<IRoleWithUsers[]> {
    const { activeOnly = true, includeSystemRoles = true } = params;

    const conditions = [];

    if (activeOnly) {
        conditions.push(eq(securityRole.isActive, true));
    }

    if (!includeSystemRoles) {
        conditions.push(eq(securityRole.isSystemRole, false));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const roles = await db
        .select({
            id: securityRole.id,
            code: securityRole.code,
            name: securityRole.name,
            description: securityRole.description,
            permissions: securityRole.permissions,
            isSystemRole: securityRole.isSystemRole,
            isActive: securityRole.isActive,
            userCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${securityUserRole}
        WHERE ${securityUserRole.roleId} = ${securityRole.id}
      )`,
        })
        .from(securityRole)
        .where(whereClause)
        .orderBy(securityRole.name);

    return roles;
}

/**
 * Gets a role by ID.
 *
 * @param id Role ID
 * @returns Role or undefined
 * @permission security.role.read
 */
export async function getRoleById(id: number): Promise<IRole | undefined> {
    const [role] = await db
        .select()
        .from(securityRole)
        .where(eq(securityRole.id, id));

    return role;
}

/**
 * Creates or updates a security role.
 *
 * @param payload Role data
 * @returns Created or updated role
 * @permission security.role.manage
 */
export async function upsertRole(payload: IUpsertRole): Promise<IRole[]> {
    const { id, code, name, description, permissions, isActive = true } = payload;

    // Validate code format (uppercase, alphanumeric with underscores)
    const normalizedCode = code.toUpperCase().trim();
    if (!/^[A-Z][A-Z0-9_]*$/.test(normalizedCode)) {
        throw new BusinessRuleError(
            "El código debe comenzar con letra y contener solo letras, números y guiones bajos"
        );
    }

    if (id) {
        // Check if it's a system role
        const [existing] = await db
            .select({ isSystemRole: securityRole.isSystemRole })
            .from(securityRole)
            .where(eq(securityRole.id, id));

        if (existing?.isSystemRole) {
            throw new BusinessRuleError(
                "No se pueden modificar roles del sistema"
            );
        }

        // Update
        return db
            .update(securityRole)
            .set({
                code: normalizedCode,
                name: name.trim(),
                description: description?.trim() || null,
                permissions,
                isActive,
            })
            .where(eq(securityRole.id, id))
            .returning();
    }

    // Insert
    return db
        .insert(securityRole)
        .values({
            code: normalizedCode,
            name: name.trim(),
            description: description?.trim() || null,
            permissions,
            isSystemRole: false,
            isActive,
        })
        .returning();
}

/**
 * Toggles a role's active status.
 *
 * @param payload ID and new status
 * @returns Updated role
 * @permission security.role.manage
 */
export async function toggleRole(payload: {
    id: number;
    isActive: boolean;
}): Promise<{ success: boolean; message: string; role?: IRole }> {
    const { id, isActive } = payload;

    const [existing] = await db
        .select()
        .from(securityRole)
        .where(eq(securityRole.id, id));

    if (!existing) {
        return { success: false, message: "Rol no encontrado" };
    }

    if (existing.isSystemRole) {
        return { success: false, message: "No se pueden desactivar roles del sistema" };
    }

    const [updated] = await db
        .update(securityRole)
        .set({ isActive })
        .where(eq(securityRole.id, id))
        .returning();

    return {
        success: true,
        message: isActive ? "Rol activado" : "Rol desactivado",
        role: updated,
    };
}

// ============================================================================
// User-Role Assignment Operations
// ============================================================================

/**
 * Lists users with their assigned roles.
 *
 * @returns List of users with role information
 * @permission security.role.read
 */
export async function listUsersWithRoles(): Promise<
    {
        id: number;
        username: string;
        fullName: string;
        roles: { id: number; name: string; code: string }[];
    }[]
> {
    // Get all users first
    const users = await db
        .select({
            id: securityUser.id,
            username: securityUser.username,
        })
        .from(securityUser)
        .orderBy(securityUser.username);

    // Get all user-role assignments
    const assignments = await db
        .select({
            userId: securityUserRole.userId,
            roleId: securityRole.id,
            roleName: securityRole.name,
            roleCode: securityRole.code,
        })
        .from(securityUserRole)
        .innerJoin(securityRole, eq(securityRole.id, securityUserRole.roleId));

    // Group roles by user
    return users.map((user) => ({
        id: user.id,
        username: user.username,
        fullName: user.username, // Will be enriched later if needed
        roles: assignments
            .filter((a) => a.userId === user.id)
            .map((a) => ({ id: a.roleId, name: a.roleName, code: a.roleCode })),
    }));
}

/**
 * Gets the roles assigned to a specific user.
 *
 * @param userId User ID
 * @returns List of role IDs
 * @permission security.role.read
 */
export async function getUserRoles(userId: number): Promise<number[]> {
    const assignments = await db
        .select({ roleId: securityUserRole.roleId })
        .from(securityUserRole)
        .where(eq(securityUserRole.userId, userId));

    return assignments.map((a) => a.roleId);
}

/**
 * Assigns roles to a user (replaces existing assignments).
 *
 * @param userId User ID
 * @param roleIds Array of role IDs to assign
 * @permission security.role.manage
 */
export async function assignUserRoles(
    userId: number,
    roleIds: number[]
): Promise<{ success: boolean; message: string }> {
    await db.transaction(async (tx) => {
        // Remove existing assignments
        await tx
            .delete(securityUserRole)
            .where(eq(securityUserRole.userId, userId));

        // Add new assignments
        if (roleIds.length > 0) {
            await tx.insert(securityUserRole).values(
                roleIds.map((roleId) => ({
                    userId,
                    roleId,
                }))
            );
        }
    });

    return {
        success: true,
        message: `Se asignaron ${roleIds.length} roles al usuario`,
    };
}

/**
 * Adds a role to a user.
 *
 * @param assignment User and role IDs
 * @permission security.role.manage
 */
export async function addUserRole(
    assignment: IUserRoleAssignment
): Promise<{ success: boolean; message: string }> {
    const { userId, roleId } = assignment;

    // Check if already assigned
    const [existing] = await db
        .select()
        .from(securityUserRole)
        .where(
            and(
                eq(securityUserRole.userId, userId),
                eq(securityUserRole.roleId, roleId)
            )
        );

    if (existing) {
        return { success: false, message: "El usuario ya tiene este rol asignado" };
    }

    await db.insert(securityUserRole).values({ userId, roleId });

    return { success: true, message: "Rol asignado correctamente" };
}

/**
 * Removes a role from a user.
 *
 * @param assignment User and role IDs
 * @permission security.role.manage
 */
export async function removeUserRole(
    assignment: IUserRoleAssignment
): Promise<{ success: boolean; message: string }> {
    const { userId, roleId } = assignment;

    await db
        .delete(securityUserRole)
        .where(
            and(
                eq(securityUserRole.userId, userId),
                eq(securityUserRole.roleId, roleId)
            )
        );

    return { success: true, message: "Rol removido correctamente" };
}

// ============================================================================
// Permission Catalog
// ============================================================================

/**
 * Returns all available permissions in the system.
 * This is a static list based on the defined services.
 *
 * @returns List of available permissions grouped by module
 * @permission security.role.read
 */
export async function getAvailablePermissions(): Promise<
    { module: string; permissions: { key: string; label: string }[] }[]
> {
    // Return the permission catalog
    return [
        {
            module: "Seguridad",
            permissions: [
                { key: "security.role.read", label: "Ver roles" },
                { key: "security.role.manage", label: "Gestionar roles" },
                { key: "security.user.read", label: "Ver usuarios" },
                { key: "*", label: "Acceso total (Admin)" },
            ],
        },
        {
            module: "CRM",
            permissions: [
                { key: "crm.client.read", label: "Ver clientes" },
                { key: "crm.client.manage", label: "Gestionar clientes" },
                { key: "crm.client_type.read", label: "Ver tipos de cliente" },
                { key: "crm.client_type.manage", label: "Gestionar tipos de cliente" },
                { key: "crm.*", label: "Acceso completo a CRM" },
            ],
        },
        {
            module: "Ventas",
            permissions: [
                { key: "sales.order.read", label: "Ver pedidos" },
                { key: "sales.order.manage", label: "Gestionar pedidos" },
                { key: "sales.flow.deliver", label: "Crear despachos" },
                { key: "sales.flow.invoice", label: "Facturar pedidos" },
                { key: "sales.*", label: "Acceso completo a Ventas" },
            ],
        },
        {
            module: "Inventario",
            permissions: [
                { key: "inventory.item.read", label: "Ver productos" },
                { key: "inventory.item.manage", label: "Gestionar productos" },
                { key: "inventory.location.read", label: "Ver ubicaciones" },
                { key: "inventory.location.manage", label: "Gestionar ubicaciones" },
                { key: "inventory.movement.read", label: "Ver movimientos" },
                { key: "inventory.movement.manage", label: "Gestionar movimientos" },
                { key: "inventory.stock.read", label: "Ver stock" },
                { key: "inventory.*", label: "Acceso completo a Inventario" },
            ],
        },
        {
            module: "Finanzas",
            permissions: [
                { key: "finance.sales_invoice.read", label: "Ver facturas de venta" },
                { key: "finance.sales_invoice.manage", label: "Gestionar facturas de venta" },
                { key: "finance.purchase_invoice.read", label: "Ver facturas de compra" },
                { key: "finance.purchase_invoice.manage", label: "Gestionar facturas de compra" },
                { key: "finance.payment.read", label: "Ver pagos" },
                { key: "finance.payment.manage", label: "Gestionar pagos" },
                { key: "finance.currency.read", label: "Ver monedas" },
                { key: "finance.currency.manage", label: "Gestionar monedas" },
                { key: "finance.*", label: "Acceso completo a Finanzas" },
            ],
        },
        {
            module: "Compras",
            permissions: [
                { key: "purchasing.supplier.read", label: "Ver proveedores" },
                { key: "purchasing.supplier.manage", label: "Gestionar proveedores" },
                { key: "purchasing.order.read", label: "Ver órdenes de compra" },
                { key: "purchasing.order.manage", label: "Gestionar órdenes de compra" },
                { key: "purchasing.*", label: "Acceso completo a Compras" },
            ],
        },
        {
            module: "Recursos Humanos",
            permissions: [
                { key: "hr.employee.read", label: "Ver empleados" },
                { key: "hr.employee.manage", label: "Gestionar empleados" },
                { key: "hr.department.read", label: "Ver departamentos" },
                { key: "hr.department.manage", label: "Gestionar departamentos" },
                { key: "hr.*", label: "Acceso completo a RRHH" },
            ],
        },
        {
            module: "Configuración",
            permissions: [
                { key: "config.system.read", label: "Ver configuración" },
                { key: "config.system.manage", label: "Gestionar configuración" },
                { key: "numbering.series.read", label: "Ver series de numeración" },
                { key: "numbering.series.manage", label: "Gestionar series de numeración" },
            ],
        },
    ];
}
