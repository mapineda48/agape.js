import { useState } from "react";
import Form from "@/components/form";
import { Submit } from "@/components/form/Submit";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { listClients } from "@agape/crm/client";
import { listItems } from "@agape/catalogs/item";
import { createSalesOrder, listSalesOrderTypes } from "@agape/crm/order";
import type { CreateSalesOrderInput, SalesOrderType } from "@utils/dto/crm/order";
import type { ClientListItem } from "@utils/dto/crm/client";
import type { ListItemItem } from "@utils/dto/catalogs/item";
import { SalesOrderForm } from "./components";
import DateTime from "@utils/data/DateTime";
import Decimal from "@utils/data/Decimal";

interface Props {
    clients: ClientListItem[];
    orderTypes: SalesOrderType[];
    items: ListItemItem[];
}

export async function onInit(): Promise<Props> {
    const [clientsResult, itemsResult, orderTypes] = await Promise.all([
        listClients({ isActive: true, pageSize: 500 }),
        listItems({ isEnabled: true, pageSize: 500 }),
        listSalesOrderTypes(),
    ]);

    return {
        clients: clientsResult.clients,
        orderTypes,
        items: itemsResult.items,
    };
}

export default function NewSalesOrderPage(props: Props) {
    const { navigate } = useRouter();
    const notify = useNotificacion();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: CreateSalesOrderInput) => {
        // Validate
        if (!data.clientId || data.clientId === 0) {
            throw new Error("Debe seleccionar un cliente");
        }

        if (!data.orderTypeId || data.orderTypeId === 0) {
            throw new Error("Debe seleccionar un tipo de pedido");
        }

        if (!data.items || data.items.length === 0) {
            throw new Error("Debe agregar al menos un producto al pedido");
        }

        const toNum = (val: any): number => {
            if (val instanceof Decimal) return val.toNumber();
            if (typeof val === 'string') return parseFloat(val) || 0;
            return Number(val) || 0;
        };

        // Validate each item
        for (const item of data.items) {
            if (!item.itemId || item.itemId === 0) {
                throw new Error("Todos los ítems deben tener un producto seleccionado");
            }
            if (!item.quantity || toNum(item.quantity) <= 0) {
                throw new Error("Todas las cantidades deben ser mayores a cero");
            }
            if (!item.unitPrice || toNum(item.unitPrice) < 0) {
                throw new Error("Los precios no pueden ser negativos");
            }
        }

        const order = await createSalesOrder({
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
            payload: `Pedido de venta creado exitosamente`,
            type: "success",
        });

        navigate(`../order/${order.id}`);

        return order;
    };

    const handleError = (error: unknown) => {
        notify({
            payload:
                error instanceof Error ? error.message : "Error al crear el pedido",
            type: "error",
        });
    };

    const initialState: Partial<CreateSalesOrderInput> = {
        clientId: 0,
        orderTypeId: props.orderTypes[0]?.id || 0,
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate("../orders")}
                    className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-indigo-600 mb-8 group transition-all"
                >
                    <svg
                        className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform stroke-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    VOLVER AL LISTADO
                </button>

                <Form.Root<CreateSalesOrderInput>
                    state={initialState as CreateSalesOrderInput}
                >
                    <SalesOrderForm clients={props.clients} orderTypes={props.orderTypes} items={itemsForForm}>
                        <button
                            type="button"
                            onClick={() => navigate("../orders")}
                            className="px-8 py-3 text-sm font-bold text-gray-400 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 hover:text-gray-600 active:scale-95 transition-all shadow-sm"
                        >
                            Cancelar
                        </button>
                        <Submit<CreateSalesOrderInput>
                            onSubmit={handleSubmit}
                            onError={handleError}
                            onLoadingChange={setIsSubmitting}
                            className="px-10 py-3 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "GUARDANDO..." : "CREAR PEDIDO"}
                        </Submit>
                    </SalesOrderForm>
                </Form.Root>
            </div>
        </div>
    );
}
