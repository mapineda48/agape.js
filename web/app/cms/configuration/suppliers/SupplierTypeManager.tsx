import { useState, useMemo } from "react";
import { useNotificacion } from "@/components/ui/notification";
import clsx from "clsx";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  listSupplierTypes,
  createSupplierType,
  updateSupplierType,
  deleteSupplierType,
} from "@agape/purchasing/supplier_type";
import Form from "@/components/form";
import * as Input from "@/components/form/Input";
import Submit from "@/components/ui/submit";
import {
  createPortalHook,
  type PortalInjectedProps,
} from "@/components/util/portal";
import PortalModal from "@/components/ui/PortalModal";
import { useConfirmModal } from "@/components/ui/PortalConfirm";

interface SupplierType {
  id: number;
  name: string;
}

/**
 * Form state interface for SupplierType creation/editing.
 */
interface SupplierTypeFormState {
  name: string;
}

interface SupplierTypeManagerProps {
}

// -- Form Modal --

function SupplierTypeFormModalWrapper(
  props: {
    item: SupplierType | null;
    onSave: () => Promise<void>;
  } & PortalInjectedProps
) {
  return (
    <PortalModal
      {...props}
      title={
        props.item ? "Editar tipo de proveedor" : "Nuevo tipo de proveedor"
      }
      size="md"
      zIndex={60} // Higher z-index for nested modal
    >
      <SupplierTypeForm
        item={props.item}
        onSave={props.onSave}
      />
    </PortalModal>
  );
}

function SupplierTypeForm({
  item,
  onSave,
}: {
  item: SupplierType | null;
  onSave: () => Promise<void>;
}) {
  const notify = useNotificacion();
  const isEditing = !!item;
  const initialState: SupplierTypeFormState = item || { name: "" };

  async function handleSubmit(data: SupplierTypeFormState) {
    try {
      if (isEditing && item) {
        await updateSupplierType(item.id, data);
      } else {
        await createSupplierType(data);
      }
      await onSave();
    } catch (error) {
      console.error("Error saving supplier type:", error);
      notify({
        payload: "Error al guardar el tipo de proveedor",
        type: "error",
      });
    }
  }

  return (
    <Form.Root<SupplierTypeFormState> state={initialState}>
      <div className="p-6 space-y-5">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Nombre
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Usa nombres cortos y claros; aparecerán en compras y órdenes.
          </p>
          <Input.Text
            path="name"
            required
            placeholder="Ej: Logística, Materias primas"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 rounded-b-xl">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <Submit<SupplierTypeFormState>
          onSubmit={handleSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
        >
          {isEditing ? "Guardar cambios" : "Crear tipo"}
        </Submit>
      </div>
    </Form.Root>
  );
}

const useSupplierTypeFormModal = createPortalHook(SupplierTypeFormModalWrapper);

// -- Filter Modal --

function FilterModalWrapper(
  props: {
    search: string;
    onApply: (search: string) => void;
  } & PortalInjectedProps
) {
  return (
    <PortalModal {...props} title="Filtrar tipos" size="sm" zIndex={60}>
      <FilterForm
        initialSearch={props.search}
        onApply={props.onApply}
      />
    </PortalModal>
  );
}

function FilterForm({
  initialSearch,
  onApply,
}: {
  initialSearch: string;
  onApply: (search: string) => void;
}) {
  const [search, setSearch] = useState(initialSearch);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(search);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-5 space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Buscar por nombre
          </span>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm"
            placeholder="Ej: Logística"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 rounded-b-xl">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
        >
          Aplicar filtros
        </button>
      </div>
    </form>
  );
}

const useFilterModal = createPortalHook(FilterModalWrapper);

// -- Main Component --

export default function SupplierTypeManager({
}: SupplierTypeManagerProps) {
  const notify = useNotificacion();
  const [types, setTypes] = useState<SupplierType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const showForm = useSupplierTypeFormModal();
  const showFilter = useFilterModal();
  const showConfirm = useConfirmModal();

  // Load initial data
  useState(() => {
    loadTypes();
  });

  async function loadTypes() {
    try {
      setLoading(true);
      const data = await listSupplierTypes();
      setTypes(data);
    } catch (error) {
      console.error("Error loading types:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTypes = useMemo(() => {
    return types.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [types, search]);

  const paginatedTypes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTypes.slice(start, start + pageSize);
  }, [filteredTypes, currentPage]);

  const totalPages = Math.ceil(filteredTypes.length / pageSize);

  function handleCreate() {
    showForm({ item: null, onSave: loadTypes });
  }

  function handleEdit(item: SupplierType) {
    showForm({ item, onSave: loadTypes });
  }

  function handleDelete(item: SupplierType) {
    showConfirm({
      title: "Eliminar tipo",
      message: `¿Seguro que deseas eliminar "${item.name}"?`,
      confirmText: "Eliminar",
      variant: "danger",
      // zIndex: 60, // Higher z-index for confirm on top of modal
      onConfirm: async () => {
        try {
          await deleteSupplierType(item.id);
          await loadTypes();
        } catch (error) {
          console.error("Error deleting type:", error);
          if (
            error instanceof Error &&
            error.message.includes("Foreign key constraint")
          ) {
            notify({
              payload: "No se puede eliminar porque está en uso",
              type: "error",
            });
          } else {
            notify({ payload: "Error al eliminar el registro", type: "error" });
          }
        }
      },
    });
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header Actions */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredTypes.length} registros encontrados
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              showFilter({
                search,
                onApply: (val) => {
                  setSearch(val);
                  setCurrentPage(1);
                },
              })
            }
            className={clsx(
              "p-2 rounded-lg transition-colors border",
              search
                ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-transparent dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800"
            )}
            title="Filtrar"
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Nuevo
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Cargando...</div>
        ) : paginatedTypes.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No se encontraron tipos de proveedor.
          </div>
        ) : (
          paginatedTypes.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ID {item.id}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(item)}
                  className="rounded-md p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/40 transition-colors"
                  title="Editar"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="rounded-md p-2 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/40 transition-colors"
                  title="Eliminar"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-400">
                Página <span className="font-medium">{currentPage}</span> de{" "}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                {/* Add simple page numbers logic or just prev/next for now to match style */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                  )
                  .map((page, index, array) => {
                    const showEllipsis =
                      index > 0 && page - array[index - 1] > 1;
                    return (
                      <div key={page} className="flex">
                        {showEllipsis && (
                          <span className="px-2 self-center">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={clsx(
                            "relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0",
                            currentPage === page
                              ? "z-10 bg-emerald-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                              : "text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  })}
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Siguiente</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
