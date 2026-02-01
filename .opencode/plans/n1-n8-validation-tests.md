# Plan de Implementación: Tests N1-N8 Validación

## Estado Actual

- **4 tests pasando**: N1.1, N1.2, N1.8, "Validation without schema"
- **4 tests fallando**: N1.3, N1.4, N1.5, N1.10

## Bug Identificado en el Código Fuente

### Problema: Path duplicado en Form.Text dentro de Form.Field

**Archivo**: `web/utils/components/form/Input/Text.tsx`

**Líneas afectadas**: 63-65

**Código actual (buggy)**:
```tsx
// Get path from Field context if not provided
const fieldContext = useFieldContextOptional();
const path = pathProp ?? fieldContext?.name ?? "";
```

**Problema**: 
1. `Form.Field name="email"` crea un `PathProvider` con el path `["email"]`
2. `Form.Text` sin `path` prop obtiene `fieldContext.name = "email"` 
3. `useInput("email")` llama a `usePaths("email")` que concatena con el contexto
4. Resultado: `["email", "email"]` - path duplicado!

**Corrección propuesta**:
```tsx
// Get path from Field context if not provided
// When inside Form.Field, we should NOT provide a path to useInput because
// Form.Field already creates a PathProvider with the field name.
const fieldContext = useFieldContextOptional();

// If pathProp is provided, use it. If inside Form.Field, use undefined
// to let PathProvider handle the path. Otherwise use empty string.
const path = pathProp !== undefined ? pathProp : (fieldContext ? undefined : "");
```

### Mismo fix necesario en otros Input components

Verificar y corregir el mismo patrón en:
- `web/utils/components/form/Input/Int.tsx`
- `web/utils/components/form/Input/Float.tsx`
- `web/utils/components/form/Input/Decimal.tsx`
- `web/utils/components/form/Input/DateTime.tsx`
- `web/utils/components/form/Input/TextArea.tsx`
- `web/utils/components/form/Input/File.tsx`
- `web/utils/components/form/CheckBox.tsx`
- `web/utils/components/form/Select/*.tsx`

---

## Orden de Implementación

### Fase 1: Corregir el Bug en Input Components

1. **Fix Text.tsx** - Cambiar lógica de path como se indica arriba
2. **Fix Int.tsx** - Aplicar mismo patrón
3. **Fix todos los demás inputs** - Aplicar mismo patrón
4. **Ejecutar tests existentes** - Verificar que no rompe nada

### Fase 2: Verificar Tests N1 Corregidos

1. Ejecutar `pnpm vitest run --project frontend web/__test__/utils/components/form/n1-validation-zod.test.tsx`
2. Los 4 tests que fallaban deberían pasar ahora

### Fase 3: Agregar Tests N1 Faltantes

Agregar al archivo `n1-validation-zod.test.tsx`:

**N1.6 - Schema async**:
```tsx
describe("N1.6 - Schema async", () => {
  it("should support async refinements", async () => {
    const schema = z.object({
      username: z.string().refine(
        async (val) => {
          // Simulate async check (e.g., username availability)
          await new Promise(resolve => setTimeout(resolve, 10));
          return val !== "taken";
        },
        { message: "Username is already taken" }
      ),
    });
    // Test that "taken" shows error, valid username passes
  });
});
```

**N1.7 - Schema discriminatedUnion**:
```tsx
describe("N1.7 - Schema condicional", () => {
  it("should work with discriminatedUnion", async () => {
    const schema = z.discriminatedUnion("type", [
      z.object({ type: z.literal("email"), email: z.string().email() }),
      z.object({ type: z.literal("phone"), phone: z.string().min(10) }),
    ]);
    // Test both union branches
  });
});
```

**N1.9 - Default en schema**:
```tsx
describe("N1.9 - Default en schema", () => {
  it("should apply schema defaults on valid submit", async () => {
    const schema = z.object({
      name: z.string(),
      role: z.string().default("user"),
    });
    // Submit with only name, verify role gets default
  });
});
```

### Fase 4: Crear N2 - Modos de Validación

Crear archivo: `web/__test__/utils/components/form/n2-validation-modes.test.tsx`

```tsx
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import Form from "#web/utils/components/form";
import { Submit } from "#web/utils/components/form/Submit";
import EventEmitter from "#web/utils/components/event-emitter";

describe("N2. Modos de Validación", () => {
  const schema = z.object({
    email: z.string().email("Invalid email"),
  });

  describe("N2.1 - mode='onSubmit'", () => {
    it("should only validate on submit", async () => {
      // Render with mode="onSubmit"
      // Type invalid email
      // Blur - should NOT show error yet
      // Submit - should show error
    });
  });

  describe("N2.2 - mode='onBlur'", () => {
    it("should validate on blur", async () => {
      // Render with mode="onBlur"
      // Type invalid email
      // Blur - should show error
    });
  });

  describe("N2.3 - mode='onChange'", () => {
    it("should validate on each change", async () => {
      // Render with mode="onChange"
      // Type character - should validate immediately
    });
  });

  describe("N2.4 - mode='onTouched'", () => {
    it("should validate on blur first, then on change", async () => {
      // Render with mode="onTouched"
      // Type - no validation
      // Blur - validate
      // Type again - validate on change now
    });
  });
});
```

