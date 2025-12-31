import { Fragment, useEffect } from "react";
import { listPayments } from "@agape/finance/payment";
import type {
    ListPaymentsParams,
    PaymentListItem,
    ListPaymentsResult,
} from "@utils/dto/finance/payment";
import { useSharedState } from "@/components/util/event-emitter";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { Pagination } from "../../inventory/Pagination";
import Decimal from "@utils/data/Decimal";

const PAGE_SIZE = 15;

interface Props extends ListPaymentsResult { }

export async function onInit(): Promise<Props> {
    const result = await listPayments({
        pageIndex: 0,
        pageSize: PAGE_SIZE,
        includeTotalCount: true,
    });

    return result;
}

export default function PaymentsPage(props: Props) {
    const notify = useNotificacion();
    const { navigate } = useRouter();

    const [{ filters, totalCount, payments, fetch }, setState] =
        useSharedState<IState>(() => ({
            filters: {
                pageSize: PAGE_SIZE,
                pageIndex: 0,
                includeTotalCount: true,
            },
            fetch: false,
            payments: props.payments,
            totalCount: props.totalCount || 0,
        }));

    const updateFilter = (newFilters: Partial<ListPaymentsParams>) => {
        setState({
            payments,
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

        listPayments(filters)
            .then((response: ListPaymentsResult) => {
                setState({
                    fetch: false,
                    filters: { ...filters, includeTotalCount: false },
                    payments: response.payments,
                    totalCount: response.totalCount ?? totalCount,
                });
            })
            .catch((error: any) => {
                notify({
                    payload: error instanceof Error ? error.message : String(error),
                    type: "error"
                });
            });
    }, [fetch, filters, notify, setState, totalCount]);

    return (
        <Fragment>
            <div className="min-h-screen bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Pagos y Recaudos
                            </h1>
                            <p className="text-gray-500 mt-1">
                                Gestión de cobros a clientes y pagos a proveedores
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("./new")}
                            className="inline-flex items-center px-6 py-3 text-sm font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100"
                        >
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Nuevo Recaudo
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 mb-8 flex flex-wrap gap-4 items-end">
                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Pago</label>
                            <select
                                value={filters.type || ''}
                                onChange={(e) => updateFilter({ type: (e.target.value as any) || undefined })}
                                className="w-full bg-white border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 shadow-sm focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                            >
                                <option value="">Todos los tipos</option>
                                <option value="receipt">Recaudos (Clientes)</option>
                                <option value="disbursement">Egresos (Proveedores)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado</label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) => updateFilter({ status: (e.target.value as any) || undefined })}
                                className="w-full bg-white border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 shadow-sm focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                            >
                                <option value="">Todos los estados</option>
                                <option value="draft">Borrador (Registrado)</option>
                                <option value="posted">Contabilizado (Aplicado)</option>
                            </select>
                        </div>

                        <button
                            onClick={() => updateFilter({ type: undefined, status: undefined, userId: undefined })}
                            className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-indigo-600 hover:bg-white rounded-2xl transition-all"
                        >
                            Limpiar
                        </button>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {payments.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-gray-500">No se encontraron pagos registrados.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Documento</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario/Empresa</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Pendiente</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-bold text-indigo-600">
                                                        {payment.documentNumberFull}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${payment.paymentType === 'receipt' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {payment.paymentType === 'receipt' ? 'Recaudo' : 'Egreso'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {payment.userName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                                    ${toNum(payment.amount).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                                    ${toNum(payment.unallocatedAmount).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
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
                                onChange={(pageIndex) => updateFilter({ pageIndex })}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Fragment>
    );
}

function toNum(val: any): number {
    if (val instanceof Decimal) return val.toNumber();
    return Number(val) || 0;
}

interface IState {
    fetch: boolean;
    filters: ListPaymentsParams;
    payments: PaymentListItem[];
    totalCount: number;
}
