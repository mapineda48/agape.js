import { useState, useMemo } from "react";
import clsx from "clsx";
import { useNotificacion } from "@/components/ui/notification";
import {
  PlusIcon,
  ArrowsUpDownIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import {
  listMovementTypes,
  upsertMovementType,
} from "@agape/inventory/movementType";
import Form from "@/components/form";
import * as Input from "@/components/form/Input";
import * as FormSelect from "@/components/form/Select";
import { Select as UISelect, SelectItem } from "@/components/ui/select";
import Checkbox from "@/components/form/CheckBox";
import Submit from "@/components/ui/submit";
import {
  createPortalHook,
  type PortalInjectedProps,
} from "@/components/util/portal";
import PortalModal from "@/components/ui/PortalModal";
import { useConfirmModal } from "@/components/ui/PortalConfirm";
import { Card, StackedList, Field } from "./components";

interface MovementType {
  id?: number;
  name: string;
  factor: number;
  affectsStock: boolean;
  isEnabled: boolean;
  documentTypeId: number;
}

interface MovementFilters {
  search: string;
  activeOnly: boolean;
  type: "all" | "entry" | "exit";
  affectsStock: "all" | "yes" | "no";
}

/**
 * Form state interface for MovementType creation/editing.
 */
interface MovementTypeFormState {
  id?: number;
  name: string;
  factor: number;
  affectsStock: boolean;
  isEnabled: boolean;
  documentTypeId: number;
}

function MovementModalWrapper(
  props: {
    movement: MovementType;
    onSave: (data: MovementType) => Promise<void>;
  } & PortalInjectedProps
) {
  return (
    <PortalModal
      {...props}
      title={
        props.movement.id
          ? "Editar tipo de movimiento"
          : "Nuevo tipo de movimiento"
      }
      size="md"
    >
      <MovementForm
        movement={props.movement}
        onSave={props.onSave}
        onClose={() => { }}
      />
    </PortalModal>
  );
}

function MovementFilterModalWrapper(
  props: {
    filters: MovementFilters;
    onApply: (filters: MovementFilters) => void;
  } & PortalInjectedProps
) {
  return (
    <PortalModal {...props} title="Filtrar tipos de movimiento" size="sm">
      <MovementFilterForm
        initialFilters={props.filters}
        onApply={props.onApply}
        onClose={() => props.remove()}
      />
    </PortalModal>
  );
}

function MovementFilterForm({
  initialFilters,
  onApply,
  onClose,
}: {
  initialFilters: MovementFilters;
  onApply: (filters: MovementFilters) => void;
  onClose: () => void;
}) {
  const [localFilters, setLocalFilters] = useState(initialFilters);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(localFilters);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 p-5">
        <Field label="Buscar por nombre">
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm"
            placeholder="Ej: Entrada"
            value={localFilters.search}
            onChange={(e) =>
              setLocalFilters((prev) => ({ ...prev, search: e.target.value }))
            }
          />
        </Field>

        <Field label="Tipo">
          <UISelect
            value={localFilters.type}
            onChange={(value) =>
              setLocalFilters((prev) => ({
                ...prev,
                type: value as any,
              }))
            }
          >
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="entry">Entradas (+)</SelectItem>
            <SelectItem value="exit">Salidas (-)</SelectItem>
          </UISelect>
        </Field>

        <Field label="Afecta Stock">
          <UISelect
            value={localFilters.affectsStock}
            onChange={(value) =>
              setLocalFilters((prev) => ({
                ...prev,
                affectsStock: value as any,
              }))
            }
          >
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="yes">Sí</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </UISelect>
        </Field>

        <div className="flex items-center gap-3 mt-2">
          <input
            type="checkbox"
            id="mov-activeOnly"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            checked={localFilters.activeOnly}
            onChange={(e) =>
              setLocalFilters((prev) => ({
                ...prev,
                activeOnly: e.target.checked,
              }))
            }
          />
          <label
            htmlFor="mov-activeOnly"
            className="text-sm text-gray-900 dark:text-white"
          >
            Solo activos
          </label>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 rounded-b-xl">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
        >
          Aplicar filtros
        </button>
      </div>
    </form>
  );
}

