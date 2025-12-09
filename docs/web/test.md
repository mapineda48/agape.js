# Testing en Web

Esta guía documenta las mejores prácticas para escribir pruebas unitarias de componentes en el proyecto, con énfasis especial en formularios y páginas que usan los providers del sistema.

## Índice

- [Configuración Inicial](#configuración-inicial)
- [Estructura de Tests](#estructura-de-tests)
- [Providers Requeridos](#providers-requeridos)
- [Testing de Formularios](#testing-de-formularios)
- [Mocking de Servicios](#mocking-de-servicios)
- [Manejo de Timers](#manejo-de-timers)
- [Patrones Comunes](#patrones-comunes)
- [Troubleshooting](#troubleshooting)

---

## Configuración Inicial

### Archivo de Setup

El proyecto usa `web/test/setup.ts` para configuración global:

```typescript
// web/test/setup.ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "test-uuid",
  },
});
```

### Configuración de Vitest

El proyecto frontend se configura en `vitest.config.ts`:

```typescript
{
  test: {
    name: "frontend",
    environment: "jsdom",
    globals: true,
    setupFiles: "./web/test/setup.ts",
    include: ["web/**/*.test.ts", "web/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./web"),
      "@utils": path.resolve(__dirname, "./lib/utils"),
      // Servicios mapeados a mocks
      "@agape/security/access": "./web/test/mocks/access.ts",
      "@agape/catalogs/item": "./web/test/mocks/catalogs/item.ts",
      // ... más servicios
    },
  },
}
```

---

## Estructura de Tests

### Ubicación de Archivos

Los tests se colocan junto al archivo que prueban:

```
web/app/login/
├── page.tsx          # Componente
└── page.test.tsx     # Test del componente

web/app/cms/hr/employee/
├── components.tsx
├── components.test.tsx
├── [id]/
│   ├── page.tsx
│   └── page.test.tsx
```

### Estructura Básica de un Test

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { act } from "react";

// Componente a testear
import MyComponent from "./page";

// Mocks de servicios (vía alias en vitest.config.ts)
import { myService } from "@agape/my-module";

// Providers necesarios
import { HistoryManager, HistoryContext } from "@/components/router/router";
import EventEmitter from "@/components/util/event-emitter";
import PortalProvider from "@/components/util/portal";

describe("MyComponent", () => {
  let router: HistoryManager;

  beforeEach(() => {
    vi.clearAllMocks();
    router = new HistoryManager();
    // Setup de spies del router
  });

  const renderComponent = () => {
    return render(/* wrapped component */);
  };

  describe("Rendering", () => {
    it("should render correctly", () => {
      // ...
    });
  });

  describe("Behavior", () => {
    it("should handle user interaction", async () => {
      // ...
    });
  });
});
```

---

## Providers Requeridos

### Jerarquía de Providers

Los componentes del proyecto requieren varios providers. Este es el orden correcto de anidación:

```
HistoryContext.Provider    ← Router (navegación)
  └── EventEmitter         ← Sistema de eventos (Form, Submit)
       └── PortalProvider  ← Modales y overlays
            └── Component  ← Tu componente
```

### Helper de Render con Providers

```typescript
import { createElement } from "react";
import { render } from "@testing-library/react";
import { HistoryManager, HistoryContext } from "@/components/router/router";
import EventEmitter from "@/components/util/event-emitter";
import PortalProvider from "@/components/util/portal";

const renderWithProviders = (
  component: React.ReactElement,
  router: HistoryManager
) => {
  return render(
    createElement(
      HistoryContext.Provider,
      { value: router },
      createElement(
        EventEmitter,
        null,
        createElement(PortalProvider, null, component)
      )
    )
  );
};
```

### Cuándo Usar Cada Provider

| Provider                  | Necesario cuando...                                         |
| ------------------------- | ----------------------------------------------------------- |
| `HistoryContext.Provider` | El componente usa `useRouter()`                             |
| `EventEmitter`            | El componente usa `Form`, `Submit`, o `useEventEmitter()`   |
| `PortalProvider`          | El componente usa modales, tooltips, o `usePortalTrigger()` |

### Ejemplo: Componente con Form

```typescript
// El Form component usa internamente useEventEmitter() y Submit usa usePortalTrigger()
// Por lo tanto necesitamos EventEmitter y PortalProvider

const renderLoginForm = () => {
  return render(
    createElement(
      HistoryContext.Provider,
      { value: router },
      createElement(
        EventEmitter,
        null,
        createElement(PortalProvider, null, createElement(LoginForm))
      )
    )
  );
};
```

---

## Testing de Formularios

### Anatomía de un Form Test

```typescript
describe("Form Tests", () => {
  // 1. Rendering: ¿Se muestran los campos?
  it("should render form fields", () => {
    renderForm();
    expect(screen.getByLabelText("Usuario")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  // 2. Interaction: ¿Funcionan los inputs?
  it("should allow typing in fields", () => {
    renderForm();
    const input = screen.getByLabelText("Usuario");
    fireEvent.change(input, { target: { value: "test" } });
    expect(input).toHaveValue("test");
  });

  // 3. Submission: ¿Se envía correctamente?
  it("should submit form with correct data", async () => {
    renderForm();
    // Fill fields...
    fireEvent.submit(form);
    await waitFor(() => {
      expect(mockService).toHaveBeenCalledWith(expectedData);
    });
  });

  // 4. Validation: ¿Se manejan errores?
  it("should show validation errors", async () => {
    // ...
  });
});
```

### Interacción con Inputs

```typescript
// Input de texto
const input = screen.getByPlaceholderText("Tu nombre");
fireEvent.change(input, { target: { value: "Juan" } });

// Select
const select = screen.getByRole("combobox");
fireEvent.change(select, { target: { value: "1" } });

// Checkbox
const checkbox = screen.getByRole("checkbox");
fireEvent.click(checkbox);

// Submit button
const submitBtn = screen.getByRole("button", { name: /guardar/i });
fireEvent.click(submitBtn);

// Submit via form (preferido para formularios)
const form = input.closest("form");
fireEvent.submit(form!);
```

### Verificar Llamadas a Servicios

```typescript
import { myService } from "@agape/my-module";

it("should call service with correct data", async () => {
  (myService as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });

  renderForm();

  // Fill form
  fireEvent.change(screen.getByLabelText("Nombre"), {
    target: { value: "Test" },
  });

  // Submit
  fireEvent.submit(screen.getByRole("form"));

  await waitFor(() => {
    expect(myService).toHaveBeenCalledWith({
      name: "Test",
    });
  });
});
```

---

## Mocking de Servicios

### Estructura de Mocks

Los mocks se ubican en `web/test/mocks/` y se mapean vía alias en `vitest.config.ts`:

```
web/test/mocks/
├── access.ts           # @agape/security/access
├── user.ts             # @agape/core/user
├── employee.ts         # @agape/hr/employee
└── catalogs/
    └── item.ts         # @agape/catalogs/item
```

### Anatomía de un Mock

```typescript
// web/test/mocks/access.ts
import { vi } from "vitest";

// Re-exportar DTOs para que los tests puedan tipar datos
export type { LoginRequest, IUserSession } from "@utils/dto/security/access";

// Mocks de funciones
export const login = vi.fn();
export const logout = vi.fn();
export const isAuthenticated = vi.fn();

// Mocks de estado (si aplica)
export const session = {
  id: 0,
  fullName: "",
  avatarUrl: null,
};
```

### Configurar Mock para un Test

```typescript
import { login } from "@agape/security/access";

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle successful login", async () => {
    // Configurar respuesta exitosa
    (login as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    // ... test
  });

  it("should handle login error", async () => {
    // Configurar error
    (login as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Invalid credentials")
    );

    // ... test
  });
});
```

### Agregar Nuevo Servicio Mock

1. Crear archivo en `web/test/mocks/[module]/[service].ts`
2. Agregar alias en `vitest.config.ts`:

```typescript
"@agape/my-module/my-service": path.resolve(
  __dirname,
  "./web/test/mocks/my-module/my-service.ts"
),
```

---

## Manejo de Timers

### ⚠️ Problema Común: Fake Timers vs waitFor

El sistema de eventos del proyecto (`EventEmitter`) usa `setTimeout` internamente. Esto causa conflictos con `vi.useFakeTimers()` y `waitFor` de testing-library.

### Regla General

| Tipo de Test                                    | Timers                  |
| ----------------------------------------------- | ----------------------- |
| Tests síncronos (rendering, interaction básica) | `vi.useFakeTimers()` ✅ |
| Tests con `waitFor` / form submission           | `vi.useRealTimers()` ✅ |

### Patrón Recomendado

```typescript
describe("MyComponent", () => {
  let router: HistoryManager;

  beforeEach(() => {
    vi.useFakeTimers(); // Default: fake timers
    vi.clearAllMocks();
    router = new HistoryManager();
    // Setup router spies...
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Tests síncronos usan fake timers (del beforeEach principal)
  describe("Rendering", () => {
    it("should render title", () => {
      renderComponent();
      expect(screen.getByText("Título")).toBeInTheDocument();
    });
  });

  // Tests async con waitFor necesitan real timers
  describe("Form Submission", () => {
    beforeEach(() => {
      vi.useRealTimers(); // ⬅️ Cambiar a real timers
    });

    afterEach(() => {
      vi.useFakeTimers(); // ⬅️ Restaurar para otros grupos
    });

    it("should submit form", async () => {
      renderComponent();
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockService).toHaveBeenCalled();
      });
    });
  });
});
```

### Alternativa: Test sin Fake Timers

Si la mayoría de tus tests son async, simplemente no uses fake timers:

```typescript
describe("MyComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // NO usar vi.useFakeTimers()
  });

  // Todos los tests usan real timers
  it("should submit form", async () => {
    renderComponent();
    await waitFor(() => {
      expect(something).toBe(true);
    });
  });
});
```

---

## Patrones Comunes

### Testing del Router Hook

```typescript
import { useRouter } from "@/components/router/router-hook";

// Mock del hook completo
vi.mock("@/components/router/router-hook", () => ({
  useRouter: vi.fn(),
}));

describe("Component with navigation", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    (useRouter as any).mockReturnValue({
      navigate: mockNavigate,
      pathname: "/current",
      params: {},
    });
  });

  it("should navigate on action", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Go"));
    expect(mockNavigate).toHaveBeenCalledWith("/destination");
  });
});
```

### Testing de Notificaciones

```typescript
import { useNotificacion } from "@/components/ui/notification";

