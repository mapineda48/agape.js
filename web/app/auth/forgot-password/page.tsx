import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { requestPasswordReset } from "@agape/public/passwordReset";
import { useNotificacion } from "@/components/ui/notification";
import { useRouter } from "@/components/router/router-hook";

export default function ForgotPasswordPage() {
    const notify = useNotificacion();
    const { navigate } = useRouter();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setStatus("sending");

        try {
            const result = await requestPasswordReset({
                email,
                resetUrl: new URL("/auth/reset", location.origin).toString(),
            });

            if (result.success) {
                setStatus("done");
            } else {
                setStatus("idle");
                notify({ payload: result.message, type: "error" });
            }
        } catch (error: any) {
            setStatus("idle");
            notify({ payload: error?.message || error, type: "error" });
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
            <div className="absolute inset-0">
                <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500/20 blur-[120px]" />
                <div className="absolute bottom-0 left-8 h-52 w-52 rounded-full bg-indigo-500/20 blur-[120px]" />
                <div className="absolute right-6 top-16 h-52 w-52 rounded-full bg-cyan-500/20 blur-[120px]" />
            </div>

            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-lg rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl"
                >
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 shadow-lg">
                            <Mail className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-blue-200/70">
                                Recuperacion de acceso
                            </p>
                            <h1 className="text-2xl font-semibold">Restablecer contrasena</h1>
                        </div>
                    </div>

                    <p className="mt-5 text-sm text-blue-100/80">
                        Ingresa el correo principal asociado a tu cuenta. Si coincide, enviaremos
                        un enlace de restablecimiento con vigencia de 15 minutos.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-blue-100">
                                Correo electronico
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-blue-200/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                placeholder="correo@empresa.com"
                                required
                                disabled={status === "sending"}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === "sending"}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold shadow-lg shadow-blue-500/25 transition hover:from-blue-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {status === "sending" ? "Enviando..." : "Enviar enlace"}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </form>

                    {status === "done" && (
                        <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5" />
                                <span>
                                    Si el correo coincide, enviaremos el enlace de restablecimiento.
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex items-center justify-between text-xs text-blue-200/60">
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200"
                        >
                            <ArrowRight className="h-3 w-3 rotate-180" />
                            Volver al inicio
                        </button>
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" />
                            <span>No compartas tu enlace con terceros.</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
