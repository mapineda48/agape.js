import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
    ShieldCheckIcon,
    PlusIcon,
    PencilIcon,
    UserGroupIcon,
    CheckIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { useNotificacion } from "@/components/ui/notification";
import {
    listRoles,
    listUsersWithRoles,
    getAvailablePermissions,
    upsertRole,
    toggleRole,
    assignUserRoles,
    type IRole,
    type IRoleWithUsers,
} from "@agape/security/role";
import Form from "@/components/form";
import * as Input from "@/components/form/Input";
import CheckBox from "@/components/form/CheckBox";
import Submit from "@/components/ui/submit";
import {
    createPortalHook,
    type PortalInjectedProps,
} from "@/components/util/portal";
import PortalModal from "@/components/ui/PortalModal";

// ============================================================================
// Types
// ============================================================================

interface RoleFormState {
    code: string;
    name: string;
    description: string;
    permissions: string[];
    isActive: boolean;
}

interface UserWithRoles {
    id: number;
    username: string;
    fullName: string;
    roles: { id: number; name: string; code: string }[];
}

interface PermissionGroup {
    module: string;
    permissions: { key: string; label: string }[];
}

// ============================================================================
// Data Loader
// ============================================================================

export async function onInit() {
    const [roles, users, permissionGroups] = await Promise.all([
        listRoles({ activeOnly: false }),
        listUsersWithRoles(),
        getAvailablePermissions(),
    ]);

    return { roles, users, permissionGroups };
}

// ============================================================================
// Modal Hooks
// ============================================================================

type PortalModalProps = PortalInjectedProps & { onClose?: () => void };

function RoleModalWrapper(
    props: {
        item: IRoleWithUsers | null;
        permissionGroups: PermissionGroup[];
        onSave: () => void;
    } & PortalModalProps
) {
    const handleClose = props.onClose ?? (() => {});

    return (
        <PortalModal
            {...props}
            title={props.item ? "Editar Rol" : "Nuevo Rol"}
            size="lg"
        >
            <RoleForm
                item={props.item}
                permissionGroups={props.permissionGroups}
                onSave={props.onSave}
                onClose={handleClose}
            />
        </PortalModal>
    );
}

function UserRolesModalWrapper(
    props: {
        user: UserWithRoles;
        roles: IRoleWithUsers[];
        onSave: () => void;
    } & PortalModalProps
) {
    const handleClose = props.onClose ?? (() => {});

    return (
        <PortalModal
            {...props}
            title={`Roles de ${props.user.username}`}
            size="md"
        >
            <UserRolesForm
                user={props.user}
                roles={props.roles}
                onSave={props.onSave}
                onClose={handleClose}
            />
        </PortalModal>
    );
}

const useRoleModal = createPortalHook(RoleModalWrapper);
const useUserRolesModal = createPortalHook(UserRolesModalWrapper);

// ============================================================================
// Main Page Component
// ============================================================================

