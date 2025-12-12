import { useState } from "react";
import Form from "@/components/form";
import { Submit } from "@/components/form/Submit";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { listSuppliers } from "@agape/purchasing/supplier";
import { listItems } from "@agape/catalogs/item";
import { createPurchaseOrder } from "@agape/purchasing/purchase_order";
import type { CreatePurchaseOrderInput } from "@utils/dto/purchasing/purchase_order";
import type { SupplierListItem } from "@utils/dto/purchasing/supplier";
import type { ListItemItem } from "@utils/dto/catalogs/item";
import { OrderForm } from "./components";
import DateTime from "@utils/data/DateTime";
import Decimal from "@utils/data/Decimal";

interface Props {
  suppliers: SupplierListItem[];
  items: ListItemItem[];
}

export async function onInit(): Promise<Props> {
  const [suppliersResult, itemsResult] = await Promise.all([
    listSuppliers({ isActive: true, pageSize: 500 }),
    listItems({ isEnabled: true, pageSize: 500 }),
  ]);

  return {
    suppliers: suppliersResult.suppliers,
    items: itemsResult.items,
  };
}

export default function NewOrderPage(props: Props) {
  const { navigate } = useRouter();
  const notify = useNotificacion();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreatePurchaseOrderInput) => {
    // Validate
    if (!data.supplierId || data.supplierId === 0) {
      throw new Error("Debe seleccionar un proveedor");
    }

    if (!data.items || data.items.length === 0) {
      throw new Error("Debe agregar al menos un ítem a la orden");
    }

    // Validate each item
    for (const item of data.items) {
      if (!item.itemId || item.itemId === 0) {
        throw new Error("Todos los ítems deben tener un producto seleccionado");
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new Error("Todas las cantidades deben ser mayores a cero");
      }
      if (!item.unitPrice || Number(item.unitPrice) <= 0) {
        throw new Error("Todos los precios deben ser mayores a cero");
      }
    }

    const order = await createPurchaseOrder({
      ...data,
      orderDate: data.orderDate || new DateTime(),
      items: data.items.map((item) => ({
        ...item,
        unitPrice:
          item.unitPrice instanceof Decimal
            ? item.unitPrice
            : new Decimal(item.unitPrice),
      })),
    });

    notify({
      payload: `Orden de compra #${order.id} creada exitosamente`,
      type: "success",
    });

    navigate(`../order/${order.id}`);

    return order;
  };

  const handleError = (error: unknown) => {
    notify({
      payload:
        error instanceof Error ? error.message : "Error al crear la orden",
      type: "error",
    });
  };

  const initialState: Partial<CreatePurchaseOrderInput> = {
    supplierId: 0,
    orderDate: new DateTime(),
    items: [],
  };

  const itemsForForm = props.items.map((item) => ({
    id: item.id,
    code: item.code,
    fullName: item.fullName,
    basePrice: item.basePrice,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("../orders")}
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

        <Form.Root<CreatePurchaseOrderInput>
          state={initialState as CreatePurchaseOrderInput}
        >
          <OrderForm suppliers={props.suppliers} items={itemsForForm}>
            <button
              type="button"
              onClick={() => navigate("../orders")}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
            >
              Cancelar
            </button>
            <Submit<CreatePurchaseOrderInput>
              onSubmit={handleSubmit}
              onError={handleError}
              onLoadingChange={setIsSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creando..." : "Crear Orden"}
            </Submit>
          </OrderForm>
        </Form.Root>
      </div>
    </div>
  );
}
