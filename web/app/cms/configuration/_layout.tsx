import { useState, useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  CubeIcon,
  UsersIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "@/app/router-hook";

interface ConfigurationLayoutProps {
  children: ReactNode;
}

const TABS = [
  {
    path: "inventory",
    label: "Inventario",
    icon: CubeIcon,
  },
  {
    path: "users",
    label: "Usuarios",
    icon: UsersIcon,
  },
  {
    path: "general",
    label: "General",
    icon: Cog6ToothIcon,
  },
];

export default function ConfigurationLayout({
  children,
}: ConfigurationLayoutProps) {
  const { pathname, navigate, listen } = useRouter();
  const [currentPath, setCurrentPath] = useState(pathname);

  useEffect(() => {
    const unlisten = listen((path) => {
      setCurrentPath(path);
    });
    return unlisten;
  }, [listen]);

  // Auto-redirect to first tab when at root path
  useEffect(() => {
    // Check if we're at the exact root of this layout context
    if (pathname === "" || pathname === "/") {
      // Use setTimeout to avoid race condition with router.loading
      setTimeout(() => {
        navigate(TABS[0].path, { replace: true });
      }, 0);
    }
  }, [pathname, navigate]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header Section with Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8">
        {/* Tabs */}
        <div className="flex space-x-8 pt-4">
          {TABS.map((tab) => {
            // Since currentPath is now relative, we can compare directly
            const isActive =
              currentPath === tab.path ||
              currentPath.startsWith(tab.path + "/");
            return (
              <div
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={clsx(
                  "group flex items-center pb-4 border-b-2 cursor-pointer transition-all duration-200",
                  isActive
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                <tab.icon
                  className={clsx(
                    "mr-2 h-5 w-5 transition-colors",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300"
                  )}
                />
                <span className="font-medium text-sm">{tab.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
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
  );
}