### Fase 5: Crear N3 - Estado de Errores

Crear archivo: `web/__test__/utils/components/form/n3-error-state.test.tsx`

Tests para:
- N3.1: `Form.Error` muestra mensaje
- N3.2: Error desaparece al corregir
- N3.3: Múltiples errores por campo
- N3.4: Errores globales
- N3.5: `formState.errors` 
- N3.6: `formState.isValid`
- N3.7: Error en submit async
- N3.8: `setError(path, message)`
- N3.9: `clearErrors(path)`
- N3.10: `clearErrors()`

### Fase 6: Crear N4 - Estado Touched/Dirty

Crear archivo: `web/__test__/utils/components/form/n4-touched-dirty.test.tsx`

Tests para:
- N4.1-N4.4: touched y dirty tracking
- N4.5-N4.8: formState.isDirty, dirtyFields, touchedFields, reset

### Fase 7: Crear N5 - Form.Field Component

Crear archivo: `web/__test__/utils/components/form/n5-form-field.test.tsx`

Tests para:
- N5.1: Provee contexto a hijos
- N5.2: name type-safe (puede requerir TypeScript tests)
- N5.3: Validación inline
- N5.4: Deps para re-validación
- N5.5: Render condicional
- N5.6: Error boundary

### Fase 8: Crear N6 - Form.Label Component

Crear archivo: `web/__test__/utils/components/form/n6-form-label.test.tsx`

Tests para:
- N6.1: Vinculado a input (click enfoca)
- N6.2: htmlFor automático
- N6.3: Accesibilidad (aria-labelledby)
- N6.4: Fuera de Field requiere name

### Fase 9: Crear N7 - Form.Error Component

Crear archivo: `web/__test__/utils/components/form/n7-form-error.test.tsx`

Tests para:
- N7.1: Hereda de Field
- N7.2: name explícito
- N7.3: Sin error no renderiza
- N7.4: Render prop
- N7.5: Múltiples Form.Error
- N7.6: Accesibilidad (role="alert", aria-live)

### Fase 10: Crear N8 - Form.Array Component

Crear archivo: `web/__test__/utils/components/form/n8-form-array.test.tsx`

Tests para:
- N8.1-N8.12: render prop, keys, append, prepend, insert, remove, move, swap, replace, update, validación

---

## Actualizar TEST_PLAN.md

Después de cada sección completada, actualizar el estado en `TEST_PLAN.md`:
- Cambiar "| ID |" a "| ID | Estado |" 
- Marcar tests completados con ✅

---

## Comandos de Verificación

```bash
# Ejecutar todos los tests de form
pnpm vitest run --project frontend web/__test__/utils/components/form/

# Ejecutar tests específicos
pnpm vitest run --project frontend web/__test__/utils/components/form/n1-validation-zod.test.tsx

# Watch mode para desarrollo
pnpm vitest --project frontend web/__test__/utils/components/form/
```

---

## Archivos a Modificar

### Código Fuente (Bug Fixes)
1. `web/utils/components/form/Input/Text.tsx` - Fix path duplication
2. `web/utils/components/form/Input/Int.tsx` - Same fix
3. `web/utils/components/form/Input/Float.tsx` - Same fix
4. `web/utils/components/form/Input/Decimal.tsx` - Same fix
5. `web/utils/components/form/Input/DateTime.tsx` - Same fix
6. `web/utils/components/form/Input/TextArea.tsx` - Same fix
7. `web/utils/components/form/Input/File.tsx` - Same fix
8. `web/utils/components/form/CheckBox.tsx` - Same fix (if applicable)
9. `web/utils/components/form/Select/*.tsx` - Same fix (if applicable)

### Tests (New/Modified)
1. `web/__test__/utils/components/form/n1-validation-zod.test.tsx` - Fix + add N1.6, N1.7, N1.9
2. `web/__test__/utils/components/form/n2-validation-modes.test.tsx` - New
3. `web/__test__/utils/components/form/n3-error-state.test.tsx` - New
4. `web/__test__/utils/components/form/n4-touched-dirty.test.tsx` - New
5. `web/__test__/utils/components/form/n5-form-field.test.tsx` - New
6. `web/__test__/utils/components/form/n6-form-label.test.tsx` - New
7. `web/__test__/utils/components/form/n7-form-error.test.tsx` - New
8. `web/__test__/utils/components/form/n8-form-array.test.tsx` - New

### Documentación
1. `web/utils/components/form/TEST_PLAN.md` - Update status

---

## Notas

- N15, N16, N17 están excluidos de esta sesión (se abordarán después)
- Si encuentro tests que no aplican por cambios en la versión, los removeré
- Priorizaré hacer pasar los tests existentes antes de agregar nuevos
