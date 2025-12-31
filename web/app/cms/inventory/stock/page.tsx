import { Fragment, useEffect, useState } from "react";
import {
    listStockValuation,
    getStockMetrics,
    type ListStockValuationParams as GetStockParams,
    type StockValuationItem,
} from "@agape/inventory/stock_report";

import { listCategories as findAll } from "@agape/catalogs/category";
import { useSharedState } from "@/components/util/event-emitter";
import { useNotificacion } from "@/components/ui/notification";
import { Pagination } from "../Pagination";
import { debounce } from "@/utils/debounce";
import Decimal from "@utils/data/Decimal";
import {
    Search,
    Tag,
    Package,
    Layers,
    ChevronDown,
    Calendar,
    AlertCircle,
    Coins,
    History,
    FileText,
    TrendingUp,
    ShieldAlert,
    Clock
} from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_SIZE = 20;

type CategoryWithSubs = Awaited<ReturnType<typeof findAll>>[number];
type StockItem = StockValuationItem;
type LayerDetail = StockItem["layers"][number];
type Metrics = Awaited<ReturnType<typeof getStockMetrics>>;

interface Props {
    items: StockItem[];
    totalCount: number;
    categories: CategoryWithSubs[];
    metrics: Metrics;
}

export async function onInit() {
    const [stockResult, categories, metrics] = await Promise.all([
        listStockValuation({
            pageIndex: 0,
            pageSize: PAGE_SIZE,
            includeTotalCount: true,
        }),
        findAll(),
        getStockMetrics(),
    ]);

    return {
        items: stockResult.items,
        totalCount: stockResult.totalCount,
        categories,
        metrics,
    };
}