vi.mock("@/components/ui/notification", () => ({
  useNotificacion: vi.fn(),
}));

describe("Component with notifications", () => {
  const mockNotify = vi.fn();

  beforeEach(() => {
    (useNotificacion as any).mockReturnValue(mockNotify);
  });

  it("should show success notification", async () => {
    renderComponent();
    // ... trigger success action

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        payload: "Operación exitosa",
        type: "success",
      });
    });
  });
});
```

### Testing de Form Reset

```typescript
import { useFormReset } from "@/components/form";

vi.mock("@/components/form", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/form")>();
  return {
    ...actual,
    useFormReset: vi.fn(),
  };
});

describe("Form with reset", () => {
  const mockMerge = vi.fn();
  const mockSetAt = vi.fn();

  beforeEach(() => {
    (useFormReset as any).mockReturnValue({
      merge: mockMerge,
      setAt: mockSetAt,
    });
  });

  it("should populate form with data", async () => {
    renderComponent();
    // ... trigger data load

    await waitFor(() => {
      expect(mockMerge).toHaveBeenCalledWith({
        field: "value",
      });
    });
  });
});
```

### Testing de Componentes con Props

```typescript
const renderWithContext = (ui: React.ReactNode) => {
  return render(<EventEmitter>{ui}</EventEmitter>);
};

