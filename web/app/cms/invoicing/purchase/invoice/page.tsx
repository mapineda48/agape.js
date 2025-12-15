import { Fragment, useMemo } from "react";
import { listItems } from "@agape/catalogs/item";
import { listSuppliers } from "@agape/purchasing/supplier";
import { createPurchaseInvoice } from "@agape/finance/purchase_invoice";
import Form from "@/components/form";
import { Submit } from "@/components/form/Submit";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import type { CreatePurchaseInvoiceInput, CreatePurchaseInvoiceItemInput } from "@utils/dto/finance/purchase_invoice";
import type { SupplierListItem } from "@utils/dto/purchasing/supplier";
import type { ListItemItem } from "@utils/dto/catalogs/item";
import Decimal from "@utils/data/Decimal";
import DateTime from "@utils/data/DateTime";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

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

// Internal form state type that uses DateTime
interface InvoiceFormState {
    supplierId: number;
    issueDate?: DateTime;
    dueDate?: DateTime;
    items: CreatePurchaseInvoiceItemInput[];
}

export default function NewPurchaseInvoicePage(props: Props) {
    const { navigate } = useRouter();
    const notify = useNotificacion();

    const handleSubmit = async (data: InvoiceFormState) => {
        // Validate
        if (!data.supplierId || data.supplierId === 0) {
            throw new Error("Debe seleccionar un proveedor");
        }

        if (!data.items || data.items.length === 0) {
            throw new Error("Debe agregar al menos un ítem a la factura");
        }

        // Validate each item
        for (const item of data.items) {
            if (!item.itemId || item.itemId === 0) {
                throw new Error(
                    "Todos los ítems deben tener un producto seleccionado"
                );
            }
            if (!item.quantity || item.quantity <= 0) {
                throw new Error("Todas las cantidades deben ser mayores a cero");
            }
            if (!item.unitPrice || Number(item.unitPrice) <= 0) {
                throw new Error("Todos los precios deben ser mayores a cero");
            }
        }

        // Calculate total from items
        const totalAmount = data.items.reduce(
            (acc: Decimal, item) =>
                acc.add(new Decimal(item.quantity).mul(new Decimal(item.unitPrice))),
            new Decimal(0)
        );

        // Convert form data to API input
        const apiInput: CreatePurchaseInvoiceInput = {
            supplierId: data.supplierId,
            issueDate: data.issueDate,
            dueDate: data.dueDate,
            totalAmount,
            items: data.items.map((item) => ({
                ...item,
                unitPrice:
                    item.unitPrice instanceof Decimal
                        ? item.unitPrice
                        : new Decimal(item.unitPrice),
            })),
        };

        const invoice = await createPurchaseInvoice(apiInput);

        notify({
            payload: `Factura de compra ${invoice.documentNumberFull} creada exitosamente`,
            type: "success",
        });

        navigate(`../${invoice.id}`);

        return invoice;
    };

    const handleError = (error: unknown) => {
        notify({
            payload:
                error instanceof Error ? error.message : "Error al crear la factura",
            type: "error",
        });
    };

    const initialState: InvoiceFormState = {
        supplierId: 0,
        issueDate: new DateTime(),
        items: [],
    };

    return (
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

                <Form.Root<InvoiceFormState> state={initialState}>
                    <InvoiceForm suppliers={props.suppliers} items={props.items}>
                        <button
                            type="button"
                            onClick={() => navigate("../invoices")}
                            className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
                        >
                            Cancelar
                        </button>
                        <Submit<InvoiceFormState>
                            onSubmit={handleSubmit}
                            onError={handleError}
                            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl hover:from-violet-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Crear Factura
                        </Submit>
                    </InvoiceForm>
                </Form.Root>
            </div>
        </div>
    );
}

// Invoice Form Component
interface InvoiceFormProps {
    suppliers: SupplierListItem[];
    items: ListItemItem[];
    children?: React.ReactNode;
}

function InvoiceForm({ suppliers, items, children }: InvoiceFormProps) {
    const { setAt } = Form.useForm();

    // Watch invoice items
    const invoiceItemsArray = Form.useArray<CreatePurchaseInvoiceItemInput[]>("items");

    // Get items from state
    const invoiceItems = Form.useSelector(
        (state: InvoiceFormState) => state.items
    );

    // Calculate totals
    const { subtotal, itemCount } = useMemo(() => {
        let total = new Decimal(0);
        for (const item of invoiceItems || []) {
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
            itemCount: invoiceItems?.length || 0,
        };
    }, [invoiceItems]);

    const handleAddItem = () => {
        invoiceItemsArray.addItem({
            itemId: 0,
            quantity: 1,
            unitPrice: new Decimal(0),
        });
    };

    const handleRemoveItem = (index: number) => {
        invoiceItemsArray.removeItem(index);
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            {/* Header with summary */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            Nueva Factura de Compra
                        </h2>
                        <p className="text-violet-100 mt-1">
                            {itemCount} ítems en la factura
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-violet-100 text-sm">Total estimado</p>
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <svg
                            className="h-5 w-5 mr-2 text-violet-600"
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
                    <Form.Select.Int
                        path="supplierId"
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                    >
                        <option value={0}>Seleccionar proveedor...</option>
                        {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                                {supplier.firstName
                                    ? `${supplier.firstName} ${supplier.lastName ?? ""}`.trim()
                                    : supplier.legalName ?? ""}
                            </option>
                        ))}
                    </Form.Select.Int>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <svg
                                className="h-5 w-5 mr-2 text-violet-600"
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
                            Fecha de Emisión
                        </h3>
                        <Form.DateTime
                            path="issueDate"
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                        />
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <svg
                                className="h-5 w-5 mr-2 text-violet-600"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Fecha de Vencimiento
                        </h3>
                        <Form.DateTime
                            path="dueDate"
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                        />
                    </div>
                </div>

                {/* Items Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                            <svg
                                className="h-5 w-5 mr-2 text-violet-600"
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
                            Ítems de la Factura
                        </h3>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition"
                        >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Agregar Ítem
                        </button>
                    </div>

                    {/* Items List */}
                    <div className="space-y-3">
                        {invoiceItemsArray.map(
                            (item: CreatePurchaseInvoiceItemInput, index: number) => (
                                <div
                                    key={index}
                                    className="flex flex-col md:flex-row gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                                >
                                    {/* Item Select */}
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Producto
                                        </label>
                                        <select
                                            value={item.itemId || 0}
                                            onChange={(e) =>
                                                handleItemSelect(index, Number(e.target.value))
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition text-sm"
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
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Cantidad
                                        </label>
                                        <Form.Int
                                            path="quantity"
                                            min={1}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition text-sm"
                                        />
                                    </div>

                                    {/* Unit Price */}
                                    <div className="w-full md:w-32">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Precio Unit.
                                        </label>
                                        <Form.Decimal
                                            path="unitPrice"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition text-sm"
                                        />
                                    </div>

                                    {/* Subtotal */}
                                    <div className="w-full md:w-28">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Subtotal
                                        </label>
                                        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-white">
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
                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                            title="Eliminar ítem"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            )
                        )}

                        {(!invoiceItems || invoiceItems.length === 0) && (
                            <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
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
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    No hay ítems en la factura
                                </p>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="mt-3 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
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
                <div className="bg-gray-50 dark:bg-gray-700/50 px-8 py-4 flex justify-end space-x-3">
                    {children}
                </div>
            )}
        </div>
    );
}
