import { ItemForm } from "./index";
import { useRouter } from "@/components/router/router-hook";

export default function CreateItemPage() {
  const { navigate } = useRouter();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Item</h1>
          <p className="text-gray-500">
            Selecciona el tipo y completa la informacion para crear un nuevo item.
          </p>
        </div>
        <button
          onClick={() => navigate("../products")}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Ver Catalogo
        </button>
      </div>
      <ItemForm onSuccess={() => navigate("../products")} />
    </div>
  );
}
