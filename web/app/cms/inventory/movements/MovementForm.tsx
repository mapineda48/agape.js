import { useEffect, useState } from "react";
import { Form, useAppDispatch, setAtPath } from "@/components/form";
import { SelectItem } from "@/components/ui/select";
import Decimal from "@utils/data/Decimal";

import Submit from "@/components/ui/submit";
import {
  createInventoryMovement,
  getInventoryMovement,
  type CreateInventoryMovementInput,
} from "@agape/inventory/movement";
import { listMovementTypes } from "@agape/inventory/movementType";
import { listItems } from "@agape/catalogs/item";
import { listLocations } from "@agape/inventory/location";
import DateTime from "@utils/data/DateTime";
import { TrashIcon, PlusIcon, InformationCircleIcon, MapPinIcon, CubeIcon, BeakerIcon } from "@heroicons/react/24/outline";
import { clsx } from "clsx";

type MovementType = Awaited<ReturnType<typeof listMovementTypes>>[number];
type Item = Awaited<ReturnType<typeof listItems>>["items"][number];
type Location = Awaited<ReturnType<typeof listLocations>>[number];

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
  status: string;
  details: Array<{
    itemId?: number;
    itemName?: string;
    itemCode?: string;
    quantity: number;
    unitCost?: Decimal;
    locationId?: number;
    locationName?: string;
    lotId?: number;
    lotNumber?: string;
  }>;
}

export function MovementForm(props: Props) {
  const defaultState: MovementFormState = {
    movementTypeId: undefined,
    movementDate: new DateTime(),
    status: "draft",
    details: [],
  };

  const isReadOnly =
    props.initialData?.status && props.initialData.status !== "draft";

  return (
    <Form.Root<MovementFormState>
      state={
        (props.initialData as unknown as MovementFormState) ?? defaultState
      }
      className="max-w-7xl mx-auto space-y-6"
    >
      <MovementFormContent {...props} isReadOnly={!!isReadOnly} />
    </Form.Root>
  );
}

