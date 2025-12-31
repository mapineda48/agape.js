import { useEffect } from "react";
import Select from "@/components/form/Select";
import { SelectItem } from "@/components/ui/select";
import useInput from "@/components/form/Input/useInput";
import {
  useEventEmitter,
  useSharedState,
} from "@/components/util/event-emitter";
import {
  type ICategory as Category,
  listCategories as findAll,
  listSubcategories,
} from "@agape/catalogs/category";

const DEFAULT_CATEGORY: Partial<Category> = {
  id: 0,
  fullName: "- Seleccionar -",
  isEnabled: false,
};

const REF_READ_DELAY_MS = 50; // Increased slightly

export default function Categories() {
  const [value] = useInput<number>("categoryId", 0);
  const emitter = useEventEmitter();
  const [state, setState] = useSharedState<Category[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await findAll();
        setState([{ ...DEFAULT_CATEGORY } as Category, ...categories]);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };

    loadCategories();
  }, [setState]);

  useEffect(() => {
    if (value) {
      updateSubcategories(value, emitter);
    }
  }, [value, emitter]);

  const handleChange = (value: number) => {
    updateSubcategories(value, emitter);
  };

  return (
    <Select.Int
      path="categoryId"
      required
      className="mt-1 block w-full border-gray-300 rounded p-2"
      onChange={handleChange}
    >
      {state.map((category) => (
        <SelectItem key={category.id} value={category.id || 0}>
          {category.fullName}
        </SelectItem>
      ))}
    </Select.Int>
  );
}

async function updateSubcategories(
  categoryId: number,
  emitter: ReturnType<typeof useEventEmitter>
) {
  if (!categoryId) {
    emitter.emit("setSubCategories", []);
    return;
  }

  try {
    const subcategories = await listSubcategories({ categoryId });
    emitter.emit("setSubCategories", subcategories);
  } catch (err) {
    console.error("Error loading subcategories", err);
    emitter.emit("setSubCategories", []);
  }
}
