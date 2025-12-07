import { useEffect, useMemo, useState } from "react";
import { useNotificacion } from "@/components/ui/notification";
import type { ReactNode } from "react";
import clsx from "clsx";
import {
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  FolderIcon,
  FolderOpenIcon,
  TagIcon,
  BuildingStorefrontIcon,
  ArrowsUpDownIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import {
  listCategories,
  upsertCategory,
  type CategoryWithSubcategoriesDto as Category,
} from "@agape/inventory/category";
import { listLocations, upsertLocation } from "@agape/inventory/location";
import {
  listMovementTypes,
  upsertMovementType,
} from "@agape/inventory/movementType";
import { useEventEmitter } from "@/components/util/event-emitter";
import Form, { Path, useInputArray } from "@/components/form";
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

const state: Category[] = [];

interface Location {
  id?: number;
  name: string;
  isEnabled: boolean;
}

interface MovementType {
  id?: number;
  name: string;
  factor: number;
  affectsStock: boolean;
  isEnabled: boolean;
  documentTypeId: number;
}

export async function onInit() {
  const [locations, movementTypes] = await Promise.all([
    listLocations(),
    listMovementTypes(),
  ]);

  return {
    locations,
    movementTypes,
  };
}

function LocationModalWrapper(
  props: {
    location: Location;
    onSave: (data: Location) => Promise<void>;
  } & PortalInjectedProps
) {
  return (
    <PortalModal
      {...props}
      title={props.location.id ? "Editar ubicación" : "Nueva ubicación"}
      size="md"
    >
      <LocationForm
        location={props.location}
        onSave={props.onSave}
        onClose={() => {}}
      />
    </PortalModal>
  );
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

const useLocationModal = createPortalHook(LocationModalWrapper);
const useMovementModal = createPortalHook(MovementModalWrapper);

export default function InventoryPage(props: {
  locations: Location[];
  movementTypes: MovementType[];
}) {
  const notify = useNotificacion();
  const [locations, setLocations] = useState<Location[]>(props.locations);
  const [movementTypes, setMovementTypes] = useState<MovementType[]>(
    props.movementTypes
  );
  const [loading, setLoading] = useState(false);

  const showLocation = useLocationModal();
  const showMovement = useMovementModal();
  const showConfirm = useConfirmModal();

  async function loadAncillary() {
    try {
      setLoading(true);
      const [locs, moves] = await Promise.all([
        listLocations(),
        listMovementTypes(),
      ]);
      setLocations(locs);
      setMovementTypes(moves);
    } catch (error) {
      console.error("Error cargando catálogos de inventario:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveLocation(data: {
    id?: number;
    name: string;
    isEnabled: boolean;
  }) {
    await upsertLocation(data);
    await loadAncillary();
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
    await loadAncillary();
  }

  async function confirmDeleteLocation(item: Location) {
    showConfirm({
      title: "Eliminar registro",
      message: `¿Seguro que deseas eliminar "${item.name}"?`,
      confirmText: "Eliminar",
      variant: "danger",
      onConfirm: async () => {
        try {
          await upsertLocation({ ...item, isEnabled: false });
          await loadAncillary();
        } catch (error) {
          console.error("Error al eliminar:", error);
          notify({ payload: "No se pudo eliminar el registro", type: "error" });
        }
      },
    });
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
          await loadAncillary();
        } catch (error) {
          console.error("Error al eliminar:", error);
          notify({ payload: "No se pudo eliminar el registro", type: "error" });
        }
      },
    });
  }

  return (
    <Form state={state}>
      <div className="space-y-8">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
              Configuración de inventario
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
              Categorías, ubicaciones y tipos de movimiento
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mantén ordenado el catálogo para productos, ubicaciones físicas y
              flujos de entrada/salida.
            </p>
          </div>
          <InsertUpdate />
        </header>

        <div className="grid gap-6 2xl:grid-cols-5">
          <div className="2xl:col-span-3 space-y-4">
            <Card
              title="Categorías y subcategorías"
              icon={<FolderIcon className="w-5 h-5" />}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <Categories />
                </div>
                <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <FCategory />
                </div>
              </div>
            </Card>
          </div>

          <div className="2xl:col-span-2 space-y-4">
            <Card
              title="Ubicaciones de almacén"
              icon={<BuildingStorefrontIcon className="w-5 h-5" />}
              action={
                <button
                  type="button"
                  onClick={() =>
                    showLocation({
                      location: { name: "", isEnabled: true },
                      onSave: saveLocation,
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Nueva ubicación
                </button>
              }
            >
              <StackedList<Location>
                items={locations}
                loading={loading}
                empty="Aún no hay ubicaciones"
                render={(item) => ({
                  title: item.name,
                  subtitle: `ID ${item.id}`,
                  badge: item.isEnabled ? "Activa" : "Inactiva",
                  badgeTone: item.isEnabled ? "green" : "amber",
                  onEdit: () =>
                    showLocation({ location: item, onSave: saveLocation }),
                  onDelete: () => confirmDeleteLocation(item),
                })}
              />
            </Card>

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
                  subtitle: `Factor ${item.factor > 0 ? "+" : ""}${
                    item.factor
                  }`,
                  badge: item.affectsStock ? "Afecta stock" : "Solo registro",
                  badgeTone: item.affectsStock ? "blue" : "gray",
                  extraChip: item.isEnabled ? "Activo" : "Inactivo",
                  extraTone: item.isEnabled ? "green" : "amber",
                  onEdit: () =>
                    showMovement({ movement: item, onSave: saveMovement }),
                  onDelete: () => confirmDeleteMovement(item),
                })}
              />
            </Card>
          </div>
        </div>
      </div>
    </Form>
  );
}

