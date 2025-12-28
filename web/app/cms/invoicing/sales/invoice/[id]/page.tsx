import { Fragment, useState } from "react";
import { getSalesInvoiceById, postSalesInvoice } from "@agape/finance/sales_invoice";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import type { SalesInvoiceDetails, SalesInvoiceStatus, SalesInvoiceItemDetails } from "@utils/dto/finance/sales_invoice";
import Decimal from "@utils/data/Decimal";
import { DocumentCheckIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface Props {
    invoice: SalesInvoiceDetails;
}

export async function onInit({
    params,
}: {
    params: { id: string };
}): Promise<Props> {
    const invoice = await getSalesInvoiceById(Number(params.id));

    if (!invoice) {
        throw new Error("Factura de venta no encontrada");
    }

    return { invoice };
}

export default function SalesInvoiceDetailPage({ invoice: initialInvoice }: Props) {
    const { navigate } = useRouter();
    const notify = useNotificacion();
    const [invoice, setInvoice] = useState(initialInvoice);
    const [isPosting, setIsPosting] = useState(false);

    const totalNumber =
        invoice.totalAmount instanceof Decimal
            ? invoice.totalAmount.toNumber()
            : Number(invoice.totalAmount);

    const subtotalNumber =
        invoice.subtotal instanceof Decimal
            ? invoice.subtotal.toNumber()
            : Number(invoice.subtotal);

    const taxNumber =
        invoice.taxAmount instanceof Decimal
            ? invoice.taxAmount.toNumber()
            : Number(invoice.taxAmount);

    const discountNumber =
        invoice.globalDiscountAmount instanceof Decimal
            ? invoice.globalDiscountAmount.toNumber()
            : Number(invoice.globalDiscountAmount);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const getStatusBadge = (status: SalesInvoiceStatus) => {
        const statusConfig: Record<SalesInvoiceStatus, { label: string; className: string }> = {
            draft: {
                label: "Borrador",
                className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
            },
            issued: {
                label: "Emitida",
                className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
            },
            partially_paid: {
                label: "Pago Parcial",
                className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            },
            paid: {
                label: "Pagada",
                className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
            },
            cancelled: {
                label: "Anulada",
                className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
            },
        };

        const config = statusConfig[status] || statusConfig.draft;
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
                {config.label}
            </span>
        );
    };

    const handlePost = async () => {
        if (invoice.status !== "draft") return;

        setIsPosting(true);
        try {
            const result = await postSalesInvoice(invoice.id);
            notify({
                payload: `Factura ${invoice.documentNumberFull} emitida exitosamente`,
                type: "success",
            });
            // Refresh invoice data
            const updated = await getSalesInvoiceById(invoice.id);
            if (updated) {
                setInvoice(updated);
            }
        } catch (error) {
            notify({
                payload: error instanceof Error ? error.message : "Error al emitir la factura",
                type: "error",
            });
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <Fragment>
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate("../..")}
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
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-emerald-200 text-sm font-medium">
                                            Factura de Venta
                                        </p>
                                        {getStatusBadge(invoice.status)}
                                    </div>
                                    <h1 className="text-3xl font-bold text-white mt-1">
                                        {invoice.documentNumberFull}
                                    </h1>
                                    {invoice.orderDocumentNumber && (
                                        <p className="text-emerald-200 text-sm mt-1">
                                            Orden: {invoice.orderDocumentNumber}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-emerald-200 text-sm font-medium">Total</p>
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
                                {/* Client Info */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                        Cliente
                                    </h3>
                                    <div className="space-y-2">
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {invoice.clientName}
                                        </p>
                                        {invoice.clientDocumentType && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {invoice.clientDocumentType}:{" "}
                                                {invoice.clientDocumentNumber}
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

                    {/* Items Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden mb-6">
                        <div className="px-8 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Detalle de Ítems
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            #
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Producto
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Cantidad
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Precio Unit.
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Descuento
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Impuesto
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {invoice.items.map((item: SalesInvoiceItemDetails) => {
                                        const qty =
                                            item.quantity instanceof Decimal
                                                ? item.quantity.toNumber()
                                                : Number(item.quantity);
                                        const price =
                                            item.unitPrice instanceof Decimal
                                                ? item.unitPrice.toNumber()
                                                : Number(item.unitPrice);
                                        const discAmt =
                                            item.discountAmount instanceof Decimal
                                                ? item.discountAmount.toNumber()
                                                : Number(item.discountAmount);
                                        const taxAmt =
                                            item.taxAmount instanceof Decimal
                                                ? item.taxAmount.toNumber()
                                                : Number(item.taxAmount);
                                        const lineTotal =
                                            item.total instanceof Decimal
                                                ? item.total.toNumber()
                                                : Number(item.total);

                                        return (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {item.lineNumber}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {item.itemName}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {item.itemCode}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                                                    {qty.toLocaleString("es-CO")}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                                                    ${price.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400">
                                                    {discAmt > 0 ? `-$${discAmt.toLocaleString("es-CO", { minimumFractionDigits: 2 })}` : "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-400">
                                                    {taxAmt > 0 ? `$${taxAmt.toLocaleString("es-CO", { minimumFractionDigits: 2 })}` : "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">
                                                    ${lineTotal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="px-8 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                            <div className="max-w-xs ml-auto space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        ${subtotalNumber.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                {discountNumber > 0 && (
                                    <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                                        <span>Descuento Global:</span>
                                        <span>-${discountNumber.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                {taxNumber > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Impuestos:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            ${taxNumber.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold border-t border-gray-300 dark:border-gray-500 pt-2">
                                    <span className="text-gray-900 dark:text-white">Total:</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                        ${totalNumber.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {invoice.notes && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden mb-6 p-6">
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Notas
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300">{invoice.notes}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between gap-4">
                        <button
                            onClick={() => navigate("../..")}
                            className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
                        >
                            Volver al Listado
                        </button>

                        {invoice.status === "draft" && (
                            <button
                                onClick={handlePost}
                                disabled={isPosting}
                                className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPosting ? (
                                    <>
                                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                        Emitiendo...
                                    </>
                                ) : (
                                    <>
                                        <DocumentCheckIcon className="h-4 w-4 mr-2" />
                                        Emitir Factura
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Fragment>
    );
}
