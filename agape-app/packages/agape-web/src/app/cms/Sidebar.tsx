// components/Sidebar.js
import Link from "next/link";
import Image from "next/image";
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  CubeIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { logout, user } from "agape-backend/service/auth";
import AvaterDemo from "./AvaterDemo";
import { useRouter } from "next/navigation";
import LogOut from "./LogOut";

const Sidebar = ({ userName, userAvatar, onLogout }: any) => {
  return (
    // 1. Utilizamos h-screen para que el aside ocupe el alto completo de la ventana
    //    y flex-col para organizar verticalmente: header, opciones y footer.
    <aside className="w-64 bg-blue-800 text-white flex flex-col h-screen sticky top-0 z-10">
      {/* HEADER */}
      {/* 2. Podemos hacer que el Header sea "sticky" si queremos que permanezca fijo 
            incluso cuando hacemos scroll en la sección de opciones */}
      <div className="p-6 text-2xl font-bold bg-blue-800">AgapeApp</div>

      {/* SECCIÓN SCROLLEABLE */}
      {/* 3. Flex-1 ocupa todo el espacio restante, overflow-y-auto para poder hacer scroll */}
      <div className="flex-1 overflow-y-auto">
        <nav className="mt-4 space-y-1">
          {/* Opción Inicio */}
          <Link
            href="/cms"
            className="flex items-center py-2 px-6 bg-blue-700 bg-opacity-25 hover:bg-blue-700 hover:bg-opacity-25 transition-colors duration-200"
          >
            <HomeIcon className="w-6 h-6 mr-3" />
            <span>Inicio</span>
          </Link>

          {/* Opción Reportes */}
          <Link
            href="/cms/report"
            className="flex items-center py-2 px-6 hover:bg-blue-700 hover:bg-opacity-25 transition-colors duration-200"
          >
            <ChartBarIcon className="w-6 h-6 mr-3" />
            <span>Reportes</span>
          </Link>

          {/* Opción Usuarios */}
          <Link
            href="/cms/user"
            className="flex items-center py-2 px-6 hover:bg-blue-700 hover:bg-opacity-25 transition-colors duration-200"
          >
            <UsersIcon className="w-6 h-6 mr-3" />
            <span>Usuarios</span>
          </Link>

          {/* Opción Producto */}
          <Link
            href="/cms/inventory"
            className="flex items-center py-2 px-6 hover:bg-blue-700 hover:bg-opacity-25 transition-colors duration-200"
          >
            <CubeIcon className="w-6 h-6 mr-3" />
            <span>Inventario</span>
          </Link>

          {/* Opción Configuración */}
          <Link
            href="/cms/configuration"
            className="flex items-center py-2 px-6 hover:bg-blue-700 hover:bg-opacity-25 transition-colors duration-200"
          >
            <CogIcon className="w-6 h-6 mr-3" />
            <span>Configuración</span>
          </Link>

          {/* ...Más opciones si lo deseas... */}
        </nav>
      </div>

      {/* FOOTER */}
      <div className="p-6 border-t border-blue-700">
        <div className="flex items-center">
          {/* Avatar del Usuario */}
          <div className="w-10 h-10 rounded-full overflow-hidden mr-4">
            <Image
              src={AvaterDemo} // Imagen por defecto
              alt="Avatar del Usuario"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          {/* Datos del usuario y botón de Cerrar Sesión */}
          <div>
            <p className="text-sm font-semibold">{user.fullName}</p>
            <LogOut />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
