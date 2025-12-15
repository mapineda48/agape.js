import { useEffect } from "react";
import { useRouter } from "@/components/router/router-hook";

/**
 * Página raíz de Facturación.
 * Redirige automáticamente a la pestaña de Compras.
 */
export default function InvoicingPage() {
    const { navigate } = useRouter();

    useEffect(() => {
        navigate("purchase", { replace: true });
    }, [navigate]);

    return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
        </div>
    );
}
