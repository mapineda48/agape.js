"use client";

import { ArrowLeftStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { logout } from "agape-backend/service/auth";
import { useRouter } from "next/navigation";

export default function LogOut() {
  
    const router = useRouter();
  
    return (
      <button
        onClick={() => logout().then(() => router.replace("/login"))}
        className="flex items-center text-xs text-gray-300 hover:text-white mt-1"
      >
        <ArrowLeftStartOnRectangleIcon className="w-4 h-4 mr-1" />
        Cerrar Sesión
      </button>
    );
  }