function MovementForm({
  movement,
  onClose,
  onSave,
}: {
  movement: MovementType;
  onClose: () => void;
  onSave: (data: {
    id?: number;
    name: string;
    factor: number;
    affectsStock: boolean;
    isEnabled: boolean;
    documentTypeId: number;
  }) => Promise<void>;
}) {
  const initialState: MovementTypeFormState = {
    id: movement.id || undefined,
    name: movement.name,
    factor: movement.factor ?? 1,
    affectsStock: movement.affectsStock ?? true,
    isEnabled: movement.isEnabled ?? true,
    documentTypeId: movement.documentTypeId ?? 0,
  };

  async function handleSubmit(data: MovementTypeFormState) {
    await onSave({
      id: data.id,
      name: data.name,
      factor: Number(data.factor) || 1,
      affectsStock: data.affectsStock,
      isEnabled: data.isEnabled,
      documentTypeId: data.documentTypeId,
    });
    onClose();
  }

  return (
    <Form.Root<MovementTypeFormState> state={initialState}>
      <div className="space-y-4 p-5">
        <Field label="Nombre">
          <Input.Text
            path="name"
            required
            placeholder="Ej: Entrada por compra"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </Field>
        <Field
          label="Factor"
          description="Usa +1 para entradas, -1 para salidas."
        >
          <FormSelect.Int
            path="factor"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <SelectItem value={1}>+1 Entrada</SelectItem>
            <SelectItem value={-1}>-1 Salida</SelectItem>
          </FormSelect.Int>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <Checkbox
              path="affectsStock"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-800 dark:text-gray-200">
              Afecta stock
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <Checkbox
              path="isEnabled"
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-800 dark:text-gray-200">
              Activo
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 rounded-b-xl">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <Submit<MovementTypeFormState>
          onSubmit={handleSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
        >
          {initialState.id ? "Guardar cambios" : "Crear tipo"}
        </Submit>
      </div>
    </Form.Root>
  );
}

const useMovementModal = createPortalHook(MovementModalWrapper);
const useMovementFilterModal = createPortalHook(MovementFilterModalWrapper);

export default function MovementTypeList(props: {
  movementTypes: MovementType[];
}) {
  const notify = useNotificacion();
  const [movementTypes, setMovementTypes] = useState<MovementType[]>(
    props.movementTypes
  );
  const [loading, setLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState<MovementFilters>({
    search: "",
    activeOnly: true,
    type: "all",
    affectsStock: "all",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const showMovement = useMovementModal();
  const showFilter = useMovementFilterModal();
  const showConfirm = useConfirmModal();

  async function loadMovements() {
    try {
      setLoading(true);
      const moves = await listMovementTypes();
      setMovementTypes(moves);
    } catch (error) {
      console.error("Error cargando tipos de movimiento:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredMovements = useMemo(() => {
    return movementTypes.filter((item) => {
      // Search
      if (
        filters.search &&
        !item.name.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      // Active Only
      if (filters.activeOnly && !item.isEnabled) {
        return false;
      }
      // Type (Entry/Exit)
      if (filters.type === "entry" && item.factor <= 0) return false;
      if (filters.type === "exit" && item.factor >= 0) return false;

      // Affects Stock
      if (filters.affectsStock === "yes" && !item.affectsStock) return false;
      if (filters.affectsStock === "no" && item.affectsStock) return false;

      return true;
    });
  }, [movementTypes, filters]);

  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMovements.slice(start, start + pageSize);
  }, [filteredMovements, currentPage]);

  const totalPages = Math.ceil(filteredMovements.length / pageSize);

  async function saveMovement(data: {
    id?: number;
    name: string;
    factor: number;
    affectsStock: boolean;
    isEnabled: boolean;
    documentTypeId: number;
  }) {
    await upsertMovementType(data);
    await loadMovements();
  }

  async function confirmDeleteMovement(item: MovementType) {
    showConfirm({
      title: "Eliminar registro",
      message: `¿Seguro que deseas eliminar "${item.name}"?`,
      confirmText: "Eliminar",
      variant: "danger",
      onConfirm: async () => {
        try {
          await upsertMovementType({ ...item, isEnabled: false });
          await loadMovements();
        } catch (error) {
          console.error("Error al eliminar:", error);
          notify({ payload: "No se pudo eliminar el registro", type: "error" });
        }
      },
    });
  }

  return (
    <Card
      title="Tipos de movimiento"
      icon={<ArrowsUpDownIcon className="w-5 h-5" />}
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              showFilter({
                filters,
                onApply: (newFilters) => {
                  setFilters(newFilters);
                  setCurrentPage(1);
                },
              })
            }
            className={clsx(
              "p-2 rounded-lg transition-colors border",
              filters.search ||
                !filters.activeOnly ||
                filters.type !== "all" ||
                filters.affectsStock !== "all"
                ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-transparent dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800"
            )}
            title="Filtrar tipos de movimiento"
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() =>
              showMovement({
                movement: {
                  name: "",
                  factor: 1,
                  affectsStock: true,
                  isEnabled: true,
                  documentTypeId: 0,
                },
                onSave: saveMovement,
              })
            }
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Nuevo tipo
          </button>
        </div>
      }
    >
      <StackedList<MovementType>
        items={paginatedMovements}
        loading={loading}
        empty="No se encontraron tipos de movimiento"
        render={(item) => ({
          title: item.name,
          subtitle: `Factor ${item.factor > 0 ? "+" : ""}${item.factor}`,
          badge: item.affectsStock ? "Afecta stock" : "Solo registro",
          badgeTone: item.affectsStock ? "blue" : "gray",
          extraChip: item.isEnabled ? "Activo" : "Inactivo",
          extraTone: item.isEnabled ? "green" : "amber",
          onEdit: () => showMovement({ movement: item, onSave: saveMovement }),
          onDelete: () => confirmDeleteMovement(item),
        })}
        pagination={{
          currentPage: currentPage,
          totalPages: totalPages,
          onPageChange: setCurrentPage,
          totalItems: filteredMovements.length,
          startIndex: (currentPage - 1) * pageSize,
          endIndex: (currentPage - 1) * pageSize + paginatedMovements.length,
        }}
      />
    </Card>
  );
}