it("renders with initial data", () => {
  renderWithContext(
    <EditEmployeePage
      documentTypes={mockDocumentTypes}
      employee={mockEmployee}
    />
  );

  expect(screen.getByDisplayValue("Juan")).toBeInTheDocument();
});
```

---

## Troubleshooting

### Error: "Portal Context not found"

**Problema:** El componente usa modales o tooltips sin `PortalProvider`.

**Solución:**

```typescript
createElement(PortalProvider, null, createElement(MyComponent));
```

### Error: "Cannot read properties of null (reading 'on')"

**Problema:** El componente usa `Form` o `Submit` sin `EventEmitter`.

**Solución:**

```typescript
createElement(EventEmitter, null, createElement(MyComponent));
```

### Error: "Test timed out in 5000ms"

**Problema:** Usando `vi.useFakeTimers()` con `waitFor`.

**Solución:**

```typescript
// Cambiar a real timers para tests async
beforeEach(() => {
  vi.useRealTimers();
});
```

### Error: Mock no es llamado

**Problema:** El servicio no está siendo mockeado correctamente.

**Verificar:**

1. El alias está configurado en `vitest.config.ts`
2. El mock exporta la función con el nombre correcto
3. Estás usando `vi.clearAllMocks()` en `beforeEach`

```typescript
// vitest.config.ts
"@agape/my-service": path.resolve(__dirname, "./web/test/mocks/my-service.ts"),

// web/test/mocks/my-service.ts
export const myFunction = vi.fn();

// Test
beforeEach(() => {
  vi.clearAllMocks();
  (myFunction as ReturnType<typeof vi.fn>).mockResolvedValue(data);
});
```

### Error: getByLabelText no encuentra el elemento

**Problema:** El `htmlFor` del label no coincide con el `id` del input.

**Verificar:**

```tsx
<label htmlFor="username">Usuario</label>  {/* htmlFor="username" */}
<Input.Text id="username" />                {/* id="username" */}
```

**Alternativas:**

```typescript
// Por placeholder
screen.getByPlaceholderText("Tu nombre de usuario");

// Por rol
screen.getByRole("textbox", { name: /usuario/i });

// Por display value (para verificar valores)
screen.getByDisplayValue("Juan");
```

---

## Checklist para Nuevos Tests

- [ ] Importar `render`, `screen`, `fireEvent`, `waitFor` de `@testing-library/react`
- [ ] Importar `describe`, `it`, `expect`, `vi`, `beforeEach` de `vitest`
- [ ] Importar providers necesarios (`EventEmitter`, `PortalProvider`, `HistoryContext`)
- [ ] Configurar mocks de servicios con `vi.clearAllMocks()` en `beforeEach`
- [ ] Usar `vi.useRealTimers()` para tests con `waitFor`
- [ ] Verificar que el alias del servicio está en `vitest.config.ts`
- [ ] Estructurar tests en grupos: Rendering, Interaction, Submission, Validation
- [ ] Usar `act()` para cambios de estado síncronos
- [ ] Usar `waitFor()` para esperar cambios async
