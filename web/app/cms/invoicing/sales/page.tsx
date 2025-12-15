import { useEffect } from "react";
import { useRouter } from "@/components/router/router-hook";

/**
 * Placeholder page for Sales Invoicing.
 * This feature is coming soon.
 */
export default function SalesInvoicingPage() {
    const { navigate } = useRouter();

    // Redirect back to purchase since sales is not implemented yet
    useEffect(() => {
        navigate("../purchase", { replace: true });
    }, [navigate]);

    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                    Ventas - Próximamente
                </p>
            </div>
        </div>
    );
}
