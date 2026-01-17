---
name: react-component-patterns
description: Usa este skill cuando el usuario pida crear o modificar componentes React en el frontend web/. Define patrones de componentes, hooks y estilos.
---

# Patrones de Componentes React

Este skill define las convenciones para crear componentes React en `agape.js`.

## Ubicación de Archivos

- **Páginas:** `web/app/cms/[módulo]/[funcionalidad]/page.tsx`
- **Componentes compartidos:** `web/components/[Componente].tsx`
- **Hooks personalizados:** `web/hook/[useHook].ts`
- **Tests:** Junto al componente como `[componente].test.tsx`

## Estructura de Página

```tsx
// web/app/cms/modulo/page.tsx
import { useState, useEffect } from "react";
import { useHistory } from "@/components/router/router";
import { list, type ListResult } from "@agape/modulo/entidad";

export default function ModuloPage() {
  const router = useHistory();
  const [data, setData] = useState<ListResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const result = await list({ pageSize: 10 });
      setData(result);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Título de Página</h1>
      {/* Contenido */}
    </div>
  );
}
```

## Imports Frontend

```tsx
// Router
import { useHistory } from "@/components/router/router";

// Servicios
import { list, getById, upsert } from "@agape/modulo/entidad";

// Tipos
import type { IMiEntidad, ListParams } from "@utils/dto/modulo/entidad";

// Componentes compartidos
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

// Librerías
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import Decimal from "@utils/data/Decimal";
import DateTime from "@utils/data/DateTime";
```

## Patrones de Estado

### Estado Local Simple

```tsx
const [isOpen, setIsOpen] = useState(false);
const [search, setSearch] = useState("");
```

### Estado con Tipo Complejo

```tsx
import type { IItemRecord } from "@utils/dto/catalogs/item";

const [selectedItem, setSelectedItem] = useState<IItemRecord | null>(null);
const [items, setItems] = useState<IItemRecord[]>([]);
```

### Estado de Formulario

```tsx
const [formData, setFormData] = useState<IItemInput>({
  code: "",
  fullName: "",
  basePrice: new Decimal("0"),
  isEnabled: true,
});

const handleChange = (field: keyof IItemInput, value: unknown) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
};
```

## Navegación

```tsx
import { useHistory } from "@/components/router/router";

function MyComponent() {
  const router = useHistory();

  // Navegar a ruta
  router.navigateTo("/cms/modulo/detalle/123");

  // Navegar con reemplazo (no agrega al historial)
  router.navigateTo("/cms/modulo", { replace: true });

  // Obtener path actual
  const currentPath = router.pathname;

  // Escuchar cambios de ruta
  useEffect(() => {
    const unlisten = router.listenPath((path) => {
      console.log("Path changed:", path);
    });
    return unlisten;
  }, [router]);
}
```

## Formularios

### Input Controlado

```tsx
<input
  type="text"
  value={formData.code}
  onChange={(e) => handleChange("code", e.target.value)}
  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
  placeholder="Código"
/>
```

### Select

```tsx
<select
  value={formData.categoryId ?? ""}
  onChange={(e) => handleChange("categoryId", e.target.value ? Number(e.target.value) : null)}
  className="w-full px-4 py-2 border rounded-lg"
>
  <option value="">Seleccionar categoría</option>
  {categories.map((cat) => (
    <option key={cat.id} value={cat.id}>
      {cat.fullName}
    </option>
  ))}
</select>
```

### Decimal Input

```tsx
import Decimal from "@utils/data/Decimal";

const [price, setPrice] = useState(new Decimal("0"));

<input
  type="number"
  step="0.01"
  value={price.toString()}
  onChange={(e) => setPrice(new Decimal(e.target.value || "0"))}
  className="w-full px-4 py-2 border rounded-lg"
/>
```

## Animaciones con Framer Motion

```tsx
import { motion, AnimatePresence } from "framer-motion";

// Fade in/out
<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Contenido
    </motion.div>
  )}
</AnimatePresence>

// Slide in
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Contenido
</motion.div>
```

## Clases CSS con clsx

```tsx
import clsx from "clsx";

<div
  className={clsx(
    "p-4 rounded-lg transition-all",
    isActive
      ? "bg-indigo-50 text-indigo-600 border-indigo-200"
      : "bg-gray-50 text-gray-600 border-gray-200",
    isDisabled && "opacity-50 cursor-not-allowed"
  )}
>
  Contenido
</div>
```

## Iconos (Heroicons)

```tsx
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

<button className="p-2 hover:bg-gray-100 rounded">
  <PlusIcon className="w-5 h-5" />
</button>
```

## Tablas

```tsx
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Código
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Nombre
        </th>
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
          Acciones
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {items.map((item) => (
        <tr key={item.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.code}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.fullName}</td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
            <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900">
              <PencilIcon className="w-5 h-5" />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

## Modales

```tsx
import { Modal } from "@/components/ui/Modal";

<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Crear Nuevo Ítem"
>
  <form onSubmit={handleSubmit}>
    {/* Campos del formulario */}
    <div className="flex justify-end gap-3 mt-6">
      <button
        type="button"
        onClick={() => setIsModalOpen(false)}
        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
      >
        Cancelar
      </button>
      <button
        type="submit"
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Guardar
      </button>
    </div>
  </form>
</Modal>
```

## Loading States

```tsx
// Spinner simple
<div className="flex items-center justify-center p-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
</div>

// Skeleton
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
  <div className="h-4 bg-gray-200 rounded w-1/2" />
</div>
```

## Tests

```tsx
// web/app/cms/modulo/page.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ModuloPage from "./page";
import { list, upsert } from "@agape/modulo/entidad";
import { Providers } from "@/test/providers";

describe("ModuloPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render list of items", async () => {
    (list as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        { id: 1, code: "ITEM-001", fullName: "Test Item" },
      ],
      totalCount: 1,
    });

    render(
      <Providers>
        <ModuloPage />
      </Providers>
    );

    await waitFor(() => {
      expect(screen.getByText("Test Item")).toBeInTheDocument();
    });

    expect(list).toHaveBeenCalledWith(expect.objectContaining({
      pageSize: 10,
    }));
  });

  it("should navigate to detail on row click", async () => {
    // ... test navigation
  });
});
```

## Estilos Dark Mode

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  <p className="text-gray-500 dark:text-gray-400">Texto secundario</p>
  <button className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
    Acción
  </button>
</div>
```

## Restricciones

- ❌ **NO** importar servicios de `#svc/` - usar `@agape/`
- ❌ **NO** usar `Date` nativo - usar `DateTime` de `@utils/data`
- ❌ **NO** manipular el DOM directamente - usar refs si necesario
- ❌ **NO** hardcodear textos en inglés - usar español para UI
