import { Fragment, useEffect, useState } from "react";
import {
  listItems,
  type ListItemsParams as GetItemsParams,
  type ListItemItem as GetItem,
  type ListItemsResult as GetItemsResult,
} from "@agape/catalogs/item";

import { listCategories as findAll } from "@agape/catalogs/category";
import { useSharedState } from "@/components/util/event-emitter";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { debounce } from "@/utils/debounce";
import { Pagination } from "../Pagination";
import Decimal from "@utils/data/Decimal";
import {
  Search,
  Plus,
  Filter,
  Tag,
  Package,
  Layers,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Box,
  Wrench,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";

const PAGE_SIZE = 12;

type CategoryWithSubs = Awaited<ReturnType<typeof findAll>>[number];

interface Props extends GetItemsResult {
  categories: CategoryWithSubs[];
}

export async function onInit() {
  const [itemsResult, categories] = await Promise.all([
    listItems({
      pageIndex: 0,
      pageSize: PAGE_SIZE,
      includeTotalCount: true,
    }),
    findAll(),
  ]);

  return {
    ...itemsResult,
    categories,
  };
}

export default function CatalogPage(props: Props) {
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

  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({
    min: "",
    max: "",
  });

  const updateFilter = (newFilters: Partial<GetItemsParams>) => {
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
    updateFilter({ fullName: value });
  }, 300);

  const debouncedPriceSearch = debounce((min: string, max: string) => {
    updateFilter({
      minPrice: min ? new Decimal(min) : undefined,
      maxPrice: max ? new Decimal(max) : undefined,
    });
  }, 500);

  useEffect(() => {
    if (!fetch) {
      return;
    }

    listItems(filters)
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
                <Box size={20} />
              </span>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Catálogo de Productos
              </h1>
            </div>
            <p className="text-gray-500 ml-9 text-sm">
              Administra tu inventario de productos y servicios de forma eficiente.
            </p>
          </div>
          <button
            onClick={() => navigate("../product")}
            className="group inline-flex items-center px-5 py-2.5 bg-indigo-600 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
            Nuevo Item
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
                  placeholder="Buscar ítem..."
                  className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all"
                  onChange={(e) => debouncedSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Filter size={14} /> Tipo
              </h3>
              <div className="space-y-2">
                <TypeFilterButton
                  label="Todos"
                  icon={<Layers size={16} />}
                  isActive={filters.type === undefined}
                  onClick={() => updateFilter({ type: undefined })}
                />
                <TypeFilterButton
                  label="Productos"
                  icon={<Package size={16} />}
                  isActive={filters.type === "good"}
                  onClick={() => updateFilter({ type: "good" })}
                  color="indigo"
                />
                <TypeFilterButton
                  label="Servicios"
                  icon={<Wrench size={16} />}
                  isActive={filters.type === "service"}
                  onClick={() => updateFilter({ type: "service" })}
                  color="purple"
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
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={() => updateFilter({ categoryId: undefined })}
                >
                  <span>Todas</span>
                  {filters.categoryId === undefined && (
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
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
                          ? "bg-indigo-50 text-indigo-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                      onClick={() => updateFilter({ categoryId: cat.id })}
                    >
                      <span className="truncate">{cat.fullName}</span>
                      {filters.categoryId === cat.id && (
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle2 size={14} /> Estado
              </h3>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer transition-colors"
                    checked={filters.isEnabled === true}
                    onChange={(e) =>
                      updateFilter({
                        isEnabled: e.target.checked ? true : undefined,
                      })
                    }
                  />
                  <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                    Activo
                  </span>
                </label>
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer transition-colors"
                    checked={filters.isEnabled === false}
                    onChange={(e) =>
                      updateFilter({
                        isEnabled: e.target.checked ? false : undefined,
                      })
                    }
                  />
                  <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                    Inactivo
                  </span>
                </label>
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
                  No se encontraron items
                </h3>
                <p className="mt-1 text-sm text-gray-500 max-w-sm text-center">
                  Intenta ajustar los filtros de búsqueda o crea un nuevo ítem.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => updateFilter({ fullName: undefined, type: undefined, categoryId: undefined, isEnabled: undefined })}
                    className="text-sm text-indigo-600 font-medium hover:text-indigo-800"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Table Header */}
                <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-12 sm:col-span-6 lg:col-span-5 pl-2">Item</div>
                  <div className="hidden lg:block col-span-3">Categoría</div>
                  <div className="hidden sm:block sm:col-span-3 lg:col-span-2 text-right">Precio</div>
                  <div className="hidden sm:block sm:col-span-3 lg:col-span-2 text-center">Estado</div>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onEdit={() => navigate(`../product/${item.id}`)}
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

function TypeFilterButton(props: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  color?: "indigo" | "purple";
}) {
  const activeClass =
    props.color === "purple"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : props.color === "indigo"
        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
        : "bg-gray-100 text-gray-900 border-gray-200";

  return (
    <button
      type="button"
      className={clsx(
        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border",
        props.isActive
          ? activeClass
          : "text-gray-500 bg-white border-transparent hover:bg-gray-50 hover:text-gray-900"
      )}
      onClick={props.onClick}
    >
      <span className={clsx("opacity-75", props.isActive ? "opacity-100" : "")}>
        {props.icon}
      </span>
      <span>{props.label}</span>
      {props.isActive && (
        <span
          className={clsx(
            "ml-auto w-1.5 h-1.5 rounded-full",
            props.color === "purple" ? "bg-purple-500" : props.color === "indigo" ? "bg-indigo-500" : "bg-gray-500"
          )}
        />
      )}
    </button>
  );
}

function ItemRow({ item, onEdit }: { item: GetItem; onEdit: () => void }) {
  const isService = item.type === "service";

  return (
    <div
      className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 p-4 cursor-pointer relative overflow-hidden"
      onClick={onEdit}
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Name & Type */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-5 flex items-center gap-4">
          <div
            className={clsx(
              "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
              isService ? "bg-purple-50 text-purple-600" : "bg-indigo-50 text-indigo-600"
            )}
          >
            {isService ? <Wrench size={20} /> : <Package size={20} />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
              {item.fullName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">
                {isService ? "Servicio" : "Producto"}
              </span>
              {/* Mobile Status - Visible only on small screens */}
              <span className={clsx(
                "sm:hidden text-[10px] px-1.5 py-0.5 rounded-full font-medium border",
                item.isEnabled
                  ? "bg-green-50 text-green-700 border-green-100"
                  : "bg-gray-50 text-gray-600 border-gray-100"
              )}>
                {item.isEnabled ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="hidden lg:flex col-span-3 items-center text-sm text-gray-500">
          <Tag size={14} className="mr-2 opacity-50" />
          <span className="truncate">{item.category || "Sin categoría"}</span>
        </div>

        {/* Price */}
        <div className="hidden sm:flex sm:col-span-3 lg:col-span-2 items-center justify-end font-medium text-gray-900">
          ${new Decimal(item.basePrice).toNumber().toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>

        {/* Status */}
        <div className="hidden sm:flex sm:col-span-3 lg:col-span-2 items-center justify-center">
          <span className={clsx(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
            item.isEnabled
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-gray-50 text-gray-600 border-gray-100"
          )}>
            {item.isEnabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {item.isEnabled ? "Activo" : "Inactivo"}
          </span>
        </div>

        {/* Action Icon (Hover only) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block">
          <ChevronRight size={20} className="text-gray-400" />
        </div>
      </div>
    </div>
  );
}

interface IState {
  fetch: boolean;
  filters: GetItemsParams;
  items: GetItem[];
  totalCount: number;
}