function MovementFormContent(props: Props & { isReadOnly: boolean }) {
  const { isReadOnly } = props;
  const isEditing = !!props.initialData?.id;
  const dispatch = useAppDispatch();

  const movementTypeReadOnly = isReadOnly || isEditing;

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
          <GeneralInfoCard
            types={props.types}
            isReadOnly={movementTypeReadOnly}
          />
          <DetailsCard isReadOnly={isReadOnly} />
        </div>
        <div className="space-y-6">
          <SummaryCard />
          {!isReadOnly && (
            <div className="sticky bottom-6">
              <Submit<MovementFormState>
                onSubmit={async (state) => {
                  const payload: CreateInventoryMovementInput = {
                    movementTypeId: state.movementTypeId!,
                    movementDate:
                      state.movementDate instanceof DateTime
                        ? state.movementDate
                        : new DateTime(state.movementDate ?? new Date()),
                    observation: state.observation,
                    userId: 1, // TODO: Get from auth context
                    sourceDocumentType: state.sourceDocumentType,
                    sourceDocumentId: state.sourceDocumentId,
                    details: state.details.map((d: any) => ({
                      itemId: d.itemId!,
                      quantity: Number(d.quantity),
                      unitCost: d.unitCost,
                      locationId: d.locationId,
                      lotId: d.lotId,
                    })),
                  };

                  if (isEditing) {
                    await createInventoryMovement(payload);
                  } else {
                    await createInventoryMovement(payload);
                  }
                  props.onSuccess?.();
                }}
                className="w-full py-4 px-6 text-white font-bold rounded-2xl shadow-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-95 transition-all shadow-indigo-500/30 flex items-center justify-center gap-2"
                data-testid="submit-btn"
              >
                <CubeIcon className="w-5 h-5" />
                {isEditing ? "Guardar Cambios" : "Crear Movimiento"}
              </Submit>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GeneralInfoCard({
  types,
  isReadOnly,
}: {
  types: MovementType[];
  isReadOnly: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
        <InformationCircleIcon className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg font-bold text-gray-900">
          Información General
        </h2>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tipo de Movimiento
          </label>
          <Form.Select.Int
            path="movementTypeId"
            required
            placeholder="- Seleccionar -"
            disabled={isReadOnly}
            data-testid="type-select"
          >
            <SelectItem value={0}>- Seleccionar -</SelectItem>
            {types.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </Form.Select.Int>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fecha
          </label>
          <Form.DatePicker
            path="movementDate"
            showTime
            placeholder="Seleccionar fecha..."
            disabled={isReadOnly}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Observación
          </label>
          <Form.TextArea
            path="observation"
            rows={3}
            placeholder="Escriba aquí cualquier detalle adicional..."
            className="w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50/30"
            disabled={isReadOnly}
          />
        </div>
      </div>
    </div>
  );
}

function DetailsCard({ isReadOnly }: { isReadOnly: boolean }) {
  const details = Form.useArray<MovementFormState["details"]>("details");
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    if (!isReadOnly) {
      listItems({ pageIndex: 0, pageSize: 100 }).then((res) => setItems(res.items));
      listLocations().then((res) => setLocations(res));
    }
  }, [isReadOnly]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CubeIcon className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-gray-900">
            Detalles del Movimiento
          </h2>

        </div>
        {!isReadOnly && (
          <button
            type="button"
            onClick={() =>
              details.addItem({ quantity: 1, unitCost: new Decimal(0) })
            }
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none transition-all"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Agregar Item
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ítem / Referencia</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ubicación</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Cant.</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">V. Unitario</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
              {!isReadOnly && <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Acción</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {details.length === 0 ? (
              <tr>
                <td colSpan={isReadOnly ? 5 : 6} className="px-6 py-12 text-center text-gray-400 italic">
                  No hay items agregados.
                </td>
              </tr>
            ) : (
              details.map((_item: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isReadOnly ? (
                      <div>
                        <div className="text-sm font-bold text-gray-900">{_item.itemName}</div>
                        <div className="text-xs text-gray-500 font-mono">{_item.itemCode}</div>
                        {_item.lotNumber && (
                          <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">
                            <BeakerIcon className="w-3 h-3" />
                            Lote: {_item.lotNumber}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Form.Select.Int
                        path="itemId"
                        required
                        placeholder="- Seleccionar -"
                        data-testid={`item-select-${index}`}
                      >
                        <SelectItem value={0}>- Seleccionar -</SelectItem>
                        {items.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.fullName} ({i.code})
                          </SelectItem>
                        ))}
                      </Form.Select.Int>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isReadOnly ? (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPinIcon className="w-4 h-4 text-gray-400" />
                        {_item.locationName}
                      </div>
                    ) : (
                      <Form.Select.Int
                        path="locationId"
                        required
                        placeholder="- Ubicación -"
                        data-testid={`location-select-${index}`}
                      >
                        <SelectItem value={0}>- Ubicación -</SelectItem>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.code} - {loc.name}
                          </SelectItem>
                        ))}

                      </Form.Select.Int>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {isReadOnly ? (
                      <span className="text-sm font-bold text-gray-900">
                        {Number(_item.quantity).toLocaleString()}
                      </span>
                    ) : (
                      <Form.Decimal
                        path="quantity"
                        required
                        data-testid={`quantity-input-${index}`}
                        className="w-24 rounded-lg border-gray-200 text-sm text-right focus:border-indigo-500 focus:ring-indigo-500 bg-transparent"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {isReadOnly ? (
                      <span className="text-sm text-gray-600 font-mono">
                        ${Number(_item.unitCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <Form.Decimal
                        path="unitCost"
                        data-testid={`unit-cost-input-${index}`}
                        className="w-32 rounded-lg border-gray-200 text-sm text-right focus:border-indigo-500 focus:ring-indigo-500 bg-transparent"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-indigo-600 font-mono">
                    ${(Number(_item.quantity || 0) * Number(_item.unitCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  {!isReadOnly && (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        type="button"
                        title="Remover linea"
                        aria-label="Remover linea"
                        onClick={() => details.removeItem(index)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  )}

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard() {
  const details = Form.useSelector(
    (state: any) => state.details || []
  ) as MovementFormState["details"];

  const totals = details.reduce(
    (acc: { items: number; quantity: number; totalCost: number }, curr) => {
      const qty = Number(curr.quantity || 0);
      const cost = Number(curr.unitCost || 0);
      return {
        items: acc.items + 1,
        quantity: acc.quantity + qty,
        totalCost: acc.totalCost + qty * cost,
      };
    },
    { items: 0, quantity: 0, totalCost: 0 }
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-900">Resumen</h2>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-medium">Líneas de movimiento:</span>
          <span className="text-gray-900 font-bold">{totals.items}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-medium">Cantidad total:</span>
          <span className="text-gray-900 font-bold">{totals.quantity.toLocaleString()} unids</span>
        </div>
        <div className="h-px bg-gray-100 my-2" />
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">Costo Total:</span>
          <span className="text-2xl font-black text-indigo-600 font-mono">
            ${totals.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="mt-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
          <div className="flex gap-3">
            <InformationCircleIcon className="w-5 h-5 text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-700 leading-relaxed font-medium">
              Los costos se calculan según el método de valoración configurado (FIFO).
              Los movimientos de salida consumirán las capas de costo disponibles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
