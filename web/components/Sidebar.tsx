import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  UserCircleIcon,
  CubeIcon,
  CogIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ArrowLeftOnRectangleIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "./ThemeProvider";
import { logout, session } from "@agape/access";
import router from "@/app/router";
import clsx from "clsx";

// Navigation Items
const NAV_ITEMS = [
  { path: "/cms", icon: HomeIcon, label: "Inicio" },
  { path: "/cms/report", icon: ChartBarIcon, label: "Reportes" },
  { path: "/cms/user", icon: UserCircleIcon, label: "Colaboradores" },
  { path: "/cms/crm", icon: UsersIcon, label: "Clientes" },
  { path: "/cms/inventory", icon: CubeIcon, label: "Inventario" },
  { path: "/cms/configuration", icon: CogIcon, label: "Configuración" },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPath, setCurrentPath] = useState(router.pathname);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const unlisten = router.listenPath((path) => {
      setCurrentPath(path);
    });
    return unlisten;
  }, []);

  const handleLogout = () => {
    logout()
      .then(() => router.navigateTo("/login", { replace: true }))
      .catch((error) => {
        console.error("Error logging out:", error);
      });
  };

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 },
  };

  return (
    <motion.aside
      initial="expanded"
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shadow-xl z-50 flex flex-col transition-colors duration-300"
    >
      {/* Header */}
      <div
        className={clsx(
          "flex items-center transition-all duration-300",
          isCollapsed
            ? "flex-col justify-center p-4 gap-4"
            : "flex-row justify-between p-6"
        )}
      >
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              AgapeApp
            </motion.div>
          )}
        </AnimatePresence>
        <div
          className={clsx(
            "flex items-center gap-2",
            isCollapsed && "flex-col-reverse"
          )}
        >
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            {theme === "dark" ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            {isCollapsed ? (
              <ChevronDoubleRightIcon className="w-5 h-5" />
            ) : (
              <ChevronDoubleLeftIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <div
              key={item.path}
              onClick={() => router.navigateTo(item.path)}
              className={clsx(
                "flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon
                className={clsx(
                  "w-6 h-6 relative z-10 transition-colors",
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "group-hover:text-gray-900 dark:group-hover:text-gray-200"
                )}
              />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="ml-3 font-medium whitespace-nowrap relative z-10"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <div
          className={clsx(
            "flex items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 transition-all",
            isCollapsed ? "justify-center" : "justify-start"
          )}
        >
          <div className="relative">
            <img
              src={session.avatarUrl || "https://ui-avatars.com/api/?name=User"}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-700 rounded-full"></div>
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="ml-3 overflow-hidden"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {session.fullName || "Usuario"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  Administrador
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="ml-auto p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Cerrar Sesión"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
