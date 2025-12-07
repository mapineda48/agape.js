import { useState, useMemo, useEffect } from "react";
import { useNotificacion } from "@/components/ui/notification";
import clsx from "clsx";
import {
  PlusIcon,
  PencilIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  listDocumentTypes,
  upsertDocumentType,
  type DocumentType,
} from "@agape/numbering/documentType";
import {
  listDocumentSeries,
  upsertDocumentSeries,
  type DocumentSeries,
} from "@agape/numbering/documentSeries";
import Form from "@/components/form";
import * as Input from "@/components/form/Input";
import Checkbox from "@/components/form/CheckBox";
import Submit from "@/components/ui/submit";
import {
  createPortalHook,
  type PortalInjectedProps,
} from "@/components/util/portal";
import PortalModal from "@/components/ui/PortalModal";
import { useConfirmModal } from "@/components/ui/PortalConfirm";

// -- Series Modal --
function SeriesModalWrapper(
  props: {
    series: DocumentSeries | null;
    documentTypeId: number;
    onSave: () => void;
  } & PortalInjectedProps
) {
  return (
    <PortalModal
      {...props}
      title={
        props.series
          ? "Editar serie de numeración"
          : "Nueva serie de numeración"
      }
      size="md"
      zIndex={70}
    >
      <SeriesForm
        series={props.series}
        documentTypeId={props.documentTypeId}
        onSave={props.onSave}
        onClose={() => {}}
      />
    </PortalModal>
  );
}

