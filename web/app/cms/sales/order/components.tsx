import { useMemo, type ReactNode } from "react";
import { Form } from "@/components/form";
import { PlusIcon, TrashIcon, ShoppingCartIcon, CalendarIcon } from "@heroicons/react/24/outline";
import type {
    CreateSalesOrderInput,
    CreateSalesOrderItemInput,
    OrderStatus,
    SalesOrderType,
} from "@utils/dto/crm/order";
import type { ClientListItem } from "@utils/dto/crm/client";
import Decimal from "@utils/data/Decimal";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface ItemOption {
    id: number;
    code: string;
    fullName: string;
    basePrice: Decimal;
}

interface OrderFormProps {
    clients: ClientListItem[];
    orderTypes: SalesOrderType[];
    items: ItemOption[];
    children?: ReactNode;
    isEdit?: boolean;
}

export function SalesOrderForm({
    clients,
    orderTypes,
    items,
    children,
    isEdit = false,
}: OrderFormProps) {
    const { setAt } = Form.useForm();

    // Watch order items
    const orderItemsArray =
        Form.useArray<CreateSalesOrderItemInput[]>("items");

    // Get items from state using selector
    const orderItems = Form.useSelector(
        (state: CreateSalesOrderInput) => state.items
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

    const toNum = (val: any): number => {
        if (val instanceof Decimal) return val.toNumber();
        if (typeof val === 'string') return parseFloat(val) || 0;
        return Number(val) || 0;
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-indigo-50 overflow-hidden">
            {/* Header with summary */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-white tracking-tight">
                            {isEdit ? "Editar Orden de Venta" : "Nueva Orden de Venta"}
                        </h2>
                        <p className="text-indigo-100 mt-1 font-medium opacity-90">
                            {itemCount} productos seleccionados
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider mb-1">Total Estimado</p>
                        <p className="text-4xl font-extrabold text-white">
                            $
                            {subtotal.toNumber().toLocaleString("es-CO", {
                                minimumFractionDigits: 2,
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Fields */}
            <div className="px-8 py-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Client Selection */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <ShoppingCartIcon className="h-5 w-5 text-indigo-600" />
                            </div>
                            Cliente
                        </h3>
                        <Form.Select.Int
                            path="clientId"
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-white text-sm font-medium"
                        >
                            <option value={0}>Seleccionar cliente...</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.firstName
                                        ? `${client.firstName} ${client.lastName ?? ""}`.trim()
                                        : client.legalName ?? ""}
                                </option>
                            ))}
                        </Form.Select.Int>
                    </div>

                    {/* Order Type */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <PlusIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            Tipo de Pedido
                        </h3>
                        <Form.Select.Int
                            path="orderTypeId"
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-white text-sm font-medium"
                        >
                            <option value={0}>Seleccionar tipo...</option>
                            {orderTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </Form.Select.Int>
                    </div>

                    {/* Order Date */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <CalendarIcon className="h-5 w-5 text-purple-600" />
                            </div>
                            Fecha de Venta
                        </h3>
                        <Form.DateTime
                            path="orderDate"
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-sm font-medium"
                        />
                    </div>
                </div>

                {/* Items Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <div className="p-2 bg-pink-50 rounded-lg">
                                <PlusIcon className="h-5 w-5 text-pink-600" />
                            </div>
                            Ítems del Pedido
                        </h3>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="inline-flex items-center px-6 py-2.5 text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100"
                        >
                            <PlusIcon className="h-4 w-4 mr-2 stroke-2" />
                            Añadir Producto
                        </button>
                    </div>

                    {/* Items List */}
                    <div className="space-y-4">
                        {orderItemsArray.map(
                            (item: CreateSalesOrderItemInput, index: number) => (
                                <div
                                    key={index}
                                    className="group relative flex flex-col md:flex-row gap-4 p-6 bg-white rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
                                >
                                    {/* Item Select */}
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                            Producto
                                        </label>
                                        <select
                                            value={item.itemId || 0}
                                            onChange={(e) =>
                                                handleItemSelect(index, Number(e.target.value))
                                            }
                                            className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-semibold text-gray-700"
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
                                    <div className="w-full md:w-28">
                                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                            Cantidad
                                        </label>
                                        <Form.Int
                                            path="quantity"
                                            min={1}
                                            required
                                            className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold text-center text-gray-700"
                                        />
                                    </div>

                                    {/* Unit Price */}
                                    <div className="w-full md:w-36">
                                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                            Precio Unitario
                                        </label>
                                        <Form.Decimal
                                            path="unitPrice"
                                            required
                                            className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold text-right text-gray-700"
                                        />
                                    </div>

                                    {/* Subtotal */}
                                    <div className="w-full md:w-36">
                                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 ml-1 text-right">
                                            Subtotal
                                        </label>
                                        <div className="px-4 py-2.5 bg-indigo-50/50 rounded-xl text-sm font-black text-indigo-700 text-right">
                                            $
                                            {(
                                                toNum(item.quantity) * toNum(item.unitPrice)
                                            ).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <div className="flex items-end pb-0.5">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                                            title="Eliminar ítem"
                                        >
                                            <TrashIcon className="h-5 w-5 stroke-2" />
                                        </button>
                                    </div>
                                </div>
                            )
                        )}

                        {(!orderItems || orderItems.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/30">
                                <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
                                    <ShoppingCartIcon className="h-10 w-10 text-gray-200" />
                                </div>
                                <p className="text-sm font-bold text-gray-400">
                                    La orden está vacía
                                </p>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="mt-4 text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest hover:underline transition-all"
                                >
                                    + Agregar primer producto
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer with Actions */}
            {children && (
                <div className="bg-gray-50/50 px-8 py-6 flex justify-end items-center gap-4 border-t border-gray-100">
                    {children}
                </div>
            )}
        </div>
    );
}

