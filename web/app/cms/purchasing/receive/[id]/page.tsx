import { useState } from "react";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import {
  getPurchaseOrderById,
  receivePurchaseOrder,
} from "@agape/purchasing/purchase_order";
import { listLocations } from "@agape/inventory/location";
import type {
  PurchaseOrderDetails,
  PurchaseOrderItemWithProduct,
} from "@utils/dto/purchasing/purchase_order";
import { StatusBadge } from "../../order/components";
import Decimal from "@utils/data/Decimal";

interface Location {
  id: number;
  name: string;
  isEnabled: boolean;
}

interface ReceivedItem {
  orderItemId: number;
  receivedQuantity: number;
  maxQuantity: number;
}

interface Props {
  order: PurchaseOrderDetails;
  locations: Location[];
}

export async function onInit({ params }: { params: { id: string } }): Promise<Props> {
  const [order, locations] = await Promise.all([
    getPurchaseOrderById(Number(params.id)),
    listLocations(true),
  ]);

  if (!order) {
    throw new Error("Orden de compra no encontrada");
  }

  if (order.status !== "approved") {
    throw new Error("Solo se pueden recibir órdenes aprobadas");
  }

  return { order, locations };
}

export default function ReceiveOrderPage(props: Props) {
  const { navigate } = useRouter();
  const notify = useNotificacion();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationId, setLocationId] = useState<number>(0);
  const [observation, setObservation] = useState("");
  const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>(
    props.order.items.map((item: PurchaseOrderItemWithProduct) => ({
      orderItemId: item.id,
      receivedQuantity: item.quantity,
      maxQuantity: item.quantity,
    }))
  );

  const handleQuantityChange = (orderItemId: number, quantity: number) => {
    setReceivedItems((prev: ReceivedItem[]) =>
      prev.map((item: ReceivedItem) =>
        item.orderItemId === orderItemId
          ? { ...item, receivedQuantity: Math.min(quantity, item.maxQuantity) }
          : item
      )
    );
  };

  const handleSubmit = async () => {
    if (!locationId || locationId === 0) {
      notify({
        payload: "Debe seleccionar una ubicación de bodega",
        type: "error",
      });
      return;
    }

    const itemsToReceive = receivedItems.filter(
      (item: ReceivedItem) => item.receivedQuantity > 0
    );
    if (itemsToReceive.length === 0) {
      notify({ payload: "Debe recibir al menos un ítem", type: "error" });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await receivePurchaseOrder({
        orderId: props.order.id,
        locationId,
        receivedById: 1, // TODO: Get current user ID from session
        observation: observation || undefined,
        receivedItems: itemsToReceive.map((item: ReceivedItem) => ({
          orderItemId: item.orderItemId,
          receivedQuantity: item.receivedQuantity,
        })),
      });

      notify({
        payload: `Mercancía recibida. Movimiento: ${result.movementNumber}`,
        type: "success",
      });

      navigate(`../../order/${props.order.id}`);
    } catch (error) {
      notify({
        payload:
          error instanceof Error ? error.message : "Error al recibir la orden",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalNumber =
    props.order.totalAmount instanceof Decimal
      ? props.order.totalAmount.toNumber()
      : Number(props.order.totalAmount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(`../../order/${props.order.id}`)}
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
          Volver a la Orden
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <svg
                    className="h-8 w-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <h1 className="text-2xl font-bold text-white">
                    Recibir Mercancía
                  </h1>
                </div>
                <p className="text-green-100 mt-1">
                  Orden #{props.order.id} - {props.order.supplierName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-green-100 text-sm">Total de la Orden</p>
                <p className="text-2xl font-bold text-white">
                  $
                  {totalNumber.toLocaleString("es-CO", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Reception Form */}
          <div className="px-8 py-6 space-y-6">
            {/* Location Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ubicación de Bodega *
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(Number(e.target.value))}
                className="w-full md:w-1/2 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white"
              >
                <option value={0}>Seleccionar ubicación...</option>
                {props.locations.map((loc: Location) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Observation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Observaciones (opcional)
              </label>
              <textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                rows={3}
                placeholder="Notas sobre la recepción..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
              />
            </div>

            {/* Items to Receive */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg
                  className="h-5 w-5 mr-2 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                Ítems a Recibir
              </h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ordenado
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        A Recibir
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {props.order.items.map(
                      (item: PurchaseOrderItemWithProduct) => {
                        const receivedItem = receivedItems.find(
                          (r: ReceivedItem) => r.orderItemId === item.id
                        );

                        return (
                          <tr key={item.id}>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {item.itemName}
                              </div>
                              <div className="text-sm text-gray-500 font-mono">
                                {item.itemCode}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className="text-sm font-medium text-gray-700">
                                {item.quantity}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <input
                                type="number"
                                min={0}
                                max={item.quantity}
                                value={receivedItem?.receivedQuantity || 0}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    item.id,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm"
                              />
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-8 py-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`../../order/${props.order.id}`)}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Procesando..." : "Confirmar Recepción"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
