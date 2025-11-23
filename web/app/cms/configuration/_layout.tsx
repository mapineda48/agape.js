import { useState, useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  CubeIcon,
  UsersIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import router from "@/app/router";

interface ConfigurationLayoutProps {
  children: ReactNode;
}

const MENU_ITEMS = [
  {
    path: "/cms/configuration/inventory",
    label: "Inventario",
    icon: CubeIcon,
    description: "Gestionar categorías y productos",
  },
  {
    path: "/cms/configuration/users",
    label: "Usuarios",
    icon: UsersIcon,
    description: "Administrar acceso y roles",
  },
  {
    path: "/cms/configuration/general",
    label: "General",
    icon: Cog6ToothIcon,
    description: "Configuraciones globales del sistema",
  },
];

export default function ConfigurationLayout({
  children,
}: ConfigurationLayoutProps) {
  const [currentPath, setCurrentPath] = useState(router.pathname);

  useEffect(() => {
    const unlisten = router.listenPath((path) => {
      setCurrentPath(path);
    });
    return unlisten;
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/50">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configuración
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Administra las preferencias y ajustes del sistema
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Secondary Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {MENU_ITEMS.map((item) => {
              const isActive = currentPath.startsWith(item.path);
              return (
                <div
                  key={item.path}
                  onClick={() => router.navigateTo(item.path)}
                  className={clsx(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200",
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  )}
                >
                  <item.icon
                    className={clsx(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300"
                    )}
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <span className="block">{item.label}</span>
                    {/* Optional: Show description on hover or always if space permits, 
                        but for a sidebar, just label is usually cleaner. 
                        Keeping it simple for now. */}
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeConfigIndicator"
                      className="w-1 h-4 bg-indigo-600 dark:bg-indigo-400 rounded-full ml-2"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
