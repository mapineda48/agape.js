import { Fragment } from "react";
import { getPurchaseInvoiceById } from "@agape/finance/purchase_invoice";
import { useRouter } from "@/components/router/router-hook";
import type { PurchaseInvoiceDetails } from "@utils/dto/finance/purchase_invoice";
import Decimal from "@utils/data/Decimal";

interface Props {
    invoice: PurchaseInvoiceDetails;
}

export async function onInit({
    params,
}: {
    params: { id: string };
}): Promise<Props> {
    const invoice = await getPurchaseInvoiceById(Number(params.id));

    if (!invoice) {
        throw new Error("Factura de compra no encontrada");
    }

    return { invoice };
}

export default function PurchaseInvoiceDetailPage({ invoice }: Props) {
    const { navigate } = useRouter();

    const totalNumber =
        invoice.totalAmount instanceof Decimal
            ? invoice.totalAmount.toNumber()
            : Number(invoice.totalAmount);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    return (
        <Fragment>
            <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate("../invoices")}
                        className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 group"
                    >
                        <svg
                            className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Volver a Facturas
                    </button>

                    {/* Invoice Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden mb-6">
                        {/* Top Banner */}
                        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-violet-200 text-sm font-medium">
                                        Factura de Compra
                                    </p>
                                    <h1 className="text-3xl font-bold text-white mt-1">
                                        {invoice.documentNumberFull}
                                    </h1>
                                </div>
                                <div className="text-right">
                                    <p className="text-violet-200 text-sm font-medium">Total</p>
                                    <p className="text-3xl font-bold text-white">
                                        $
                                        {totalNumber.toLocaleString("es-CO", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Supplier Info */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                        Proveedor
                                    </h3>
                                    <div className="space-y-2">
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {invoice.supplierName}
                                        </p>
                                        {invoice.supplierDocumentType && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {invoice.supplierDocumentType}:{" "}
                                                {invoice.supplierDocumentNumber}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Fecha de Emisión
                                        </h3>
                                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                                            {formatDate(invoice.issueDate)}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Fecha de Vencimiento
                                        </h3>
                                        <p
                                            className={`text-lg font-medium ${invoice.dueDate
                                                    ? "text-gray-900 dark:text-white"
                                                    : "text-gray-400 dark:text-gray-500"
                                                }`}
                                        >
                                            {formatDate(invoice.dueDate)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={() => navigate("../invoices")}
                            className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
                        >
                            Volver al Listado
                        </button>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}
