/**
 * Modal de Visualización de PDF
 * 
 * Componente modal que utiliza el sistema de portales de la aplicación
 * para mostrar un visor de PDF con animaciones elegantes.
 * 
 * Soporta tanto facturas de compra como de venta, detectando automáticamente
 * el tipo basado en la estructura de los datos.
 * 
 * Usa BlobProvider de @react-pdf/renderer para generar el PDF dinámicamente
 * y react-pdf para renderizarlo como canvas (compatible con Android).
 */

import { useEffect, useState, useCallback } from "react";
import { BlobProvider } from "@react-pdf/renderer";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
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
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { DocumentTextIcon } from "@heroicons/react/24/solid";

// Configurar el worker de PDF.js (local con Vite)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

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

/**
 * Componente interno para renderizar el PDF usando react-pdf
 * Renderiza el PDF como canvas, compatible con Android
 */
interface PdfCanvasViewerProps {
    url: string | null;
    blob: Blob | null;
    isSales: boolean;
    documentNumber: string;
}

function PdfCanvasViewer({ url, blob, isSales, documentNumber }: PdfCanvasViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [pageWidth, setPageWidth] = useState<number>(600);
    const [isPageLoading, setIsPageLoading] = useState(true);

    // Ajustar el ancho según el contenedor
    const containerRef = useCallback((node: HTMLDivElement | null) => {
        if (node) {
            const width = Math.min(node.clientWidth - 32, 800);
            setPageWidth(width);
        }
    }, []);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPageNumber(1);
    };

    const goToPrevPage = () => {
        setPageNumber((prev) => Math.max(prev - 1, 1));
        setIsPageLoading(true);
    };

    const goToNextPage = () => {
        setPageNumber((prev) => Math.min(prev + 1, numPages));
        setIsPageLoading(true);
    };

    const handleDownload = () => {
        if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `${documentNumber.replace(/\//g, "-")}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
        }
    };

    if (!url) {
        return (
            <div className="h-full flex items-center justify-center">
                <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Controls Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-200 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                        className={`p-2 rounded-lg transition-colors ${pageNumber <= 1
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
                            }`}
                        aria-label="Página anterior"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[80px] text-center">
                        {numPages > 0 ? `${pageNumber} / ${numPages}` : "..."}
                    </span>
                    <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                        className={`p-2 rounded-lg transition-colors ${pageNumber >= numPages
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
                            }`}
                        aria-label="Página siguiente"
                    >
                        <ChevronRightIcon className="h-5 w-5" />
                    </button>
                </div>

                <button
                    onClick={handleDownload}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isSales
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-violet-600 hover:bg-violet-700 text-white"
                        }`}
                >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Descargar</span>
                </button>
            </div>

            {/* PDF Canvas */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto p-4 flex justify-center"
            >
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="flex flex-col items-center justify-center gap-4 py-12">
                            <div className="relative">
                                <div className={`w-12 h-12 border-4 ${isSales ? 'border-emerald-200' : 'border-violet-200'} rounded-full`} />
                                <div className={`absolute inset-0 w-12 h-12 border-4 border-transparent ${isSales ? 'border-t-emerald-600' : 'border-t-violet-600'} rounded-full animate-spin`} />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando documento...</p>
                        </div>
                    }
                    error={
                        <div className="flex flex-col items-center justify-center gap-4 py-12">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <XMarkIcon className="h-8 w-8 text-red-500" />
                            </div>
                            <p className="text-red-600 dark:text-red-400 text-sm">Error al cargar el PDF</p>
                        </div>
                    }
                    className="max-w-full"
                >
                    <Page
                        pageNumber={pageNumber}
                        width={pageWidth}
                        renderMode="canvas"
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        loading={
                            <div className="flex items-center justify-center py-8">
                                <ArrowPathIcon className={`h-6 w-6 ${isSales ? 'text-emerald-500' : 'text-violet-500'} animate-spin`} />
                            </div>
                        }
                        onRenderSuccess={() => setIsPageLoading(false)}
                        className="shadow-lg rounded-lg overflow-hidden"
                    />
                </Document>
            </div>
        </div>
    );
}

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
                                <PdfCanvasViewer
                                    url={url}
                                    blob={blob}
                                    isSales={isSales}
                                    documentNumber={data.documentNumberFull}
                                />
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