function InsertUpdate() {
  const emitter = useEventEmitter();
  const setCategoriesEvent = useMemo(() => Symbol("setCategories"), []);

  useEffect(() => {
    return emitter.on(setCategoriesEvent, ((categories: Category[]) => {
      emitter.emit("setCategories", categories);
    }) as any);
  }, [emitter, setCategoriesEvent]);

  return (
    <Submit
      onSubmit={async (state: Category[]) => {
        await Promise.all(state.map((cat) => upsertCategory(cat)));
        return await listCategories();
      }}
      event={setCategoriesEvent}
      className={clsx(
        "flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-all shadow-sm",
        "bg-indigo-600 hover:bg-indigo-700 hover:shadow-md"
      )}
    >
      <CheckCircleIcon className="w-5 h-5 mr-2" />
      Guardar Cambios
    </Submit>
  );
}

export function Categories() {
  const emitter = useEventEmitter();
  const categories = useInputArray<Category[]>();
  const [current, setIndex] = useState<number>(0);

  useEffect(() => {
    listCategories()
      .then((payload) => {
        emitter.emit("setCategories", payload);
      })
      .catch((error) => emitter.emit("failLoadCategories", error));

    return emitter.on("setCategories", ((payload: Category[]) => {
      categories.set(payload);
      setIndex(0);
    }) as any);
  }, [emitter]);

  return (
    <>
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/70">
        <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
          <FolderIcon className="w-5 h-5 mr-2 text-gray-400" />
          Categorías
        </h3>
        <button
          type="button"
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-indigo-600 dark:text-indigo-400 transition-all shadow-sm hover:shadow"
          onClick={(e) => {
            e.stopPropagation();
            categories.addItem({
              fullName: "Nueva Categoría",
              isEnabled: true,
              subcategories: [],
            } as any);
          }}
          title="Agregar Categoría"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {categories.map((cat, index, paths) => (
          <div
            key={index}
            className={clsx(
              "group flex items-center p-3 rounded-lg transition-all cursor-pointer border border-transparent",
              index === current
                ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30 shadow-sm"
                : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIndex(index);
              emitter.emit("setCategory", paths);
            }}
          >
            <Checkbox
              path={`isEnabled`}
              defaultChecked={cat.isEnabled}
              className="mr-3"
            />

            <div className="flex-1 min-w-0">
              <Input.Text
                required
                path="fullName"
                className="bg-transparent border-none focus:ring-0 p-0 w-full text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400"
                placeholder="Nombre de categoría"
              />
              <p className="text-xs text-gray-500 truncate">
                {cat.subcategories?.length || 0} subcategorías
              </p>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
              {!cat.id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    categories.removeItem(index);
                  }}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No hay categorías creadas
          </div>
        )}
      </div>
    </>
  );
}

