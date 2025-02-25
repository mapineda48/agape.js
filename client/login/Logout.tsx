import { useRouter } from "next/navigation";
import React from "react";

export default function LogOut() {
  const router = useRouter();

  const goToLogin = () => {
    router.push("/"); // Navegar a /login
  };

  return (
    <button onClick={goToLogin} className="bg-blue-500 text-white p-2">
      Ir a Login
    </button>
  );
}
