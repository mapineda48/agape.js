import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { findAll, insertUpdate, type Category } from "@agape/cms/inventory/configuration/category";
import { useEmitter } from "@/components/event-emiter";
import Form, { Path, useForm, useInputArray } from "@/components/form";
import Input from "@/components/form/Input";
import Checkbox from "@/components/form/CheckBox";

const state: Category[] = [];

const ContegoryConfiguration = () => {
  return (
    <Form state={state}>
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-6 relative">
        <InsertUpdate />
        <h1 className="text-2xl font-bold mb-6 text-primary">
          Administrar Categorías
        </h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Panel Izquierdo: Lista de Categorías */}
          <Categories />

          {/* Panel Derecho: Subcategorías de la categoría seleccionada */}
          <FCategory />
        </div>
      </div>
    </Form>
  );
};

function InsertUpdate() {
  const emitter = useEmitter();

  const form: any = useForm();

  useEffect(() => {
    return form.submit((state: Category[]) => {
      console.log(state);
      
      insertUpdate(state)
        .then(emitter.setCategories)
        .catch(emitter.failInsertUpdateCategories);
    });
  }, [emitter]);

  return (
    <button
      type="submit"
      className="absolute top-6 right-6 flex items-center bg-success text-white px-4 py-2 rounded hover:bg-success/80 transition-colors"
    >
      <CheckCircleIcon className="w-5 h-5 mr-2" />
      Guardar
    </button>
  );
}

export function Categories() {
  const emitter = useEmitter();
  const categories = useInputArray<Category[]>();

  useEffect(() => {
    findAll().then(emitter.setCategories).catch(emitter.failLoadCategories);

    return emitter.setCategories((payload: Category[]) => {
      categories.set(payload);
      setIndex(null);
    });
  }, [emitter]);

  // Estado para saber qué categoría está seleccionada
  const [current, setIndex] = useState<number | null>(null);

  return (
    <div className="md:w-1/3 bg-muted rounded-lg p-4 border border-secondary/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary">Categorías</h2>
        <button
          type="button"
          className="p-1 rounded hover:bg-accent/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();

            categories.addItem({
              fullName: "Categoria " + (categories.length + 1),
              isEnabled: false,
              subcategories: [],
            } as any);
          }}
        >
          <PlusIcon className="w-6 h-6 text-accent" />
        </button>
      </div>

      {categories.map((cat, index, paths) => (
        <div
          key={index}
          className={clsx(
            "flex items-center p-2 rounded mb-2 hover:bg-accent/10",
            index === current && "bg-accent/10"
          )}
          onClick={(e) => {
            e.stopPropagation();

            setIndex(index);
            emitter.setCategory(paths);
          }}
        >
          {/* Checkbox isEnabled */}
          <Checkbox
            path={`isEnabled`}
            checked={cat.isEnabled}
            className="mr-2"
          />

          {/* Input para editar fullName de la categoría */}
          <Input.Text
            required
            path="fullName"
            className={clsx(
              "bg-transparent border-none focus:outline-none w-full text-dark",
              index !== current && "cursor-pointer"
            )}
          />

          {!cat.id && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();

                categories.removeItem(index);
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

function FCategory() {
  const emitter = useEmitter();

  const [category, setCategory] = useState<string[]>([]);

  useEffect(() => emitter.setCategory(setCategory), []);

  return (
    <Path value={category}>
      <div className="md:w-2/3 bg-muted rounded-lg p-4 border border-secondary/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary">Subcategorías</h2>
          <button
            type="button"
            className="p-1 rounded hover:bg-accent/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();

              emitter.addSubcategories();
            }}
          >
            <PlusIcon className="w-6 h-6 text-accent" />
          </button>
        </div>
        <SubCategories />
      </div>
    </Path>
  );
}

function SubCategories() {
  const emitter = useEmitter();

  const subcategories = useInputArray<ISubCategories[]>("subcategories");

  const [current, setIndex] = useState<number | null>(null);

  useEffect(() => {
    return emitter.addSubcategories(() => {
      subcategories.addItem({
        fullName: "SubCategoria " + (subcategories.length + 1),
        isEnabled: false,
      });
    });
  }, [subcategories]);

  if (!subcategories.length) {
    return <p className="text-gray-500">Sin subcategorías</p>;
  }

  return subcategories.map((payload, index) => {
    return (
      <div
        key={index}
        className={clsx(
          "flex items-center mb-2 p-2 hover:bg-accent/5 rounded",
          index === current && "bg-accent/10"
        )}
        onClick={() => {
          setIndex(index);
        }}
      >
        <Checkbox path="isEnabled" className="mr-2" />
        <Input.Text
          path="fullName"
          required
          placeholder={payload.fullName}
          className={clsx(
            "bg-transparent border border-secondary/20 focus:outline-none focus:border-accent rounded w-full text-dark px-2 py-1",
            index !== current && "cursor-pointer"
          )}
        />
        {!payload.id && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();

              subcategories.removeItem(index);
            }}
            className="ml-2 p-1 hover:bg-red-100 rounded"
          >
            <TrashIcon className="w-5 h-5 text-red-500" />
          </button>
        )}
      </div>
    );
  });
}

export default ContegoryConfiguration;

/**
 * Types
 */

interface ISubCategories {
  id?: number;
  fullName: string;
  isEnabled: boolean;
}