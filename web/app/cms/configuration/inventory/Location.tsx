import { useState } from "react";
import { useNotificacion } from "@/components/ui/notification";
import { PlusIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline";
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
import { Card, StackedList } from "./components";

interface Location {
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

const useLocationModal = createPortalHook(LocationModalWrapper);

export default function LocationList(props: { locations: Location[] }) {
  const notify = useNotificacion();
  const [locations, setLocations] = useState<Location[]>(props.locations);
  const [loading, setLoading] = useState(false);

  const showLocation = useLocationModal();
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
          onEdit: () => showLocation({ location: item, onSave: saveLocation }),
          onDelete: () => confirmDeleteLocation(item),
        })}
      />
    </Card>
  );
}
