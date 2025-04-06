// import Form, { IForm } from "@client/components/form";
// import Checkbox from "@client/components/form/CheckBox";
// import Input from "@client/components/form/Input";
// import { useCallback, useEffect, useState } from "react";
// import { findAll, createCategory } from "@agape/inventory/category";
// import { useEmitter } from "@client/components/EventEmitter";

import { useEffect, useState } from "react";
import { NextPage } from "next";
import clsx from "clsx";
import {
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import {
  findAll,
  insertUpdate,
  Category,
  upsert,
} from "@agape/inventory/category";
import { useEmitter } from "@client/components/EventEmitter";
import Form, { useInputArray } from "@client/components/form";
import Input from "@client/components/form/Input";
import Checkbox from "@client/components/form/CheckBox";

const ContegoryConfiguration: NextPage = () => {
  const emitter = useEmitter();
  return (
    <Form
      initState={[]}
      className="bg-teal-50 min-h-screen py-8"
      onSubmit={async (state) => {
        state.forEach((category: any) => {
          if (category.id === 0) {
            delete category.id;
          }
        });

        emitter.InitCategories(await insertUpdate(state));
      }}
    >
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md p-6 relative">
        {/* Botón Guardar en la esquina superior derecha */}
        <button
          type="submit"
          className="absolute top-6 right-6 flex items-center bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-500 transition-colors"
        >
          <CheckCircleIcon className="w-5 h-5 mr-2" />
          Guardar
        </button>

        <h1 className="text-2xl font-bold mb-6 text-teal-700">
          Administrar Categorías
        </h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Panel Izquierdo: Lista de Categorías */}
          <Categories />

          {/* Panel Derecho: Subcategorías de la categoría seleccionada */}
          <SubCategories />
        </div>
      </div>
    </Form>
  );
};

export function Categories() {
  const emitter = useEmitter();
  const items = useInputArray<Category[]>();

  useEffect(() => {
    findAll().then(emitter.InitCategories).catch(console.error);

    return emitter.OnInitCategories(items.add);
  }, []);

  // Estado para saber qué categoría está seleccionada
  const [current, setIndex] = useState<number | null>(null);

  return (
    <div className="md:w-1/3 bg-teal-100 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-teal-800">Categorías</h2>
        <button
          type="button"
          className="p-1 rounded hover:bg-teal-200 transition-colors"
          onClick={(e) => {
            e.stopPropagation();

            items.add({
              id: 0,
              fullName: "Categoria " + (items.length + 1),
              isEnabled: false,
              subcategories: [],
            });
          }}
        >
          <PlusIcon className="w-6 h-6 text-teal-600" />
        </button>
      </div>

      {items.map((cat, index, key) => (
        <div
          key={index}
          className={clsx(
            "flex items-center p-2 rounded mb-2 cursor-pointer hover:bg-teal-200",
            index === current && "bg-teal-200"
          )}
          onClick={(e) => {
            e.stopPropagation();

            setIndex(index);
            emitter.SetSubcategories({ key, subcategories: cat.subcategories });
          }}
        >
          {/* Checkbox isEnabled */}
          <Checkbox
            name={`isEnabled`}
            checked={cat.isEnabled}
            className="mr-2"
          />

          {/* Input para editar fullName de la categoría */}
          <Input.Text
            required
            name="fullName"
            className="bg-transparent border-none focus:outline-none w-full text-teal-900"
          />

          {/* Ícono para remover la categoría cuando cat.id === 0 */}
          {!cat.id && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();

                items.remove(index);
              }}
              className="ml-2 p-1 hover:bg-red-100 rounded"
            >
              <TrashIcon className="w-5 h-5 text-red-500" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function SubCategories() {
  const emitter = useEmitter();
  const [category, setCategory] = useState<string>("subcategories");

  useEffect(
    () =>
      emitter.OnSetSubcategories(({ key, subcategories }: any) => {
        console.log(key);
        setCategory(key + ".subcategories");
      }),
    []
  );

  console.log({ category });
  const subcategories = useInputArray<
    {
      id: number;
      fullName: string;
      isEnabled: boolean;
    }[]
  >(category);

  // Estado para saber qué categoría está seleccionada

  return (
    <div className="md:w-2/3 bg-teal-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-teal-800">Subcategorías</h2>
        <button
          type="button"
          className="p-1 rounded hover:bg-teal-200 transition-colors"
          onClick={(e) => {
            e.stopPropagation();

            subcategories.add({
              id: 0,
              fullName: "SubCategoria " + (subcategories.length + 1),
              isEnabled: false,
            });
          }}
        >
          <PlusIcon className="w-6 h-6 text-teal-600" />
        </button>
      </div>

      {category === null ? (
        // Si no hay categoría seleccionada, un mensaje
        <p className="text-gray-500">
          Selecciona una categoría para ver sus subcategorías
        </p>
      ) : (
        // Mostrar subcategorías de la categoría seleccionada
        subcategories.map((sub, index, key) => (
          <div key={sub.id} className="flex items-center mb-2">
            {/* Checkbox isEnabled */}
            <input
              type="checkbox"
              checked={sub.isEnabled}
              onChange={() => setCategory(key)}
              className="mr-2"
            />
            {/* Input para editar fullName de la subcategoría */}
            <input
              type="text"
              value={sub.fullName}
              onChange={(e) => {}}
              className="bg-transparent border-b border-teal-200 focus:outline-none focus:border-teal-400 w-full text-teal-900"
            />
          </div>
        ))
      )}
    </div>
  );
}

export default ContegoryConfiguration;
