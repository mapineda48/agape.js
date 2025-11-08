import { useState, type ReactNode, useEffect, Fragment } from "react";
import clsx from "clsx";
import CategoryConfiguration from "./Category";
import { useEmitter } from "@/components/util/event-emiter";

interface CollapsibleItemProps {
  title: string;
  children: ReactNode;
}

const CollapsibleItem = ({ title, children }: CollapsibleItemProps) => {
  const [state, setState] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const emitter = useEmitter();

  useEffect(() => {
    return emitter.closeCollapsibleItem(() => setIsOpen(false));
  }, []);

  return (
    <div className="border border-secondary/30 rounded-xl mb-4 overflow-hidden shadow-sm bg-white">
      <button
        type="button"
        onClick={() => {
          emitter.closeCollapsibleItem();
          setIsOpen(!isOpen);
          if (!isOpen) setState(true);
        }}
        className="w-full text-left px-4 py-3 bg-muted hover:bg-accent/10 text-dark font-medium focus:outline-none transition-colors duration-200"
      >
        <div className="flex justify-between items-center">
          <span>{title}</span>
          <span
            className={clsx(
              "transform transition-transform duration-300 text-primary",
              isOpen ? "rotate-180" : "rotate-0"
            )}
          >
            ▼
          </span>
        </div>
      </button>

      <div
        className={clsx(
          "transition-all duration-500 ease-in-out overflow-hidden",
          isOpen ? "max-h-[99999px] opacity-100" : "max-h-0 opacity-0"
        )}
        onTransitionEnd={() => setState(isOpen)}
      >
        <div className="px-4 py-3 text-sm text-dark">{state && children}</div>
      </div>
    </div>
  );
};

const CollapsibleList = () => {
  return (
    <div className="max-w-4xl mx-auto mt-10">
      <CollapsibleItem title="Inventario">
        <CategoryConfiguration />
      </CollapsibleItem>
      <CollapsibleItem title="Usuarios">
        <ul className="list-disc pl-6 space-y-1">
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

export default function ConfigurationCMS() {
  return (
    <Fragment>
      <CollapsibleList />
    </Fragment>
  );
}