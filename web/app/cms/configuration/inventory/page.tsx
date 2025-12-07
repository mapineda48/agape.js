import { useState } from "react";
import { useNotificacion } from "@/components/ui/notification";
import type { ReactNode } from "react";
import clsx from "clsx";
import {
  PlusIcon,
  TrashIcon,
  FolderIcon,
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
  const [categories, locations, movementTypes] = await Promise.all([
    listCategories(),
    listLocations(),
    listMovementTypes(),
  ]);

  return {
    categories,
    locations,
    movementTypes,
  };
}

function CategoryModalWrapper(
  props: {
    category: Category;
    onSave: (data: Category) => Promise<void>;
  } & PortalInjectedProps
) {
  return (
    <PortalModal
      {...props}
      title={props.category.id ? "Editar categoría" : "Nueva categoría"}
      size="md"
    >
      <CategoryForm
        category={props.category}
        onSave={props.onSave}
        onClose={() => {}}
      />
    </PortalModal>
  );
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

const useCategoryModal = createPortalHook(CategoryModalWrapper);
const useLocationModal = createPortalHook(LocationModalWrapper);
const useMovementModal = createPortalHook(MovementModalWrapper);

export default function InventoryPage(props: {
  categories: Category[];
  locations: Location[];
  movementTypes: MovementType[];
}) {
  const notify = useNotificacion();
  const [categories, setCategories] = useState<Category[]>(props.categories);
  const [locations, setLocations] = useState<Location[]>(props.locations);
  const [movementTypes, setMovementTypes] = useState<MovementType[]>(
    props.movementTypes
  );
  const [loading, setLoading] = useState(false);

  const showCategory = useCategoryModal();
  const showLocation = useLocationModal();
  const showMovement = useMovementModal();
  const showConfirm = useConfirmModal();

  async function loadAncillary() {
    try {
      setLoading(true);
      const [cats, locs, moves] = await Promise.all([
        listCategories(),
        listLocations(),
        listMovementTypes(),
      ]);
      setCategories(cats);
      setLocations(locs);
      setMovementTypes(moves);
    } catch (error) {
      console.error("Error cargando catálogos de inventario:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveCategory(data: Category) {
    await upsertCategory(data);
    await loadAncillary();
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

  async function confirmDeleteCategory(item: Category) {
    showConfirm({
      title: "Eliminar registro",
      message: `¿Seguro que deseas eliminar "${item.fullName}"?`,
      confirmText: "Eliminar",
      variant: "danger",
      onConfirm: async () => {
        try {
          await upsertCategory({ ...item, isEnabled: false });
          await loadAncillary();
        } catch (error) {
          console.error("Error al eliminar:", error);
          notify({ payload: "No se pudo eliminar el registro", type: "error" });
        }
      },
    });
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
      </header>

      <div className="grid gap-6 2xl:grid-cols-5">
        <div className="2xl:col-span-3 space-y-4">
          <Card
            title="Categorías"
            icon={<FolderIcon className="w-5 h-5" />}
            action={
              <button
                type="button"
                onClick={() =>
                  showCategory({
                    category: {
                      fullName: "",
                      isEnabled: true,
                      subcategories: [],
                    } as any,
                    onSave: saveCategory,
                  })
                }
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Nueva categoría
              </button>
            }
          >
            <StackedList<Category>
              items={categories}
              loading={loading}
              empty="Aún no hay categorías"
              render={(item) => ({
                title: item.fullName,
                subtitle: `${item.subcategories?.length || 0} subcategorías`,
                badge: item.isEnabled ? "Activa" : "Inactiva",
                badgeTone: item.isEnabled ? "green" : "amber",
                onEdit: () =>
                  showCategory({ category: item, onSave: saveCategory }),
                onDelete: () => confirmDeleteCategory(item),
              })}
            />
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
                subtitle: `Factor ${item.factor > 0 ? "+" : ""}${item.factor}`,
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
  );
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

function CategoryForm({
  category,
  onClose,
  onSave,
}: {
  category: Category;
  onClose: () => void;
  onSave: (data: Category) => Promise<void>;
}) {
  const initialState = {
    id: category.id || undefined,
    fullName: category.fullName,
    isEnabled: category.isEnabled ?? true,
    subcategories: category.subcategories || [],
  };

  async function handleSubmit(data: typeof initialState) {
    await onSave(data);
    onClose();
  }

  return (
    <Form state={initialState}>
      <div className="space-y-4 p-5">
        <label className="space-y-1.5 block">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Nombre de categoría
          </span>
          <Input.Text
            path="fullName"
            required
            placeholder="Ej: Electrónica"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </label>
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
          <Checkbox
            path="isEnabled"
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-800 dark:text-gray-200">
            Activa
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
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
        >
          {initialState.id ? "Guardar cambios" : "Crear categoría"}
        </Submit>
      </div>
    </Form>
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
            Activa
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
