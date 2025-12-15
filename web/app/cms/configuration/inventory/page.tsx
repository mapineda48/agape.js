import {
  listCategories,
  type ICategoryWithCounts as Category,
} from "@agape/catalogs/category";
import { listLocations } from "@agape/inventory/location";
import { listMovementTypes } from "@agape/inventory/movementType";
import {
  listUnitOfMeasures,
  type IUnitOfMeasure,
} from "@agape/inventory/unit_of_measure";
import CategoryList from "./Category";
import LocationList from "./Location";
import MovementTypeList from "./MovementType";
import UnitsOfMeasureList from "./UnitsOfMeasure";

interface Location {
  id?: number;
  name: string;
  code: string;
  type: string;
  description?: string | null;
  isEnabled: boolean;
}

interface MovementType {
  id?: number;
  name: string;
  factor: number;
  affectsStock: boolean;
  isEnabled: boolean;
  documentTypeId: number;
}

export async function onInit() {
  const [categories, locations, movementTypes, unitsOfMeasure] = await Promise.all([
    listCategories({ includeSubcategoryCount: true }),
    listLocations(),
    listMovementTypes(),
    listUnitOfMeasures({ activeOnly: false }),
  ]);

  return {
    categories,
    locations,
    movementTypes,
    unitsOfMeasure,
  };
}

export default function InventoryPage(props: {
  categories: Category[];
  locations: Location[];
  movementTypes: MovementType[];
  unitsOfMeasure: IUnitOfMeasure[];
}) {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
            Configuración de inventario
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
            Categorías, ubicaciones, unidades y tipos de movimiento
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Mantén ordenado el catálogo para productos, ubicaciones físicas,
            unidades de medida y flujos de entrada/salida.
          </p>
        </div>
      </header>

      <div className="grid gap-6 2xl:grid-cols-5">
        <div className="2xl:col-span-3 space-y-4">
          <CategoryList categories={props.categories} />
        </div>

        <div className="2xl:col-span-2 space-y-4">
          <UnitsOfMeasureList unitsOfMeasure={props.unitsOfMeasure} />
          <MovementTypeList movementTypes={props.movementTypes} />
          <LocationList locations={props.locations} />
        </div>
      </div>
    </div>
  );
}

