import { motion } from "framer-motion";
import { useRouter } from "./router/router-hook";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 overflow-hidden">
      <div className="text-center max-w-md mx-auto relative z-10">
        {/* Creative SVG Illustration with Framer Motion */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8 relative w-64 h-64 mx-auto"
        >
          <motion.svg
            viewBox="0 0 200 200"
            className="w-full h-full drop-shadow-2xl"
            animate={{ y: [0, -15, 0] }}
            transition={{
              repeat: Infinity,
              duration: 6,
              ease: "easeInOut",
            }}
          >
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop
                  offset="0%"
                  style={{ stopColor: "#6366f1", stopOpacity: 1 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: "#a855f7", stopOpacity: 1 }}
                />
              </linearGradient>
            </defs>

            {/* Abstract shapes */}
            <circle cx="100" cy="100" r="80" fill="url(#grad1)" opacity="0.1" />
            <circle cx="100" cy="100" r="60" fill="url(#grad1)" opacity="0.2" />

            {/* 404 Text integrated in SVG */}
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="url(#grad1)"
              fontSize="48"
              fontWeight="bold"
              className="font-mono"
            >
              404
            </text>

            {/* Orbiting elements */}
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              style={{ originX: "100px", originY: "100px" }}
            >
              <circle cx="100" cy="20" r="5" fill="#6366f1" />
              <circle cx="100" cy="180" r="5" fill="#a855f7" />
            </motion.g>
            <motion.g
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
              style={{ originX: "100px", originY: "100px" }}
            >
              <circle cx="20" cy="100" r="3" fill="#ec4899" />
              <circle cx="180" cy="100" r="3" fill="#8b5cf6" />
            </motion.g>
          </motion.svg>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl font-bold text-gray-800 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600"
        >
          Página no encontrada
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-gray-600 mb-8 text-lg"
        >
          Parece que te has perdido en el espacio digital. Esta página no existe
          o aún no ha sido implementada.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          onClick={() => router.navigate("/cms", { replace: true })}
          className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white transition-all duration-200 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg hover:shadow-xl"
        >
          <span className="mr-2">←</span> Regresar
          <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
        </motion.button>
      </div>
    </div>
  );
}
