import { useEffect, useState } from "react";
import Select from "@/components/form/Select";
import { useDispatch, useMitt } from "@/components/util/event-emiter";

const DEFAULT_SUBCATEGORY = {
    id: 0,
    fullName: "- Seleccionar -",
    isEnabled: false,
};

export function SubCategories() {
    const [subcategories, setSubcategories] = useState<SubCategory[]>([
        { ...DEFAULT_SUBCATEGORY },
    ]);

    const emitter = useDispatch();

    useEffect(() => {
        // Escucha los cambios que llegan desde el componente padre
        emitter.setSubCategories((subcategories: SubCategory[]) => setSubcategories([{ ...DEFAULT_SUBCATEGORY }, ...subcategories]));
    }, [emitter]);

    return (
        <Select.Int
            path="subcategoryId"
            required
            className="mt-1 block w-full border-gray-300 rounded p-2"
        >
            {subcategories.map(({ id, fullName }) => (
                <option key={id} value={id || ""}>
                    {fullName}
                </option>
            ))}
        </Select.Int>
    );
}


/**
 * Types
 */

interface SubCategory {
    id: number;
    fullName: string;
    isEnabled: boolean;
}