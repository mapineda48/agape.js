"use client"; // Asegura que el componente sea interactivo
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const goToLogin = () => {
    router.push("/login"); // Navegar a /login
  };

  return (
    <div>
      <h1>Bienvenido</h1>
      <button onClick={goToLogin} className="bg-blue-500 text-white p-2">
        Ir a Login
      </button>
    </div>
  );
}
