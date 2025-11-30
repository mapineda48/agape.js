import { useEffect, useMemo } from "react";
import FormProvider, { useAppDispatch, setAtPath } from "@/components/form";
import * as Input from "@/components/form/Input";
import Checkbox from "@/components/form/CheckBox";
import { upsertProduct, type Product } from "@agape/cms/inventory/product";
import InputImages from "./Images";
import Categories from "./Categories";
import { SubCategories } from "./SubCategories";
import { useEventEmitter } from "@/components/util/event-emitter";
import Submit from "@/components/ui/submit";

export function Inventory(props: {
  product?: Product;
  onSuccess?: () => void;
}) {
  return (
    <FormProvider state={props.product} className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">
                Información Básica
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Detalles principales del producto
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Producto
                </label>
                <Input.Text
                  path="fullName"
                  required
                  placeholder="Ej: Camiseta Premium Algodón"
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slogan / Subtítulo
                </label>
                <Input.Text
                  path="slogan"
                  required
                  placeholder="Ej: La mejor calidad para tu día a día"
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <Input.TextArea
                  path="description"
                  rows={6}
                  placeholder="Describe las características y beneficios del producto..."
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Media Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">
                Galería de Imágenes
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Sube imágenes de alta calidad para tu producto
              </p>
            </div>
            <div className="p-6">
              <InputImages />
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Status & Price Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">
                Estado y Precio
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center">
                  <Checkbox
                    materialize
                    checked
                    path="isActive"
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-3 block text-sm font-medium text-gray-900"
                  >
                    Producto Habilitado
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <Input.Decimal
                    path="price"
                    required
                    className="w-full rounded-lg border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating Inicial
                </label>
                <Input.Int
                  path="rating"
                  min={0}
                  max={5}
                  required
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Valor entre 0 y 5</p>
              </div>
            </div>
          </div>

          {/* Categorization Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">
                Categorización
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <Categories />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategoría
                </label>
                <SubCategories />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="sticky bottom-6">
            <InsertUpdate onSuccess={props.onSuccess} />
          </div>
        </div>
      </div>
    </FormProvider>
  );
}

function InsertUpdate(props: { onSuccess?: () => void }) {
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
        props.onSuccess?.();
        return record;
      }}
      event={updateFormEvent}
      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
    >
      Guardar Producto
    </Submit>
  );
}
