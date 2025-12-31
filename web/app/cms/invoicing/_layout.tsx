import { useState, useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
    ShoppingCartIcon,
    BanknotesIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "@/components/router/router-hook";

interface InvoicingLayoutProps {
    children: ReactNode;
}

const TABS = [
    {
        path: "sales",
        label: "Ventas",
        icon: BanknotesIcon,
        description: "Facturas a clientes y cuentas por cobrar",
    },
    {
        path: "purchase",
        label: "Compras",
        icon: ShoppingCartIcon,
        description: "Facturas de proveedores y cuentas por pagar",
    },
    {
        path: "payments",
        label: "Pagos",
        icon: BanknotesIcon,
        description: "Gestión de recaudos y egresos de caja",
    },
];

export default function InvoicingLayout({ children }: InvoicingLayoutProps) {
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
        if (pathname === "" || pathname === "/") {
            const firstTab = TABS[0];
            if (firstTab) {
                navigate(firstTab.path, { replace: true });
            }
        }
    }, [pathname, navigate]);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                {/* Title */}
                <div className="px-8 pt-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                            <BanknotesIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Facturación
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Gestión de facturas de compra y venta
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-8 px-8">
                    {TABS.map((tab) => {
                        const isActive =
                            currentPath === tab.path ||
                            currentPath.startsWith(tab.path + "/");

                        return (
                            <div
                                key={tab.path}
                                onClick={() => navigate(tab.path)}
                                className={clsx(
                                    "group flex items-center pb-4 border-b-2 transition-all duration-200 cursor-pointer",
                                    isActive
                                        ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
                                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                                )}
                            >
                                <tab.icon
                                    className={clsx(
                                        "mr-2 h-5 w-5 transition-colors",
                                        isActive
                                            ? "text-violet-600 dark:text-violet-400"
                                            : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300"
                                    )}
                                />
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">
                                        {tab.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                <motion.div
                    key={currentPath}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
}
