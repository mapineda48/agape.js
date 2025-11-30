import { Inventory } from "./index";

export default function CreateProductPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
        <p className="text-gray-500">
          Completa la información para crear un nuevo producto.
        </p>
      </div>
      <Inventory />
    </div>
  );
}
