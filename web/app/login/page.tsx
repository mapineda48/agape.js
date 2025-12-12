import { login, type LoginRequest } from "@agape/security/access";
import { Form } from "@/components/form";
import Submit from "@/components/ui/submit";
import { motion } from "framer-motion";
import { User, Lock, ArrowRight } from "lucide-react";
import { useRouter } from "../../components/router/router-hook";

export default function LoginForm() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/30 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/30 blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transform rotate-3"
            >
              <User className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Bienvenido
            </h2>
            <p className="text-blue-200/80 text-sm">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <Form.Root<LoginRequest>>
            <div className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-blue-100 ml-1"
                  htmlFor="username"
                >
                  Usuario
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-blue-300 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <Form.Text
                    id="username"
                    path="username"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="Tu nombre de usuario"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-blue-100 ml-1"
                  htmlFor="password"
                >
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-blue-300 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <Form.Text
                    type="password"
                    id="password"
                    path="password"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Submit<LoginRequest>
                  onSubmit={login}
                  onSuccess={() => router.navigate("/cms", { replace: true })}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                >
                  Iniciar Sesión
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Submit>
              </div>

              <p className="text-center text-sm text-blue-200/60 mt-6">
                ¿Olvidaste tu contraseña?{" "}
                <a
                  href="#"
                  className="text-blue-400 hover:text-blue-300 font-medium hover:underline transition-colors"
                >
                  Recuperar acceso
                </a>
              </p>
            </div>
          </Form.Root>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-blue-200/40">
            &copy; {new Date().getFullYear()} Agape CMS. Todos los derechos
            reservados.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
