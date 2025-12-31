import { useEffect, useState, useCallback } from "react";
import { MovementForm } from "../MovementForm";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import {
  getInventoryMovement,
  postInventoryMovement,
  cancelInventoryMovement,
  type getInventoryMovement as GetMovementFn,
} from "@agape/inventory/movement";
import { listMovementTypes } from "@agape/inventory/movementType";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  PrinterIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  FolderOpenIcon
} from "@heroicons/react/24/outline";
import { clsx } from "clsx";

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

  const loadMovement = useCallback(() => {
    if (params.id) {
      const id = parseInt(params.id, 10);
      setLoading(true);
      getInventoryMovement(id)
        .then((record) => {
          setMovement(record);
        })
        .catch((error: any) => {
          notify({ payload: error });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [params.id, notify]);

  useEffect(() => {
    loadMovement();
  }, [loadMovement]);

  const handlePost = async () => {
    if (!movement?.id) return;
    try {
      await postInventoryMovement(movement.id);
      notify({
        title: "Movimiento Procesado",
        payload: "El movimiento ha sido contabilizado exitosamente en el stock.",
        type: "success",
      });
      loadMovement();
    } catch (error) {
      notify({ payload: error });
    }
  };

  const handleCancel = async () => {
    if (!movement?.id) return;
    const reason = window.prompt("Motivo de cancelación:");
    if (reason === null) return; // Cancelled prompt

    try {
      await cancelInventoryMovement(movement.id, reason);
      notify({
        title: "Movimiento Anulado",
        payload: "El movimiento ha sido cancelado y el stock ha sido revertido si aplicaba.",
        type: "info",
      });
      loadMovement();
    } catch (error) {
      notify({ payload: error });
    }
  };

  const handleSuccess = () => {
    notify({
      title: "Cambios guardados",
      payload: "El movimiento ha sido actualizado correctamente.",
      type: "success",
    });
    loadMovement();
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent shadow-lg"></div>
        <p className="text-gray-500 font-medium animate-pulse">Cargando detalles del movimiento...</p>
      </div>
    );
  }

  if (!movement) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 m-8">
        <FolderOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          Movimiento no encontrado
        </h2>
        <p className="text-gray-500 mb-8">El registro solicitado no existe o ha sido eliminado.</p>
        <button
          onClick={() => navigate("..")}
          className="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Volver al listado
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Dynamic Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 backdrop-blur-md bg-white/80">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("..")}
                className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-xl border border-transparent hover:border-indigo-100"
                title="Volver"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                    {movement.documentNumberFull}
                  </h1>
                  <StatusBadge status={movement.status} />
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 font-medium">
                  <span className="bg-gray-100 px-2.5 py-0.5 rounded-lg text-gray-700 font-mono text-[12px] border border-gray-200">
                    ID: #{movement.id}
                  </span>
                  <span className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
                    <FolderOpenIcon className="w-4 h-4" />
                    {movement.movementTypeName}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Secondary Actions */}
              <button className="inline-flex items-center px-4 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                <PrinterIcon className="w-4 h-4 mr-2" />
                Imprimir
              </button>

              {/* Status Specific Actions */}
              {movement.status === "draft" && (
                <>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all"
                  >
                    <XCircleIcon className="w-4 h-4 mr-2" />
                    Anular
                  </button>
                  <button
                    onClick={handlePost}
                    className="inline-flex items-center px-6 py-2.5 text-sm font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Procesar Movimiento
                  </button>
                </>
              )}

              {movement.status === "posted" && (
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all"
                >
                  <XCircleIcon className="w-4 h-4 mr-2" />
                  Solicitar Reversión
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <InfoCard
            icon={UserIcon}
            label="Registrado por"
            value={(movement as any).employeeFullName || "N/A"}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <InfoCard
            icon={CalendarIcon}
            label="Fecha del Movimiento"
            value={new Date(movement.movementDate as any).toLocaleDateString(undefined, { dateStyle: 'long' })}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
          />
          <InfoCard
            icon={ClockIcon}
            label="Estado Actual"
            value={STATUS_LABELS[movement.status] || movement.status}
            color={STATUS_COLORS[movement.status]?.text}
            bgColor={STATUS_COLORS[movement.status]?.bg}
          />
          {movement.sourceDocumentType && (
            <InfoCard
              icon={FolderOpenIcon}
              label={`Origen: ${movement.sourceDocumentType}`}
              value={`#${movement.sourceDocumentId}`}
              color="text-amber-600"
              bgColor="bg-amber-50"
            />
          )}
        </div>

        <div className="relative">
          <MovementForm
            types={props.types}
            initialData={movement}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, color, bgColor }: any) {
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:scale-[1.02]">
      <div className={clsx("p-3 rounded-2xl shrink-0", bgColor, color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-black text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador - Por Procesar",
  posted: "Posteado - Contabilizado",
  cancelled: "Anulado - Sin Efecto",
};

const STATUS_COLORS: Record<string, { bg: string, text: string, border: string, icon: any }> = {
  draft: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: ClockIcon,
  },
  posted: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircleIcon,
  },
  cancelled: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: XCircleIcon,
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_COLORS[status] || STATUS_COLORS.draft;
  const Icon = config.icon;

  return (
    <span className={clsx(
      "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black border uppercase tracking-widest",
      config.bg, config.text, config.border
    )}>
      <Icon className="w-4 h-4" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}
