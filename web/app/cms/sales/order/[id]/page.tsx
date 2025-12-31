import { useState, useMemo } from "react";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import {
    getSalesOrderById,
    updateSalesOrderStatus,
} from "@agape/crm/order";
import {
    deliverSalesOrder,
    invoiceSalesOrder,
} from "@agape/sales/sales_flow";
import type {
    SalesOrderDetails,
    OrderStatus,
} from "@utils/dto/crm/order";
import Decimal from "@utils/data/Decimal";
import { listLocations } from "@agape/inventory/location";
import { useDeliveryModal, useInvoicingModal } from "./SalesFlowModals";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { DeliverSalesOrderInput, InvoiceSalesOrderInput } from "@utils/dto/sales/flow";

interface Props {
    order: SalesOrderDetails;
    locations: { id: number; name: string }[];
}

export async function onInit({ params }: { params: { id: string } }): Promise<Props> {
    const [order, locations] = await Promise.all([
        getSalesOrderById(Number(params.id)),
        listLocations(true)
    ]);

    if (!order) {
        throw new Error("Orden de venta no encontrada");
    }

    return {
        order,
        locations: locations.map(l => ({ id: l.id, name: l.name }))
    };
}

export default function SalesOrderDetailPage(props: Props) {
    const { navigate } = useRouter();
    const notify = useNotificacion();
    const [order, setOrder] = useState<SalesOrderDetails>(props.order);
    const [isUpdating, setIsUpdating] = useState(false);

    const showDelivery = useDeliveryModal();
    const showInvoicing = useInvoicingModal();

    const reloadOrder = async () => {
        const updated = await getSalesOrderById(order.id);
        if (updated) setOrder(updated);
    };

    const handleStatusChange = async (newStatus: OrderStatus) => {
        setIsUpdating(true);
        try {
            await updateSalesOrderStatus(order.id, newStatus);
            await reloadOrder();
            notify({
                payload: `Estado actualizado a "${getStatusLabel(newStatus)}"`,
                type: "success",
            });
        } catch (error) {
            notify({
                payload: error instanceof Error ? error.message : "Error al actualizar estado",
                type: "error",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleConfirmDelivery = async (data: DeliverSalesOrderInput) => {
        setIsUpdating(true);
        try {
            await deliverSalesOrder({
                ...data,
                userId: 1, // Current user for demo
            });
            await reloadOrder();
            notify({ payload: "Entrega registrada exitosamente", type: "success" });
        } catch (error) {
            notify({ payload: error instanceof Error ? error.message : "Error en entrega", type: "error" });
            throw error; // Re-throw so modal form shows error
        } finally {
            setIsUpdating(false);
        }
    };

    const handleConfirmInvoice = async (data: InvoiceSalesOrderInput) => {
        setIsUpdating(true);
        try {
            const result = await invoiceSalesOrder(data);
            await reloadOrder();
            notify({ payload: `Factura ${result.documentNumber} generada`, type: "success" });
        } catch (error) {
            notify({ payload: error instanceof Error ? error.message : "Error en facturación", type: "error" });
            throw error; // Re-throw so modal form shows error
        } finally {
            setIsUpdating(false);
        }
    };

    const totalNumber = toNum(order.total);

    const canConfirm = order.status === "pending";
    const canDeliver = order.status === "confirmed" || order.status === "shipped";
    const canInvoice = order.status === "confirmed" || order.status === "shipped" || order.status === "delivered";
    const canCancel = order.status === "pending" || order.status === "confirmed";

    const totals = useMemo(() => {
        let totalQty = 0;
        let totalDelivered = 0;
        let totalInvoiced = 0;

        for (const item of order.items) {
            totalQty += toNum(item.quantity);
            totalDelivered += toNum(item.deliveredQuantity);
            totalInvoiced += toNum(item.invoicedQuantity);
        }

        return {
            deliveredPercent: totalQty > 0 ? (totalDelivered / totalQty) * 100 : 0,
            invoicedPercent: totalQty > 0 ? (totalInvoiced / totalQty) * 100 : 0
        };
    }, [order.items]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate("../../orders")}
                    className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 mb-6 group transition-colors"
                >
                    <svg className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver a Ventas
                </button>

                {/* Header Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-indigo-50 overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-4 mb-2">
                                    <h1 className="text-3xl font-bold text-white tracking-tight">
                                        Orden {order.documentNumberFull}
                                    </h1>
                                    <StatusBadge status={order.status} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-indigo-100 font-medium text-lg">
                                        {order.clientName}
                                    </p>
                                    <p className="text-indigo-200 text-sm">
                                        {order.clientDocumentType}: {order.clientDocumentNumber}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider mb-1">Total Orden</p>
                                <p className="text-4xl font-extrabold text-white">
                                    ${totalNumber.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-indigo-100 text-sm mt-2 opacity-80">
                                    {new Date(order.orderDate).toLocaleDateString("es-CO", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-black text-indigo-100 uppercase tracking-widest">
                                    <span>Entrega / Surtido</span>
                                    <span>{totals.deliveredPercent.toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white rounded-full transition-all duration-700"
                                        style={{ width: `${totals.deliveredPercent}%` }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-black text-indigo-100 uppercase tracking-widest">
                                    <span>Facturación</span>
                                    <span>{totals.invoicedPercent.toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                                        style={{ width: `${totals.invoicedPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    {(canConfirm || canDeliver || canInvoice || canCancel) && (
                        <div className="px-8 py-4 bg-gray-50/50 border-b border-indigo-50 flex flex-wrap gap-3">
                            {canConfirm && (
                                <button
                                    onClick={() => handleStatusChange("confirmed")}
                                    disabled={isUpdating}
                                    className="btn btn-primary"
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                        Confirmar Pedido
                                    </span>
                                </button>
                            )}
                            {canDeliver && (
                                <button
                                    onClick={() => showDelivery({
                                        order,
                                        locations: props.locations,
                                        onConfirm: handleConfirmDelivery
                                    })}
                                    disabled={isUpdating}
                                    className="btn btn-secondary"
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                        Registrar Entrega
                                    </span>
                                </button>
                            )}
                            {canInvoice && (
                                <button
                                    onClick={() => showInvoicing({
                                        order,
                                        onConfirm: handleConfirmInvoice
                                    })}
                                    disabled={isUpdating}
                                    className="btn btn-success"
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        Generar Factura
                                    </span>
                                </button>
                            )}
                            {canCancel && (
                                <button
                                    onClick={() => handleStatusChange("cancelled")}
                                    disabled={isUpdating}
                                    className="btn btn-ghost text-red-600 hover:bg-red-50"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    )}

                    {/* Items Table */}
                    <div className="p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 118 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            Productos del Pedido
                        </h3>

                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/80">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Producto</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Pedido</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Entregado</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Facturado</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Precio</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {order.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-gray-900">{item.itemName}</div>
                                                <div className="text-xs font-mono text-gray-400 mt-1">{item.itemCode}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm font-medium text-gray-600">{toNum(item.quantity)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <QuantityBadge qty={toNum(item.deliveredQuantity)} total={toNum(item.quantity)} color="blue" />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <QuantityBadge qty={toNum(item.invoicedQuantity)} total={toNum(item.quantity)} color="green" />
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-600">
                                                ${toNum(item.unitPrice).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                ${toNum(item.total).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .btn {
          @apply inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-sm border;
        }
        .btn-primary {
          @apply text-white bg-indigo-600 border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 shadow-indigo-200;
        }
        .btn-secondary {
          @apply text-white bg-blue-600 border-blue-600 hover:bg-blue-700 hover:border-blue-700 shadow-blue-200;
        }
        .btn-success {
          @apply text-white bg-emerald-600 border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 shadow-emerald-200;
        }
        .btn-ghost {
          @apply border-transparent hover:bg-gray-100;
        }
      `}</style>
        </div>
    );
}


function QuantityBadge({ qty, total, color }: { qty: number, total: number, color: 'blue' | 'green' }) {
    const isFull = qty >= total;
    const isNone = qty === 0;

    const colors = {
        blue: isFull ? 'bg-blue-600 text-white' : isNone ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-700',
        green: isFull ? 'bg-emerald-600 text-white' : isNone ? 'bg-gray-100 text-gray-400' : 'bg-emerald-100 text-emerald-700',
    };

    return (
        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${colors[color]}`}>
            {qty} / {total}
        </span>
    );
}

function toNum(val: any): number {
    if (val instanceof Decimal) return val.toNumber();
    if (typeof val === 'string') return parseFloat(val);
    return Number(val) || 0;
}

function getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
        pending: "Pendiente",
        confirmed: "Confirmada",
        shipped: "Enviada",
        delivered: "Entregada",
        cancelled: "Cancelada",
    };
    return labels[status];
}
