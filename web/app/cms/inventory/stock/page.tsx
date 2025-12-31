import { Fragment, useEffect, useState } from "react";
import {
    listStockValuation,
    type ListStockValuationParams as GetStockParams,
} from "@agape/inventory/stock_report"; // IMPORTANT: This alias needs to work. If not, we might need a relative import or fix vite config.
// Assuming the backend service is exported and accessible. If not, I'll need to use RPC or bridge.
// Since 'listItems' is imported from '@agape/catalogs/item', I assume there is a package mapping.

import { listCategories as findAll } from "@agape/catalogs/category";
import { useSharedState } from "@/components/util/event-emitter";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { Pagination } from "../Pagination";
import { debounce } from "@/utils/debounce";
import Decimal from "@utils/data/Decimal";
import {
    Search,
    Filter,
    Tag,
    Package,
    Layers,
    ChevronDown,
    ChevronRight,
    Calendar,
    AlertCircle,
    Coins
} from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_SIZE = 20;

type CategoryWithSubs = Awaited<ReturnType<typeof findAll>>[number];
type StockItem = Awaited<ReturnType<typeof listStockValuation>>["items"][number];
type LotDetail = StockItem["lots"][number];

interface Props {
    items: StockItem[];
    totalCount: number;
    categories: CategoryWithSubs[];
}

export async function onInit() {
    const [stockResult, categories] = await Promise.all([
        listStockValuation({
            pageIndex: 0,
            pageSize: PAGE_SIZE,
            includeTotalCount: true,
        }),
        findAll(),
    ]);

    return {
        items: stockResult.items,
        totalCount: stockResult.totalCount,
        categories,
    };
}

export default function StockPage(props: Props) {
    const notify = useNotificacion();

    const [{ filters, totalCount, items, fetch }, setState] =
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
            };
        });

    const updateFilter = (newFilters: Partial<GetStockParams>) => {
        setState({
            items,
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

    const debouncedSearch = debounce((value: string) => {
        updateFilter({ search: value });
    }, 300);

    useEffect(() => {
        if (!fetch) {
            return;
        }

        listStockValuation(filters)
            .then((response) => {
                setState({
                    fetch: false,
                    filters: {
                        ...filters,
                        includeTotalCount: false,
                    },
                    items: response.items,
                    totalCount: response.totalCount ?? totalCount,
                });
            })
            .catch((error) => {
                notify({
                    payload: error,
                });
                setState((prev) => ({ ...prev, fetch: false })); // Ensure fetch is reset
            });
    }, [fetch, filters, notify, setState, totalCount]);

    return (
        <div className="min-h-screen bg-transparent font-sans text-gray-900 pb-12">
            {/* Background is handled by layout, but we can add specific touches if needed */}
            <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-blue-50 to-transparent -z-10" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
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
                            Consulta el stock actual y el valor de inventario por capas de costo y lotes.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
                        {/* Search */}
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
                                    placeholder="Buscar ítem..."
                                    className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all"
                                    onChange={(e) => debouncedSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Category Filter */}
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
                                    <span>Todas</span>
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
                                <h3 className="text-lg font-medium text-gray-900">
                                    Sin existencias
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 max-w-sm text-center">
                                    No hay productos con stock disponible que coincidan con los filtros.
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
                                {/* Table Header */}
                                <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <div className="col-span-12 sm:col-span-5 pl-2">Item</div>
                                    <div className="hidden lg:block col-span-2">Categoría</div>
                                    <div className="hidden sm:block sm:col-span-2 text-right">Cantidad Total</div>
                                    <div className="hidden sm:block sm:col-span-3 text-right pr-6">Valor Total</div>
                                </div>

                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <StockRow key={item.itemId} item={item} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                <div className="mt-8 flex justify-center">
                                    <Pagination
                                        totalItems={totalCount}
                                        pageIndex={filters?.pageIndex ?? 0}
                                        onChange={(pageIndex) => {
                                            if (fetch) return;
                                            setState({
                                                items,
                                                totalCount,
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

function StockRow({ item }: { item: StockItem }) {
    const [expanded, setExpanded] = useState(false);
    const hasLots = item.lots && item.lots.length > 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
            {/* Header Row */}
            <div
                className={clsx(
                    "grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 cursor-pointer",
                    expanded ? "bg-gray-50/50" : ""
                )}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="col-span-12 sm:col-span-5 flex items-center gap-4">
                    {/* Icon */}
                    <div className={clsx(
                        "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                        expanded ? "bg-blue-100 text-blue-600" : "bg-blue-50 text-blue-600"
                    )}>
                        <Package size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-gray-900 truncate">
                            {item.itemCode} - {item.itemName}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 sm:hidden">
                            <span className="text-xs text-gray-500">{item.categoryName}</span>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:flex col-span-2 items-center text-sm text-gray-500">
                    <Tag size={14} className="mr-2 opacity-50" />
                    <span className="truncate">{item.categoryName || "Gral."}</span>
                </div>

                <div className="hidden sm:flex sm:col-span-2 items-center justify-end font-semibold text-gray-900">
                    {new Decimal(item.totalQuantity).toNumber().toLocaleString()} Unid.
                </div>

                <div className="hidden sm:flex sm:col-span-3 items-center justify-end font-bold text-gray-900 pr-2 gap-3">
                    <span>${new Decimal(item.totalValue).toNumber().toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    <button
                        className={clsx(
                            "p-1 rounded-full transition-transform duration-200 text-gray-400 hover:text-gray-600",
                            expanded ? "rotate-180 bg-gray-200" : ""
                        )}
                    >
                        <ChevronDown size={16} />
                    </button>
                </div>
            </div>

            {/* Expanded Details (Layers) */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-100 bg-gray-50/30"
                    >
                        <div className="p-4 pl-4 sm:pl-16">
                            {!hasLots ? (
                                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                    <AlertCircle size={16} />
                                    <span>No hay detalle de lotes disponible. El stock podría estar sin asignar.</span>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
                                                <th className="pb-2 font-medium">Lote / Serie</th>
                                                <th className="pb-2 font-medium">Vencimiento</th>
                                                <th className="pb-2 text-right font-medium">Cantidad</th>
                                                <th className="pb-2 text-right font-medium">Costo Unit.</th>
                                                <th className="pb-2 text-right font-medium">Costo Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {item.lots.map((lot) => (
                                                <tr key={lot.lotId} className="hover:bg-gray-50">
                                                    <td className="py-2.5 font-medium text-gray-900">
                                                        {lot.lotNumber}
                                                    </td>
                                                    <td className="py-2.5 text-gray-600">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar size={12} className="opacity-70" />
                                                            {lot.expirationDate ? new Date(lot.expirationDate).toLocaleDateString() : "N/A"}
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 text-right font-medium text-gray-900">
                                                        {new Decimal(lot.quantity).toNumber().toLocaleString()}
                                                    </td>
                                                    <td className="py-2.5 text-right text-gray-600">
                                                        ${new Decimal(lot.unitCost).toNumber().toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-2.5 text-right font-medium text-gray-900">
                                                        ${new Decimal(lot.totalCost).toNumber().toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))}
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
}
