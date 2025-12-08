import { useState, useMemo } from "react";
import clsx from "clsx";
import { useNotificacion } from "@/components/ui/notification";
import {
  PlusIcon,
  BuildingStorefrontIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { listLocations, upsertLocation } from "@agape/inventory/location";
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
import { Card, StackedList, Field } from "./components";

interface Location {
  id?: number;
  name: string;
  isEnabled: boolean;
}

interface LocationFilters {
  search: string;
  activeOnly: boolean;
}

/**
 * Form state interface for Location creation/editing.
 */
interface LocationFormState {
  id?: number;
  name: string;
  isEnabled: boolean;
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

function LocationFilterModalWrapper(
  props: {
    filters: LocationFilters;
    onApply: (filters: LocationFilters) => void;
  } & PortalInjectedProps
) {
  return (
    <PortalModal {...props} title="Filtrar ubicaciones" size="sm">
      <LocationFilterForm
        initialFilters={props.filters}
        onApply={props.onApply}
        onClose={() => props.close()}
      />
    </PortalModal>
  );
}

function LocationFilterForm({
  initialFilters,
  onApply,
  onClose,
}: {
  initialFilters: LocationFilters;
  onApply: (filters: LocationFilters) => void;
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
            placeholder="Ej: Almacén"
            value={localFilters.search}
            onChange={(e) =>
              setLocalFilters((prev) => ({ ...prev, search: e.target.value }))
            }
          />
        </Field>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="loc-activeOnly"
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
            htmlFor="loc-activeOnly"
            className="text-sm text-gray-900 dark:text-white"
          >
            Solo activas
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
  const initialState: LocationFormState = {
    id: location.id || undefined,
    name: location.name,
    isEnabled: location.isEnabled ?? true,
  };

  async function handleSubmit(data: LocationFormState) {
    await onSave({
      id: data.id,
      name: data.name,
      isEnabled: data.isEnabled,
    });
    onClose();
  }

  return (
    <Form<LocationFormState> state={initialState}>
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
        <Submit<LocationFormState>
          onSubmit={handleSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
        >
          {initialState.id ? "Guardar cambios" : "Crear ubicación"}
        </Submit>
      </div>
    </Form>
  );
}

const useLocationModal = createPortalHook(LocationModalWrapper);
const useLocationFilterModal = createPortalHook(LocationFilterModalWrapper);

export default function LocationList(props: { locations: Location[] }) {
  const notify = useNotificacion();
  const [locations, setLocations] = useState<Location[]>(props.locations);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState<LocationFilters>({
    search: "",
    activeOnly: true,
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const showLocation = useLocationModal();
  const showFilter = useLocationFilterModal();
  const showConfirm = useConfirmModal();

  async function loadLocations() {
    try {
      setLoading(true);
      const locs = await listLocations();
      setLocations(locs);
    } catch (error) {
      console.error("Error cargando ubicaciones:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLocations = useMemo(() => {
    return locations.filter((item) => {
      if (
        filters.search &&
        !item.name.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.activeOnly && !item.isEnabled) {
        return false;
      }
      return true;
    });
  }, [locations, filters]);

  const paginatedLocations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLocations.slice(start, start + pageSize);
  }, [filteredLocations, currentPage]);

  const totalPages = Math.ceil(filteredLocations.length / pageSize);

  async function saveLocation(data: {
    id?: number;
    name: string;
    isEnabled: boolean;
  }) {
    await upsertLocation(data);
    await loadLocations();
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
          await loadLocations();
        } catch (error) {
          console.error("Error al eliminar:", error);
          notify({ payload: "No se pudo eliminar el registro", type: "error" });
        }
      },
    });
  }

  return (
    <Card
      title="Ubicaciones de almacén"
      icon={<BuildingStorefrontIcon className="w-5 h-5" />}
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
              filters.search || !filters.activeOnly
                ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-transparent dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800"
            )}
            title="Filtrar ubicaciones"
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
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
        </div>
      }
    >
      <StackedList<Location>
        items={paginatedLocations}
        loading={loading}
        empty="No se encontraron ubicaciones"
        render={(item) => ({
          title: item.name,
          subtitle: `ID ${item.id}`,
          badge: item.isEnabled ? "Activa" : "Inactiva",
          badgeTone: item.isEnabled ? "green" : "amber",
          onEdit: () => showLocation({ location: item, onSave: saveLocation }),
          onDelete: () => confirmDeleteLocation(item),
        })}
        pagination={{
          currentPage: currentPage,
          totalPages: totalPages,
          onPageChange: setCurrentPage,
          totalItems: filteredLocations.length,
          startIndex: (currentPage - 1) * pageSize,
          endIndex: (currentPage - 1) * pageSize + paginatedLocations.length,
        }}
      />
    </Card>
  );
}
