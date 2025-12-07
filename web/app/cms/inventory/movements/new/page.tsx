import { MovementForm } from "../MovementForm";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { listMovementTypes } from "@agape/inventory/movementType";

export async function onInit() {
  const types = await listMovementTypes(true); // Active only
  return {
    types,
  };
}

interface PageProps {
  types: Awaited<ReturnType<typeof listMovementTypes>>;
}

export default function NewMovementPage(props: PageProps) {
  const { navigate } = useRouter();
  const notify = useNotificacion();

  const handleSuccess = () => {
    notify({
      title: "Movimiento creado",
      message: "El movimiento de inventario se ha registrado exitosamente.",
      type: "success",
    });
    navigate(".."); // Go back to list
  };

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
              Nuevo Movimiento
            </h1>
          </div>
          <p className="text-gray-500 ml-9">
            Registra una entrada, salida o transferencia de inventario.
          </p>
        </div>
      </div>
      <MovementForm types={props.types} onSuccess={handleSuccess} />
    </div>
  );
}
