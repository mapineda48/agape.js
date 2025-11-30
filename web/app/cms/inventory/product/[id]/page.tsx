import { useEffect, useState } from "react";
import { Inventory } from "../index";
import { useRouter } from "@/components/router/router-hook";
import { getProduct, type Product } from "@agape/cms/inventory/product";
import { useNotificacion } from "@/components/ui/notification";

export default function EditProductPage() {
  const { params, navigate } = useRouter();
  const notify = useNotificacion();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const id = parseInt(params.id, 10);
      getProduct(id)
        .then((record) => {
          setProduct(record);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">
          Producto no encontrado
        </h2>
        <p className="text-gray-500 mt-2">
          El producto que intentas editar no existe o ha sido eliminado.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
          <p className="text-gray-500">Modifica la información del producto.</p>
        </div>
        <button
          onClick={() => navigate("../../products")}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Ver Lista de Productos
        </button>
      </div>
      <Inventory
        product={product}
        onSuccess={() => navigate("../../products")}
      />
    </div>
  );
}
