import { useState, useMemo } from "react";
import { useNotificacion } from "@/components/ui/notification";
import {
  FolderIcon,
  PlusIcon,
  TrashIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
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
import { Card, StackedList, Field } from "./components";
import clsx from "clsx";

interface CategoryFilters {
  search: string;
  activeOnly: boolean;
}

/**
 * Form state interface for Category creation/editing.
 */
interface CategoryFormState {
  id?: number;
  fullName: string;
  isEnabled: boolean;
  subcategories: Array<{
    id?: number;
    fullName: string;
    isEnabled: boolean;
  }>;
}

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

function CategoryFilterModalWrapper(
  props: {
    filters: CategoryFilters;
    onApply: (filters: CategoryFilters) => void;
  } & PortalInjectedProps
) {
  return (
    <PortalModal {...props} title="Filtrar categorías" size="sm">
      <CategoryFilterForm
        initialFilters={props.filters}
        onApply={props.onApply}
        onClose={() => props.remove()}
      />
    </PortalModal>
  );
}

function CategoryFilterForm({
  initialFilters,
  onApply,
  onClose,
}: {
  initialFilters: CategoryFilters;
  onApply: (filters: CategoryFilters) => void;
  onClose: () => void;
}) {
  const [localFilters, setLocalFilters] = useState(initialFilters);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(localFilters);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 p-5">
        <Field label="Buscar por nombre">
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm"
            placeholder="Ej: Electrónica"
            value={localFilters.search}
            onChange={(e) =>
              setLocalFilters((prev) => ({ ...prev, search: e.target.value }))
            }
          />
        </Field>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="cat-activeOnly"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            checked={localFilters.activeOnly}
            onChange={(e) =>
              setLocalFilters((prev) => ({
                ...prev,
                activeOnly: e.target.checked,
              }))
            }
          />
          <label
            htmlFor="cat-activeOnly"
            className="text-sm text-gray-900 dark:text-white"
          >
            Solo activas
          </label>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 rounded-b-xl">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
        >
          Aplicar filtros
        </button>
      </div>
    </form>
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
  const initialState: CategoryFormState = {
    id: category.id || undefined,
    fullName: category.fullName,
    isEnabled: category.isEnabled ?? true,
    subcategories: category.subcategories || [],
  };

  async function handleSubmit(data: CategoryFormState) {
    await onSave(data as Category);
    onClose();
  }

  return (
    <Form.Root<CategoryFormState> state={initialState}>
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
        <Submit<CategoryFormState>
          onSubmit={handleSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
        >
          {initialState.id ? "Guardar cambios" : "Crear categoría"}
        </Submit>
      </div>
    </Form.Root>
  );
}

function SubCategoriesManager() {
  const subcategories = useInputArray<
    {
      id?: number;
      fullName: string;
      isEnabled: boolean;
    }[]
  >("subcategories");

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
const useCategoryFilterModal = createPortalHook(CategoryFilterModalWrapper);

export default function CategoryList(props: { categories: Category[] }) {
  const notify = useNotificacion();
  const [categories, setCategories] = useState<Category[]>(props.categories);
  const [loading, setLoading] = useState(false);

  // Filter State
  const [filters, setFilters] = useState<CategoryFilters>({
    search: "",
    activeOnly: true,
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const showCategory = useCategoryModal();
  const showFilter = useCategoryFilterModal();
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

  const filteredCategories = useMemo(() => {
    return categories.filter((item) => {
      if (
        filters.search &&
        !item.fullName.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.activeOnly && !item.isEnabled) {
        return false;
      }
      return true;
    });
  }, [categories, filters]);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, currentPage]);

  const totalPages = Math.ceil(filteredCategories.length / pageSize);

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              showFilter({
                filters,
                onApply: (newFilters) => {
                  setFilters(newFilters);
                  setCurrentPage(1);
                },
              })
            }
            className={clsx(
              "p-2 rounded-lg transition-colors border",
              filters.search || !filters.activeOnly
                ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-transparent dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800"
            )}
            title="Filtrar categorías"
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
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
        </div>
      }
    >
      <StackedList<Category>
        items={paginatedCategories}
        loading={loading}
        empty="No se encontraron categorías"
        render={(item) => ({
          title: item.fullName,
          subtitle: `${item.subcategories?.length || 0} subcategorías`,
          badge: item.isEnabled ? "Activa" : "Inactiva",
          badgeTone: item.isEnabled ? "green" : "amber",
          onEdit: () => showCategory({ category: item, onSave: saveCategory }),
          onDelete: () => confirmDeleteCategory(item),
        })}
        pagination={{
          currentPage: currentPage,
          totalPages: totalPages,
          onPageChange: setCurrentPage,
          totalItems: filteredCategories.length,
          startIndex: (currentPage - 1) * pageSize,
          endIndex: (currentPage - 1) * pageSize + paginatedCategories.length,
        }}
      />
    </Card>
  );
}
