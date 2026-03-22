/**
 * Unauthorized Access Component
 *
 * A premium, full-page component displayed when a user attempts to access
 * a route they don't have permission for.
 *
 * Features:
 * - Animated lock icon
 * - Glassmorphism design
 * - Gradient background
 * - Action buttons to navigate away
 */

import { motion } from "framer-motion";
import {
  LockClosedIcon,
  HomeIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useHistory } from "#web/utils/components/router/HistoryContext";

interface UnauthorizedProps {
  /**
   * Custom title to display. Defaults to "Acceso Denegado"
   */
  title?: string;

  /**
   * Custom description message
   */
  description?: string;

  /**
   * The permission that was required (for display purposes)
   */
  requiredPermission?: string;
}

export default function Unauthorized({
  title = "Acceso Denegado",
  description = "No tienes permisos para acceder a esta sección. Contacta al administrador si crees que esto es un error.",
  requiredPermission,
}: UnauthorizedProps) {
  const router = useHistory();

  const handleGoBack = () => {
    if (window.history.length > 2) {
      window.history.back();
    } else {
      router.navigateTo("/cms");
    }
  };

  const handleGoHome = () => {
    router.navigateTo("/cms");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 max-w-lg w-full"
      >
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20">
          {/* Animated Lock Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              {/* Outer ring animation */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.2, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full blur-lg"
              />

              {/* Icon container */}
              <div className="relative w-24 h-24 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                <motion.div
                  animate={{
                    rotateY: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <LockClosedIcon className="w-12 h-12 text-white" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold text-center text-white mb-4"
          >
            {title}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-300 text-center mb-8 leading-relaxed"
          >
            {description}
          </motion.p>

          {/* Required permission badge */}
          {requiredPermission && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center mb-8"
            >
              <span className="px-4 py-2 bg-white/10 rounded-full text-sm text-gray-400 font-mono border border-white/10">
                Permiso requerido:{" "}
                <span className="text-amber-400">{requiredPermission}</span>
              </span>
            </motion.div>
          )}

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={handleGoBack}
              className="group flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 border border-white/10 hover:border-white/30"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Volver
            </button>

            <button
              onClick={handleGoHome}
              className="group flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
            >
              <HomeIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Ir al Inicio
            </button>
          </motion.div>
        </div>

        {/* Decorative lines */}
        <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%]">
          <div className="absolute inset-0 border border-white/5 rounded-[40px]" />
          <div className="absolute inset-4 border border-white/5 rounded-[36px]" />
        </div>
      </motion.div>
    </div>
  );
}
