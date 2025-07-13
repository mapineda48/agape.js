import React, { useState } from "react";
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  CubeIcon,
  CogIcon,
  ChevronDoubleRightIcon as MenuIcon,
  ChevronDoubleLeftIcon as XIcon,
} from "@heroicons/react/24/outline";
import { session } from "@agape/access";
import { LogOut } from "@/app/login";
import { router } from "../Router";
import Link from "@/components/ui/link";
import { factoryBreakpointValue } from "@/hook/useBreakpointValue";
import clsx from "clsx";

// 
type LayoutProps = {
  children: React.ReactNode;
};

const useBreakpointValue = factoryBreakpointValue({
  xs: true, // Teléfonos pequeños
  sm: true, // Teléfonos medianos
  md: true, // Tablets
  lg: true, // Pantallas pequeñas
});

// Rutas del CMS
const CMS_PATH = "/cms";
const CMS_REPORT_PATH = "/cms/report";
const CMS_USER_PATH = "/cms/user";
const CMS_INVENTORY_PATH = "/cms/inventory";
const CMS_CONFIGURATION_PATH = "/cms/configuration";

// Estilos base semánticos según la paleta extendida
const STYLE_SELECT =
  "flex items-center py-2 px-4 hover:bg-accent hover:bg-opacity-20 text-white transition-colors duration-200 bg-secondary bg-opacity-20";
const STYLE_UNSELECT =
  "flex items-center py-2 px-4 hover:bg-accent hover:bg-opacity-20 text-white transition-colors duration-200";

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useBreakpointValue(false);
  const pathname = router.pathname;

  const navItems = [
    { to: CMS_PATH, icon: HomeIcon, label: "Inicio" },
    { to: CMS_REPORT_PATH, icon: ChartBarIcon, label: "Reportes" },
    { to: CMS_USER_PATH, icon: UsersIcon, label: "Usuarios" },
    { to: CMS_INVENTORY_PATH, icon: CubeIcon, label: "Inventario" },
    { to: CMS_CONFIGURATION_PATH, icon: CogIcon, label: "Configuración" },
  ];

  return (
    <div className="relative h-screen overflow-hidden">
      {/* SIDEBAR */}
      <nav
        className={`absolute top-0 left-0 h-full bg-primary text-white transition-all duration-300 z-50 ${collapsed ? "w-0 sm:w-14" : "w-64"
          }`}
      >
        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`absolute top-4 bg-primary p-1 rounded-full border border-secondary z-50 transition-all ${collapsed ? "-right-10 sm:-right-3" : "-right-3"}`}
        >
          {collapsed ? (
            <MenuIcon className="w-6 h-6" />
          ) : (
            <XIcon className="w-6 h-6" />
          )}
        </button>

        {/* HEADER */}
        <div className="p-6 text-2xl font-bold">{!collapsed && "AgapeApp"}</div>

        {/* NAV ITEMS */}
        <ul className="flex-1 overflow-y-auto mt-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = pathname === to;
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={isActive ? STYLE_SELECT : STYLE_UNSELECT}
                >
                  <Icon className="w-6 h-6" />
                  {!collapsed && <span className="ml-3">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* FOOTER */}
        {!collapsed && (
          <div className="p-6 border-t border-secondary border-opacity-40">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden mr-4">
                <img
                  src={session.avatarUrl ?? ""}
                  alt="Avatar del Usuario"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold">{session.fullName}</p>
                <LogOut />
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* MAIN CONTENT */}
      <main className="relative z-10 h-full overflow-auto bg-gray-50 p-1 md:p-6 sm:pl-16">
        {children}
      </main>

    </div>
  );
}