export default function SecurityConfigurationPage(props: {
    roles: IRoleWithUsers[];
    users: UserWithRoles[];
    permissionGroups: PermissionGroup[];
}) {
    const notify = useNotificacion();
    const [roles, setRoles] = useState<IRoleWithUsers[]>(props.roles);
    const [users, setUsers] = useState<UserWithRoles[]>(props.users);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"roles" | "users">("roles");

    const showRoleModal = useRoleModal();
    const showUserRolesModal = useUserRolesModal();

    async function reload() {
        setLoading(true);
        try {
            const [newRoles, newUsers] = await Promise.all([
                listRoles({ activeOnly: false }),
                listUsersWithRoles(),
            ]);
            setRoles(newRoles);
            setUsers(newUsers);
        } catch (error) {
            console.error("Error reloading data:", error);
            notify({ payload: "Error al cargar datos", type: "error" });
        }
        setLoading(false);
    }

    function openCreateRole() {
        showRoleModal({
            item: null,
            permissionGroups: props.permissionGroups,
            onSave: reload,
        });
    }

    function openEditRole(role: IRoleWithUsers) {
        showRoleModal({
            item: role,
            permissionGroups: props.permissionGroups,
            onSave: reload,
        });
    }

    function openUserRoles(user: UserWithRoles) {
        showUserRolesModal({
            user,
            roles,
            onSave: reload,
        });
    }

    async function handleToggleRole(role: IRoleWithUsers) {
        try {
            const result = await toggleRole({
                id: role.id,
                isActive: !role.isActive,
            });
            if (result.success) {
                notify({ payload: result.message, type: "success" });
                await reload();
            } else {
                notify({ payload: result.message, type: "error" });
            }
        } catch (error) {
            console.error("Error toggling role:", error);
            notify({ payload: "Error al cambiar estado", type: "error" });
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 shadow-sm p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-600 dark:text-purple-300">
                            Seguridad
                        </p>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                            Roles y Permisos
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">
                            Administra los roles del sistema y asigna permisos a los usuarios.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <StatChip
                            label="Roles"
                            value={roles.length}
                            tone="purple"
                            muted={loading}
                        />
                        <StatChip
                            label="Usuarios"
                            value={users.length}
                            tone="indigo"
                            muted={loading}
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab("roles")}
                    className={clsx(
                        "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
                        activeTab === "roles"
                            ? "border-purple-600 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    )}
                >
                    <ShieldCheckIcon className="w-5 h-5 inline-block mr-2" />
                    Roles
                </button>
                <button
                    onClick={() => setActiveTab("users")}
                    className={clsx(
                        "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
                        activeTab === "users"
                            ? "border-purple-600 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    )}
                >
                    <UserGroupIcon className="w-5 h-5 inline-block mr-2" />
                    Asignación de Usuarios
                </button>
            </div>

            {/* Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === "roles" ? (
                    <RolesPanel
                        roles={roles}
                        loading={loading}
                        onCreate={openCreateRole}
                        onEdit={openEditRole}
                        onToggle={handleToggleRole}
                    />
                ) : (
                    <UsersPanel
                        users={users}
                        loading={loading}
                        onEditRoles={openUserRoles}
                    />
                )}
            </motion.div>
        </div>
    );
}

// ============================================================================
// Roles Panel
// ============================================================================

function RolesPanel({
    roles,
    loading,
    onCreate,
    onEdit,
    onToggle,
}: {
    roles: IRoleWithUsers[];
    loading: boolean;
    onCreate: () => void;
    onEdit: (role: IRoleWithUsers) => void;
    onToggle: (role: IRoleWithUsers) => void;
}) {
    const [search, setSearch] = useState("");
    const normalizedSearch = search.trim().toLowerCase();

    const filteredRoles = useMemo(() => {
        if (!normalizedSearch) {
            return roles;
        }

        return roles.filter((role) => {
            const description = role.description ?? "";
            return (
                role.name.toLowerCase().includes(normalizedSearch) ||
                role.code.toLowerCase().includes(normalizedSearch) ||
                description.toLowerCase().includes(normalizedSearch)
            );
        });
    }, [roles, normalizedSearch]);

    return (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
            <div className="flex flex-col gap-4 px-5 py-4 rounded-t-2xl bg-gradient-to-r from-purple-50/70 dark:from-purple-900/20 to-transparent">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Roles del Sistema
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Define los roles y sus permisos de acceso.
                        </p>
                    </div>
                    <button
                        onClick={onCreate}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5 bg-purple-600 hover:bg-purple-700"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Nuevo Rol
                    </button>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar por nombre, codigo o descripcion"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/40"
                        />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {filteredRoles.length} de {roles.length} roles
                    </div>
                </div>
            </div>

            <div className="p-5">
                {loading ? (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-4 py-8 text-center text-sm text-gray-600 dark:text-gray-300">
                        Cargando roles...
                    </div>
                ) : filteredRoles.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-4 py-8 text-center text-sm text-gray-600 dark:text-gray-300">
                        No hay roles con esos filtros.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredRoles.map((role) => (
                            <RoleCard
                                key={role.id}
                                role={role}
                                onEdit={() => onEdit(role)}
                                onToggle={() => onToggle(role)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function RoleCard({
    role,
    onEdit,
    onToggle,
}: {
    role: IRoleWithUsers;
    onEdit: () => void;
    onToggle: () => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {role.name}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {role.code}
                    </span>
                    {role.isSystemRole && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            Sistema
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {role.permissions.length} permisos • {role.userCount} usuarios
                </p>
                {role.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {role.description}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2">
                <span
                    className={clsx(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                        role.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    )}
                >
                    {role.isActive ? "Activo" : "Inactivo"}
                </span>
                {!role.isSystemRole && (
                    <>
                        <button
                            onClick={onToggle}
                            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={role.isActive ? "Desactivar" : "Activar"}
                        >
                            {role.isActive ? (
                                <XMarkIcon className="w-5 h-5" />
                            ) : (
                                <CheckIcon className="w-5 h-5" />
                            )}
                        </button>
                        <button
                            onClick={onEdit}
                            className="rounded-md p-2 text-purple-600 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-900/40 transition-colors"
                            title="Editar"
                        >
                            <PencilIcon className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Users Panel
// ============================================================================

function UsersPanel({
    users,
    loading,
    onEditRoles,
}: {
    users: UserWithRoles[];
    loading: boolean;
    onEditRoles: (user: UserWithRoles) => void;
}) {
    const [search, setSearch] = useState("");
    const normalizedSearch = search.trim().toLowerCase();

    const filteredUsers = useMemo(() => {
        if (!normalizedSearch) {
            return users;
        }

        return users.filter((user) => {
            const rolesText = user.roles.map((role) => role.name).join(" ");
            return (
                user.username.toLowerCase().includes(normalizedSearch) ||
                user.fullName.toLowerCase().includes(normalizedSearch) ||
                rolesText.toLowerCase().includes(normalizedSearch)
            );
        });
    }, [users, normalizedSearch]);

    return (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
            <div className="px-5 py-4 rounded-t-2xl bg-gradient-to-r from-indigo-50/70 dark:from-indigo-900/20 to-transparent space-y-3">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Asignación de Roles a Usuarios
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Gestiona qué roles tiene cada usuario del sistema.
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar por usuario, nombre o rol"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/40"
                        />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {filteredUsers.length} de {users.length} usuarios
                    </div>
                </div>
            </div>

            <div className="p-5">
                {loading ? (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-4 py-8 text-center text-sm text-gray-600 dark:text-gray-300">
                        Cargando usuarios...
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-4 py-8 text-center text-sm text-gray-600 dark:text-gray-300">
                        No hay usuarios con esos filtros.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredUsers.map((user) => (
                            <UserRoleCard
                                key={user.id}
                                user={user}
                                onEdit={() => onEditRoles(user)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function UserRoleCard({
    user,
    onEdit,
}: {
    user: UserWithRoles;
    onEdit: () => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user.username}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                    {user.roles.length === 0 ? (
                        <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                            Sin roles asignados
                        </span>
                    ) : (
                        user.roles.map((role) => (
                            <span
                                key={role.id}
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                            >
                                {role.name}
                            </span>
                        ))
                    )}
                </div>
            </div>
            <button
                onClick={onEdit}
                className="rounded-md p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/40 transition-colors"
                title="Editar roles"
            >
                <PencilIcon className="w-5 h-5" />
            </button>
        </div>
    );
}

// ============================================================================
// Role Form
// ============================================================================

function RoleForm({
    item,
    permissionGroups,
    onSave,
    onClose,
}: {
    item: IRoleWithUsers | null;
    permissionGroups: PermissionGroup[];
    onSave: () => void;
    onClose: () => void;
}) {
    const notify = useNotificacion();
    const isEditing = !!item;
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
        new Set(item?.permissions || [])
    );
    const [permissionSearch, setPermissionSearch] = useState("");
    const normalizedPermissionSearch = permissionSearch.trim().toLowerCase();

    const filteredPermissionGroups = useMemo(() => {
        if (!normalizedPermissionSearch) {
            return permissionGroups;
        }

        return permissionGroups
            .map((group) => {
                const matchingPermissions = group.permissions.filter((perm) => {
                    return (
                        perm.label.toLowerCase().includes(normalizedPermissionSearch) ||
                        perm.key.toLowerCase().includes(normalizedPermissionSearch)
                    );
                });

                return {
                    ...group,
                    permissions: matchingPermissions,
                };
            })
            .filter(
                (group) =>
                    group.permissions.length > 0 ||
                    group.module.toLowerCase().includes(normalizedPermissionSearch)
            );
    }, [permissionGroups, normalizedPermissionSearch]);

    const selectedCountByGroup = useMemo(() => {
        const counts = new Map<string, { selected: number; total: number }>();

        permissionGroups.forEach((group) => {
            const selected = group.permissions.filter((perm) =>
                selectedPermissions.has(perm.key)
            ).length;

            counts.set(group.module, {
                selected,
                total: group.permissions.length,
            });
        });

        return counts;
    }, [permissionGroups, selectedPermissions]);

    const allPermissionKeys = useMemo(() => {
        return permissionGroups.flatMap((group) =>
            group.permissions.map((perm) => perm.key)
        );
    }, [permissionGroups]);

    const initialState: RoleFormState = item
        ? {
            code: item.code,
            name: item.name,
            description: item.description || "",
            permissions: item.permissions,
            isActive: item.isActive,
        }
        : {
            code: "",
            name: "",
            description: "",
            permissions: [],
            isActive: true,
        };

    function togglePermission(key: string) {
        const newSet = new Set(selectedPermissions);
        if (newSet.has(key)) {
            newSet.delete(key);
        } else {
            newSet.add(key);
        }
        setSelectedPermissions(newSet);
    }

    function applySelection(keys: string[], shouldSelect: boolean) {
        const newSet = new Set(selectedPermissions);
        keys.forEach((key) => {
            if (shouldSelect) {
                newSet.add(key);
            } else {
                newSet.delete(key);
            }
        });
        setSelectedPermissions(newSet);
    }

    async function handleSubmit(data: RoleFormState) {
        try {
            await upsertRole({
                id: item?.id,
                code: data.code,
                name: data.name,
                description: data.description || null,
                permissions: Array.from(selectedPermissions),
                isActive: data.isActive,
            });
            notify({
                payload: isEditing ? "Rol actualizado" : "Rol creado",
                type: "success",
            });
            await onSave();
            onClose();
        } catch (error: any) {
            console.error("Error saving role:", error);
            notify({
                payload: error.message || "Error al guardar el rol",
                type: "error",
            });
        }
    }

    return (
        <Form.Root<RoleFormState> state={initialState}>
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            Código
                        </label>
                        <Input.Text
                            path="code"
                            required
                            placeholder="Ej: VENTAS, ADMIN"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            Nombre
                        </label>
                        <Input.Text
                            path="name"
                            required
                            placeholder="Ej: Ventas, Administrador"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        Descripción
                    </label>
                    <Input.Text
                        path="description"
                        placeholder="Descripción del rol..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                    <CheckBox
                        path="isActive"
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                        Rol activo
                    </span>
                </div>

                <div className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <label className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            Permisos ({selectedPermissions.size} seleccionados)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => applySelection(allPermissionKeys, true)}
                                className="text-xs font-medium text-purple-600 hover:text-purple-700"
                            >
                                Seleccionar todo
                            </button>
                            <span className="text-xs text-gray-300">|</span>
                            <button
                                type="button"
                                onClick={() => applySelection(allPermissionKeys, false)}
                                className="text-xs font-medium text-gray-500 hover:text-gray-700"
                            >
                                Limpiar todo
                            </button>
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-900/40 p-3 space-y-3">
                        <input
                            type="text"
                            value={permissionSearch}
                            onChange={(event) => setPermissionSearch(event.target.value)}
                            placeholder="Buscar permisos por modulo, nombre o clave"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/40"
                        />
                        <div className="space-y-4 max-h-64 overflow-y-auto">
                            {filteredPermissionGroups.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No hay permisos con esos filtros.
                                </div>
                            ) : (
                                filteredPermissionGroups.map((group) => {
                                    const groupStats = selectedCountByGroup.get(group.module);
                                    const selectedCount = groupStats?.selected ?? 0;
                                    const totalCount = groupStats?.total ?? 0;
                                    const groupKeys = group.permissions.map((perm) => perm.key);

                                    return (
                                        <div key={group.module}>
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                                    {group.module}
                                                    <span className="ml-2 text-[11px] font-normal text-gray-400 dark:text-gray-500">
                                                        {selectedCount}/{totalCount}
                                                    </span>
                                                </p>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => applySelection(groupKeys, true)}
                                                        className="text-purple-600 hover:text-purple-700"
                                                    >
                                                        Seleccionar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => applySelection(groupKeys, false)}
                                                        className="text-gray-500 hover:text-gray-700"
                                                    >
                                                        Limpiar
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {group.permissions.map((perm) => (
                                                    <label
                                                        key={perm.key}
                                                        className={clsx(
                                                            "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                                                            selectedPermissions.has(perm.key)
                                                                ? "border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20"
                                                                : "border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
                                                        )}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPermissions.has(perm.key)}
                                                            onChange={() => togglePermission(perm.key)}
                                                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                                        />
                                                        <div className="min-w-0">
                                                            <span className="text-sm text-gray-800 dark:text-gray-200 block">
                                                                {perm.label}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono block truncate">
                                                                {perm.key}
                                                            </span>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 rounded-b-xl">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <Submit<RoleFormState>
                    onSubmit={handleSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                    {isEditing ? "Guardar cambios" : "Crear rol"}
                </Submit>
            </div>
        </Form.Root>
    );
}

// ============================================================================
// User Roles Form
// ============================================================================

function UserRolesForm({
    user,
    roles,
    onSave,
    onClose,
}: {
    user: UserWithRoles;
    roles: IRoleWithUsers[];
    onSave: () => void;
    onClose: () => void;
}) {
    const notify = useNotificacion();
    const [selectedRoles, setSelectedRoles] = useState<Set<number>>(
        new Set(user.roles.map((r) => r.id))
    );
    const [saving, setSaving] = useState(false);

    function toggleRole(roleId: number) {
        const newSet = new Set(selectedRoles);
        if (newSet.has(roleId)) {
            newSet.delete(roleId);
        } else {
            newSet.add(roleId);
        }
        setSelectedRoles(newSet);
    }

    async function handleSave() {
        setSaving(true);
        try {
            await assignUserRoles(user.id, Array.from(selectedRoles));
            notify({ payload: "Roles actualizados", type: "success" });
            await onSave();
            onClose();
        } catch (error: any) {
            console.error("Error saving user roles:", error);
            notify({
                payload: error.message || "Error al guardar roles",
                type: "error",
            });
        }
        setSaving(false);
    }

    const activeRoles = roles.filter((r) => r.isActive);

    return (
        <div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selecciona los roles que deseas asignar a <strong>{user.username}</strong>:
                </p>
                <div className="space-y-2">
                    {activeRoles.map((role) => (
                        <label
                            key={role.id}
                            className={clsx(
                                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                selectedRoles.has(role.id)
                                    ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20"
                                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                        >
                            <input
                                type="checkbox"
                                checked={selectedRoles.has(role.id)}
                                onChange={() => toggleRole(role.id)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {role.name}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                        {role.code}
                                    </span>
                                </div>
                                {role.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {role.description}
                                    </p>
                                )}
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 rounded-b-xl">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow-md disabled:opacity-50"
                >
                    {saving ? "Guardando..." : "Guardar"}
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// Helper Components
// ============================================================================

function StatChip({
    label,
    value,
    tone,
    muted,
}: {
    label: string;
    value: number;
    tone: "purple" | "indigo";
    muted?: boolean;
}) {
    const tones = {
        purple:
            "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
        indigo:
            "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
    };

    return (
        <div
            className={clsx(
                "rounded-full px-4 py-2 text-sm font-semibold shadow-sm border border-white/60 dark:border-gray-700",
                tones[tone],
                muted && "opacity-70"
            )}
        >
            {label}: {value}
        </div>
    );
}
