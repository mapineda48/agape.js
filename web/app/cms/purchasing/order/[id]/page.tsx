import { useState } from "react";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import {
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
} from "@agape/purchasing/purchase_order";
import type {
  PurchaseOrderDetails,
  PurchaseOrderStatus,
  PurchaseOrderItemWithProduct,
} from "@utils/dto/purchasing/purchase_order";
import { StatusBadge } from "../components";
import Decimal from "@utils/data/Decimal";

interface Props {
  order: PurchaseOrderDetails;
}

export async function onInit({ params }: { params: { id: string } }): Promise<Props> {
  const order = await getPurchaseOrderById(Number(params.id));

  if (!order) {
    throw new Error("Orden de compra no encontrada");
  }

  return { order };
}

export default function OrderDetailPage(props: Props) {
  const { navigate } = useRouter();
  const notify = useNotificacion();
  const [order, setOrder] = useState<PurchaseOrderDetails>(props.order);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: PurchaseOrderStatus) => {
    setIsUpdating(true);
    try {
      await updatePurchaseOrderStatus(order.id, newStatus);

      setOrder((prev: PurchaseOrderDetails) => ({
        ...prev,
        status: newStatus,
      }));

      notify({
        payload: `Estado actualizado a "${getStatusLabel(newStatus)}"`,
        type: "success",
      });
    } catch (error) {
      notify({
        payload:
          error instanceof Error ? error.message : "Error al actualizar estado",
        type: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const totalNumber =
    order.totalAmount instanceof Decimal
      ? order.totalAmount.toNumber()
      : Number(order.totalAmount);

  // Determine available actions based on status
  const canApprove = order.status === "pending";
  const canReceive = order.status === "approved";
  const canCancel = order.status === "pending" || order.status === "approved";
  const isTerminal =
    order.status === "received" || order.status === "cancelled";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("../../orders")}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 group"
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
          Volver a Órdenes
        </button>

        {/* Order Header Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">
                    Orden #{order.id}
                  </h1>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-emerald-100 mt-1">
                  Proveedor: {order.supplierName}
                </p>
                <p className="text-emerald-100 text-sm">
                  {order.supplierDocumentType}: {order.supplierDocumentNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-emerald-100 text-sm">Total</p>
                <p className="text-3xl font-bold text-white">
                  $
                  {totalNumber.toLocaleString("es-CO", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="text-emerald-100 text-sm mt-1">
                  {order.orderDate.toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {!isTerminal && (
            <div className="px-8 py-4 bg-gray-50 border-b flex flex-wrap gap-3">
              {canApprove && (
                <button
                  onClick={() => handleStatusChange("approved")}
                  disabled={isUpdating}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Aprobar Orden
                </button>
              )}

              {canReceive && (
                <button
                  onClick={() => navigate(`../../receive/${order.id}`)}
                  disabled={isUpdating}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition disabled:opacity-50"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  Recibir Mercancía
                </button>
              )}

              {canCancel && (
                <button
                  onClick={() => handleStatusChange("cancelled")}
                  disabled={isUpdating}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition disabled:opacity-50"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Cancelar Orden
                </button>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="px-8 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="h-5 w-5 mr-2 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Ítems de la Orden ({order.items.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio Unit.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item: PurchaseOrderItemWithProduct) => {
                    const unitPriceNum =
                      item.unitPrice instanceof Decimal
                        ? item.unitPrice.toNumber()
                        : Number(item.unitPrice);
                    const subtotalNum =
                      item.subtotal instanceof Decimal
                        ? item.subtotal.toNumber()
                        : Number(item.subtotal);

                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                          {item.itemCode}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.itemName}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                          $
                          {unitPriceNum.toLocaleString("es-CO", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          $
                          {subtotalNum.toLocaleString("es-CO", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-3 text-right text-sm font-semibold text-gray-700"
                    >
                      Total:
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-emerald-600">
                      $
                      {totalNumber.toLocaleString("es-CO", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusLabel(status: PurchaseOrderStatus): string {
  const labels: Record<PurchaseOrderStatus, string> = {
    pending: "Pendiente",
    approved: "Aprobada",
    received: "Recibida",
    cancelled: "Cancelada",
  };
  return labels[status];
}
