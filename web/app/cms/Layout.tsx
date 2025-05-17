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
// 
type LayoutProps = {
  children: React.ReactNode;
};

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
  const [collapsed, setCollapsed] = useState(false);
  const pathname = router.pathname;

  const navItems = [
    { to: CMS_PATH, icon: HomeIcon, label: "Inicio" },
    { to: CMS_REPORT_PATH, icon: ChartBarIcon, label: "Reportes" },
    { to: CMS_USER_PATH, icon: UsersIcon, label: "Usuarios" },
    { to: CMS_INVENTORY_PATH, icon: CubeIcon, label: "Inventario" },
    { to: CMS_CONFIGURATION_PATH, icon: CogIcon, label: "Configuración" },
  ];

  return (
    <div className="flex h-screen">
      {/* SIDEBAR */}
      <nav
        className={`flex flex-col bg-primary text-white h-full relative transition-[width] duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-4 bg-primary p-1 rounded-full border border-secondary"
        >
          {collapsed ? (
            <MenuIcon className="w-6 h-6" />
          ) : (
            <XIcon className="w-6 h-6" />
          )}
        </button>

        {/* HEADER */}
        {<div className="p-6 text-2xl font-bold">{!collapsed && "AgapeApp"}</div>}

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
      <main className="flex-1 overflow-auto bg-gray-50 p-6">
        {children}
      </main>
    </div>
  );
}