function SeriesForm({
  series,
  documentTypeId,
  onClose,
  onSave,
}: {
  series: DocumentSeries | null;
  documentTypeId: number;
  onClose: () => void;
  onSave: () => void;
}) {
  const notify = useNotificacion();
  const isEditing = !!series;

  // Initial state
  const initialState = {
    id: series?.id,
    documentTypeId: documentTypeId,
    seriesCode: series?.seriesCode ?? "",
    prefix: series?.prefix ?? "",
    startNumber: series?.startNumber ?? 1,
    endNumber: series?.endNumber ?? 999999,
    currentNumber: series?.currentNumber, // Optional in UI, handled by backend on create
    validFrom: series?.validFrom,
    validTo: series?.validTo,
    isActive: series?.isActive ?? true,
    isDefault: series?.isDefault ?? false,
  };

  async function handleSubmit(data: typeof initialState) {
    try {
      await upsertDocumentSeries(data);
      await onSave();
      onClose();
    } catch (error) {
      console.error("Error saving series:", error);
      notify({ payload: "Error al guardar la serie", type: "error" });
    }
  }

  return (
    <Form state={initialState}>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Código
            </span>
            <Input.Text
              path="seriesCode"
              required
              placeholder="Ej: RES-2024"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Prefijo (Opcional)
            </span>
            <Input.Text
              path="prefix"
              placeholder="Ej: F-"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Inicio
            </span>
            <Input.Int
              path="startNumber"
              required
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Fin
            </span>
            <Input.Int
              path="endNumber"
              required
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Válido desde
            </span>
            <Input.DateTime
              path="validFrom"
              required
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Válido hasta
            </span>
            <Input.DateTime
              path="validTo"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          </label>
        </div>

        <div className="flex gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Checkbox
              path="isActive"
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Activa
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              path="isDefault"
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Serie por defecto
            </span>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 rounded-b-xl">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cancelar
        </button>
        <Submit
          onSubmit={handleSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
        >
          {isEditing ? "Guardar cambios" : "Crear serie"}
        </Submit>
      </div>
    </Form>
  );
}
const useSeriesModal = createPortalHook(SeriesModalWrapper);

// -- DocumentType Modal --
function DocumentTypeModalWrapper(
  props: {
    item: DocumentType | null;
    onSave: () => Promise<void>;
  } & PortalInjectedProps
) {
  return (
    <PortalModal
      {...props}
      title={
        props.item
          ? "Editar método de numeración"
          : "Nuevo método de numeración"
      }
      size="xl"
    >
      <DocumentTypeForm
        item={props.item}
        onSave={props.onSave}
        onClose={() => {}}
      />
    </PortalModal>
  );
}

function DocumentTypeForm({
  item,
  onClose,
  onSave,
}: {
  item: DocumentType | null;
  onClose: () => void;
  onSave: () => Promise<void>;
}) {
  const notify = useNotificacion();
  const isEditing = !!item;
  const [currentId, setCurrentId] = useState<number | undefined>(item?.id);

  const initialState = item || {
    code: "",
    name: "",
    module: "",
    description: "",
    isEnabled: true,
  };

  // Series handling
  const [seriesList, setSeriesList] = useState<DocumentSeries[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const showSeriesModal = useSeriesModal();

  async function loadSeries() {
    if (!currentId) return;
    try {
      setLoadingSeries(true);
      const data = await listDocumentSeries({
        documentTypeId: currentId,
        activeOnly: false,
      });
      setSeriesList(data);
    } catch (error) {
      console.error("Error loading series:", error);
    } finally {
      setLoadingSeries(false);
    }
  }

  useEffect(() => {
    if (currentId) {
      loadSeries();
    }
  }, [currentId]);

  async function handleSubmit(data: typeof initialState) {
    try {
      const saved = await upsertDocumentType({
        id: currentId,
        ...data,
      });
      setCurrentId(saved.id);
      await onSave();

      if (!currentId) {
        notify({
          payload: "Registro creado. Ahora puedes agregar series.",
          type: "success",
        });
      } else {
        notify({ payload: "Cambios guardados.", type: "success" });
        onClose();
      }
    } catch (error) {
      console.error("Error saving doc type:", error);
      if (error instanceof Error && error.message.includes("duplicate key")) {
        notify({ payload: "El código ya existe", type: "error" });
      } else {
        notify({ payload: "Error al guardar el registro", type: "error" });
      }
    }
  }

  function handleAddSeries() {
    if (!currentId) return;
    showSeriesModal({
      series: null,
      documentTypeId: currentId,
      onSave: loadSeries,
    });
  }

  function handleEditSeries(series: DocumentSeries) {
    if (!currentId) return;
    showSeriesModal({
      series,
      documentTypeId: currentId,
      onSave: loadSeries,
    });
  }

  return (
    <Form state={initialState}>
      <div className="flex flex-col h-[70vh]">
        <div className="p-6 space-y-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Información General
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Nombre
              </span>
              <Input.Text
                path="name"
                required
                placeholder="Ej: Factura de Venta"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Código Interno
              </span>
              <Input.Text
                path="code"
                required
                placeholder="Ej: FAC_VTA"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                disabled={isEditing}
              />
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Módulo (Opcional)
              </span>
              <Input.Text
                path="module"
                placeholder="Ej: sales"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              />
            </label>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox
                path="isEnabled"
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Habilitado
              </span>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Submit
              onSubmit={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
            >
              {currentId ? "Actualizar Encabezado" : "Crear y Continuar"}
            </Submit>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-900/50">
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Series de Numeración
            </h3>
            {currentId && (
              <button
                type="button"
                onClick={handleAddSeries}
                className="text-xs flex items-center gap-1 font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                <PlusIcon className="w-4 h-4" /> Agregar Serie
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {!currentId ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm">
                Guarda el encabezado para administrar las series.
              </div>
            ) : loadingSeries ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                Cargando series...
              </div>
            ) : seriesList.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                No hay series configuradas.
              </div>
            ) : (
              <div className="space-y-3">
                {seriesList.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          {item.seriesCode}
                          {item.isDefault && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full dark:bg-blue-900/40 dark:text-blue-200">
                              Default
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.prefix}
                          {item.startNumber} - {item.prefix}
                          {item.endNumber}
                        </span>
                      </div>
                      <div className="border-l border-gray-200 dark:border-gray-700 pl-4 flex flex-col justify-center">
                        <span
                          className={clsx(
                            "text-xs font-medium px-2 py-0.5 rounded-full w-fit",
                            item.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          )}
                        >
                          {item.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditSeries(item)}
                      className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-md dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-xl flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Form>
  );
}
const useDocumentTypeModal = createPortalHook(DocumentTypeModalWrapper);

// -- Filter Modal --
function FilterModalWrapper(
  props: {
    search: string;
    onApply: (val: string) => void;
  } & PortalInjectedProps
) {
  return (
    <PortalModal {...props} title="Filtrar Métodos" size="sm">
      <FilterForm
        search={props.search}
        onApply={props.onApply}
        onClose={() => {}}
      />
    </PortalModal>
  );
}
function FilterForm({
  search,
  onApply,
  onClose,
}: {
  search: string;
  onApply: (v: string) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState(search);
  return (
    <div className="p-5">
      <label className="block space-y-1.5 mb-4">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          Buscar
        </span>
        <input
          autoFocus
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          placeholder="Nombre o código..."
        />
      </label>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            onApply(val);
            onClose();
          }}
          className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
const useFilterModal = createPortalHook(FilterModalWrapper);

// -- Main Component --
export default function NumberingMethods() {
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const showModal = useDocumentTypeModal();
  const showFilter = useFilterModal();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await listDocumentTypes(false); // List all, enabled or not
      setTypes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return types.filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [types, search]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm flex flex-col h-[500px]">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900/50 rounded-t-2xl">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Métodos de Numeración
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configura resoluciones y series (Facturas, etc.)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              showFilter({
                search,
                onApply: (v) => {
                  setSearch(v);
                  setCurrentPage(1);
                },
              })
            }
            className={clsx(
              "p-2 rounded-lg border transition-colors",
              search
                ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
            )}
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => showModal({ item: null, onSave: loadData })}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm"
          >
            <PlusIcon className="w-5 h-5" /> Nuevo
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No se encontraron resultados.
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">
                      {item.code} {item.module ? `• ${item.module}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={clsx(
                      "text-xs font-medium px-2.5 py-0.5 rounded-full",
                      item.isEnabled
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    )}
                  >
                    {item.isEnabled ? "Habilitado" : "Deshabilitado"}
                  </span>
                  <button
                    onClick={() => showModal({ item, onSave: loadData })}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
