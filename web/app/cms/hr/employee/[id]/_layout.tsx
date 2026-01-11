import { useState, useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
    UserIcon,
    KeyIcon,
    ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "@/components/router/router-hook";

interface EmployeeLayoutProps {
    children: ReactNode;
}

const TABS = [
    {
        path: "../",
        label: "Datos del Empleado",
        icon: UserIcon,
        matchExact: true,
    },
    {
        path: "access",
        label: "Acceso al Sistema",
        icon: KeyIcon,
        matchExact: false,
    },
];

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
    const { pathname, navigate, listen, params } = useRouter();
    const [currentPath, setCurrentPath] = useState(pathname);

    useEffect(() => {
        const unlisten = listen((path) => {
            setCurrentPath(path);
        });
        return unlisten;
    }, [listen]);

    // Determine if we're in edit mode (has ID in params) or create mode
    // NOTE: We use params.id instead of pathname because pathname is relative 
    // to the layout's basePath and doesn't contain the [id] segment
    const isEditMode = params.id !== undefined;

    // Only show tabs in edit mode
    if (!isEditMode) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Header Section with Back Button and Tabs */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8">
                {/* Back button and title */}
                <div className="flex items-center gap-4 pt-4 pb-2">
                    <button
                        onClick={() => navigate(!isEditMode ? "../../employees" : "../../../employees")}
                        className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                        Volver a Empleados
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex space-x-8 pt-2">
                    {TABS.map((tab) => {
                        // For exact match tabs, only match if path ends with the tab path or is empty
                        const isActive = tab.matchExact
                            ? currentPath === tab.path ||
                            currentPath === "" ||
                            currentPath === "/"
                            : currentPath === tab.path ||
                            currentPath.startsWith(tab.path + "/") ||
                            currentPath.endsWith("/" + tab.path);

                        const targetPath = tab.path || ".";

                        return (
                            <div
                                key={tab.path || "root"}
                                onClick={() => navigate(targetPath)}
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
