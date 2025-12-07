import { useEffect, useMemo, useState } from "react";
import FormProvider, { useAppDispatch, setAtPath } from "@/components/form";
import * as Input from "@/components/form/Input";
import Checkbox from "@/components/form/CheckBox";
import useInput from "@/components/form/Input/useInput";
import {
  upsertItem,
  type IItem,
  type IItemGood,
  type IItemService,
  type IItemRecord,
} from "@agape/catalogs/item";
import Decimal from "@utils/data/Decimal";
import InputImages from "./Images";
import Categories from "./Categories";
import { SubCategories } from "./SubCategories";
import { useEventEmitter } from "@/components/util/event-emitter";
import Submit from "@/components/ui/submit";

type ItemType = "good" | "service";

interface ItemFormProps {
  item?: IItemRecord;
  onSuccess?: () => void;
}

export function ItemForm(props: ItemFormProps) {
  const initialType: ItemType = props.item?.good
    ? "good"
    : props.item?.service
    ? "service"
    : "good";

  return (
    <FormProvider state={props.item} className="max-w-7xl mx-auto space-y-6">
      <ItemFormContent
        initialType={initialType}
        isEditing={!!props.item?.id}
        onSuccess={props.onSuccess}
      />
    </FormProvider>
  );
}

function ItemFormContent(props: {
  initialType: ItemType;
  isEditing: boolean;
  onSuccess?: () => void;
}) {
  const [itemType, setItemType] = useState<ItemType>(props.initialType);

  return (
    <>
      {/* Type Selector - Only show when creating new item */}
      {!props.isEditing && (
        <TypeSelector value={itemType} onChange={setItemType} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          <BasicInfoCard itemType={itemType} />

          {/* Type-specific Card */}
          {itemType === "good" ? <GoodDetailsCard /> : <ServiceDetailsCard />}

          {/* Media Card */}
          <MediaCard />
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Status & Price Card */}
          <StatusPriceCard />

          {/* Categorization Card */}
          <CategorizationCard />

          {/* Actions */}
          <div className="sticky bottom-6">
            <InsertUpdate itemType={itemType} onSuccess={props.onSuccess} />
          </div>
        </div>
      </div>
    </>
  );
}

function TypeSelector(props: {
  value: ItemType;
  onChange: (type: ItemType) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Tipo de Item
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => props.onChange("good")}
            className={`relative flex flex-col items-center p-6 rounded-xl border-2 transition-all ${
              props.value === "good"
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                props.value === "good"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <svg
                className="w-6 h-6"
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
            </div>
            <span
              className={`font-medium ${
                props.value === "good" ? "text-blue-700" : "text-gray-700"
              }`}
            >
              Producto
            </span>
            <span className="text-xs text-gray-500 mt-1 text-center">
              Bien fisico inventariable
            </span>
            {props.value === "good" && (
              <div className="absolute top-3 right-3">
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => props.onChange("service")}
            className={`relative flex flex-col items-center p-6 rounded-xl border-2 transition-all ${
              props.value === "service"
                ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                props.value === "service"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <svg
                className="w-6 h-6"
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
            </div>
            <span
              className={`font-medium ${
                props.value === "service" ? "text-purple-700" : "text-gray-700"
              }`}
            >
              Servicio
            </span>
            <span className="text-xs text-gray-500 mt-1 text-center">
              Servicio o trabajo
            </span>
            {props.value === "service" && (
              <div className="absolute top-3 right-3">
                <svg
                  className="w-5 h-5 text-purple-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function BasicInfoCard(props: { itemType: ItemType }) {
  const typeLabel = props.itemType === "good" ? "producto" : "servicio";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">
          Informacion Basica
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Detalles principales del {typeLabel}
        </p>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <Input.Text
            path="fullName"
            required
            placeholder={`Ej: ${
              props.itemType === "good"
                ? "Camiseta Premium Algodon"
                : "Consultoria Empresarial"
            }`}
            className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slogan / Subtitulo
          </label>
          <Input.Text
            path="slogan"
            placeholder={`Ej: ${
              props.itemType === "good"
                ? "La mejor calidad para tu dia a dia"
                : "Soluciones profesionales para tu negocio"
            }`}
            className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripcion
          </label>
          <Input.TextArea
            path="description"
            rows={4}
            placeholder={`Describe las caracteristicas y beneficios del ${typeLabel}...`}
            className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

function GoodDetailsCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-blue-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
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
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Detalles de Inventario
            </h2>
            <p className="text-sm text-gray-500">
              Configuracion de stock y unidades
            </p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidad de Medida
            </label>
            <GoodUomSelect />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Minimo
            </label>
            <Input.Decimal
              path="good.minStock"
              autoCleanup
              placeholder="0"
              className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Alerta cuando baje de este nivel
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Maximo
            </label>
            <Input.Decimal
              path="good.maxStock"
              autoCleanup
              placeholder="0"
              className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Capacidad maxima de almacenamiento
            </p>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Punto de Reorden
            </label>
            <Input.Decimal
              path="good.reorderPoint"
              autoCleanup
              placeholder="0"
              className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Nivel de stock para generar orden de compra
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoodUomSelect() {
  const [uomId, setUomId] = useInput<number>("good.uomId", 1, {
    materialize: true,
  });

  // TODO: Load from API when UOM catalog is available
  const units = [
    { id: 1, name: "Unidad (UND)" },
    { id: 2, name: "Kilogramo (KG)" },
    { id: 3, name: "Litro (LT)" },
    { id: 4, name: "Metro (MT)" },
    { id: 5, name: "Caja (CJ)" },
  ];

  return (
    <select
      value={uomId ?? 1}
      onChange={(e) => setUomId(parseInt(e.target.value, 10))}
      className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
    >
      {units.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ))}
    </select>
  );
}

function ServiceDetailsCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-purple-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
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
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Detalles del Servicio
            </h2>
            <p className="text-sm text-gray-500">
              Configuracion de duracion y recurrencia
            </p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duracion (minutos)
          </label>
          <Input.Int
            path="service.durationMinutes"
            autoCleanup
            min={0}
            placeholder="60"
            className="w-full rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Tiempo estimado del servicio
          </p>
        </div>

        <ServiceRecurringCheckbox />
      </div>
    </div>
  );
}

function ServiceRecurringCheckbox() {
  const [isRecurring, setIsRecurring] = useInput<boolean>(
    "service.isRecurring",
    false,
    { materialize: true }
  );

  return (
    <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
      <input
        type="checkbox"
        checked={isRecurring ?? false}
        onChange={(e) => setIsRecurring(e.target.checked)}
        className="h-5 w-5 mt-0.5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
      />
      <div>
        <label className="block text-sm font-medium text-gray-900">
          Servicio Recurrente
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Marcar si este servicio se presta de forma periodica (mensual,
          semanal, etc.)
        </p>
      </div>
    </div>
  );
}

function MediaCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">
          Galeria de Imagenes
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Sube imagenes de alta calidad
        </p>
      </div>
      <div className="p-6">
        <InputImages />
      </div>
    </div>
  );
}

function StatusPriceCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">Estado y Precio</h2>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center">
            <Checkbox
              materialize
              checked
              path="isEnabled"
              className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label className="ml-3 block text-sm font-medium text-gray-900">
              Item Habilitado
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio Base
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <Input.Decimal
              path="basePrice"
              required
              className="w-full rounded-lg border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rating Inicial
          </label>
          <Input.Int
            path="rating"
            min={0}
            max={5}
            className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">Valor entre 0 y 5</p>
        </div>
      </div>
    </div>
  );
}

function CategorizationCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">Categorizacion</h2>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoria
          </label>
          <Categories />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subcategoria
          </label>
          <SubCategories />
        </div>
      </div>
    </div>
  );
}

function InsertUpdate(props: { itemType: ItemType; onSuccess?: () => void }) {
  const dispatch = useAppDispatch();
  const emitter = useEventEmitter();
  const updateFormEvent = useMemo(() => Symbol("updateForm"), []);

  useEffect(() => {
    return emitter.on(updateFormEvent, ((record: IItemRecord) => {
      dispatch(setAtPath({ path: [], value: record }));
    }) as any);
  }, [emitter, updateFormEvent, dispatch]);

  const buttonColor =
    props.itemType === "good"
      ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
      : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/30";

  const buttonLabel =
    props.itemType === "good" ? "Guardar Producto" : "Guardar Servicio";

  return (
    <Submit
      onSubmit={async (state: any) => {
        const basePayload = {
          id: state.id,
          code: state.code || "ITM-" + Date.now(),
          fullName: state.fullName,
          slogan: state.slogan,
          description: state.description,
          isEnabled: state.isEnabled ?? true,
          basePrice: new Decimal(state.basePrice ?? 0),
          rating: state.rating ?? 0,
          categoryId: state.categoryId,
          subcategoryId: state.subcategoryId,
          images: state.images ?? [],
        };

        let payload: IItem;

        if (props.itemType === "good") {
          payload = {
            ...basePayload,
            good: {
              uomId: state.good?.uomId ?? 1,
              minStock: state.good?.minStock
                ? new Decimal(state.good.minStock)
                : undefined,
              maxStock: state.good?.maxStock
                ? new Decimal(state.good.maxStock)
                : undefined,
              reorderPoint: state.good?.reorderPoint
                ? new Decimal(state.good.reorderPoint)
                : undefined,
            },
          } as IItemGood;
        } else {
          payload = {
            ...basePayload,
            service: {
              durationMinutes: state.service?.durationMinutes ?? undefined,
              isRecurring: state.service?.isRecurring ?? false,
            },
          } as IItemService;
        }

        const record = await upsertItem(payload);
        props.onSuccess?.();
        return record;
      }}
      event={updateFormEvent}
      className={`w-full py-3 px-4 text-white font-medium rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${buttonColor}`}
    >
      {buttonLabel}
    </Submit>
  );
}

// Keep backward compatibility export
export { ItemForm as Inventory };
