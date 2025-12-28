import { Fragment, useMemo } from "react";
import { listItems } from "@agape/catalogs/item";
import { listClients } from "@agape/crm/client";
import { createSalesInvoice, postSalesInvoice } from "@agape/finance/sales_invoice";
import Form from "@/components/form";
import { Submit } from "@/components/form/Submit";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import type { CreateSalesInvoiceInput, CreateSalesInvoiceItemInput } from "@utils/dto/finance/sales_invoice";
import type { ClientListItem } from "@utils/dto/crm/client";
import type { ListItemItem } from "@utils/dto/catalogs/item";
import Decimal from "@utils/data/Decimal";
import DateTime from "@utils/data/DateTime";
import { PlusIcon, TrashIcon, DocumentCheckIcon } from "@heroicons/react/24/outline";

interface Props {
    clients: ClientListItem[];
    items: ListItemItem[];
}

export async function onInit(): Promise<Props> {
    const [clientsResult, itemsResult] = await Promise.all([
        listClients({ isActive: true, pageSize: 500 }),
        listItems({ isEnabled: true, pageSize: 500 }),
    ]);

    return {
        clients: clientsResult.clients,
        items: itemsResult.items,
    };
}

// Internal form state type that uses DateTime
interface InvoiceFormState {
    clientId: number;
    issueDate?: DateTime;
    dueDate?: DateTime;
    notes?: string;
    globalDiscountPercent?: number;
    items: CreateSalesInvoiceItemInput[];
}

export default function NewSalesInvoicePage(props: Props) {
    const { navigate } = useRouter();
    const notify = useNotificacion();

    const handleSubmit = async (data: InvoiceFormState, action: "draft" | "post" = "draft") => {
        // Validate
        if (!data.clientId || data.clientId === 0) {
            throw new Error("Debe seleccionar un cliente");
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
            if (!item.quantity || Number(item.quantity) <= 0) {
                throw new Error("Todas las cantidades deben ser mayores a cero");
            }
            if (!item.unitPrice || Number(item.unitPrice) <= 0) {
                throw new Error("Todos los precios deben ser mayores a cero");
            }
        }

        // Convert form data to API input
        const apiInput: CreateSalesInvoiceInput = {
            clientId: data.clientId,
            issueDate: data.issueDate,
            dueDate: data.dueDate,
            notes: data.notes,
            globalDiscountPercent: data.globalDiscountPercent,
            items: data.items.map((item) => ({
                ...item,
                unitPrice:
                    item.unitPrice instanceof Decimal
                        ? item.unitPrice
                        : new Decimal(item.unitPrice),
                quantity:
                    typeof item.quantity === "number"
                        ? item.quantity
                        : new Decimal(item.quantity),
            })),
        };

        const invoice = await createSalesInvoice(apiInput);

        if (action === "post") {
            // Post the invoice immediately
            await postSalesInvoice(invoice.id);
            notify({
                payload: `Factura de venta ${invoice.documentNumberFull} creada y emitida exitosamente`,
                type: "success",
            });
        } else {
            notify({
                payload: `Factura de venta ${invoice.documentNumberFull} creada como borrador`,
                type: "success",
            });
        }

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
        clientId: 0,
        issueDate: new DateTime(),
        globalDiscountPercent: 0,
        items: [],
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate("../")}
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
                    <InvoiceForm clients={props.clients} items={props.items}>
                        <button
                            type="button"
                            onClick={() => navigate("../")}
                            className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
                        >
                            Cancelar
                        </button>
                        <Submit<InvoiceFormState>
                            onSubmit={(data) => handleSubmit(data, "draft")}
                            onError={handleError}
                            className="px-6 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Guardar Borrador
                        </Submit>
                        <Submit<InvoiceFormState>
                            onSubmit={(data) => handleSubmit(data, "post")}
                            onError={handleError}
                            className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <DocumentCheckIcon className="h-4 w-4 mr-2" />
                            Crear y Emitir
                        </Submit>
                    </InvoiceForm>
                </Form.Root>
            </div>
        </div>
    );
}

// Invoice Form Component
interface InvoiceFormProps {
    clients: ClientListItem[];
    items: ListItemItem[];
    children?: React.ReactNode;
}

