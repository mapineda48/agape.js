import { Fragment, useEffect } from "react";
import { Select, SelectItem } from "@/components/ui/select";
import { listSalesInvoices } from "@agape/finance/sales_invoice";
import { listClients } from "@agape/crm/client";
import type {
    ListSalesInvoicesParams,
    SalesInvoiceListItem,
    ListSalesInvoicesResult,
    SalesInvoiceStatus,
} from "@utils/dto/finance/sales_invoice";
import type { ClientListItem } from "@utils/dto/crm/client";
import { useSharedState } from "@/components/util/event-emitter";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { Pagination } from "../../inventory/Pagination";
import Decimal from "@utils/data/Decimal";
import { StatusBadge } from "@/components/ui/StatusBadge";

const PAGE_SIZE = 15;

interface Props extends ListSalesInvoicesResult {
    clients: ClientListItem[];
}

export async function onInit(): Promise<Props> {
    const [invoicesResult, clientsResult] = await Promise.all([
        listSalesInvoices({
            pageIndex: 0,
            pageSize: PAGE_SIZE,
            includeTotalCount: true,
        }),
        listClients({ pageSize: 100, isActive: true }),
    ]);

    return {
        ...invoicesResult,
        clients: clientsResult.clients,
    };
}

export default function SalesInvoicesPage(props: Props) {
    const notify = useNotificacion();
    const { navigate } = useRouter();

    const [{ filters, totalCount, invoices, fetch }, setState] =
        useSharedState<IState>(() => ({
            filters: {
                pageSize: PAGE_SIZE,
                pageIndex: 0,
                includeTotalCount: true,
            },
            fetch: false,
            invoices: props.invoices,
            totalCount: props.totalCount || 0,
        }));

    const updateFilter = (newFilters: Partial<InternalFilters>) => {
        setState({
            invoices,
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

        // Cast filters: RPC layer handles string to DateTime conversion
        listSalesInvoices(filters as unknown as ListSalesInvoicesParams)
            .then((response) => {
                setState({
                    fetch: false,
                    filters: { ...filters, includeTotalCount: false },
                    invoices: response.invoices,
                    totalCount: response.totalCount ?? totalCount,
                });
            })
            .catch((error) => {
                notify({ payload: error });
            });
    }, [fetch, filters, notify, setState, totalCount]);

    return (
        <Fragment>
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                Facturas de Venta
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Gestiona tus facturas a clientes y cuentas por cobrar
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("./invoice")}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all transform hover:scale-105"
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
                            Nueva Factura
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Client Filter */}
                            <div>
                                <label htmlFor="client-filter" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Cliente
                                </label>
                                <Select
                                    value={filters.clientId ?? undefined}
                                    onChange={(value: number | undefined) =>
                                        updateFilter({
                                            clientId: value || undefined,
                                        })
                                    }
                                    placeholder="Todos los clientes"
                                >
                                    <SelectItem value={undefined as any}>Todos los clientes</SelectItem>
                                    {props.clients.map((client: ClientListItem) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.firstName
                                                ? `${client.firstName} ${client.lastName ?? ""
                                                    }`.trim()
                                                : client.legalName ?? ""}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label htmlFor="status-filter" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Estado
                                </label>
                                <Select
                                    value={filters.status ?? undefined}
                                    onChange={(value) =>
                                        updateFilter({
                                            status: (value || undefined) as SalesInvoiceStatus | undefined,
                                        })
                                    }
                                    placeholder="Todos los estados"
                                >
                                    <SelectItem value={undefined as any}>Todos los estados</SelectItem>
                                    <SelectItem value="draft">Borrador</SelectItem>
                                    <SelectItem value="issued">Emitida</SelectItem>
                                    <SelectItem value="partially_paid">Pago Parcial</SelectItem>
                                    <SelectItem value="paid">Pagada</SelectItem>
                                    <SelectItem value="cancelled">Anulada</SelectItem>
                                </Select>
                            </div>

                            {/* Date From Filter */}
                            <div>
                                <label htmlFor="date-from-filter" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Desde
                                </label>
                                <input
                                    id="date-from-filter"
                                    type="date"
                                    className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition"
                                    value={filters.fromDate ?? ""}
                                    onChange={(e) =>
                                        updateFilter({
                                            fromDate: e.target.value || undefined,
                                        })
                                    }
                                />
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
                                    className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
                                >
                                    Limpiar Filtros
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
                        {invoices.length === 0 ? (
                            <div className="text-center py-20">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                    No se encontraron facturas de venta
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Intenta ajustar los filtros o crea una nueva factura.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                # Factura
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Cliente
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Fecha Emisión
                                            </th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Total
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Pagado
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Saldo
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {invoices.map((invoice: SalesInvoiceListItem) => (
                                            <InvoiceRow
                                                key={invoice.id}
                                                invoice={invoice}
                                                onView={() => navigate(`./invoice/${invoice.id}`)}
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
                                onChange={(pageIndex: number) => {
                                    if (fetch) return;
                                    setState({
                                        invoices,
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
        </Fragment>
    );
}

function InvoiceRow({
    invoice,
    onView,
}: {
    invoice: SalesInvoiceListItem;
    onView: () => void;
}) {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };


    return (
        <tr
            className="hover:bg-emerald-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            onClick={onView}
        >
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center">
                        <svg
                            className="h-5 w-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {invoice.documentNumberFull}
                        </div>
                        {invoice.orderDocumentNumber && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Orden: {invoice.orderDocumentNumber}
                            </div>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.clientName}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-gray-300">
                    {formatDate(invoice.issueDate)}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
                <StatusBadge status={invoice.status} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    ${toNum(invoice.totalAmount).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    ${toNum(invoice.totalPaid).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
                <span className={`text-sm font-black ${toNum(invoice.balance) > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    ${toNum(invoice.balance).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onView();
                    }}
                    className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors"
                >
                    Ver
                </button>
            </td>
        </tr>
    );
}

// Internal filter state that allows string dates from HTML inputs
// The RPC layer handles the conversion
interface InternalFilters extends Omit<ListSalesInvoicesParams, 'fromDate' | 'toDate'> {
    fromDate?: string;
    toDate?: string;
}

interface IState {
    fetch: boolean;
    filters: InternalFilters;
    invoices: SalesInvoiceListItem[];
    totalCount: number;
}

function toNum(val: any): number {
    if (val instanceof Decimal) return val.toNumber();
    return Number(val) || 0;
}
