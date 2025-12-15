import { useEffect, useState } from "react";
import { ItemForm } from "../index";
import { useRouter } from "@/components/router/router-hook";
import { getItemById, type IItemRecord } from "@agape/catalogs/item";
import { useNotificacion } from "@/components/ui/notification";

export default function EditItemPage() {
  const { params, navigate } = useRouter();
  const notify = useNotificacion();
  const [item, setItem] = useState<IItemRecord | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const id = parseInt(params.id, 10);
      getItemById(id)
        .then((record) => {
          setItem(record);
        })
        .catch((error) => {
          notify({ payload: error });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [params.id, notify]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">
          Item no encontrado
        </h2>
        <p className="text-gray-500 mt-2">
          El item que intentas editar no existe o ha sido eliminado.
        </p>
      </div>
    );
  }

  const itemTypeLabel = item.good ? "Producto" : item.service ? "Servicio" : "Item";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Editar {itemTypeLabel}
            </h1>
            {item.good && (
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                Producto
              </span>
            )}
            {item.service && (
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                Servicio
              </span>
            )}
          </div>
          <p className="text-gray-500">Modifica la informacion del item.</p>
        </div>
        <button
          onClick={() => navigate("../../products")}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Ver Catalogo
        </button>
      </div>
      <ItemForm item={item} onSuccess={() => navigate("../../products")} />
    </div>
  );
}