function InvoiceForm({ clients, items, children }: InvoiceFormProps) {
    const { setAt } = Form.useForm();

    // Watch invoice items
    const invoiceItemsArray = Form.useArray<CreateSalesInvoiceItemInput[]>("items");

    // Get items and discount from state
    const formState = Form.useSelector(
        (state: InvoiceFormState) => ({
            items: state.items,
            globalDiscountPercent: state.globalDiscountPercent ?? 0,
        })
    );

    // Calculate totals
    const { subtotal, discountAmount, total, itemCount } = useMemo(() => {
        let sub = new Decimal(0);
        for (const item of formState.items || []) {
            if (item.quantity && item.unitPrice) {
                const qty = typeof item.quantity === "number" ? item.quantity : Number(item.quantity);
                const price =
                    item.unitPrice instanceof Decimal
                        ? item.unitPrice
                        : new Decimal(item.unitPrice || 0);
                const itemDiscount = item.discountPercent
                    ? new Decimal(item.discountPercent).div(100)
                    : new Decimal(0);
                const lineTotal = price.mul(qty).mul(new Decimal(1).sub(itemDiscount));
                sub = sub.add(lineTotal);
            }
        }
        const globalDiscount = new Decimal(formState.globalDiscountPercent || 0).div(100);
        const discAmount = sub.mul(globalDiscount);
        const tot = sub.sub(discAmount);
        return {
            subtotal: sub,
            discountAmount: discAmount,
            total: tot,
            itemCount: formState.items?.length || 0,
        };
    }, [formState]);

    const handleAddItem = () => {
        invoiceItemsArray.addItem({
            itemId: 0,
            quantity: 1,
            unitPrice: new Decimal(0),
            discountPercent: 0,
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
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            Nueva Factura de Venta
                        </h2>
                        <p className="text-emerald-100 mt-1">
                            {itemCount} ítems en la factura
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-emerald-100 text-sm">Total estimado</p>
                        <p className="text-3xl font-bold text-white">
                            $
                            {total.toNumber().toLocaleString("es-CO", {
                                minimumFractionDigits: 2,
                            })}
                        </p>
                        {discountAmount.gt(0) && (
                            <p className="text-emerald-200 text-sm">
                                Descuento: -${discountAmount.toNumber().toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Form Fields */}
            <div className="px-8 py-6 space-y-6">
                {/* Client Selection */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
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
                                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                            />
                        </svg>
                        Cliente
                    </h3>
                    <Form.Select.Int
                        path="clientId"
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
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

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
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
                            Fecha de Emisión
                        </h3>
                        <Form.DateTime
                            path="issueDate"
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        />
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
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
                                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Fecha de Vencimiento
                        </h3>
                        <Form.DateTime
                            path="dueDate"
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        />
                    </div>
                </div>

                {/* Global Discount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
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
                                    d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                                />
                            </svg>
                            Descuento Global (%)
                        </h3>
                        <Form.Float
                            path="globalDiscountPercent"
                            min={0}
                            max={100}
                            step={0.01}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        />
                    </div>
                </div>

                {/* Items Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
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
                            Ítems de la Factura
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
                        {invoiceItemsArray.map(
                            (item: CreateSalesInvoiceItemInput, index: number) => (
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
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
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
                                    <div className="w-full md:w-20">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Cant.
                                        </label>
                                        <Form.Int
                                            path="quantity"
                                            min={1}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                                        />
                                    </div>

                                    {/* Unit Price */}
                                    <div className="w-full md:w-28">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Precio Unit.
                                        </label>
                                        <Form.Decimal
                                            path="unitPrice"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                                        />
                                    </div>

                                    {/* Discount */}
                                    <div className="w-full md:w-20">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Dto. %
                                        </label>
                                        <Form.Float
                                            path="discountPercent"
                                            min={0}
                                            max={100}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                                        />
                                    </div>

                                    {/* Subtotal */}
                                    <div className="w-full md:w-28">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Subtotal
                                        </label>
                                        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-white">
                                            $
                                            {(() => {
                                                const qty = Number(item.quantity || 0);
                                                const price = item.unitPrice instanceof Decimal
                                                    ? item.unitPrice.toNumber()
                                                    : Number(item.unitPrice || 0);
                                                const disc = Number(item.discountPercent || 0) / 100;
                                                return (qty * price * (1 - disc)).toLocaleString("es-CO", { minimumFractionDigits: 2 });
                                            })()}
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

                        {(!formState.items || formState.items.length === 0) && (
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
                                    className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                                >
                                    + Agregar primer ítem
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
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
                                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                            />
                        </svg>
                        Notas Internas
                    </h3>
                    <Form.TextArea
                        path="notes"
                        rows={3}
                        placeholder="Notas adicionales sobre esta factura..."
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                    />
                </div>

                {/* Summary */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            ${subtotal.toNumber().toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    {discountAmount.gt(0) && (
                        <div className="flex justify-between text-sm mb-2 text-red-600 dark:text-red-400">
                            <span>Descuento ({formState.globalDiscountPercent}%):</span>
                            <span>-${discountAmount.toNumber().toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                        <span className="text-gray-900 dark:text-white">Total:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                            ${total.toNumber().toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                        </span>
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
