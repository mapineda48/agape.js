import { useMemo, type ReactNode } from "react";
import { useFormReset, useInputArray } from "@/components/form";
import Input from "@/components/form/Input";
import { Int } from "@/components/form/Input";
import Select from "@/components/form/Select";
import PathProvider from "@/components/form/paths";
import { useSelector } from "@/components/form/hooks";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import type {
  CreatePurchaseOrderInput,
  CreatePurchaseOrderItemInput,
  PurchaseOrderStatus,
} from "@utils/dto/purchasing/purchase_order";
import type { SupplierListItem } from "@utils/dto/purchasing/supplier";
import Decimal from "@utils/data/Decimal";

interface ItemOption {
  id: number;
  code: string;
  fullName: string;
  basePrice: Decimal;
}

interface OrderFormProps {
  suppliers: SupplierListItem[];
  items: ItemOption[];
  children?: ReactNode;
  isEdit?: boolean;
}

export function OrderForm({
  suppliers,
  items,
  children,
  isEdit = false,
}: OrderFormProps) {
  const { setAt } = useFormReset();

  // Watch order items
  const orderItemsArray =
    useInputArray<CreatePurchaseOrderItemInput[]>("items");

  // Get items from state using selector
  const orderItems = useSelector(
    (state: CreatePurchaseOrderInput) => state.items
  );

  // Watch supplier
  const supplierId = useSelector(
    (state: CreatePurchaseOrderInput) => state.supplierId
  );

  // Calculate totals
  const { subtotal, itemCount } = useMemo(() => {
    let total = new Decimal(0);
    for (const item of orderItems || []) {
      if (item.quantity && item.unitPrice) {
        const qty = typeof item.quantity === "number" ? item.quantity : 0;
        const price =
          item.unitPrice instanceof Decimal
            ? item.unitPrice
            : new Decimal(item.unitPrice || 0);
        total = total.add(price.mul(qty));
      }
    }
    return {
      subtotal: total,
      itemCount: orderItems?.length || 0,
    };
  }, [orderItems]);

  const handleAddItem = () => {
    orderItemsArray.addItem({
      itemId: 0,
      quantity: 1,
      unitPrice: 0,
    });
  };

  const handleRemoveItem = (index: number) => {
    orderItemsArray.removeItem(index);
  };

  const handleItemSelect = (index: number, itemId: number) => {
    const selectedItem = items.find((i) => i.id === itemId);
    if (selectedItem) {
      setAt(["items", index, "itemId"], itemId);
      setAt(
        ["items", index, "unitPrice"],
        selectedItem.basePrice instanceof Decimal
          ? selectedItem.basePrice.toNumber()
          : Number(selectedItem.basePrice)
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header with summary */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isEdit ? "Editar Orden de Compra" : "Nueva Orden de Compra"}
            </h2>
            <p className="text-emerald-100 mt-1">
              {itemCount} ítems en la orden
            </p>
          </div>
          <div className="text-right">
            <p className="text-emerald-100 text-sm">Total estimado</p>
            <p className="text-3xl font-bold text-white">
              $
              {subtotal.toNumber().toLocaleString("es-CO", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="px-8 py-6 space-y-6">
        {/* Supplier Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg
              className="h-5 w-5 mr-2 text-emerald-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-.876c-.278 0-.546-.11-.743-.307l-1.68-1.68a1.125 1.125 0 00-.796-.329H9.75V3.375c0-.621-.504-1.125-1.125-1.125H4.125C3.504 2.25 3 2.754 3 3.375v10.875c0 .621.504 1.125 1.125 1.125H3.75"
              />
            </svg>
            Proveedor
          </h3>
          <Select.Int
            path="supplierId"
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-white"
          >
            <option value={0}>Seleccionar proveedor...</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.firstName
                  ? `${supplier.firstName} ${supplier.lastName ?? ""}`.trim()
                  : supplier.legalName ?? ""}
              </option>
            ))}
          </Select.Int>
        </div>

        {/* Order Date */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg
              className="h-5 w-5 mr-2 text-emerald-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
            Fecha de Orden
          </h3>
          <Input.DateTime
            path="orderDate"
            required
            className="w-full md:w-1/3 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Items Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg
                className="h-5 w-5 mr-2 text-emerald-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
              Ítems de la Orden
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Agregar Ítem
            </button>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {orderItemsArray.map(
              (item: CreatePurchaseOrderItemInput, index: number) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                  {/* Item Select */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Producto
                    </label>
                    <select
                      value={item.itemId || 0}
                      onChange={(e) =>
                        handleItemSelect(index, Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                    >
                      <option value={0}>Seleccionar producto...</option>
                      {items.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.code} - {product.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="w-full md:w-24">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Cantidad
                    </label>
                    <Int
                      path="quantity"
                      min={1}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="w-full md:w-32">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Precio Unit.
                    </label>
                    <Input.Decimal
                      path="unitPrice"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="w-full md:w-28">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Subtotal
                    </label>
                    <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                      $
                      {(
                        (item.quantity || 0) *
                        (item.unitPrice instanceof Decimal
                          ? item.unitPrice.toNumber()
                          : Number(item.unitPrice || 0))
                      ).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar ítem"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )
            )}

            {(!orderItems || orderItems.length === 0) && (
              <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-xl">
                <svg
                  className="mx-auto h-10 w-10 text-gray-400"
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
                <p className="mt-2 text-sm text-gray-500">
                  No hay ítems en la orden
                </p>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  + Agregar primer ítem
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer with Actions */}
      {children && (
        <div className="bg-gray-50 px-8 py-4 flex justify-end space-x-3">
          {children}
        </div>
      )}
    </div>
  );
}

/** Status Badge Component */
export function StatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const config = getStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.className}`}
    >
      <span className={`h-2 w-2 rounded-full mr-2 ${config.dotClass}`} />
      {config.label}
    </span>
  );
}

function getStatusConfig(status: PurchaseOrderStatus): {
  label: string;
  className: string;
  dotClass: string;
} {
  const configs: Record<
    PurchaseOrderStatus,
    { label: string; className: string; dotClass: string }
  > = {
    pending: {
      label: "Pendiente",
      className: "bg-yellow-100 text-yellow-800",
      dotClass: "bg-yellow-400",
    },
    approved: {
      label: "Aprobada",
      className: "bg-blue-100 text-blue-800",
      dotClass: "bg-blue-400",
    },
    received: {
      label: "Recibida",
      className: "bg-green-100 text-green-800",
      dotClass: "bg-green-400",
    },
    cancelled: {
      label: "Cancelada",
      className: "bg-gray-100 text-gray-800",
      dotClass: "bg-gray-400",
    },
  };
  return configs[status];
}
