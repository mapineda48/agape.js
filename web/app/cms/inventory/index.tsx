import Layout from "../Layout";
import { useEffect, useState } from "react";
import Select from "@/components/form/Select";
import { useEmitter, useEvent } from "@/components/event-emiter";
import { type Category, findAll } from "@agape/cms/configuration/category";
import FormProvider, { useForm } from "@/components/form";
import Input from "@/components/form/Input";
import Checkbox from "@/components/form/CheckBox";
import { upsertProduct, type Product } from "@agape/cms/inventory/product";
import InputImages from "./Images";

export default function Inventory() {
  return (
    <Layout>
      <FormProvider className="max-w-2xl mx-auto space-y-6 p-6 bg-white rounded shadow">
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
            path="isEnabled"
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
    </Layout>
  );
}

function InsertUpdate() {
  const emitter = useEmitter();

  const form = useForm<Product>();

  useEffect(() => {
    return form.submit((state: any) => {
      upsertProduct(state)
        .then((record) => {
          console.log({record});
          form.set(record);
        })
        .catch(console.error);
    });
  }, [emitter]);

  return (
    <button
      type="submit"
      className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
    >
      Crear Producto
    </button>
  );
}

export function SubCategories() {
  const [state, setState] = useState<
    {
      id: number;
      fullName: string;
      isEnabled: boolean;
    }[]
  >([
    {
      id: 0,
      fullName: "- Seleccionar -",
      isEnabled: false,
    },
  ]);

  const emitter = useEmitter();

  useEffect(() => emitter.setSubCategories(setState), [setState]);

  return (
    <Select.Int
      path="subcategoryId"
      required
      className="mt-1 block w-full border-gray-300 rounded p-2"
    >
      {state.map((category) => (
        <option value={category.id}>{category.fullName}</option>
      ))}
    </Select.Int>
  );
}

export function Categories() {
  const emitter = useEmitter();

  const [state, setState] = useEvent<Category[]>([]);

  useEffect(() => {
    findAll()
      .then((res) =>
        setState([
          {
            id: 0,
            fullName: "- Seleccionar -",
            isEnabled: false,
            subcategories: [],
          },
          ...res,
        ])
      )
      .catch((error) => {
        console.log(error);

        setState([
          {
            id: 0,
            fullName: "Error Al Cargar",
            isEnabled: false,
            subcategories: [],
          },
        ]);
      });
  }, [setState]);

  return (
    <Select.Int
      path="categoryId"
      required
      className="mt-1 block w-full border-gray-300 rounded p-2"
      onChange={(_, index) => {
        emitter.setSubCategories([
          {
            id: 0,
            fullName: "- Seleccionar -",
            isEnabled: false,
          },
          ...state[index].subcategories,
        ]);
      }}
    >
      {state.map((category) => (
        <option
          onClick={() => console.log(category.subcategories)}
          value={category.id}
        >
          {category.fullName}
        </option>
      ))}
    </Select.Int>
  );
}
