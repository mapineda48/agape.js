import { useEffect, useState } from "react";
import { useEmitter } from "@/components/event-emiter";
import FormProvider, { useForm } from "@/components/form";
import Input from "@/components/form/Input";
import Checkbox from "@/components/form/CheckBox";
import { upsertProduct, type Product } from "@agape/cms/inventory/product";
import InputImages from "./Images";
import { PropsPortal, withPortalToRoot } from "@/components/Portals";
import { useNotificacion } from "@/components/ui/notification";
import Categories from "./Categories";
import { SubCategories } from "./SubCategories";

export function Inventory(props: { product?: Product }) {
    console.log(props);
    return (
        <FormProvider state={props.product} className="max-w-2xl mx-auto space-y-6 p-6 bg-white rounded shadow">
            {/* Nombre */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Nombre
                </label>
                <Input.Text
                    path="fullName"
                    required
                    className="mt-1 block w-full border-gray-300 rounded p-2"
                />
            </div>

            {/* Slogan */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Slogan
                </label>
                <Input.Text
                    path="slogan"
                    required
                    className="mt-1 block w-full border-gray-300 rounded p-2"
                />
            </div>

            {/* Descripción */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Descripción
                </label>
                <Input.TextArea
                    path="description"
                    className="mt-1 block w-full border-gray-300 rounded p-2"
                    rows={4}
                />
            </div>

            {/* Habilitado */}
            <div className="flex items-center">
                <Checkbox
                    checked
                    path="isActive"
                    className="h-4 w-4 text-blue-600"
                />
                <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700">
                    Habilitado
                </label>
            </div>

            {/* Rating y Precio */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Rating
                    </label>
                    <Input.Int
                        path="rating"
                        min={0}
                        max={5}
                        required
                        className="mt-1 block w-full border-gray-300 rounded p-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Precio
                    </label>
                    <Input.Float
                        path="price"
                        required
                        className="mt-1 block w-full border-gray-300 rounded p-2"
                    />
                </div>
            </div>

            {/* Categoría y Subcategoría */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Categoría
                    </label>
                    <Categories />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Subcategoría
                    </label>
                    <SubCategories />
                </div>
            </div>

            {/* Imágenes */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Imágenes
                </label>
                <InputImages />
            </div>

            {/* Submit */}
            <div>
                <InsertUpdate />
            </div>
        </FormProvider>
    );
}

function InsertUpdate() {
  const notify = useNotificacion();
  const emitter = useEmitter();
  const form = useForm<Product>();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return form.submit((state: any) => {
      setLoading(true);
      upsertProduct(state)
        .then((record) => {
          form.set(record);
          notify({
            payload: "Producto creado/actualizado correctamente.",
            type: "success",
          });
        })
        .catch((error) => {
          notify({
            payload: error,
          });
        })
        .finally(() => {
          setLoading(false);
        });
    });
  }, [emitter]);

  return (
    <button
      type="submit"
      disabled={loading}
      className={`w-full py-2 px-4 text-white rounded transition ${
        loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {loading ? (
        <span className="flex justify-center items-center space-x-2">
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16 8 8 0 01-8-8z"
            />
          </svg>
          <span>Cargando...</span>
        </span>
      ) : (
        "Crear/Actualizar"
      )}
    </button>
  );
}

export function InventoryModal(props: PropsModal) {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-black/60 via-gray-900/40 to-blue-900/30 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-2xl w-[95vw] sm:w-full max-h-[95vh] overflow-y-auto border border-gray-200 relative m-2 sm:m-0">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 via-white to-blue-100 rounded-t-xl flex items-center justify-between mb-0 border-b px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
                    <h2 className="text-lg sm:text-2xl font-bold text-blue-800 tracking-tight">Agregar Producto</h2>
                    <button
                        onClick={props.remove}
                        className="ml-2 sm:ml-4 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold shadow"
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                </div>
                <div className="p-4 sm:p-6">
                    <Inventory product={props.product} />
                </div>
            </div>
        </div>
    );
}

export default withPortalToRoot(InventoryModal);

interface PropsModal extends PropsPortal {
    product?: Product
}