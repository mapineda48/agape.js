import { useEffect, useRef } from "react";
import Select from "@/components/form.v2/Select";
import {
  useEventEmitter,
  useSharedState,
} from "@/components/util/event-emitter";
import {
  type Category,
  findAll,
} from "@agape/cms/inventory/configuration/category";

const DEFAULT_CATEGORY: Category = {
  id: 0,
  fullName: "- Seleccionar -",
  isEnabled: false,
  subcategories: [],
};

const REF_READ_DELAY_MS = 5;

export default function Categories() {
  const ref = useRef<HTMLSelectElement>(null);
  const emitter = useEventEmitter();
  const [state, setState] = useSharedState<Category[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await findAll();
        setState([{ ...DEFAULT_CATEGORY }, ...categories]);
        updateSubcategories(ref.current, categories, emitter);
      } catch (error) {
        console.error("Error loading categories:", error);
        setState([{ ...DEFAULT_CATEGORY, fullName: "Error" }]);
      }
    };

    loadCategories();
  }, [setState]);

  return (
    <Select.Int
      path="categoryId"
      required
      className="mt-1 block w-full border-gray-300 rounded p-2"
      ref={ref}
      onChange={(_, index) => {
        const subcategories = state[index]?.subcategories || [];
        emitter.emit("setSubCategories", [
          { ...DEFAULT_CATEGORY },
          ...subcategories,
        ]);
      }}
    >
      {state.map((category) => (
        <option key={category.id} value={category.id || ""}>
          {category.fullName}
        </option>
      ))}
    </Select.Int>
  );
}

function updateSubcategories(
  ref: HTMLSelectElement | null,
  categories: Category[],
  emitter: ReturnType<typeof useEventEmitter>
) {
  setTimeout(() => {
    const selectedId = parseInt(ref?.value || "0");
    if (!selectedId) return;

    const selectedCategory = categories.find((c) => c.id === selectedId);
    const subcategories = selectedCategory?.subcategories || [];

    emitter.emit("setSubCategories", structuredClone(subcategories));
  }, REF_READ_DELAY_MS);
}
