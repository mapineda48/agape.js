import type { Config } from "tailwindcss";

export default {
  content: [
    "./client/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF',    // Azul Profundo (actual tuyo)
        secondary: '#3B82F6',  // Azul brillante para botones
        accent: '#0EA5E9',     // Celeste vibrante para hovers
        muted: '#F3F4F6',      // Fondo suave para cajas
        dark: '#111827',       // Texto oscuro y profesional
        light: '#F9FAFB',      // Fondo general (como el tuyo)
        danger: '#EF4444',     // Errores
        warning: '#F59E0B',    // Advertencias
        success: '#10B981',    // Confirmaciones
      },
    },
  },
  plugins: [],
} satisfies Config;
