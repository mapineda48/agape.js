import { Fragment, useEffect, useState } from "react";
import {
  listItems,
  type ListItemsParams as GetItemsParams,
  type ListItemItem as GetItem,
  type ListItemsResult as GetItemsResult,
} from "@agape/catalogs/item";

import { listCategories as findAll } from "@agape/inventory/category";
import { useSharedState } from "@/components/util/event-emitter";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { debounce } from "@/utils/debounce";
import { Pagination } from "../Pagination";
import Decimal from "@utils/data/Decimal";
import Image from "@/components/util/image";

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
    <Fragment>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Catalogo
              </h1>
              <p className="text-gray-500 mt-1">
                Gestiona tus productos y servicios.
              </p>
            </div>
            <button
              onClick={() => navigate("../product")}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
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
              Nuevo Item
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-72 flex-shrink-0 space-y-8">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar en catalogo..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition shadow-sm"
                  onChange={(e) => debouncedSearch(e.target.value)}
                />
              </div>

              {/* Item Type Filter */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                  Tipo
                </h3>
                <div className="space-y-2">
                  <TypeFilterButton
                    label="Todos"
                    icon={null}
                    isActive={filters.type === undefined}
                    onClick={() => updateFilter({ type: undefined })}
                  />
                  <TypeFilterButton
                    label="Productos"
                    icon={
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    }
                    isActive={filters.type === "good"}
                    onClick={() => updateFilter({ type: "good" })}
                    color="blue"
                  />
                  <TypeFilterButton
                    label="Servicios"
                    icon={
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    }
                    isActive={filters.type === "service"}
                    onClick={() => updateFilter({ type: "service" })}
                    color="purple"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                  Categorias
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                  <div
                    className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filters.categoryId === undefined
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => updateFilter({ categoryId: undefined })}
                  >
                    Todas
                  </div>
                  {props.categories.map((cat) => (
                    <div key={cat.id}>
                      <div
                        className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${
                          filters.categoryId === cat.id
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                        onClick={() => updateFilter({ categoryId: cat.id })}
                      >
                        <span>{cat.fullName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                  Precio
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="relative rounded-md shadow-sm flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      placeholder="Min"
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-3 sm:text-sm border-gray-300 rounded-lg"
                      value={priceRange.min}
                      onChange={(e) => {
                        setPriceRange({ ...priceRange, min: e.target.value });
                        debouncedPriceSearch(e.target.value, priceRange.max);
                      }}
                    />
                  </div>
                  <span className="text-gray-500">-</span>
                  <div className="relative rounded-md shadow-sm flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      placeholder="Max"
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-3 sm:text-sm border-gray-300 rounded-lg"
                      value={priceRange.max}
                      onChange={(e) => {
                        setPriceRange({ ...priceRange, max: e.target.value });
                        debouncedPriceSearch(priceRange.min, e.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                  Calificacion
                </h3>
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div
                      key={star}
                      className={`flex items-center cursor-pointer px-2 py-1.5 rounded-lg transition-colors ${
                        filters.rating === star
                          ? "bg-yellow-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() =>
                        updateFilter({
                          rating: filters.rating === star ? undefined : star,
                        })
                      }
                    >
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${
                              i < star ? "text-yellow-400" : "text-gray-300"
                            }`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {star === 5 ? "" : "& mas"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                  Estado
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={filters.isEnabled === true}
                      onChange={(e) =>
                        updateFilter({
                          isEnabled: e.target.checked ? true : undefined,
                        })
                      }
                    />
                    <span className="ml-2 text-sm text-gray-700">Activo</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={filters.isEnabled === false}
                      onChange={(e) =>
                        updateFilter({
                          isEnabled: e.target.checked ? false : undefined,
                        })
                      }
                    />
                    <span className="ml-2 text-sm text-gray-700">Inactivo</span>
                  </label>
                </div>
              </div>
            </aside>

            {/* Item Grid */}
            <div className="flex-1">
              {items.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No se encontraron items
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Intenta ajustar los filtros o tu busqueda.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                  {items.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onEdit={() => {
                        navigate(`../product/${item.id}`);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className="mt-8">
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
          </div>
        </div>
      </div>
    </Fragment>
  );
}

function TypeFilterButton(props: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  color?: "blue" | "purple";
}) {
  const activeClass =
    props.color === "purple"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <button
      type="button"
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
        props.isActive
          ? activeClass
          : "text-gray-600 hover:bg-gray-100 border-transparent"
      }`}
      onClick={props.onClick}
    >
      {props.icon}
      <span>{props.label}</span>
    </button>
  );
}

function ItemCard({ item, onEdit }: { item: GetItem; onEdit: () => void }) {
  const images = item.images as string[];
  const image = images && images.length > 0 ? images[0] : null;
  const isService = item.type === "service";

  return (
    <div
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full cursor-pointer"
      onClick={onEdit}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {image ? (
          <Image
            src={image}
            alt={item.fullName}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {isService ? (
              <svg
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="h-12 w-12"
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
            )}
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-md ${
              isService
                ? "bg-purple-100/90 text-purple-800"
                : "bg-blue-100/90 text-blue-800"
            }`}
          >
            {isService ? (
              <>
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Servicio
              </>
            ) : (
              <>
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                Producto
              </>
            )}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-md ${
              item.isEnabled
                ? "bg-green-100/90 text-green-800"
                : "bg-gray-100/90 text-gray-800"
            }`}
          >
            {item.isEnabled ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <p
            className={`text-xs font-medium uppercase tracking-wide ${
              isService ? "text-purple-600" : "text-blue-600"
            }`}
          >
            {item.category || (isService ? "Servicio" : "Producto")}
          </p>
          <div className="flex items-center">
            <svg
              className="h-4 w-4 text-yellow-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="ml-1 text-sm text-gray-600 font-medium">
              {item.rating || "-"}
            </span>
          </div>
        </div>
        <h3
          className={`text-lg font-bold text-gray-900 mb-2 line-clamp-2 transition-colors ${
            isService
              ? "group-hover:text-purple-600"
              : "group-hover:text-blue-600"
          }`}
        >
          {item.fullName}
        </h3>
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
          <span className="text-xl font-bold text-gray-900">
            ${item.basePrice.toString()}
          </span>
          <button
            className={`text-sm font-medium transition-colors ${
              isService
                ? "text-purple-600 hover:text-purple-800"
                : "text-blue-600 hover:text-blue-800"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            Editar
          </button>
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
