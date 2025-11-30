import { useEffect, useState } from "react";
import { Inventory } from "../index";
import { useRouter } from "@/components/router/router-hook";
import { getProduct, type Product } from "@agape/cms/inventory/product";
import { useNotificacion } from "@/components/ui/notification";

export default function EditProductPage() {
  const { params } = useRouter();
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
        <p className="text-gray-500">Modifica la información del producto.</p>
      </div>
      <Inventory product={product} />
    </div>
  );
}
