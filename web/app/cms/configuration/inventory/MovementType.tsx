import { useState } from "react";
import { useNotificacion } from "@/components/ui/notification";
import { PlusIcon, ArrowsUpDownIcon } from "@heroicons/react/24/outline";
import {
  listMovementTypes,
  upsertMovementType,
} from "@agape/inventory/movementType";
import Form from "@/components/form";
import * as Input from "@/components/form/Input";
import * as Select from "@/components/form/Select";
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
        onClose={() => {}}
      />
    </PortalModal>
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
  const initialState = {
    id: movement.id || undefined,
    name: movement.name,
    factor: movement.factor ?? 1,
    affectsStock: movement.affectsStock ?? true,
    isEnabled: movement.isEnabled ?? true,
    documentTypeId: movement.documentTypeId ?? 0,
  };

  async function handleSubmit(data: typeof initialState) {
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
    <Form state={initialState}>
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
          <Select.Int
            path="factor"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value={1}>+1 Entrada</option>
            <option value={-1}>-1 Salida</option>
          </Select.Int>
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
        <Submit
          onSubmit={handleSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
        >
          {initialState.id ? "Guardar cambios" : "Crear tipo"}
        </Submit>
      </div>
    </Form>
  );
}

const useMovementModal = createPortalHook(MovementModalWrapper);

export default function MovementTypeList(props: {
  movementTypes: MovementType[];
}) {
  const notify = useNotificacion();
  const [movementTypes, setMovementTypes] = useState<MovementType[]>(
    props.movementTypes
  );
  const [loading, setLoading] = useState(false);

  const showMovement = useMovementModal();
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
      }
    >
      <StackedList<MovementType>
        items={movementTypes}
        loading={loading}
        empty="Aún no hay tipos de movimiento"
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
      />
    </Card>
  );
}
