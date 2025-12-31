import { Fragment, useEffect } from "react";
import { Select, SelectItem } from "@/components/ui/select";
import { listPurchaseOrders } from "@agape/purchasing/purchase_order";
import { PURCHASE_ORDER_STATUS_VALUES } from "@utils/dto/purchasing/purchase_order";
import { listSuppliers } from "@agape/purchasing/supplier";
import type {
  ListPurchaseOrdersParams,
  PurchaseOrderListItem,
  ListPurchaseOrdersResult,
  PurchaseOrderStatus,
} from "@utils/dto/purchasing/purchase_order";
import type { SupplierListItem } from "@utils/dto/purchasing/supplier";
import { useSharedState } from "@/components/util/event-emitter";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { Pagination } from "../../inventory/Pagination";
import Decimal from "@utils/data/Decimal";

const PAGE_SIZE = 15;

interface Props extends ListPurchaseOrdersResult {
  suppliers: SupplierListItem[];
}

export async function onInit(): Promise<Props> {
  const [ordersResult, suppliersResult] = await Promise.all([
    listPurchaseOrders({
      pageIndex: 0,
      pageSize: PAGE_SIZE,
      includeTotalCount: true,
    }),
    listSuppliers({ pageSize: 100 }),
  ]);

  return {
    ...ordersResult,
    suppliers: suppliersResult.suppliers,
  };
}

export default function PurchaseOrdersPage(props: Props) {
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

  const updateFilter = (newFilters: Partial<ListPurchaseOrdersParams>) => {
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

    listPurchaseOrders(filters)
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Órdenes de Compra
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona tus órdenes de compra con proveedores
              </p>
            </div>
            <button
              onClick={() => navigate("../order")}
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
              Nueva Orden
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Supplier Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Proveedor
                </label>
                <Select
                  value={filters.supplierId}
                  onChange={(supplierId: number | undefined) =>
                    updateFilter({ supplierId })
                  }
                  placeholder="Todos los proveedores"
                >
                  <SelectItem value={undefined}>Todos los proveedores</SelectItem>
                  {props.suppliers.map((supplier: SupplierListItem) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.firstName
                        ? `${supplier.firstName} ${supplier.lastName ?? ""
                          }`.trim()
                        : supplier.legalName ?? ""}
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
                  onChange={(status: PurchaseOrderStatus | undefined) =>
                    updateFilter({ status })
                  }
                  placeholder="Todos los estados"
                >
                  <SelectItem value={undefined}>Todos los estados</SelectItem>
                  {PURCHASE_ORDER_STATUS_VALUES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Reset Filters */}
              <div className="flex items-end">
                <button
                  onClick={() =>
                    updateFilter({
                      supplierId: undefined,
                      status: undefined,
                      fromDate: undefined,
                      toDate: undefined,
                    })
                  }
                  className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {orders.length === 0 ? (
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No se encontraron órdenes de compra
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
                        # Orden
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Proveedor
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
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order: PurchaseOrderListItem) => (
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
    </Fragment>
  );
}

function OrderRow({
  order,
  onView,
}: {
  order: PurchaseOrderListItem;
  onView: () => void;
}) {
  const statusConfig = getStatusConfig(order.status);
  const totalNumber =
    order.totalAmount instanceof Decimal
      ? order.totalAmount.toNumber()
      : Number(order.totalAmount);

  return (
    <tr
      className="hover:bg-emerald-50 cursor-pointer transition-colors"
      onClick={onView}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              #{order.id}
            </span>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">
              {order.itemCount} ítems
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {order.supplierName}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {order.orderDate.toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.className}`}
        >
          <span
            className={`h-2 w-2 rounded-full mr-2 ${statusConfig.dotClass}`}
          />
          {statusConfig.label}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <span className="text-sm font-semibold text-gray-900">
          ${totalNumber.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="text-emerald-600 hover:text-emerald-900 font-semibold transition-colors"
        >
          Ver
        </button>
      </td>
    </tr>
  );
}

function getStatusLabel(status: PurchaseOrderStatus): string {
  const labels: Record<PurchaseOrderStatus, string> = {
    pending: "Pendiente",
    approved: "Aprobada",
    received: "Recibida",
    cancelled: "Cancelada",
  };
  return labels[status];
}

function getStatusConfig(status: PurchaseOrderStatus): {
  label: string;
  className: string;
  dotClass: string;
} {
  const configs: Record<
    PurchaseOrderStatus,
    { label: string; className: string; dotClass: string }
  > = {
    pending: {
      label: "Pendiente",
      className: "bg-yellow-100 text-yellow-800",
      dotClass: "bg-yellow-400",
    },
    approved: {
      label: "Aprobada",
      className: "bg-blue-100 text-blue-800",
      dotClass: "bg-blue-400",
    },
    received: {
      label: "Recibida",
      className: "bg-green-100 text-green-800",
      dotClass: "bg-green-400",
    },
    cancelled: {
      label: "Cancelada",
      className: "bg-gray-100 text-gray-800",
      dotClass: "bg-gray-400",
    },
  };
  return configs[status];
}

interface IState {
  fetch: boolean;
  filters: ListPurchaseOrdersParams;
  orders: PurchaseOrderListItem[];
  totalCount: number;
}
