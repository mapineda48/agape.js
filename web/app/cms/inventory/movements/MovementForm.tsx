import { useEffect, useState, useMemo } from "react";
import Form, { useAppDispatch, setAtPath } from "@/components/form";
import * as Input from "@/components/form/Input";
import { useInputArray } from "@/components/form/hooks";
import useInput from "@/components/form/Input/useInput";
import Select from "@/components/form/Select";
import Submit from "@/components/ui/submit";
import { useEventEmitter } from "@/components/util/event-emitter";
import {
  createInventoryMovement,
  getInventoryMovement,
} from "@agape/inventory/movement";
import { listMovementTypes } from "@agape/inventory/movementType";
import { listItems } from "@agape/catalogs/item";
import { useNotificacion } from "@/components/ui/notification";
import DateTime from "@utils/data/DateTime";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

type MovementType = Awaited<ReturnType<typeof listMovementTypes>>[number];
type Item = Awaited<ReturnType<typeof listItems>>["items"][number];

interface Props {
  initialData?: Awaited<ReturnType<typeof getInventoryMovement>>;
  types: MovementType[];
  onSuccess?: () => void;
}

/**
 * Form state interface for inventory movement.
 */
interface MovementFormState {
  movementTypeId?: number;
  movementDate?: DateTime;
  observation?: string;
  sourceDocumentType?: string;
  sourceDocumentId?: number;
  details: Array<{
    itemId?: number;
    quantity: number;
    unitCost?: number;
    locationId?: number;
  }>;
}

export function MovementForm(props: Props) {
  return (
    <Form<MovementFormState>
      state={props.initialData as MovementFormState}
      className="max-w-7xl mx-auto space-y-6"
    >
      <MovementFormContent {...props} />
    </Form>
  );
}

function MovementFormContent(props: Props) {
  const isEditing = !!props.initialData?.id;
  const dispatch = useAppDispatch();
  const emitter = useEventEmitter();
  const updateFormEvent = useMemo(() => Symbol("updateForm"), []);
  const notify = useNotificacion();

  useEffect(() => {
    return emitter.on(updateFormEvent, ((record: any) => {
      // Handle update if needed, but usually we just redirect
    }) as any);
  }, [emitter, updateFormEvent]);

  // Set default date if new
  useEffect(() => {
    if (!isEditing) {
      dispatch(setAtPath({ path: ["movementDate"], value: new DateTime() }));
    }
  }, [isEditing, dispatch]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <GeneralInfoCard types={props.types} isEditing={isEditing} />
          <DetailsCard />
        </div>
        <div className="space-y-6">
          <SummaryCard />
          <div className="sticky bottom-6">
            <Submit<MovementFormState>
              onSubmit={async (state) => {
                const payload = {
                  movementTypeId: state.movementTypeId,
                  movementDate:
                    state.movementDate instanceof DateTime
                      ? state.movementDate
                      : new DateTime(state.movementDate),
                  observation: state.observation,
                  userId: 1, // TODO: Get from auth context
                  sourceDocumentType: state.sourceDocumentType,
                  sourceDocumentId: state.sourceDocumentId,
                  details: state.details.map((d: any) => ({
                    itemId: d.itemId,
                    quantity: Number(d.quantity),
                    unitCost: d.unitCost ? Number(d.unitCost) : undefined,
                    locationId: d.locationId,
                  })),
                };

                if (isEditing) {
                  // Update logic here if implemented in backend
                  throw new Error(
                    "Edición no implementada en backend aún (simulado)"
                  );
                } else {
                  await createInventoryMovement(payload);
                }
                props.onSuccess?.();
              }}
              event={updateFormEvent}
              className="w-full py-3 px-4 text-white font-medium rounded-xl shadow-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-indigo-500/30"
            >
              {isEditing ? "Guardar Cambios" : "Crear Movimiento"}
            </Submit>
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralInfoCard({
  types,
  isEditing,
}: {
  types: MovementType[];
  isEditing: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">
          Información General
        </h2>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Movimiento
          </label>
          <Select.Int
            path="movementTypeId"
            required
            className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            disabled={isEditing} // Usually changing type changes numbering series, safest to disable on edit
          >
            <option value="">- Seleccionar -</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select.Int>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha
          </label>
          <Input.DateTime
            path="movementDate"
            required
            className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observación
          </label>
          <Input.TextArea
            path="observation"
            rows={2}
            className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}

function DetailsCard() {
  const details = useInputArray("details");
  // Assuming we preload items for selection or use a smart selector
  // For simplicity, I'll fetch items once in a shared state or context, but here I'll just use a local fetch for the select options
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    listItems({ pageIndex: 0, pageSize: 100 }).then((res) =>
      setItems(res.items)
    );
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Detalles del Movimiento
        </h2>
        <button
          type="button"
          onClick={() => details.addItem({ quantity: 1 })}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-1.5" />
          Agregar Item
        </button>
      </div>
      <div className="p-6">
        {details.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No hay items agregados.
          </div>
        ) : (
          <div className="space-y-4">
            {details.map((item, index) => (
              <div
                key={index}
                className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-100 relative group"
              >
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Item
                  </label>
                  <Select.Int
                    path="itemId"
                    required
                    className="w-full rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">- Seleccionar Item -</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.fullName} ({i.code})
                      </option>
                    ))}
                  </Select.Int>
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Cantidad
                  </label>
                  <Input.Decimal
                    path="quantity"
                    required
                    placeholder="0"
                    className="w-full rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                {/* Unit Cost is optional/hidden depending on type usually, but we include it for now */}
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Costo Unit
                  </label>
                  <Input.Decimal
                    path="unitCost"
                    placeholder="0.00"
                    className="w-full rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => details.removeItem(index)}
                  className="mt-6 p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                  title="Remover linea"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard() {
  // We could calculate totals here using useSelector
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">Resumen</h2>
      </div>
      <div className="p-6">
        <p className="text-sm text-gray-500">
          Asegúrese de revisar los detalles antes de guardar. Una vez procesado,
          el movimiento afectará el stock inmediatamente.
        </p>
      </div>
    </div>
  );
}