export default function StockPage(props: Props) {
    const notify = useNotificacion();

    const [{ filters, totalCount, items, fetch, metrics }, setState] =
        useSharedState<IState>(() => {
            return {
                filters: {
                    pageSize: PAGE_SIZE,
                    pageIndex: 0,
                    includeTotalCount: true,
                },
                fetch: false,
                items: props.items,
                totalCount: props.totalCount || 0,
                metrics: props.metrics,
            };
        });

    const updateFilter = (newFilters: Partial<GetStockParams>) => {
        setState({
            items,
            totalCount,
            metrics,
            fetch: true,
            filters: {
                ...filters,
                ...newFilters,
                pageIndex: 0,
                includeTotalCount: true,
            },
        });
    };

    const debouncedSearch = debounce((value: string) => {
        updateFilter({ search: value });
    }, 300);

    useEffect(() => {
        if (!fetch) {
            return;
        }

        Promise.all([
            listStockValuation(filters),
            getStockMetrics(),
        ])
            .then(([response, newMetrics]) => {
                setState({
                    fetch: false,
                    filters: {
                        ...filters,
                        includeTotalCount: false,
                    },
                    items: response.items,
                    totalCount: response.totalCount ?? totalCount,
                    metrics: newMetrics,
                });
            })
            .catch((error) => {
                notify({
                    payload: error,
                });
                setState((prev) => ({ ...prev, fetch: false }));
            });
    }, [fetch, filters, notify, setState, totalCount]);

    return (
        <div className="min-h-screen bg-transparent font-sans text-gray-900 pb-12">
            <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-blue-50 to-transparent -z-10" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                                <Layers size={20} />
                            </span>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                Existencias Valorizadas
                            </h1>
                        </div>
                        <p className="text-gray-500 ml-9 text-sm">
                            Consulta el stock real y el valor de inventario mediante capas de costo FIFO.
                        </p>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <MetricCard
                        title="Valor Total"
                        value={`$${metrics.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                        icon={<Coins className="text-blue-600" size={20} />}
                        trend="Costo Real FIFO"
                        color="blue"
                    />
                    <MetricCard
                        title="Capas Activas"
                        value={metrics.totalItems.toLocaleString()}
                        icon={<Layers className="text-indigo-600" size={20} />}
                        trend="Total Ítems"
                        color="indigo"
                    />
                    <MetricCard
                        title="En Cuarentena"
                        value={`$${metrics.quarantineValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                        icon={<ShieldAlert className="text-amber-600" size={20} />}
                        trend="Valor Bloqueado"
                        color="amber"
                    />
                    <MetricCard
                        title="Vencidos"
                        value={metrics.expiredQty.toLocaleString()}
                        icon={<Clock className="text-rose-600" size={20} />}
                        trend="Unidades Críticas"
                        color="rose"
                    />
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Search size={14} /> Búsqueda
                            </h3>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o código..."
                                    className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all"
                                    onChange={(e) => debouncedSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Tag size={14} /> Categoría
                            </h3>
                            <div className="space-y-1">
                                <button
                                    className={clsx(
                                        "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex justify-between items-center group",
                                        filters.categoryId === undefined
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                    onClick={() => updateFilter({ categoryId: undefined })}
                                >
                                    <span>Todas las categorías</span>
                                    {filters.categoryId === undefined && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    )}
                                </button>
                                <div className="h-px bg-gray-100 my-2" />
                                <div className="max-h-[300px] overflow-y-auto space-y-1 custom-scrollbar pr-1">
                                    {props.categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            className={clsx(
                                                "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex justify-between items-center group",
                                                filters.categoryId === cat.id
                                                    ? "bg-blue-50 text-blue-700 font-medium"
                                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                            )}
                                            onClick={() => updateFilter({ categoryId: cat.id })}
                                        >
                                            <span className="truncate">{cat.fullName}</span>
                                            {filters.categoryId === cat.id && (
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 ml-2" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main List */}
                    <div className="flex-1 min-w-0">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-300">
                                <div className="p-4 bg-blue-50 rounded-full mb-4">
                                    <Layers className="h-8 w-8 text-blue-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Sin resultados</h3>
                                <p className="mt-1 text-sm text-gray-500 max-w-sm text-center">
                                    No se encontraron productos con existencias para los criterios seleccionados.
                                </p>
                                <div className="mt-6">
                                    <button
                                        onClick={() => updateFilter({ search: undefined, categoryId: undefined })}
                                        className="text-sm text-blue-600 font-medium hover:text-blue-800"
                                    >
                                        Limpiar filtros
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    <div className="col-span-12 sm:col-span-5 pl-2">Ítem / Código</div>
                                    <div className="hidden lg:block col-span-2">Categoría</div>
                                    <div className="hidden sm:block sm:col-span-2 text-right">Existencia</div>
                                    <div className="hidden sm:block sm:col-span-3 text-right pr-6">Valor Contable</div>
                                </div>

                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <StockRow key={item.itemId} item={item} />
                                    ))}
                                </div>

                                <div className="mt-8 flex justify-center">
                                    <Pagination
                                        totalItems={totalCount}
                                        pageIndex={filters?.pageIndex ?? 0}
                                        onChange={(pageIndex) => {
                                            if (fetch) return;
                                            setState({
                                                items,
                                                totalCount,
                                                metrics,
                                                fetch: true,
                                                filters: {
                                                    ...filters,
                                                    pageIndex: pageIndex,
                                                },
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, trend, color }: { title: string, value: string, icon: React.ReactNode, trend: string, color: 'blue' | 'indigo' | 'amber' | 'rose' }) {
    const bgColors = {
        blue: 'bg-blue-50',
        indigo: 'bg-indigo-50',
        amber: 'bg-amber-50',
        rose: 'bg-rose-50'
    };

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={clsx("p-3 rounded-xl", bgColors[color])}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-gray-900">{value}</span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">{trend}</p>
            </div>
        </div>
    );
}

function StockRow({ item }: { item: StockItem }) {
    const [expanded, setExpanded] = useState(false);
    const hasLayers = item.layers && item.layers.length > 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
            {/* Header Row */}
            <div
                className={clsx(
                    "grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 cursor-pointer hover:bg-gray-50/50 transition-colors",
                    expanded ? "bg-blue-50/20" : ""
                )}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="col-span-12 sm:col-span-5 flex items-center gap-4">
                    <div className={clsx(
                        "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                        expanded ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                    )}>
                        <Package size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-gray-900 truncate">
                            {item.itemName}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-mono font-bold">
                                {item.itemCode}
                            </span>
                            <span className="text-[10px] text-gray-400 lg:hidden">
                                {item.categoryName}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:flex col-span-2 items-center text-xs text-gray-500">
                    <span className="truncate">{item.categoryName || "Sin Categoría"}</span>
                </div>

                <div className="hidden sm:flex sm:col-span-2 items-center justify-end font-semibold text-gray-900 text-sm">
                    {item.totalQuantity.toLocaleString()} Unid.
                </div>

                <div className="hidden sm:flex sm:col-span-3 items-center justify-end font-bold text-gray-900 pr-2 gap-3 text-sm">
                    <span>${item.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    <button
                        className={clsx(
                            "p-1 rounded-lg transition-all duration-200",
                            expanded ? "rotate-180 bg-blue-100 text-blue-600" : "text-gray-300"
                        )}
                    >
                        <ChevronDown size={16} />
                    </button>
                </div>
            </div>

            {/* Expanded Details (Real Cost Layers) */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-50 bg-gray-50/30"
                    >
                        <div className="p-4 pl-4 sm:pl-16">
                            {!hasLayers ? (
                                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100/50">
                                    <AlertCircle size={14} />
                                    <span>No se detectaron capas de costo activas para este ítem.</span>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[11px] text-left">
                                        <thead>
                                            <tr className="text-gray-400 uppercase font-bold border-b border-gray-100">
                                                <th className="pb-2 font-bold px-2">Lote / Origen</th>
                                                <th className="pb-2 font-bold px-2">Antigüedad</th>
                                                <th className="pb-2 font-bold px-2">Vencimiento</th>
                                                <th className="pb-2 font-bold px-2">Estado</th>
                                                <th className="pb-2 text-right font-bold px-2">Cantidad</th>
                                                <th className="pb-2 text-right font-bold px-4">Costo Unit.</th>
                                                <th className="pb-2 text-right font-bold px-2">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {item.layers.map((layer) => {
                                                const ageDays = Math.floor((new Date().getTime() - new Date(layer.createdAt).getTime()) / (1000 * 3600 * 24));
                                                return (
                                                    <tr key={layer.layerId} className="hover:bg-gray-100/50 transition-colors">
                                                        <td className="py-2.5 px-2">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-900">{layer.lotNumber || "N/A"}</span>
                                                                {layer.sourceDocumentNumber && (
                                                                    <span className="text-[10px] text-blue-500 font-medium flex items-center gap-1">
                                                                        <FileText size={10} /> {layer.sourceDocumentNumber}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 px-2 text-gray-500">
                                                            <div className="flex items-center gap-1" title={new Date(layer.createdAt).toLocaleDateString()}>
                                                                <History size={10} className="opacity-70" />
                                                                {ageDays === 0 ? "Hoy" : `hace ${ageDays} días`}
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 px-2">
                                                            {layer.expirationDate ? (
                                                                <div className={clsx(
                                                                    "flex items-center gap-1 font-medium",
                                                                    new Date(layer.expirationDate).getTime() < new Date().getTime() ? "text-rose-600" : "text-gray-600"
                                                                )}>
                                                                    <Calendar size={10} className="opacity-70" />
                                                                    {new Date(layer.expirationDate).toLocaleDateString()}
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-2.5 px-2">
                                                            {layer.lotStatus ? (
                                                                <span className={clsx(
                                                                    "px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase",
                                                                    layer.lotStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                                        layer.lotStatus === 'QUARANTINE' ? 'bg-amber-100 text-amber-700' :
                                                                            'bg-gray-100 text-gray-700'
                                                                )}>
                                                                    {layer.lotStatus}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-300">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-2.5 px-2 text-right font-bold text-gray-900">
                                                            {layer.quantity.toLocaleString()}
                                                        </td>
                                                        <td className="py-2.5 px-4 text-right text-gray-500">
                                                            ${layer.unitCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="py-2.5 px-2 text-right font-bold text-blue-600">
                                                            ${layer.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface IState {
    fetch: boolean;
    filters: GetStockParams;
    items: StockItem[];
    totalCount: number;
    metrics: Metrics;
}
