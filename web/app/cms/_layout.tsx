import React from "react";
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  UserCircleIcon,
  CubeIcon,
  CogIcon,
  ChevronDoubleRightIcon as MenuIcon,
  ChevronDoubleLeftIcon as XIcon,
} from "@heroicons/react/24/outline";
import { session } from "@agape/access";
import { LogOut } from "@/app/login/page";
import { router } from "@/app/router";
import Link from "@/components/ui/link";
import { factoryBreakpointValue } from "@/hook/useBreakpointValue";
import clsx from "clsx";

type LayoutProps = {
  children: React.ReactNode;
};

const useBreakpointValue = factoryBreakpointValue({
  xs: true,
  sm: true,
  md: true,
  lg: true,
});

const CMS_PATH = "/cms";
const CMS_REPORT_PATH = "/cms/report";
const CMS_USER_PATH = "/cms/user";
const CMS_INVENTORY_PATH = "/cms/inventory";
const CMS_CONFIGURATION_PATH = "/cms/configuration";
const CMS_CLIENT_PATH = "/cms/crm";


export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useBreakpointValue(false);
  const pathname = router.pathname;

  const navItems = [
    { to: CMS_PATH, icon: HomeIcon, label: "Inicio" },
    { to: CMS_REPORT_PATH, icon: ChartBarIcon, label: "Reportes" },
    { to: CMS_USER_PATH, icon: UserCircleIcon, label: "Colaboradores" },
    { to: CMS_CLIENT_PATH, icon: UsersIcon, label: "Clientes" },
    { to: CMS_INVENTORY_PATH, icon: CubeIcon, label: "Inventario" },
    { to: CMS_CONFIGURATION_PATH, icon: CogIcon, label: "Configuración" },
  ];

  return (
    <div className="relative h-screen overflow-hidden">
      {/* SIDEBAR */}
      <nav
        className={clsx(
          "absolute top-0 left-0 h-full bg-primary text-white transition-all duration-300 z-50",
          collapsed ? "w-0 sm:w-14" : "w-64"
        )}
      >
        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx(
            "absolute top-4 bg-primary p-1 rounded-full border border-secondary z-50 transition-all",
            collapsed ? "-right-10 sm:-right-3" : "-right-3"
          )}
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
                  title={label}
                  className={clsx(
                    "flex items-center py-2 px-4 text-white transition-colors duration-200 hover:bg-accent hover:bg-opacity-20",
                    {
                      "bg-secondary bg-opacity-20": isActive,
                    }
                  )}
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
      <main className="relative z-10 h-full overflow-auto bg-gray-50 p-1 sm:pl-16 xl:pl-66">
        {children}
      </main>
    </div>
  );
}