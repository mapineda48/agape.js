import { useState, useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { CubeIcon, ArrowsRightLeftIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";
import { useRouter } from "@/components/router/router-hook";

interface InventoryLayoutProps {
  children: ReactNode;
}

const TABS = [
  {
    path: "movements",
    label: "Movimientos",
    icon: ArrowsRightLeftIcon,
  },
  {
    path: "products",
    label: "Productos",
    icon: CubeIcon,
  },
  {
    path: "stock",
    label: "Existencias",
    icon: ArchiveBoxIcon,
  }
];

export default function InventoryLayout({ children }: InventoryLayoutProps) {
  const { pathname, navigate, listen } = useRouter();
  const [currentPath, setCurrentPath] = useState(pathname);

  useEffect(() => {
    const unlisten = listen((path) => {
      setCurrentPath(path);
    });
    return unlisten;
  }, [listen]);

  // Auto-redirect to first tab when at root path of the layout
  useEffect(() => {
    // Check if we're at the exact root of this layout context
    // This depends on how the router handles nesting.
    // If layout is at /cms/inventory, then checking if pathname is empty or / is context dependent.
    // Assuming context-relative path:
    if (pathname === "" || pathname === "/") {
      navigate(TABS[0].path, { replace: true });
    }
  }, [pathname, navigate]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header Section with Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8">
        {/* Tabs */}
        <div className="flex space-x-8 pt-4">
          {TABS.map((tab) => {
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
      <main className="flex-1 overflow-y-auto w-full">
        <div className="w-full">
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
