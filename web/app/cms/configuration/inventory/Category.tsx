import { useState } from "react";
import { useNotificacion } from "@/components/ui/notification";
import { FolderIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  listCategories,
  upsertCategory,
  type CategoryWithSubcategoriesDto as Category,
} from "@agape/inventory/category";
import Form, { useInputArray } from "@/components/form";
import * as Input from "@/components/form/Input";
import Checkbox from "@/components/form/CheckBox";
import Submit from "@/components/ui/submit";
import {
  createPortalHook,
  type PortalInjectedProps,
} from "@/components/util/portal";
import PortalModal from "@/components/ui/PortalModal";
import { useConfirmModal } from "@/components/ui/PortalConfirm";
import { Card, StackedList } from "./components";

function CategoryModalWrapper(
  props: {
    category: Category;
    onSave: (data: Category) => Promise<void>;
  } & PortalInjectedProps
) {
  return (
    <PortalModal
      {...props}
      title={props.category.id ? "Editar categoría" : "Nueva categoría"}
      size="md"
    >
      <CategoryForm
        category={props.category}
        onSave={props.onSave}
        onClose={() => {}}
      />
    </PortalModal>
  );
}

function CategoryForm({
  category,
  onClose,
  onSave,
}: {
  category: Category;
  onClose: () => void;
  onSave: (data: Category) => Promise<void>;
}) {
  const initialState = {
    id: category.id || undefined,
    fullName: category.fullName,
    isEnabled: category.isEnabled ?? true,
    subcategories: category.subcategories || [],
  };

  async function handleSubmit(data: typeof initialState) {
    await onSave(data);
    onClose();
  }

  return (
    <Form state={initialState}>
      <div className="space-y-5 p-5">
        <div className="space-y-4">
          <label className="space-y-1.5 block">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Nombre de categoría
            </span>
            <Input.Text
              path="fullName"
              required
              placeholder="Ej: Electrónica"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </label>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <Checkbox
              path="isEnabled"
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-800 dark:text-gray-200">
              Activa
            </span>
          </div>
        </div>

        <SubCategoriesManager />
      </div>
      <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 rounded-b-xl">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <Submit
          onSubmit={handleSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
        >
          {initialState.id ? "Guardar cambios" : "Crear categoría"}
        </Submit>
      </div>
    </Form>
  );
}

function SubCategoriesManager() {
  const subcategories = useInputArray<{
    id?: number;
    fullName: string;
    isEnabled: boolean;
  }>("subcategories");

  return (
    <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900 dark:text-white">
          Subcategorías
        </label>
        <button
          type="button"
          onClick={() =>
            subcategories.addItem({
              fullName: "",
              isEnabled: true,
            })
          }
          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          + Agregar subcategoría
        </button>
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
        {subcategories.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex-1">
              <Input.Text
                path="fullName"
                placeholder="Nombre de subcategoría"
                className="w-full bg-transparent border-none text-sm focus:ring-0 p-0 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-3">
              <Checkbox
                path="isEnabled"
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <button
                type="button"
                onClick={() => subcategories.removeItem(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Eliminar subcategoría"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {subcategories.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center py-4 bg-gray-50 dark:bg-gray-800/20 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
            No hay subcategorías asignadas
          </p>
        )}
      </div>
    </div>
  );
}

const useCategoryModal = createPortalHook(CategoryModalWrapper);

export default function CategoryList(props: { categories: Category[] }) {
  const notify = useNotificacion();
  const [categories, setCategories] = useState<Category[]>(props.categories);
  const [loading, setLoading] = useState(false);

  const showCategory = useCategoryModal();
  const showConfirm = useConfirmModal();

  async function loadCategories() {
    try {
      setLoading(true);
      const cats = await listCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveCategory(data: Category) {
    await upsertCategory(data);
    await loadCategories();
  }

  async function confirmDeleteCategory(item: Category) {
    showConfirm({
      title: "Eliminar registro",
      message: `¿Seguro que deseas eliminar "${item.fullName}"?`,
      confirmText: "Eliminar",
      variant: "danger",
      onConfirm: async () => {
        try {
          await upsertCategory({ ...item, isEnabled: false });
          await loadCategories();
        } catch (error) {
          console.error("Error al eliminar:", error);
          notify({ payload: "No se pudo eliminar el registro", type: "error" });
        }
      },
    });
  }

  return (
    <Card
      title="Categorías"
      icon={<FolderIcon className="w-5 h-5" />}
      action={
        <button
          type="button"
          onClick={() =>
            showCategory({
              category: {
                fullName: "",
                isEnabled: true,
                subcategories: [],
              } as any,
              onSave: saveCategory,
            })
          }
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Nueva categoría
        </button>
      }
    >
      <StackedList<Category>
        items={categories}
        loading={loading}
        empty="Aún no hay categorías"
        render={(item) => ({
          title: item.fullName,
          subtitle: `${item.subcategories?.length || 0} subcategorías`,
          badge: item.isEnabled ? "Activa" : "Inactiva",
          badgeTone: item.isEnabled ? "green" : "amber",
          onEdit: () => showCategory({ category: item, onSave: saveCategory }),
          onDelete: () => confirmDeleteCategory(item),
        })}
      />
    </Card>
  );
}
