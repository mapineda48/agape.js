/**
 * Modal de Visualización de PDF
 * 
 * Componente modal que utiliza el sistema de portales de la aplicación
 * para mostrar un visor de PDF con animaciones elegantes.
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
import type { PurchaseInvoicePdfData } from "@utils/dto/finance/purchase_invoice";
import {
    XMarkIcon,
    ArrowDownTrayIcon,
    PrinterIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { DocumentTextIcon } from "@heroicons/react/24/solid";

interface PdfViewerModalProps extends PortalInjectedProps {
    data: PurchaseInvoicePdfData;
    title?: string;
}

/**
 * Modal de visualización de PDF con animaciones y controles
 */
function PdfViewerModal({ data, title, remove, zIndex, style }: PdfViewerModalProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [isOpening, setIsOpening] = useState(true);

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

    // Descargar PDF
    const handleDownload = (blob: Blob | null) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Factura_${data.documentNumberFull}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Imprimir PDF
    const handlePrint = (url: string | null) => {
        if (!url) return;
        const printWindow = window.open(url);
        if (printWindow) {
            printWindow.onload = () => {
                printWindow.print();
            };
        }
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
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <DocumentTextIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                {title || "Vista Previa de PDF"}
                            </h2>
                            <p className="text-sm text-violet-200">
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
                    <BlobProvider document={<PurchaseInvoicePdf data={data} />}>
                        {({ blob, url, loading, error }) => {
                            if (loading) {
                                return (
                                    <div className="h-full flex flex-col items-center justify-center gap-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-violet-200 dark:border-violet-900 rounded-full" />
                                            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-violet-600 rounded-full animate-spin" />
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
                                    {/* Toolbar */}
                                    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Factura de Compra
                                            </span>
                                            <span className="px-2 py-1 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-medium rounded-full">
                                                PDF
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleDownload(blob)}
                                                disabled={!blob}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                                            >
                                                <ArrowDownTrayIcon className="h-4 w-4" />
                                                Descargar
                                            </button>
                                            <button
                                                onClick={() => handlePrint(url)}
                                                disabled={!url}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                                            >
                                                <PrinterIcon className="h-4 w-4" />
                                                Imprimir
                                            </button>
                                        </div>
                                    </div>

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
 * @example
 * ```tsx
 * import { usePdfViewer } from "@/components/pdf/PdfViewerModal";
 * 
 * function MyComponent() {
 *     const openPdfViewer = usePdfViewer();
 *     
 *     const handleViewPdf = async () => {
 *         const data = await getPurchaseInvoiceForPdf(invoiceId);
 *         if (data) {
 *             openPdfViewer({ 
 *                 data, 
 *                 title: "Factura de Compra" 
 *             });
 *         }
 *     };
 *     
 *     return <button onClick={handleViewPdf}>Ver PDF</button>;
 * }
 * ```
 */
export const usePdfViewer = createPortalHook<
    Omit<PdfViewerModalProps, keyof PortalInjectedProps>
>(PdfViewerModal);

export default PdfViewerModal;
