import { useEffect, useState } from "react";
import { MovementForm } from "../MovementForm";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import {
  getInventoryMovement,
  type getInventoryMovement as GetMovementFn,
} from "@agape/inventory/movement";
import { listMovementTypes } from "@agape/inventory/movementType";

export async function onInit() {
  const types = await listMovementTypes(false); // All types (including inactive) for edit view
  return { types };
}

interface PageProps {
  types: Awaited<ReturnType<typeof listMovementTypes>>;
}

export default function EditMovementPage(props: PageProps) {
  const { params, navigate } = useRouter();
  const notify = useNotificacion();
  const [movement, setMovement] = useState<Awaited<
    ReturnType<typeof GetMovementFn>
  > | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const id = parseInt(params.id, 10);
      getInventoryMovement(id)
        .then((record) => {
          setMovement(record);
        })
        .catch((error) => {
          notify({ payload: error });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [params.id, notify]);

  const handleSuccess = () => {
    notify({
      title: "Movimiento actualizado",
      message: "Los cambios se han guardado exitosamente.",
      type: "success",
    });
    navigate("../.."); // Back to list
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!movement) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">
          Movimiento no encontrado
        </h2>
        <button
          onClick={() => navigate("..")}
          className="text-indigo-600 hover:underline mt-4"
        >
          Volver al listado
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate("..")}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Ver / Editar Movimiento
            </h1>
          </div>
          <div className="ml-9 flex items-center gap-2 mt-1">
            <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-700">
              {movement.documentNumberFull}
            </span>
            <span className="text-gray-400">|</span>
            <p className="text-gray-500">
              Consulta los detalles de este movimiento.
            </p>
          </div>
        </div>
      </div>

      <MovementForm
        types={props.types}
        initialData={movement}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
