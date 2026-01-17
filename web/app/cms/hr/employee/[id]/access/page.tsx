import { Fragment, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    KeyIcon,
    ShieldCheckIcon,
    LockClosedIcon,
    LockOpenIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    UserCircleIcon,
    ArrowPathIcon,
    EyeIcon,
    EyeSlashIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import Form from "@/components/form";
import { Submit } from "@/components/form/Submit";
import {
    getSecurityUserByEmployeeId,
    upsertSecurityUser,
    toggleSecurityUserActive,
    toggleSecurityUserLock,
    requestPasswordReset,
    type ISecurityUser,
    type IUpsertSecurityUser,
} from "@agape/security/user";
import { listRoles, type IRoleWithUsers } from "@agape/security/role";
import { getEmployeeById } from "@agape/hr/employee";

interface PageParams {
    id: string;
}

interface Props {
    employeeId: number;
    employeeName: string;
    avatarUrl: string | null;
    securityUser: ISecurityUser | null;
    roles: IRoleWithUsers[];
}

export async function onInit({ params }: { params: PageParams }) {
    const employeeId = Number(params.id);

    const [employee, securityUser, rolesResult] = await Promise.all([
        getEmployeeById(employeeId),
        getSecurityUserByEmployeeId(employeeId),
        listRoles({ activeOnly: true, includeSystemRoles: false }),
    ]);

    if (!employee) {
        throw new Error("Empleado no encontrado");
    }

    return {
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        avatarUrl: employee.avatarUrl,
        securityUser,
        roles: rolesResult,
    };
}

export default function EmployeeAccessPage(props: Props) {
    const { navigate } = useRouter();
    const notify = useNotificacion();
    const [securityUser, setSecurityUser] = useState<ISecurityUser | null>(
        props.securityUser
    );
    const [isCreating, setIsCreating] = useState(!securityUser);
    const [isLoading, setIsLoading] = useState(false);
    const [isResetLinkLoading, setIsResetLinkLoading] = useState(false);

    // Initial form data for creating or editing
    const initialData: IUpsertSecurityUser = securityUser
        ? {
            id: securityUser.id,
            employeeId: securityUser.employeeId,
            username: securityUser.username,
            isActive: securityUser.isActive,
            roleIds: securityUser.roles.map((r) => r.id),
        }
        : {
            employeeId: props.employeeId,
            username: "",
            password: "",
            isActive: true,
            roleIds: [],
        };

    // Handler for toggling user active status
    const handleToggleActive = async () => {
        if (!securityUser) return;
        setIsLoading(true);
        try {
            const result = await toggleSecurityUserActive(
                securityUser.id,
                !securityUser.isActive
            );
            if (result.success) {
                setSecurityUser({ ...securityUser, isActive: !securityUser.isActive });
                notify({ payload: result.message, type: "success" });
            } else {
                notify({ payload: result.message, type: "error" });
            }
        } catch (error: any) {
            notify({ payload: error });
        } finally {
            setIsLoading(false);
        }
    };

    // Handler for toggling lock status
    const handleToggleLock = async () => {
        if (!securityUser) return;
        setIsLoading(true);
        try {
            const result = await toggleSecurityUserLock(
                securityUser.id,
                !securityUser.isLocked,
                !securityUser.isLocked ? "Bloqueado por administrador" : undefined
            );
            if (result.success) {
                setSecurityUser({
                    ...securityUser,
                    isLocked: !securityUser.isLocked,
                    lockReason: !securityUser.isLocked
                        ? "Bloqueado por administrador"
                        : null,
                    failedLoginAttempts: 0,
                });
                notify({ payload: result.message, type: "success" });
            } else {
                notify({ payload: result.message, type: "error" });
            }
        } catch (error: any) {
            notify({ payload: error });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendResetLink = async () => {
        if (!securityUser) return;
        setIsResetLinkLoading(true);
        try {
            const resetUrl = new URL("/auth/reset", location.origin).toString();
            const result = await requestPasswordReset({
                userId: securityUser.id,
                resetUrl,
            });
            if (result.success) {
                notify({ payload: result.message, type: "success" });
            } else {
                notify({ payload: result.message, type: "error" });
            }
        } catch (error: any) {
            notify({ payload: error?.message || error, type: "error" });
        } finally {
            setIsResetLinkLoading(false);
        }
    };

    return (
        <Fragment>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                                <KeyIcon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    Acceso al Sistema
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                                    <UserCircleIcon className="h-5 w-5" />
                                    {props.employeeName}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <AnimatePresence mode="wait">
                        {securityUser && !isCreating ? (
                            <motion.div
                                key="user-details"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* Status Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Active Status Card */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className={`p-6 rounded-2xl border-2 transition-all ${securityUser.isActive
                                            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700"
                                            : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`p-2 rounded-lg ${securityUser.isActive
                                                        ? "bg-emerald-100 dark:bg-emerald-800"
                                                        : "bg-gray-200 dark:bg-gray-700"
                                                        }`}
                                                >
                                                    <CheckCircleIcon
                                                        className={`h-6 w-6 ${securityUser.isActive
                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                            : "text-gray-500"
                                                            }`}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        Estado
                                                    </p>
                                                    <p
                                                        className={`font-semibold ${securityUser.isActive
                                                            ? "text-emerald-700 dark:text-emerald-400"
                                                            : "text-gray-700 dark:text-gray-300"
                                                            }`}
                                                    >
                                                        {securityUser.isActive ? "Activo" : "Inactivo"}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleToggleActive}
                                                disabled={isLoading}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${securityUser.isActive
                                                    ? "bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                                                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                                                    }`}
                                            >
                                                {securityUser.isActive ? "Desactivar" : "Activar"}
                                            </button>
                                        </div>
                                    </motion.div>

                                    {/* Lock Status Card */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className={`p-6 rounded-2xl border-2 transition-all ${securityUser.isLocked
                                            ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700"
                                            : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`p-2 rounded-lg ${securityUser.isLocked
                                                        ? "bg-red-100 dark:bg-red-800"
                                                        : "bg-blue-100 dark:bg-blue-800"
                                                        }`}
                                                >
                                                    {securityUser.isLocked ? (
                                                        <LockClosedIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                                                    ) : (
                                                        <LockOpenIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        Acceso
                                                    </p>
                                                    <p
                                                        className={`font-semibold ${securityUser.isLocked
                                                            ? "text-red-700 dark:text-red-400"
                                                            : "text-blue-700 dark:text-blue-400"
                                                            }`}
                                                    >
                                                        {securityUser.isLocked
                                                            ? "Bloqueado"
                                                            : "Desbloqueado"}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleToggleLock}
                                                disabled={isLoading}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${securityUser.isLocked
                                                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                                                    : "bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-800 dark:hover:bg-red-700 dark:text-red-300"
                                                    }`}
                                            >
                                                {securityUser.isLocked ? "Desbloquear" : "Bloquear"}
                                            </button>
                                        </div>
                                        {securityUser.isLocked && securityUser.lockReason && (
                                            <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                                <ExclamationTriangleIcon className="h-4 w-4" />
                                                {securityUser.lockReason}
                                            </p>
                                        )}
                                    </motion.div>

                                    {/* Login Stats Card */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="p-6 rounded-2xl bg-purple-50 border-2 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-800">
                                                <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                    Último Acceso
                                                </p>
                                                <p className="font-semibold text-purple-700 dark:text-purple-400">
                                                    {securityUser.lastLogin
                                                        ? new Date(
                                                            securityUser.lastLogin as any
                                                        ).toLocaleDateString("es", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })
                                                        : "Nunca"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                                            <span>Accesos: {securityUser.loginCount}</span>
                                            {securityUser.failedLoginAttempts > 0 && (
                                                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                    <ExclamationTriangleIcon className="h-3 w-3" />
                                                    Fallidos: {securityUser.failedLoginAttempts}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Account Details Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <ShieldCheckIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                            Información de la Cuenta
                                        </h3>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {/* Username */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Nombre de Usuario
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-mono bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg text-gray-800 dark:text-gray-200">
                                                        @{securityUser.username}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Creado
                                                </label>
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    {new Date(
                                                        securityUser.createdAt as any
                                                    ).toLocaleDateString("es", {
                                                        day: "2-digit",
                                                        month: "long",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Password Reset Section */}
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Contraseña
                                                    </h4>
                                                    {securityUser.mustChangePassword && (
                                                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                                                            <ExclamationTriangleIcon className="h-4 w-4" />
                                                            Debe cambiar la contraseña en el próximo inicio de
                                                            sesión
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={handleSendResetLink}
                                                    disabled={isResetLinkLoading}
                                                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-800 dark:text-amber-200 dark:hover:bg-amber-700 transition-all disabled:opacity-60"
                                                >
                                                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                                                    {isResetLinkLoading
                                                        ? "Enviando..."
                                                        : "Enviar enlace de cambio"}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Se enviara un enlace valido por 15 minutos al correo principal del
                                                empleado.
                                            </p>
                                        </div>

                                        {/* Roles Section */}
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                Roles Asignados
                                            </h4>
                                            {securityUser.roles.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {securityUser.roles.map((role) => (
                                                        <span
                                                            key={role.id}
                                                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 text-sm font-medium"
                                                        >
                                                            <ShieldCheckIcon className="h-4 w-4 mr-1.5" />
                                                            {role.name}
                                                            <span className="ml-1.5 text-xs text-indigo-500 dark:text-indigo-400 font-mono">
                                                                ({role.code})
                                                            </span>
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                    No tiene roles asignados
                                                </p>
                                            )}
                                        </div>

                                        {/* 2FA Status */}
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Autenticación de Dos Factores (2FA)
                                                    </h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Capa adicional de seguridad para el inicio de sesión
                                                    </p>
                                                </div>
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${securityUser.twoFactorEnabled
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                                                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                                        }`}
                                                >
                                                    {securityUser.twoFactorEnabled
                                                        ? "Habilitado"
                                                        : "Deshabilitado"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions Footer */}
                                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                                        <button
                                            onClick={() => setIsCreating(true)}
                                            className="px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
                                        >
                                            Editar Configuración
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            /* Create/Edit Form */
                            <motion.div
                                key="user-form"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <KeyIcon className="h-5 w-5" />
                                            {securityUser
                                                ? "Editar Acceso al Sistema"
                                                : "Crear Acceso al Sistema"}
                                        </h3>
                                        <p className="text-indigo-100 text-sm mt-1">
                                            {securityUser
                                                ? "Modifica las credenciales y permisos del usuario"
                                                : "Configura las credenciales de acceso para este empleado"}
                                        </p>
                                    </div>

                                    <Form.Root<IUpsertSecurityUser> state={initialData}>
                                        <SecurityUserForm
                                            roles={props.roles}
                                            isEdit={!!securityUser}
                                            onSuccess={(user) => {
                                                setSecurityUser(user);
                                                setIsCreating(false);
                                                notify({
                                                    payload: securityUser
                                                        ? "Acceso actualizado exitosamente"
                                                        : "Acceso creado exitosamente",
                                                    type: "success",
                                                });
                                            }}
                                            onCancel={() => {
                                                if (securityUser) {
                                                    setIsCreating(false);
                                                } else {
                                                    navigate("..");
                                                }
                                            }}
                                        />
                                    </Form.Root>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </Fragment>
    );
}

// Security User Form Component
function SecurityUserForm({
    roles,
    isEdit,
    onSuccess,
    onCancel,
}: {
    roles: IRoleWithUsers[];
    isEdit: boolean;
    onSuccess: (user: ISecurityUser) => void;
    onCancel: () => void;
}) {
    const notify = useNotificacion();
    const [showPassword, setShowPassword] = useState(false);

    const selectedRoles = Form.useSelector(
        (state: IUpsertSecurityUser) => state.roleIds || []
    );
    const { setAt } = Form.useForm();

    const toggleRole = (roleId: number) => {
        const current = selectedRoles || [];
        if (current.includes(roleId)) {
            setAt(["roleIds"], current.filter((id) => id !== roleId));
        } else {
            setAt(["roleIds"], [...current, roleId]);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Username */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de Usuario
                </label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        @
                    </span>
                    <Form.Text
                        path="username"
                        placeholder="nombre.usuario"
                        required
                        className="w-full pl-8 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                    />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Solo letras minúsculas, números, puntos, guiones y guiones bajos
                </p>
            </div>

            {/* Password (only for create or optional update) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contraseña {isEdit && "(dejar vacío para mantener la actual)"}
                </label>
                <div className="relative">
                    <Form.Text
                        path="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={isEdit ? "••••••••" : "Mínimo 6 caracteres"}
                        required={!isEdit}
                        className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        {showPassword ? (
                            <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                            <EyeIcon className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
                <Form.Checkbox
                    path="isActive"
                    materialize
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Usuario Activo
                </label>
            </div>

            {/* Roles Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Roles de Seguridad
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        ({selectedRoles.length} seleccionados)
                    </span>
                </label>
                {roles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {roles.map((role) => {
                            const isSelected = selectedRoles.includes(role.id);
                            return (
                                <label
                                    key={role.id}
                                    className={`
                    flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${isSelected
                                            ? "border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-900/30"
                                            : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                        }
                  `}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleRole(role.id)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white block">
                                            {role.name}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                            {role.code}
                                        </span>
                                        {role.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                                {role.description}
                                            </p>
                                        )}
                                    </div>
                                    {isSelected && (
                                        <CheckCircleIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                                    )}
                                </label>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        No hay roles disponibles. Configure roles en{" "}
                        <span className="font-medium">Seguridad → Roles</span>.
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                    Cancelar
                </button>
                <Submit<IUpsertSecurityUser>
                    onSubmit={async (data) => {
                        try {
                            if (!data.username || data.username.trim().length < 3) {
                                throw new Error(
                                    "El nombre de usuario debe tener al menos 3 caracteres"
                                );
                            }

                            if (!isEdit && (!data.password || data.password.length < 6)) {
                                throw new Error(
                                    "La contraseña debe tener al menos 6 caracteres"
                                );
                            }

                            const result = await upsertSecurityUser(data);
                            onSuccess(result);
                        } catch (error: any) {
                            notify({ payload: error });
                        }
                    }}
                    className="px-6 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                >
                    {isEdit ? "Guardar Cambios" : "Crear Acceso"}
                </Submit>
            </div>
        </div>
    );
}
