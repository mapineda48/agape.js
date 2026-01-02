import { Fragment, useEffect } from "react";
import {
  listInventoryMovements,
  type ListInventoryMovementsParams,
} from "@agape/inventory/movement";
import { listMovementTypes } from "@agape/inventory/movementType";
import { useSharedState } from "@/components/util/event-emitter";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { debounce } from "@/utils/debounce";
import { Pagination } from "../Pagination";
import { DatePicker } from "@/components/ui/datepicker";
import DateTime from "@utils/data/DateTime";
import {
  Search,
  Plus,
  Filter,
  Calendar,
  Package,
  ArrowRight,
  ClipboardList,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { clsx } from "clsx";

const PAGE_SIZE = 12;

type InventoryMovement = Awaited<
  ReturnType<typeof listInventoryMovements>
>["movements"][number];
type MovementType = Awaited<ReturnType<typeof listMovementTypes>>[number];

interface Props {
  items: InventoryMovement[];
  totalCount: number;
  types: MovementType[];
}

export async function onInit() {
  const [movementsResult, types] = await Promise.all([
    listInventoryMovements({
      pageIndex: 0,
      pageSize: PAGE_SIZE,
      includeTotalCount: true,
    }),
    listMovementTypes(false),
  ]);

  return {
    items: movementsResult.movements,
    totalCount: movementsResult.totalCount ?? 0,
    types,
  };
}

export default function MovementsPage(props: Props) {
  const notify = useNotificacion();
  const { navigate } = useRouter();

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

  const updateFilter = (newFilters: Partial<ListInventoryMovementsParams>) => {
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
    updateFilter({ documentNumber: value });
  }, 300);

  useEffect(() => {
    if (!fetch) {
      return;
    }

    listInventoryMovements(filters)
      .then((response) => {
        setState({
          fetch: false,
          filters: {
            ...filters,
            includeTotalCount: false,
          },
          items: response.movements,
          totalCount: response.totalCount ?? totalCount,
        });
      })
      .catch((error) => {
        notify({
          payload: error,
        });
        setState({
          fetch: false,
          filters,
          items,
          totalCount,
        });
      });
  }, [fetch, filters, notify, setState, totalCount]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-12">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-indigo-50 to-transparent -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                <ClipboardList size={20} />
              </span>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Movimientos de Inventario
              </h1>
            </div>
            <p className="text-gray-500 ml-9 text-sm">
              Gestiona, audita y rastrea todos los movimientos de stock en tiempo real.
            </p>
          </div>
          <button
            onClick={() => navigate("./new")}
            className="group inline-flex items-center px-5 py-2.5 bg-indigo-600 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
            Nuevo Movimiento
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
            {/* Search Card */}
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
                  placeholder="Buscar por documento..."
                  className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all"
                  onChange={(e) => debouncedSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Type Filter Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 overflow-hidden">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Filter size={14} /> Filtros Rápidos
              </h3>
              <div className="space-y-1">
                <button
                  className={clsx(
                    "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex justify-between items-center group",
                    filters.movementTypeId === undefined
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={() => updateFilter({ movementTypeId: undefined })}
                >
                  <span>Todos los tipos</span>
                  {filters.movementTypeId === undefined && (
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  )}
                </button>
                <div className="h-px bg-gray-100 my-2" />
                <div className="max-h-[300px] overflow-y-auto space-y-1 custom-scrollbar pr-1">
                  {props.types.map((type) => (
                    <button
                      key={type.id}
                      className={clsx(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex justify-between items-center group",
                        filters.movementTypeId === type.id
                          ? "bg-indigo-50 text-indigo-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                      onClick={() => updateFilter({ movementTypeId: type.id })}
                    >
                      <span className="truncate">{type.name}</span>
                      {filters.movementTypeId === type.id && (
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date Filter (Simplified UI) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar size={14} /> Periodo
              </h3>
              <div className="space-y-3">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Desde</label>
                    <DatePicker
                      placeholder="Fecha inicio"
                      value={filters.fromDate ? (filters.fromDate instanceof DateTime ? filters.fromDate : new Date(filters.fromDate as any)) : undefined}
                      onChange={(date) => updateFilter({ fromDate: date ? new DateTime(date) : undefined })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Hasta</label>
                    <DatePicker
                      placeholder="Fecha fin"
                      value={filters.toDate ? (filters.toDate instanceof DateTime ? filters.toDate : new Date(filters.toDate as any)) : undefined}
                      onChange={(date) => updateFilter({ toDate: date ? new DateTime(date) : undefined })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main List */}
          <div className="flex-1 min-w-0">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-300">
                <div className="p-4 bg-indigo-50 rounded-full mb-4">
                  <Package className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  No se encontraron movimientos
                </h3>
                <p className="mt-1 text-sm text-gray-500 max-w-sm text-center">
                  Intenta ajustar los filtros de búsqueda o crea un nuevo movimiento para comenzar el registro.
                </p>
                <button
                  onClick={() => updateFilter({ documentNumber: undefined, movementTypeId: undefined })}
                  className="mt-6 text-sm text-indigo-600 font-medium hover:text-indigo-800"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {items.map((item) => (
                    <MovementCard
                      key={item.id}
                      item={item}
                      onEdit={() => navigate(`./${item.id}`)}
                    />
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

function MovementCard({
  item,
  onEdit,
}: {
  item: InventoryMovement;
  onEdit: () => void;
}) {
  return (
    <div
      className="group bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 border border-gray-100/50 hover:border-indigo-100 p-5 cursor-pointer relative overflow-hidden"
      onClick={onEdit}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-50 to-transparent -translate-y-16 translate-x-16 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
              <FileText size={20} />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {item.documentNumberFull}
              </h4>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-medium">{item.movementTypeName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={item.status} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-gray-400" />
              <span>{new Date(item.movementDate as any).toLocaleDateString()}</span>
            </div>
            {item.observation && (
              <div className="flex items-center gap-1.5 max-w-[200px] sm:max-w-md">
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="truncate italic">{item.observation}</span>
              </div>
            )}
          </div>

          <div className="flex items-center text-indigo-600 text-sm font-medium opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
            Ver detalles <ArrowRight size={16} className="ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface IState {
  fetch: boolean;
  filters: ListInventoryMovementsParams;
  items: InventoryMovement[];
  totalCount: number;
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { className: string; icon: any; label: string }> = {
    draft: {
      className: "bg-amber-50 text-amber-700 border-amber-100",
      icon: Clock,
      label: "Borrador",
    },
    posted: {
      className: "bg-emerald-50 text-emerald-700 border-emerald-100",
      icon: CheckCircle2,
      label: "Contabilizado",
    },
    cancelled: {
      className: "bg-red-50 text-red-700 border-red-100",
      icon: XCircle,
      label: "Cancelado",
    },
  };

  const config = configs[status] || {
    className: "bg-gray-50 text-gray-700 border-gray-100",
    icon: AlertCircle,
    label: status,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
}


