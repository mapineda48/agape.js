import Link from "@/components/ui/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-soft dark:bg-bg-dark flex items-center justify-center p-6">
      <div className="bg-white dark:bg-zinc-800 shadow-2xl rounded-2xl p-10 max-w-md w-full text-center border border-dashed border-zinc-300 dark:border-zinc-600 relative overflow-hidden">
        {/* Doodle ilustrado: hoja volando */}
        <div className="absolute -top-8 -right-8 w-24 h-24 opacity-30 animate-float">
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
            <path
              d="M12 4l40 8-8 48L4 52z"
              fill="#F9FAFB"
              stroke="#D4D4D8"
              strokeWidth="2"
            />
            <path
              d="M16 8l32 6-6 36L8 46z"
              fill="#E0E7FF"
              stroke="#6366F1"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-7xl font-extrabold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-neutral dark:text-text-dark mb-2">
          Página no encontrada
        </h2>
        <p className=" text-zinc-400 mb-6">
          Como una hoja perdida en una libreta... esta página no existe.
        </p>

        <Link
          to="/"
          className="inline-block bg-accent text-white px-5 py-2 rounded-full font-medium hover:bg-fuchsia-600 transition"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