function FCategory() {
  const emitter = useEventEmitter();
  const [category, setCategory] = useState<string[]>([]);

  useEffect(() => emitter.on("setCategory", setCategory as any), [emitter]);

  return (
    <Path value={category}>
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
        <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
          <FolderOpenIcon className="w-5 h-5 mr-2 text-gray-400" />
          Subcategorías
        </h3>
        <button
          type="button"
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-indigo-600 dark:text-indigo-400 transition-all shadow-sm hover:shadow"
          onClick={(e) => {
            e.stopPropagation();
            emitter.emit("addSubcategories");
          }}
          title="Agregar Subcategoría"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <SubCategories />
      </div>
    </Path>
  );
}

function SubCategories() {
  const emitter = useEventEmitter();
  const subcategories = useInputArray<ISubCategories[]>("subcategories");
  const [current, setIndex] = useState<number | null>(null);

  useEffect(() => {
    return emitter.on("addSubcategories", (() => {
      subcategories.addItem({
        fullName: "Nueva Subcategoría",
        isEnabled: true,
      });
    }) as any);
  }, [emitter, subcategories]);

  if (!subcategories.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <TagIcon className="w-12 h-12 mb-2 opacity-20" />
        <p className="text-sm">
          Selecciona una categoría para ver sus subcategorías
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {subcategories.map((payload, index) => (
        <div
          key={index}
          className={clsx(
            "group flex items-center p-3 rounded-lg border transition-all",
            index === current
              ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
          )}
          onClick={() => setIndex(index)}
        >
          <Checkbox path="isEnabled" className="mr-3" />

          <div className="flex-1 min-w-0">
            <Input.Text
              path="fullName"
              required
              placeholder="Nombre de subcategoría"
              className="bg-transparent border-none focus:ring-0 p-0 w-full text-sm text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            {!payload.id && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  subcategories.removeItem(index);
                }}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-md transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Types
 */
interface ISubCategories {
  id?: number;
  fullName: string;
  isEnabled: boolean;
}

function Card({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-200">
            {icon}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function StackedList<T>({
  items,
  loading,
  empty,
  render,
}: {
  items: T[];
  loading: boolean;
  empty: string;
  render: (item: T) => {
    title: string;
    subtitle?: string;
    badge?: string;
    badgeTone?: "green" | "amber" | "blue" | "gray";
    extraChip?: string;
    extraTone?: "green" | "amber" | "blue" | "gray";
    onEdit: () => void;
    onDelete: () => void;
  };
}) {
  const badgeMap: Record<string, string> = {
    green:
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
    amber:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        Cargando...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        {empty}
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800">
      {items.map((item, idx) => {
        const row = render(item);
        return (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {row.title}
              </p>
              {row.subtitle ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {row.subtitle}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 mt-1">
                {row.badge ? (
                  <span
                    className={clsx(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                      badgeMap[row.badgeTone || "gray"]
                    )}
                  >
                    {row.badge}
                  </span>
                ) : null}
                {row.extraChip ? (
                  <span
                    className={clsx(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                      badgeMap[row.extraTone || "gray"]
                    )}
                  >
                    {row.extraChip}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={row.onEdit}
                className="rounded-md p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/40 transition-colors"
                title="Editar"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={row.onDelete}
                className="rounded-md p-2 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/40 transition-colors"
                title="Eliminar"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1.5 block">
      <span className="text-sm font-medium text-gray-900 dark:text-white">
        {label}
      </span>
      {description ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      ) : null}
      {children}
    </label>
  );
}

function LocationForm({
  location,
  onClose,
  onSave,
}: {
  location: Location;
  onClose: () => void;
  onSave: (data: {
    id?: number;
    name: string;
    isEnabled: boolean;
  }) => Promise<void>;
}) {
  const initialState = {
    id: location.id || undefined,
    name: location.name,
    isEnabled: location.isEnabled ?? true,
  };

  async function handleSubmit(data: {
    id?: number;
    name: string;
    isEnabled: boolean;
  }) {
    await onSave({
      id: data.id,
      name: data.name,
      isEnabled: data.isEnabled,
    });
    onClose();
  }

  return (
    <Form state={initialState}>
      <div className="space-y-4 p-5">
        <label className="space-y-1.5 block">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Nombre de ubicación
          </span>
          <Input.Text
            path="name"
            required
            placeholder="Ej: Almacén Central"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </label>
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
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
        >
          {initialState.id ? "Guardar cambios" : "Crear ubicación"}
        </Submit>
      </div>
    </Form>
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
