import { Fragment, useEffect } from "react";
import {
  listClients,
  type ListClientsParams as GetClientsParams,
  type ClientListItem as GetClient,
  type ListClientsResult as GetClientsResult,
} from "@agape/crm/client";
import { listClientTypes as findAll } from "@agape/crm/clientType";
import { useSharedState } from "@/components/util/event-emitter";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { debounce } from "@/utils/debounce";
import { Pagination } from "../../inventory/Pagination";
import Image from "@/components/util/image";

const PAGE_SIZE = 15;

type ClientTypeWithSubs = Awaited<ReturnType<typeof findAll>>[number];

interface Props extends GetClientsResult {
  clientTypes: ClientTypeWithSubs[];
}

export async function onInit() {
  const [clientsResult, clientTypes] = await Promise.all([
    listClients({
      pageIndex: 0,
      pageSize: PAGE_SIZE,
      includeTotalCount: true,
    }),
    findAll(),
  ]);

  return {
    ...clientsResult,
    clientTypes,
  };
}

export default function ClientsPage(props: Props) {
  console.log({ props });

  const notify = useNotificacion();
  const { navigate } = useRouter();

  const [{ filters, totalCount, clients, fetch }, setState] =
    useSharedState<IState>(() => {
      return {
        filters: {
          pageSize: PAGE_SIZE,
          pageIndex: 0,
          includeTotalCount: true,
        },
        fetch: false,
        clients: props.clients,
        totalCount: props.totalCount || 0,
      };
    });

  const updateFilter = (newFilters: Partial<GetClientsParams>) => {
    setState({
      clients,
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

  useEffect(() => {
    if (!fetch) {
      return;
    }

    listClients(filters)
      .then((response) => {
        setState({
          fetch: false,
          filters: {
            ...filters,
            includeTotalCount: false,
          },
          clients: response.clients,
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Clientes
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona tus clientes y su información
              </p>
            </div>
            <button
              onClick={() => navigate("../client")}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105"
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
              Nuevo Cliente
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Buscar Cliente
                </label>
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
                    placeholder="Nombre del cliente..."
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition"
                    onChange={(e) => debouncedSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Client Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Cliente
                </label>
                <select
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition"
                  value={filters.typeId ?? ""}
                  onChange={(e) =>
                    updateFilter({
                      typeId: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                >
                  <option value="">Todos los tipos</option>
                  {props.clientTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Estado
                </label>
                <div className="flex items-center space-x-4 h-[42px]">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={filters.isActive === true}
                      onChange={(e) =>
                        updateFilter({
                          isActive: e.target.checked ? true : undefined,
                        })
                      }
                    />
                    <span className="ml-2 text-sm text-gray-700 font-medium">
                      Activo
                    </span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={filters.isActive === false}
                      onChange={(e) =>
                        updateFilter({
                          isActive: e.target.checked ? false : undefined,
                        })
                      }
                    />
                    <span className="ml-2 text-sm text-gray-700 font-medium">
                      Inactivo
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {clients.length === 0 ? (
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No se encontraron clientes
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Intenta ajustar los filtros o crea un nuevo cliente.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clients.map((client) => (
                      <ClientRow
                        key={client.id}
                        client={client}
                        onEdit={() => navigate(`../client/${client.id}`)}
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
                    clients,
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
          )}
        </div>
      </div>
    </Fragment>
  );
}

function ClientRow({
  client,
  onEdit,
}: {
  client: GetClient;
  onEdit: () => void;
}) {
  return (
    <tr
      className="hover:bg-blue-50 cursor-pointer transition-colors"
      onClick={onEdit}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12">
            {client.photoUrl ? (
              <Image
                className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-100"
                src={client.photoUrl}
                alt={`${client.firstName} ${client.lastName}`}
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center ring-2 ring-blue-100">
                <span className="text-white font-semibold text-lg">
                  {client?.firstName?.[0]}
                  {client?.lastName?.[0]}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-bold text-gray-900">
              {client.firstName} {client.lastName}
            </div>
            <div className="text-sm text-gray-500">{client.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{client.phone || "—"}</div>
        <div className="text-sm text-gray-500 truncate max-w-xs">
          {client.address || "—"}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {client.typeName || "Sin tipo"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            client.active
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full mr-2 ${
              client.active ? "bg-green-400" : "bg-gray-400"
            }`}
          />
          {client.active ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="text-blue-600 hover:text-blue-900 font-semibold transition-colors"
        >
          Editar
        </button>
      </td>
    </tr>
  );
}

interface IState {
  fetch: boolean;
  filters: GetClientsParams;
  clients: GetClient[];
  totalCount: number;
}
