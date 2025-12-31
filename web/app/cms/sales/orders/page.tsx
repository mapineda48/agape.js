import { Fragment, useEffect } from "react";
import { listSalesOrders } from "@agape/crm/order";
import { ORDER_STATUS_VALUES } from "@utils/dto/crm/order";
import { listClients } from "@agape/crm/client";
import type {
    ListSalesOrdersParams,
    SalesOrderListItem,
    ListSalesOrdersResult,
    OrderStatus,
} from "@utils/dto/crm/order";
import type { ClientListItem } from "@utils/dto/crm/client";
import { useSharedState } from "@/components/util/event-emitter";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { Pagination } from "../../inventory/Pagination";
import Decimal from "@utils/data/Decimal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Select, SelectItem } from "@/components/ui/select";

const PAGE_SIZE = 15;

interface Props extends ListSalesOrdersResult {
    clients: ClientListItem[];
}

export async function onInit(): Promise<Props> {
    const [ordersResult, clientsResult] = await Promise.all([
        listSalesOrders({
            pageIndex: 0,
            pageSize: PAGE_SIZE,
            includeTotalCount: true,
        }),
        listClients({ pageSize: 100 }),
    ]);

    return {
        ...ordersResult,
        clients: clientsResult.clients,
    };
}

export default function SalesOrdersPage(props: Props) {
    const notify = useNotificacion();
    const { navigate } = useRouter();

    const [{ filters, totalCount, orders, fetch }, setState] =
        useSharedState<IState>(() => ({
            filters: {
                pageSize: PAGE_SIZE,
                pageIndex: 0,
                includeTotalCount: true,
            },
            fetch: false,
            orders: props.orders,
            totalCount: props.totalCount || 0,
        }));

    const updateFilter = (newFilters: Partial<ListSalesOrdersParams>) => {
        setState({
            orders,
            totalCount,
            fetch: true,
            filters: {
                ...filters,
                ...newFilters,
                pageIndex: 0,
                includeTotalCount: true,
            },
        });
    };

    useEffect(() => {
        if (!fetch) return;

        listSalesOrders(filters)
            .then((response) => {
                setState({
                    fetch: false,
                    filters: { ...filters, includeTotalCount: false },
                    orders: response.orders,
                    totalCount: response.totalCount ?? totalCount,
                });
            })
            .catch((error) => {
                notify({ payload: error });
            });
    }, [fetch, filters, notify, setState, totalCount]);

    return (
        <Fragment>
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Órdenes de Venta
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Gestiona tus pedidos y ventas a clientes
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("../order")}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-105"
                        >
                            <svg
                                className="-ml-1 mr-2 h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Nueva Orden
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-indigo-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Client Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Cliente
                                </label>
                                <Select
                                    value={filters.clientId}
                                    onChange={(clientId) => updateFilter({ clientId })}
                                    placeholder="Todos los clientes"
                                >
                                    <SelectItem value={undefined}>Todos los clientes</SelectItem>
                                    {props.clients.map((client: ClientListItem) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.firstName
                                                ? `${client.firstName} ${client.lastName ?? ""}`.trim()
                                                : client.legalName ?? ""}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Estado
                                </label>
                                <Select
                                    value={filters.status}
                                    onChange={(status: OrderStatus | undefined) => updateFilter({ status })}
                                    placeholder="Todos los estados"
                                >
                                    <SelectItem value={undefined}>Todos los estados</SelectItem>
                                    {ORDER_STATUS_VALUES.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status === 'pending' ? 'Pendiente' :
                                                status === 'confirmed' ? 'Confirmada' :
                                                    status === 'shipped' ? 'Enviada' :
                                                        status === 'delivered' ? 'Entregada' : 'Cancelada'}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            {/* Reset Filters */}
                            <div className="flex items-end">
                                <button
                                    onClick={() =>
                                        updateFilter({
                                            clientId: undefined,
                                            status: undefined,
                                            fromDate: undefined,
                                            toDate: undefined,
                                        })
                                    }
                                    className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                                >
                                    Limpiar Filtros
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-indigo-50">
                            {orders.length === 0 ? (
                                <div className="text-center py-20">
                                    <svg
                                        className="mx-auto h-12 w-12 text-indigo-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        No se encontraron órdenes de venta
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Intenta ajustar los filtros o crea una nueva orden.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Documento
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Cliente
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Fecha
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Estado
                                                </th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Total
                                                </th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Surtido
                                                </th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Facturado
                                                </th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Acciones
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {orders.map((order: SalesOrderListItem) => (
                                                <OrderRow
                                                    key={order.id}
                                                    order={order}
                                                    onView={() => navigate(`../order/${order.id}`)}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalCount > 0 && (
                            <div className="mt-6">
                                <Pagination
                                    totalItems={totalCount}
                                    pageIndex={filters?.pageIndex ?? 0}
                                    onChange={(pageIndex) => {
                                        if (fetch) return;
                                        setState({
                                            orders,
                                            totalCount,
                                            fetch: true,
                                            filters: { ...filters, pageIndex },
                                        });
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Fragment>
    );
}

function OrderRow({
    order,
    onView,
}: {
    order: SalesOrderListItem;
    onView: () => void;
}) {

    return (
        <tr
            className="hover:bg-indigo-50 cursor-pointer transition-colors"
            onClick={onView}
        >
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center">
                        <span className="text-white font-semibold text-xs text-center px-1">
                            {order.documentNumberFull}
                        </span>
                    </div>
                    <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                            OV-{order.id}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                    {order.clientName}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                    {new Date(order.orderDate).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    })}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={order.status} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
                <span className="text-sm font-semibold text-gray-900">
                    ${toDecimalNum(order.total).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap min-w-[100px]">
                <ProgressBar percent={order.deliveredPercent} color="blue" />
            </td>
            <td className="px-6 py-4 whitespace-nowrap min-w-[100px]">
                <ProgressBar percent={order.invoicedPercent} color="emerald" />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onView();
                    }}
                    className="text-indigo-600 hover:text-indigo-900 font-semibold transition-colors"
                >
                    Ver
                </button>
            </td>
        </tr>
    );
}


interface IState {
    fetch: boolean;
    filters: ListSalesOrdersParams;
    orders: SalesOrderListItem[];
    totalCount: number;
}

function toDecimalNum(val: any): number {
    if (val instanceof Decimal) return val.toNumber();
    return Number(val) || 0;
}

function ProgressBar({ percent, color }: { percent: number; color: 'blue' | 'emerald' }) {
    const safePercent = Math.min(Math.max(percent, 0), 100);
    const colorClasses = {
        blue: 'bg-blue-600',
        emerald: 'bg-emerald-600'
    };
    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter leading-none">{safePercent.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1">
                <div className={`h-1 rounded-full ${colorClasses[color]} transition-all duration-500`} style={{ width: `${safePercent}%` }}></div>
            </div>
        </div>
    );
}
