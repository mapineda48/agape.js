# Plan de Pruebas: Sistema de Formularios

> **Autor:** Arquitecto de Software Senior  
> **Fecha:** Junio 2025  
> **Estado:** Catálogo de Pruebas para Migración

---

## Tabla de Contenidos

1. [Objetivo del Documento](#objetivo-del-documento)
2. [Tests de Regresión](#tests-de-regresión)
3. [Nuevos Escenarios de Prueba](#nuevos-escenarios-de-prueba)
4. [Matriz de Cobertura](#matriz-de-cobertura)

---

## Objetivo del Documento

Este documento cataloga **todos los tests necesarios** para:

1. **Regresión:** Garantizar que el comportamiento actual del sistema se preserve durante la migración
2. **Nuevos Escenarios:** Validar las nuevas funcionalidades propuestas (validación, errores, tipos)
3. **Edge Cases:** Cubrir casos límite y comportamientos no obvios

> ⚠️ **Nota:** Este documento describe la lógica de los tests, no su implementación en código.

---

## Tests de Regresión

### R1. Form.Root - Inicialización

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| R1.1 | Render sin estado inicial | Form se monta correctamente con estado vacío `{}` |
| R1.2 | Render con estado inicial | El estado inicial se propaga a todos los inputs hijos |
| R1.3 | Estado inicial con objetos anidados | Los campos anidados reciben sus valores correctos |
| R1.4 | Estado inicial con arrays | Los arrays se inicializan correctamente |
| R1.5 | Estado inicial con tipos especiales | `Decimal`, `DateTime`, `File` se inicializan correctamente |
| R1.6 | Múltiples Form.Root en misma página | Cada formulario tiene estado independiente (aislamiento) |
| R1.7 | Form.Root sin children | No arroja error, renderiza fragmento vacío |

### R2. Form.Text - Input de Texto

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| R2.1 | Render básico | Input se renderiza como `<input type="text">` |
| R2.2 | Valor inicial desde estado | Input muestra el valor del path especificado |
| R2.3 | Cambio de valor | Al escribir, el estado del form se actualiza |
| R2.4 | Prop `type="email"` | Input renderiza con `type="email"` |
| R2.5 | Prop `type="password"` | Input renderiza con `type="password"` |
| R2.6 | Prop `disabled` | Input está deshabilitado, no permite cambios |
| R2.7 | Prop `placeholder` | Placeholder se muestra correctamente |
| R2.8 | Prop `className` | Clase CSS se aplica al input |
| R2.9 | Path con punto `user.name` | Actualiza correctamente el objeto anidado |
| R2.10 | Path con índice `items.0` | Actualiza correctamente el array |
| R2.11 | `materialize: true` | Escribe valor por defecto al montar |
| R2.12 | `autoCleanup: true` | Elimina valor del estado al desmontar |

### R3. Form.Int - Input Numérico Entero

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| R3.1 | Render básico | Input se renderiza como `<input type="number">` |
| R3.2 | Solo acepta enteros | Decimales se truncan/rechazan |
| R3.3 | Valor inicial `0` | Muestra "0", no string vacío |
| R3.4 | Valor vacío | Se interpreta como `null` o `undefined` |
| R3.5 | Prop `min` | Valida valor mínimo |
| R3.6 | Prop `max` | Valida valor máximo |
| R3.7 | Entrada no numérica | Se ignora o muestra error |
| R3.8 | Números negativos | Se permiten si no hay restricción de `min` |

### R4. Form.Float - Input Numérico Decimal

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| R4.1 | Acepta decimales | `3.14` se guarda como number JavaScript |
| R4.2 | Prop `step` | Define precisión del input |
| R4.3 | Precisión de punto flotante | Maneja correctamente `0.1 + 0.2` edge case |
| R4.4 | Notación científica | Maneja entrada como `1e5` |

### R5. Form.Decimal - Input con Decimal.js

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| R5.1 | Almacena como Decimal | El estado contiene instancia de Decimal.js |
| R5.2 | Precisión arbitraria | Soporta `0.123456789012345678901234567890` |
| R5.3 | Serialización | Al submit, se serializa correctamente |
| R5.4 | Operaciones matemáticas | Mantiene precisión en cálculos |
| R5.5 | Valor inicial string | Convierte string a Decimal correctamente |
| R5.6 | Valor inicial number | Convierte number a Decimal correctamente |

### R6. Form.DateTime - Input de Fecha/Hora

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| R6.1 | Render como datetime-local | Input usa `type="datetime-local"` |
| R6.2 | Formato de display | Muestra fecha en formato del locale |
| R6.3 | Valor inicial Date | Convierte Date JS correctamente |
| R6.4 | Valor inicial string ISO | Parsea string ISO 8601 |
| R6.5 | Timezone handling | Maneja correctamente zonas horarias |
| R6.6 | Valor vacío | No muestra fecha inválida |

### R7. Form.File - Input de Archivos

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| R7.1 | Render como file input | Input usa `type="file"` |
| R7.2 | Selección de archivo | Estado contiene objeto `File` |
| R7.3 | Prop `multiple` | Permite seleccionar múltiples archivos |
| R7.4 | Prop `accept` | Filtra tipos de archivo permitidos |
| R7.5 | Archivo grande | Maneja archivos grandes sin bloquear UI |
| R7.6 | Clear/Reset | Puede limpiar selección de archivo |

### R8. Form.TextArea

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| R8.1 | Render como textarea | Renderiza `<textarea>` |
| R8.2 | Prop `rows` | Define altura visible |
| R8.3 | Texto multilínea | Preserva saltos de línea |
| R8.4 | Redimensionable | Comportamiento resize según CSS |

### R9. Form.Select

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| R9.1 | Render con opciones | Muestra todas las opciones |
| R9.2 | Selección de opción | Actualiza estado con value seleccionado |
| R9.3 | Opción por defecto | Primera opción o placeholder |
| R9.4 | Opciones dinámicas | Actualiza al cambiar prop options |
| R9.5 | Select.Boolean | Opciones Sí/No predefinidas |
| R9.6 | Select.Int | Values numéricos enteros |
| R9.7 | Select.String | Values string |
| R9.8 | Valor no en opciones | Maneja gracefully valor inválido |

### R10. Form.Checkbox

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| R10.1 | Estado inicial false | Checkbox desmarcado |
| R10.2 | Estado inicial true | Checkbox marcado |
| R10.3 | Toggle | Cambia valor al click |
| R10.4 | Label clickeable | Click en label activa checkbox |
| R10.5 | Estado indeterminado | Soporte para tri-state |

### R11. Form.Scope - Paths Anidados

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| R11.1 | Scope simple | Prefija paths de hijos |
| R11.2 | Scopes anidados | Concatena paths correctamente |
| R11.3 | `<Scope path="user"><Text path="name">` | Path final: `["user", "name"]` |
| R11.4 | Scope con índice numérico | Soporta `path={0}` para arrays |
| R11.5 | Scope vacío | No afecta paths de hijos |

### R12. Form.Submit

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| R12.1 | Click dispara submit | Llama a onSubmit con datos del form |
| R12.2 | Submit async | Muestra estado de loading |
| R12.3 | `onSuccess` callback | Se llama tras submit exitoso |
| R12.4 | `onError` callback | Se llama si submit falla |
| R12.5 | `onLoadingChange` | Notifica cambios de estado loading |
| R12.6 | Submit mientras loading | No permite doble submit |
| R12.7 | Enter en input | Dispara submit (form behavior) |
| R12.8 | Error en onSubmit | Captura y pasa a onError |

### R13. useForm Hook

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| R13.1 | `getValues()` | Retorna objeto con todos los valores |
| R13.2 | `getValues(path)` | Retorna valor en path específico |
| R13.3 | `reset()` | Resetea al estado inicial |
| R13.4 | `reset(newValues)` | Resetea con nuevos valores |
| R13.5 | `merge(values)` | Merge parcial de valores |
| R13.6 | `setAt(path, value)` | Actualiza valor en path |
| R13.7 | Hook fuera de Form | Arroja error descriptivo |

### R14. useFormState Hook

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| R14.1 | Retorna estado completo | Objeto con todos los valores |
| R14.2 | Re-render en cambios | Componente re-renderiza al cambiar estado |
| R14.3 | Selector específico | `useFormState(s => s.user)` solo re-render si user cambia |
| R14.4 | Hook fuera de Form | Arroja error descriptivo |

### R15. useFieldArray Hook

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| R15.1 | `map(callback)` | Itera sobre elementos con key |
| R15.2 | `addItem(item)` | Añade elemento al final |
| R15.3 | `addItem(item1, item2)` | Añade múltiples elementos |
| R15.4 | `removeItem(index)` | Elimina elemento por índice |
| R15.5 | `removeItem(0, 2, 4)` | Elimina múltiples índices |
| R15.6 | `set(newArray)` | Reemplaza array completo |
| R15.7 | `length` | Retorna cantidad de elementos |
| R15.8 | Keys estables | Keys no cambian al modificar otros elementos |
| R15.9 | Array vacío | Maneja array vacío sin errores |
| R15.10 | Array de objetos | Soporta elementos complejos |

### R16. Serialización de Tipos Especiales

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| R16.1 | Decimal en submit | Se serializa a string o número |
| R16.2 | DateTime en submit | Se serializa a ISO 8601 |
| R16.3 | File en submit | Se incluye objeto File |
| R16.4 | Reset con tipos especiales | Restaura tipos correctamente |

---

## Nuevos Escenarios de Prueba

### N1. Validación con Zod

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| N1.1 | Schema válido en submit | Submit procede, onSubmit recibe data tipada |
| N1.2 | Schema inválido en submit | Submit bloqueado, onError recibe errores |
| N1.3 | Validación por campo | Cada campo muestra su error específico |
| N1.4 | Validación anidada | Errores en `user.email` se asocian correctamente |
| N1.5 | Array validation | Error en `items.2.name` se muestra |
| N1.6 | Schema async | Soporta `z.string().refine(async ...)` |
| N1.7 | Schema condicional | `z.discriminatedUnion` funciona |
| N1.8 | Transform en schema | `z.string().transform(parseInt)` aplica |
| N1.9 | Default en schema | `z.string().default("foo")` se aplica |
| N1.10 | Optional fields | Campos opcionales no requieren valor |

### N2. Modos de Validación

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| N2.1 | `mode="onSubmit"` | Solo valida al hacer submit |
| N2.2 | `mode="onBlur"` | Valida campo al perder foco |
| N2.3 | `mode="onChange"` | Valida en cada cambio |
| N2.4 | `mode="onTouched"` | Valida en blur, luego en change |
| N2.5 | Cambio de modo runtime | Respeta nuevo modo |
| N2.6 | `reValidateMode` diferente | Re-valida según configuración |

### N3. Estado de Errores

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| N3.1 | Error visible en campo | `Form.Error` muestra mensaje |
| N3.2 | Error desaparece al corregir | Re-validación limpia error |
| N3.3 | Múltiples errores por campo | Solo muestra primer error (o lista) |
| N3.4 | Errores globales | Errores no asociados a campo específico |
| N3.5 | `formState.errors` | Objeto con todos los errores actuales |
| N3.6 | `formState.isValid` | false si hay errores |
| N3.7 | Error en submit async | Error de servidor se muestra |
| N3.8 | `setError(path, message)` | Puede setear error manualmente |
| N3.9 | `clearErrors(path)` | Limpia error de campo |
| N3.10 | `clearErrors()` | Limpia todos los errores |

### N4. Estado Touched/Dirty

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| N4.1 | Campo sin interactuar | `touched: false`, `dirty: false` |
| N4.2 | Campo con foco y blur | `touched: true` |
| N4.3 | Campo modificado | `dirty: true` |
| N4.4 | Campo vuelve a valor original | `dirty: false` (opcional) |
| N4.5 | `formState.isDirty` | true si algún campo dirty |
| N4.6 | `formState.dirtyFields` | Lista de campos modificados |
| N4.7 | `formState.touchedFields` | Lista de campos tocados |
| N4.8 | Reset limpia touched/dirty | Vuelve a estado inicial |

### N5. Form.Field Component

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| N5.1 | Provee contexto a hijos | Input/Error/Label reciben field info |
| N5.2 | `name` type-safe | Solo acepta paths válidos del schema |
| N5.3 | Validación inline | `validate` prop adicional al schema |
| N5.4 | Deps para re-validación | Campo re-valida cuando deps cambian |
| N5.5 | Render condicional | Ocultar campo no rompe form |
| N5.6 | Error boundary | Error en render no crashea form |

### N6. Form.Label Component

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| N6.1 | Vinculado a input | Click en label enfoca input |
| N6.2 | `htmlFor` automático | Generación de ID si no existe |
| N6.3 | Accesibilidad | `aria-labelledby` correcto |
| N6.4 | Fuera de Field | Requiere `name` prop |

### N7. Form.Error Component

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| N7.1 | Hereda de Field | Muestra error del campo padre |
| N7.2 | `name` explícito | Muestra error de otro campo |
| N7.3 | Sin error | No renderiza nada |
| N7.4 | Render prop | Custom render del error |
| N7.5 | Múltiples Form.Error | Todos muestran el error |
| N7.6 | Accesibilidad | `role="alert"`, `aria-live` |

### N8. Form.Array Component

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| N8.1 | Render prop pattern | `{(fields, helpers) => ...}` |
| N8.2 | `fields[].key` estable | Key persiste en reorder |
| N8.3 | `append(value)` | Añade al final |
| N8.4 | `prepend(value)` | Añade al inicio |
| N8.5 | `insert(index, value)` | Inserta en posición |
| N8.6 | `remove(index)` | Elimina por índice |
| N8.7 | `move(from, to)` | Mueve elemento |
| N8.8 | `swap(indexA, indexB)` | Intercambia elementos |
| N8.9 | `replace(index, value)` | Reemplaza elemento |
| N8.10 | `update(index, value)` | Merge parcial |
| N8.11 | Validación de array | Min/max items, items únicos |
| N8.12 | Error por ítem | `items.2.name` se muestra en ítem 2 |

### N9. Type-Safe Paths

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| N9.1 | Autocompletado de paths | IDE sugiere paths válidos |
| N9.2 | Error en typo | `user.naem` da error de TS |
| N9.3 | Path a tipo incorrecto | `Form.Int name="user.email"` error |
| N9.4 | Paths de array | `items.0.name` válido |
| N9.5 | Paths profundos | `a.b.c.d.e` funciona |
| N9.6 | Paths con unión | `address.line1 | address.line2` |
| N9.7 | Schema inferido | `z.infer<typeof schema>` tipos correctos |

### N10. useWatch Hook

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| N10.1 | Watch todo | Re-render en cualquier cambio |
| N10.2 | Watch path específico | Solo re-render si path cambia |
| N10.3 | Watch múltiples paths | Re-render si alguno cambia |
| N10.4 | Valor inicial | Retorna valor actual, no undefined |
| N10.5 | Watch sin contexto | Error descriptivo |
| N10.6 | Comparación por valor | No re-render si valor igual |

### N11. useFormContext Hook

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| N11.1 | Acceso a form completo | `form.getValues()`, etc |
| N11.2 | Tipado correcto | Retorno tipado según schema |
| N11.3 | Fuera de contexto | Error descriptivo |
| N11.4 | Nested providers | Usa el más cercano |

### N12. Accesibilidad (a11y)

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| N12.1 | Labels asociados | Todos los inputs tienen label |
| N12.2 | Errores anunciados | `aria-describedby` apunta a error |
| N12.3 | Campos requeridos | `aria-required="true"` |
| N12.4 | Campos inválidos | `aria-invalid="true"` |
| N12.5 | Focus management | Focus va a primer error en submit |
| N12.6 | Keyboard navigation | Tab order lógico |
| N12.7 | Screen reader | Textos descriptivos correctos |
| N12.8 | Loading state | `aria-busy="true"` durante submit |
| N12.9 | Disabled fields | `aria-disabled="true"` |
| N12.10 | Field descriptions | `aria-describedby` para help text |

### N13. Performance

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| N13.1 | Input individual | Solo ese input re-renderiza |
| N13.2 | 100 campos | Sin lag perceptible |
| N13.3 | Array 1000 elementos | Virtualización o lazy render |
| N13.4 | Submit async | UI responde durante espera |
| N13.5 | Validación pesada | No bloquea main thread |
| N13.6 | Memoria | Sin memory leaks en mount/unmount |
| N13.7 | useWatch específico | Menos re-renders que useFormState |

### N14. Edge Cases

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| N14.1 | Submit vacío | Valida, permite si schema lo permite |
| N14.2 | Campo undefined | Maneja sin error |
| N14.3 | Path no existente | Error claro o crear path |
| N14.4 | Cambio de schema runtime | Re-valida con nuevo schema |
| N14.5 | Unmount durante async | Cleanup sin errores |
| N14.6 | Double submit rápido | Solo un submit procede |
| N14.7 | Form dentro de form | Aislamiento correcto |
| N14.8 | Portal con Field | Context se mantiene |
| N14.9 | Suspense boundary | Funciona con lazy loading |
| N14.10 | Error boundary | Recuperación graceful |
| N14.11 | StrictMode | Sin doble efectos problemáticos |
| N14.12 | Concurrent Mode | Safe para concurrent features |

### N15. Integración con UI Libraries

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| N15.1 | Custom input component | `useField` permite integración |
| N15.2 | Componentes UI externos | Wrapper fácil de crear |
| N15.3 | DatePicker externo | Integra con react-datepicker, etc |
| N15.4 | Rich text editor | Soporta contenido complejo |
| N15.5 | File dropzone | Integra con react-dropzone |
| N15.6 | Select con búsqueda | Integra con react-select |

### N16. SSR y Hydration

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| N16.1 | Server render | No errores en SSR |
| N16.2 | Hydration | Estado consistente post-hydrate |
| N16.3 | Valores dinámicos | Re-hydrata correctamente |
| N16.4 | Sin localStorage | Funciona sin storage API |

### N17. DevTools y Debugging

| ID | Escenario | Comportamiento Esperado |
|----|-----------|------------------------|
| N17.1 | React DevTools | Estado visible en devtools |
| N17.2 | Console warnings | Warnings claros en desarrollo |
| N17.3 | Error messages | Stack traces útiles |
| N17.4 | Form state inspector | Herramienta de debug opcional |

---

## Matriz de Cobertura

### Por Componente

| Componente | Regresión | Nuevos | Total |
|------------|-----------|--------|-------|
| Form.Root | 7 | 5 | 12 |
| Form.Text | 12 | 3 | 15 |
| Form.Int | 8 | 2 | 10 |
| Form.Float | 4 | 2 | 6 |
| Form.Decimal | 6 | 2 | 8 |
| Form.DateTime | 6 | 2 | 8 |
| Form.File | 6 | 2 | 8 |
| Form.TextArea | 4 | 1 | 5 |
| Form.Select | 8 | 2 | 10 |
| Form.Checkbox | 5 | 2 | 7 |
| Form.Scope | 5 | 2 | 7 |
| Form.Submit | 8 | 4 | 12 |
| Form.Field | - | 6 | 6 |
| Form.Label | - | 4 | 4 |
| Form.Error | - | 6 | 6 |
| Form.Array | - | 12 | 12 |

### Por Feature

| Feature | Tests Regresión | Tests Nuevos | Total |
|---------|-----------------|--------------|-------|
| Inicialización | 16 | 5 | 21 |
| Data Binding | 20 | 8 | 28 |
| Validación | 0 | 25 | 25 |
| Errores | 0 | 20 | 20 |
| Touched/Dirty | 0 | 8 | 8 |
| Arrays | 10 | 12 | 22 |
| Type Safety | 0 | 7 | 7 |
| Hooks | 15 | 10 | 25 |
| Accesibilidad | 0 | 10 | 10 |
| Performance | 0 | 7 | 7 |
| Edge Cases | 4 | 12 | 16 |

### Resumen

| Categoría | Cantidad |
|-----------|----------|
| **Tests de Regresión** | ~80 |
| **Tests Nuevos** | ~120 |
| **Total Estimado** | ~200 |

---

## Prioridades de Implementación

### P0 - Críticos (Bloquean release)

- R1.* - Inicialización de Form.Root
- R12.* - Submit functionality
- N1.* - Validación con Zod
- N3.* - Estado de errores

### P1 - Altos (Release inicial)

- R2.* a R11.* - Todos los inputs
- R13.* a R15.* - Hooks actuales
- N2.* - Modos de validación
- N5.* a N7.* - Nuevos components

### P2 - Medios (Post-release)

- N4.* - Touched/Dirty
- N8.* - Form.Array mejorado
- N9.* - Type-safe paths
- N10.* - useWatch

### P3 - Bajos (Nice to have)

- N12.* - Accesibilidad completa
- N13.* - Optimización performance
- N15.* - Integraciones UI
- N16.* - SSR

---

## Estrategia de Testing

### Unit Tests
- Cada componente en aislamiento
- Mocking de contextos/providers
- Coverage mínimo: 80%

### Integration Tests
- Formularios completos
- Flujos de validación end-to-end
- Interacción usuario simulada

### Visual Regression
- Snapshots de estados de error
- Consistencia de estilos
- Responsive behavior

### Accessibility Tests
- axe-core automated checks
- Manual screen reader testing
- Keyboard-only navigation

---

*Documento vivo - actualizar conforme se implementen tests*
