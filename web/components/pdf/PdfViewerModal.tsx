/**
 * Modal de Visualización de PDF
 * 
 * Componente modal que utiliza el sistema de portales de la aplicación
 * para mostrar un visor de PDF con animaciones elegantes.
 * 
 * Soporta tanto facturas de compra como de venta, detectando automáticamente
 * el tipo basado en la estructura de los datos.
 * 
 * Usa BlobProvider de @react-pdf/renderer para generar el PDF dinámicamente.
 */

import { useEffect, useState } from "react";
import { BlobProvider } from "@react-pdf/renderer";
import {
    createPortalHook,
    type PortalInjectedProps,
} from "@/components/util/portal";
import PurchaseInvoicePdf from "./PurchaseInvoicePdf";
import SalesInvoicePdf from "./SalesInvoicePdf";
import type { PurchaseInvoicePdfData } from "@utils/dto/finance/purchase_invoice";
import type { SalesInvoicePdfData } from "@utils/dto/finance/sales_invoice";
import {
    XMarkIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { DocumentTextIcon } from "@heroicons/react/24/solid";

// Tipo unión para los datos del PDF
type InvoicePdfData = PurchaseInvoicePdfData | SalesInvoicePdfData;

// Función para detectar si es una factura de venta
function isSalesInvoice(data: InvoicePdfData): data is SalesInvoicePdfData {
    return 'client' in data && 'status' in data;
}

// Colores para cada tipo de factura
const invoiceColors = {
    purchase: {
        gradient: "from-violet-600 to-purple-600",
        text: "text-violet-200",
    },
    sales: {
        gradient: "from-emerald-600 to-teal-600",
        text: "text-emerald-200",
    },
};

interface PdfViewerModalProps extends PortalInjectedProps {
    data: InvoicePdfData;
    title?: string;
}

/**
 * Modal de visualización de PDF con animaciones y controles
 */
function PdfViewerModal({ data, title, remove, zIndex, style }: PdfViewerModalProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [isOpening, setIsOpening] = useState(true);

    const isSales = isSalesInvoice(data);
    const colors = isSales ? invoiceColors.sales : invoiceColors.purchase;

    // Animación de apertura
    useEffect(() => {
        const timer = setTimeout(() => setIsOpening(false), 50);
        return () => clearTimeout(timer);
    }, []);

    // Animación de cierre
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            remove();
        }, 200);
    };

    // Renderizar el componente PDF apropiado
    const renderPdfDocument = () => {
        if (isSalesInvoice(data)) {
            return <SalesInvoicePdf data={data} />;
        }
        return <PurchaseInvoicePdf data={data} />;
    };

    return (
        <div
            style={{
                ...style,
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
            }}
            className={`transition-all duration-200 ${isOpening || isClosing
                ? "opacity-0"
                : "opacity-100"
                }`}
            onClick={handleClose}
        >
            {/* Backdrop con blur */}
            <div
                style={{ zIndex: zIndex - 1 }}
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${isOpening || isClosing
                    ? "opacity-0"
                    : "opacity-100"
                    }`}
            />

            {/* Modal Container */}
            <div
                style={{ zIndex }}
                className={`relative w-full max-w-5xl h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all duration-200 ${isOpening || isClosing
                    ? "scale-95 opacity-0"
                    : "scale-100 opacity-100"
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`bg-gradient-to-r ${colors.gradient} px-6 py-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <DocumentTextIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                {title || "Vista Previa de PDF"}
                            </h2>
                            <p className={`text-sm ${colors.text}`}>
                                {data.documentNumberFull}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        aria-label="Cerrar"
                    >
                        <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                </div>

                {/* PDF Content */}
                <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-hidden">
                    <BlobProvider document={renderPdfDocument()}>
                        {({ blob, url, loading, error }) => {
                            if (loading) {
                                return (
                                    <div className="h-full flex flex-col items-center justify-center gap-4">
                                        <div className="relative">
                                            <div className={`w-16 h-16 border-4 ${isSales ? 'border-emerald-200 dark:border-emerald-900' : 'border-violet-200 dark:border-violet-900'} rounded-full`} />
                                            <div className={`absolute inset-0 w-16 h-16 border-4 border-transparent ${isSales ? 'border-t-emerald-600' : 'border-t-violet-600'} rounded-full animate-spin`} />
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 font-medium">
                                            Generando PDF...
                                        </p>
                                    </div>
                                );
                            }

                            if (error) {
                                return (
                                    <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
                                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                                            <XMarkIcon className="h-12 w-12 text-red-500" />
                                        </div>
                                        <p className="text-red-600 dark:text-red-400 font-medium text-center">
                                            Error al generar el PDF
                                        </p>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-md">
                                            {error.message || "Ha ocurrido un error inesperado. Por favor, intente de nuevo."}
                                        </p>
                                    </div>
                                );
                            }

                            return (
                                <div className="h-full flex flex-col">
                                    {/* PDF Viewer */}
                                    <div className="flex-1 p-4 overflow-auto">
                                        {url ? (
                                            <iframe
                                                src={url}
                                                className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-lg"
                                                title="Vista previa del PDF"
                                            />
                                        ) : (
                                            <div className="h-full flex items-center justify-center">
                                                <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        }}
                    </BlobProvider>
                </div>
            </div>
        </div>
    );
}

/**
 * Hook para abrir el modal de visualización de PDF desde cualquier componente
 * que esté dentro del PortalProvider.
 * 
 * Soporta tanto facturas de compra (PurchaseInvoicePdfData) como de venta (SalesInvoicePdfData).
 * El tipo de factura se detecta automáticamente basado en la estructura de los datos.
 * 
 * @example
 * ```tsx
 * import { usePdfViewer } from "@/components/pdf/PdfViewerModal";
 * 
 * function MyComponent() {
 *     const openPdfViewer = usePdfViewer();
 *     
 *     const handleViewPurchasePdf = async () => {
 *         const data = await getPurchaseInvoiceForPdf(invoiceId);
 *         if (data) {
 *             openPdfViewer({ 
 *                 data, 
 *                 title: "Factura de Compra" 
 *             });
 *         }
 *     };
 *     
 *     const handleViewSalesPdf = async () => {
 *         const data = await getSalesInvoiceForPdf(invoiceId);
 *         if (data) {
 *             openPdfViewer({ 
 *                 data, 
 *                 title: "Factura de Venta" 
 *             });
 *         }
 *     };
 *     
 *     return (
 *         <>
 *             <button onClick={handleViewPurchasePdf}>Ver PDF Compra</button>
 *             <button onClick={handleViewSalesPdf}>Ver PDF Venta</button>
 *         </>
 *     );
 * }
 * ```
 */
export const usePdfViewer = createPortalHook<
    Omit<PdfViewerModalProps, keyof PortalInjectedProps>
>(PdfViewerModal);

export default PdfViewerModal;
