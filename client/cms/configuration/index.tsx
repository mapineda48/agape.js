import { useState, ReactNode } from "react";
import CategoryConfiguration from "./Category";

interface CollapsibleItemProps {
  title: string;
  children: ReactNode;
}

const CollapsibleItem = ({ title, children }: CollapsibleItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-4 py-2 bg-gray-200 hover:bg-gray-300 focus:outline-none"
      >
        <span className="font-bold">{title}</span>
      </button>
      {isOpen && <div className="px-4 py-2">{children}</div>}
    </div>
  );
};

const CollapsibleList = () => {
  return (
    <div className="max-w-full mx-auto mt-10">
      <CollapsibleItem title="Inventario">
        <CategoryConfiguration />
      </CollapsibleItem>
      <CollapsibleItem title="Usuarios">
        <ul className="list-disc pl-6">
          <li>Usuario 1 - Información de usuario 1</li>
          <li>Usuario 2 - Información de usuario 2</li>
          <li>Usuario 3 - Información de usuario 3</li>
        </ul>
      </CollapsibleItem>
      <CollapsibleItem title="General">
        <p>
          Contenido general de ejemplo. Aquí puedes incluir textos, imágenes o
          cualquier otro contenido de muestra.
        </p>
      </CollapsibleItem>
    </div>
  );
};

export function ConfigurationCMS() {
  return <CollapsibleList />;
}
