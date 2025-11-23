import { useEffect, useMemo } from "react";
import FormProvider, { useAppDispatch, setAtPath } from "@/components/form";
import * as Input from "@/components/form/Input";
import Checkbox from "@/components/form/CheckBox";
import { upsertProduct, type Product } from "@agape/cms/inventory/product";
import InputImages from "./Images";
import { type PropsPortal, withPortalToRoot } from "@/components/util/portal";
import Categories from "./Categories";
import { SubCategories } from "./SubCategories";
import { useEventEmitter } from "@/components/util/event-emitter";
import Submit from "@/components/ui/submit";

export function Inventory(props: { product?: Product }) {
  console.log(props);
  return (
    <FormProvider
      state={props.product}
      className="max-w-2xl mx-auto space-y-6 p-6 bg-white rounded shadow"
    >
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
          materialize
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
  const dispatch = useAppDispatch();
  const emitter = useEventEmitter();
  const updateFormEvent = useMemo(() => Symbol("updateForm"), []);

  useEffect(() => {
    return emitter.on(updateFormEvent, ((record: Product) => {
      dispatch(setAtPath({ path: [], value: record }));
    }) as any);
  }, [emitter, updateFormEvent, dispatch]);

  return (
    <Submit
      onSubmit={async (state: any) => {
        const record = await upsertProduct(state);
        return record;
      }}
      event={updateFormEvent}
      className="w-full py-2 px-4 text-white rounded transition bg-blue-600 hover:bg-blue-700"
    >
      Crear/Actualizar
    </Submit>
  );
}

export function InventoryModal(props: PropsModal) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-black/60 via-gray-900/40 to-blue-900/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-2xl sm:w-full max-h-[95vh] overflow-y-auto border border-gray-200 relative m-2 sm:m-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 via-white to-blue-100 rounded-t-xl flex items-center justify-between mb-0 border-b px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
          <h2 className="text-lg sm:text-2xl font-bold text-blue-800 tracking-tight">
            Agregar Producto
          </h2>
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
  product?: Product;
}
