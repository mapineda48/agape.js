import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  FolderIcon,
  FolderOpenIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import {
  findAll,
  insertUpdate,
  type Category,
} from "@agape/cms/inventory/configuration/category";
import { useEventEmitter } from "@/components/util/event-emitter";
import Form, { Path, useForm, useInputArray } from "@/components/form";
import * as Input from "@/components/form/Input";
import Checkbox from "@/components/form/CheckBox";

const state: Category[] = [];

export default function InventoryPage() {
  return (
    <Form state={state}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Categorías y Subcategorías
            </h2>
            <p className="text-sm text-gray-500">
              Gestiona la estructura de tu inventario
            </p>
          </div>
          <InsertUpdate />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Panel Izquierdo: Lista de Categorías */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            <Categories />
          </div>

          {/* Panel Derecho: Subcategorías de la categoría seleccionada */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            <FCategory />
          </div>
        </div>
      </div>
    </Form>
  );
}

function InsertUpdate() {
  const emitter = useEventEmitter();
  const { SUBMIT } = useForm();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return emitter.on(SUBMIT, ((state: Category[]) => {
      setIsSaving(true);
      insertUpdate(state)
        .then((categories) => {
          emitter.emit("setCategories", categories);
          // Optional: Show success toast
        })
        .catch((error) => {
          emitter.emit("failInsertUpdateCategories", error);
          // Optional: Show error toast
        })
        .finally(() => setIsSaving(false));
    }) as any);
  }, [emitter, SUBMIT]);

  return (
    <button
      type="submit"
      disabled={isSaving}
      className={clsx(
        "flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-all shadow-sm",
        isSaving
          ? "bg-indigo-400 cursor-not-allowed"
          : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-md"
      )}
    >
      {isSaving ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
      ) : (
        <CheckCircleIcon className="w-5 h-5 mr-2" />
      )}
      {isSaving ? "Guardando..." : "Guardar Cambios"}
    </button>
  );
}

export function Categories() {
  const emitter = useEventEmitter();
  const categories = useInputArray<Category[]>();
  const [current, setIndex] = useState<number>(0);

  useEffect(() => {
    findAll()
      .then((payload) => {
        emitter.emit("setCategories", payload);
      })
      .catch((error) => emitter.emit("failLoadCategories", error));

    return emitter.on("setCategories", ((payload: Category[]) => {
      categories.set(payload);
      setIndex(0);
    }) as any);
  }, [emitter]);

  return (
    <>
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
        <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
          <FolderIcon className="w-5 h-5 mr-2 text-gray-400" />
          Categorías
        </h3>
        <button
          type="button"
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-indigo-600 dark:text-indigo-400 transition-all shadow-sm hover:shadow"
          onClick={(e) => {
            e.stopPropagation();
            categories.addItem({
              fullName: "Nueva Categoría",
              isEnabled: true,
              subcategories: [],
            } as any);
          }}
          title="Agregar Categoría"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {categories.map((cat, index, paths) => (
          <div
            key={index}
            className={clsx(
              "group flex items-center p-3 rounded-lg transition-all cursor-pointer border border-transparent",
              index === current
                ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30 shadow-sm"
                : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIndex(index);
              emitter.emit("setCategory", paths);
            }}
          >
            <Checkbox
              path={`isEnabled`}
              checked={cat.isEnabled}
              className="mr-3"
            />

            <div className="flex-1 min-w-0">
              <Input.Text
                required
                path="fullName"
                className="bg-transparent border-none focus:ring-0 p-0 w-full text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400"
                placeholder="Nombre de categoría"
              />
              <p className="text-xs text-gray-500 truncate">
                {cat.subcategories?.length || 0} subcategorías
              </p>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
              {!cat.id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    categories.removeItem(index);
                  }}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No hay categorías creadas
          </div>
        )}
      </div>
    </>
  );
}

function FCategory() {
  const emitter = useEventEmitter();
  const [category, setCategory] = useState<string[]>([]);

  useEffect(() => emitter.on("setCategory", setCategory as any), [emitter]);

  return (
    <Path value={category}>
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
        <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
          <FolderOpenIcon className="w-5 h-5 mr-2 text-gray-400" />
          Subcategorías
        </h3>
        <button
          type="button"
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-indigo-600 dark:text-indigo-400 transition-all shadow-sm hover:shadow"
          onClick={(e) => {
            e.stopPropagation();
            emitter.emit("addSubcategories");
          }}
          title="Agregar Subcategoría"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <SubCategories />
      </div>
    </Path>
  );
}

function SubCategories() {
  const emitter = useEventEmitter();
  const subcategories = useInputArray<ISubCategories[]>("subcategories");
  const [current, setIndex] = useState<number | null>(null);

  useEffect(() => {
    return emitter.on("addSubcategories", (() => {
      subcategories.addItem({
        fullName: "Nueva Subcategoría",
        isEnabled: true,
      });
    }) as any);
  }, [emitter, subcategories]);

  if (!subcategories.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <TagIcon className="w-12 h-12 mb-2 opacity-20" />
        <p className="text-sm">
          Selecciona una categoría para ver sus subcategorías
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {subcategories.map((payload, index) => (
        <div
          key={index}
          className={clsx(
            "group flex items-center p-3 rounded-lg border transition-all",
            index === current
              ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
          )}
          onClick={() => setIndex(index)}
        >
          <Checkbox path="isEnabled" className="mr-3" />

          <div className="flex-1 min-w-0">
            <Input.Text
              path="fullName"
              required
              placeholder="Nombre de subcategoría"
              className="bg-transparent border-none focus:ring-0 p-0 w-full text-sm text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            {!payload.id && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  subcategories.removeItem(index);
                }}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-md transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Types
 */
interface ISubCategories {
  id?: number;
  fullName: string;
  isEnabled: boolean;
}
