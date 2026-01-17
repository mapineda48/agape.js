import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
    CheckCircle2,
    ShieldAlert,
    KeyRound,
    Eye,
    EyeOff,
    ArrowRight,
    Lock,
} from "lucide-react";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { resetPasswordWithToken, validatePasswordResetToken } from "@agape/public/passwordReset";

const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function ResetPasswordPage() {
    const notify = useNotificacion();
    const { navigate } = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<"idle" | "loading" | "valid" | "invalid" | "success">(
        "loading"
    );
    const [message, setMessage] = useState("");

    const token = useMemo(() => {
        if (typeof window === "undefined") return "";
        const params = new URLSearchParams(window.location.search);
        return params.get("token") ?? "";
    }, []);

    useEffect(() => {
        if (!token) {
            setStatus("invalid");
            setMessage("El enlace no es valido o ya fue utilizado.");
            return;
        }

        validatePasswordResetToken(token)
            .then((result) => {
                if (result.success) {
                    setStatus("valid");
                    setMessage("Token verificado. Puedes crear una nueva contrasena.");
                } else {
                    setStatus("invalid");
                    setMessage(result.message);
                }
            })
            .catch((error: any) => {
                setStatus("invalid");
                setMessage(error?.message || "No se pudo validar el enlace.");
            });
    }, [token]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (password.length < 6) {
            notify({ payload: "La contrasena debe tener al menos 6 caracteres", type: "error" });
            return;
        }

        if (password !== confirmPassword) {
            notify({ payload: "Las contrasenas no coinciden", type: "error" });
            return;
        }

        setStatus("loading");
        try {
            const result = await resetPasswordWithToken({ token, newPassword: password });
            if (result.success) {
                setStatus("success");
                setMessage("Contrasena actualizada. Ya puedes iniciar sesion.");
            } else {
                setStatus("valid");
                notify({ payload: result.message, type: "error" });
            }
        } catch (error: any) {
            setStatus("valid");
            notify({ payload: error?.message || error, type: "error" });
        }
    };

    return (
        <div className="relative min-h-screen bg-slate-950 overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/20 blur-[140px]" />
                <div className="absolute bottom-0 left-10 h-56 w-56 rounded-full bg-cyan-400/20 blur-[140px]" />
                <div className="absolute right-0 top-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-[140px]" />
            </div>

            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
                <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-xl rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl"
                >
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 shadow-lg">
                            <KeyRound className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-blue-200/70">
                                Agape CMS
                            </p>
                            <h1 className="text-2xl font-semibold text-white">Restablecer contrasena</h1>
                        </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-blue-100/80">
                        {message ||
                            "Ingresa una nueva contrasena segura para recuperar el acceso al sistema."}
                    </div>

                    <AnimatePresence mode="wait">
                        {status === "invalid" && (
                            <motion.div
                                key="invalid"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-100"
                            >
                                <div className="flex items-center gap-3">
                                    <ShieldAlert className="h-6 w-6" />
                                    <div>
                                        <p className="text-base font-semibold">Enlace invalido</p>
                                        <p className="text-sm text-red-100/70">
                                            Solicita un nuevo enlace con el administrador.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {status !== "invalid" && status !== "success" && (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                onSubmit={handleSubmit}
                                className="mt-6 space-y-5"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-blue-100">Nueva contrasena</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-200/70" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3 pl-11 pr-12 text-sm text-white placeholder-blue-200/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                            placeholder="Minimo 6 caracteres"
                                            required
                                            minLength={6}
                                            disabled={status === "loading"}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((current) => !current)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200/70 hover:text-blue-100"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-blue-100">Confirmar contrasena</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(event) => setConfirmPassword(event.target.value)}
                                        className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3 px-4 text-sm text-white placeholder-blue-200/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                        placeholder="Repite la contrasena"
                                        required
                                        minLength={6}
                                        disabled={status === "loading"}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === "loading"}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {status === "loading" ? "Guardando..." : "Actualizar contrasena"}
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </motion.form>
                        )}

                        {status === "success" && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-emerald-100"
                            >
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-6 w-6" />
                                    <div>
                                        <p className="text-base font-semibold">Contrasena actualizada</p>
                                        <p className="text-sm text-emerald-100/70">
                                            Ya puedes iniciar sesion con tu nueva clave.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate("/login", { replace: true })}
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
                                >
                                    Ir al inicio de sesion
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
