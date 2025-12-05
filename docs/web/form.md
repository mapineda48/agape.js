Claro que sí 👋 Vamos a dejar una documentación lista para que otro dev pueda usar la API del form sin preguntarte nada.

Te la dejo en formato Markdown para que puedas pegarla en el repo / Notion / README.

---

# API de formulario (Form + Inputs + Select + Submit)

Esta librería implementa un **estado de formulario controlado** usando un store de Redux interno y un sistema de paths para mapear inputs a un objeto JSON de datos. Está pensada solo para **estado de UI de formularios en el navegador** (no para un Redux global de la app).

---

## Visión general

### Flujo básico

1. Envuelves tus campos dentro de `<Form>` (default export del módulo).
2. Cada input declara un `path` (string o array) que indica dónde vive en el objeto de datos.
3. La librería guarda todo en `form.data` (store interno).
4. Al hacer submit, el componente `<Submit>` emite un evento y llama a tu `onSubmit(state)` con el objeto de datos actual.

### Conceptos clave

- **`path`**: ruta al valor dentro del objeto de formulario (`"name"`, `"user.profile.name"`, `["user", "profile", "name"]`, etc).
- **`materialize`**: si es `true`, el valor por defecto se escribe en el store **aunque el usuario no toque el input**. Útil cuando quieres que el campo exista siempre en el payload.
- **Store local**: el store se crea por formulario con `createStore` y vive solo en el navegador. Permite valores no 100% serializables (File, Decimal, DateTime, etc.).
- **EventEmitter**: el submit se coordina con un EventEmitter (`SUBMIT`, `SUBMIT_SUCCESS`). Para usar `<Submit />` necesitas que haya un `EventEmitter` en el árbol.

---

## Ejemplo rápido

```tsx
import Form, { Path } from "@/components/form"; // ruta de ejemplo
import * as Input from "@/components/form/Input";
import Checkbox from "@/components/form/CheckBox";
import { Submit } from "@/components/form/Submit";
import EventEmitter from "@/components/util/event-emitter";

function UserForm() {
  const handleSubmit = async (state: any) => {
    // state = { name: string, age: number, active: boolean }
    console.log("form data", state);
  };

  return (
    <EventEmitter>
      <Form
        state={{ name: "John", age: 30 }} // inicial opcional
      >
        <Input.Text path="name" />
        <Input.Int path="age" />
        <Checkbox path="active" materialize />

        <Submit onSubmit={handleSubmit}>Guardar</Submit>
      </Form>
    </EventEmitter>
  );
}
```

En los tests se validan exactamente estos comportamientos: inicialización desde `state`, actualización de inputs y envío del objeto completo en `onSubmit`.

---

## Componente `<Form>` (default export)

```tsx
import Form from "./form";
```

Envuelve el formulario con:

- Un **StoreProvider** de Redux interno.
- El **FormProvider**, que maneja el contexto del formulario y los eventos de submit.

**Props:**

```ts
type Props = {
  state?: any; // estado inicial del formulario (objeto/array)
  children: React.ReactNode;
};
```

Uso:

```tsx
<Form state={{ name: "Jane", age: 25 }}>{/* inputs */}</Form>
```

---

## Inputs

Todos los inputs comparten:

- `path: string | Path` (obligatorio).
- Resto de props son los del elemento HTML base (`input` o `textarea`), excepto `value`, `name`, `onChange`, `type`, que los controla la librería.

### Hook base: `useInput`

Todos los inputs se apoyan en:

```ts
const [value, setValue] = useInput<T>(
  path,
  defaultValue?,
  { materialize?: boolean }?
);
```

- Lee el valor desde el store usando `path`.
- Si no hay valor, usa `defaultValue`.
- Si `materialize: true` y aún no existe valor, escribe `defaultValue` en el store al montar.

---

### `<Input.Text>`

```tsx
import { Text } from "./Input";
// o import Input from "./Input"; Input.Text
```

**Props específicos:**

- `path: string | Path`
- `password?: boolean` → renderiza `type="password"`.
- `email?: boolean` → renderiza `type="email"`.
- `value?: string` → valor inicial por defecto.
- `materialize?: boolean` → si quieres que `value` se escriba en el store sin interacción.

---

### `<Input.TextArea>`

```tsx
<Input.TextArea path="description" />
```

- Usa `textarea` HTML.
- Inicializa con `""` si no hay valor.

---

### `<Input.Int>`

```tsx
<Input.Int path="age" />
```

- `type="number"`.
- Almacena un **número entero**.
- Si el campo se deja vacío → guarda `0` en el store (evita `NaN`).
- Si el usuario escribe un decimal (`"42.7"`) se trunca a `42`.

---

### `<Input.Float>`

```tsx
<Input.Float path="price" />
```

- `type="number"`.
- Guarda un **número flotante** (`parseFloat`).
- Campo vacío → guarda `0` en store y muestra `""` en UI.

---

### `<Input.Decimal>`

```tsx
import Decimal from "@utils/data/Decimal";

<Input.Decimal path="amount" />;
```

- Usa un tipo `Decimal` propio para precisión de números decimales.
- `displayValue` es `state.toString()` si `state` es `Decimal`.
- Input HTML es `type="number"`, `step="0.01"`.

---

### `<Input.DateTime>`

```tsx
import DateTime from "@utils/data/DateTime";

<Input.DateTime path="eventDate" />;
```

- Usa `type="datetime-local"`.
- Internamente trabaja con `DateTime` (wrapper de fecha propia).
- Por defecto inicializa con `new DateTime()` y **materializa** el valor en el store.
- Formato visual: `"yyyy-MM-dd'T'HH:mm"`.

---

### `<Input.File>`

```tsx
<Input.File path="avatar" />
<Input.File path="photos" multiple />
```

- Usa `type="file"`.
- Si `multiple` es `false` (default): guarda un solo `File` o `null`.
- Si `multiple` es `true`: guarda un `File[]`, concatenando los nuevos archivos con los existentes.

Los tests confirman que el estado en Redux contiene instancias reales de `File`.

---

### `<Checkbox>`

```tsx
import Checkbox from "./CheckBox";

<Checkbox path="enabled" />
<Checkbox path="termsAccepted" checked={true} materialize />
```

- Usa `type="checkbox"`.
- Props:

  - `path: string | Path`
  - `checked?: boolean` → valor inicial por defecto (`false` si no se pasa).
  - `materialize?: boolean` → si quieres que el valor por defecto se incluya siempre en el payload, incluso si el usuario no toca el checkbox.

---

## Selects

### `<Select.Boolean>`

```tsx
import * as Select from "./Select";

<Select.Boolean path="isActive" />
<Select.Boolean path="isActive" materialize />
```

- Renderiza un `<select>` con opciones `"Si"` y `"No"`.
- Mapea a/desde un `boolean` (`"true"`/`"false"`).
- Default interno: `false`.
- `materialize?: boolean` → mismo comportamiento que en los inputs.

---

### `<Select.Int>`

```tsx
<Select.Int path="count">
  <option value="0">Zero</option>
  <option value="10">Ten</option>
</Select.Int>
```

- Renderiza `<select>` y guarda un **número** parseado con `parseInt`.
- Si el valor del `<option>` no es numérico → usa `0`.
- Props extra:

  - `onChange?: (value: number, index: number) => void`
    Se llama con el valor parseado y el índice de la opción seleccionada.

---

## Submit

### `<Submit>`

```tsx
import { Submit } from "./Submit";

<Submit onSubmit={handleSubmit} onLoadingChange={setLoading}>
  Guardar
</Submit>;
```

**Props:**

```ts
interface Props extends Omit<JSX.IntrinsicElements["button"], "type"> {
  onSubmit: (state: any) => Promise<any>;
  onLoadingChange?: (loading: boolean) => void;
}
```

Comportamiento:

- Escucha el evento `SUBMIT` del contexto del formulario.
- Cuando recibe `SUBMIT`:

  - Llama `onSubmit(payload)` (payload = `form.data`).
  - Pone `loading = true`, deshabilita el botón.
  - Al resolver:

    - Emite `SUBMIT_SUCCESS` con el mismo payload.
    - Pone `loading = false`.

  - Si `onSubmit` lanza error:

    - No emite `SUBMIT_SUCCESS`.
    - `loading` vuelve a `false`.
    - En `NODE_ENV === "development"` hace `console.error(error)`.

`onLoadingChange?(loading)` se llama en cada cambio de estado de carga.

> 💡 Para que `<Submit>` funcione, debe haber un `EventEmitter` en el árbol y el formulario debe usar el contexto `useEvent` internamente (esto ya lo hace el `FormProvider`).

---

## Hooks avanzados

### `useInput(path, defaultValue?, options?)`

Ya lo vimos arriba: vínculo 1:1 con un campo del formulario. Úsalo para crear tus propios inputs custom.

---

### `useInputArray(path?)`

Hook para trabajar con **arrays** en el estado del formulario (listas dinámicas, colecciones, etc.).

```ts
const list = useInputArray<{ name: string }[]>("categories");
```

Devuelve un objeto con interfaz:

```ts
interface IInputArray<T extends unknown[]> {
  map(
    cb: (payload: T[number], index: number, paths: Path) => JSX.Element
  ): JSX.Element[];

  set(state: T): void;

  addItem(...items: T[number][]): void;

  removeItem(...index: number[]): void;

  readonly length: number;
}
```

- `map` envuelve cada item en un `PathProvider` interno, de forma que dentro puedes usar `useInput("campo")` con paths relativos.
- `set` reemplaza todo el array.
- `addItem` agrega al final uno o varios elementos.
- `removeItem` elimina por índices (acepta múltiples índices y los ordena para evitar problemas de desplazamiento).

Ejemplo:

```tsx
const Categories = () => {
  const categories = useInputArray<{ name: string }[]>("categories");

  return (
    <div>
      {categories.map((_item, index) => (
        <div key={index}>
          <Input.Text path="name" data-testid={`category-${index}`} />
        </div>
      ))}

      <button onClick={() => categories.addItem({ name: "New" })}>
        Add category
      </button>
    </div>
  );
};
```

Los tests cubren casos con arrays en raíz, nested arrays, arrays de objetos, y estabilidad de keys.

---

### `useSelector(selector)`

Versión propia de `useSelector` (tipo Redux), pero aplicada sobre `form.data` **revivida** (con `File`, `Decimal`, `DateTime`, etc.).

```ts
const profile = useSelector((state: any) => state.profile);
```

- Internamente:

  - Lee `state.form.data` del store interno.
  - Aplica `deepCloneWithOutHelpers` para reconstruir helpers no JSON-safe.
  - Aplica tu `selector` sobre ese dato revivido.

---

## Paths y `PathProvider`

El sistema de paths permite anidar contextos:

```tsx
import PathProvider from "./paths";

<Form state={{}}>
  <PathProvider value="user">
    <PathProvider value="profile">
      <Input.Text path="name" />
    </PathProvider>
  </PathProvider>
</Form>;
```

El submit devuelve:

```ts
{
  user: {
    profile: {
      name: "Alice";
    }
  }
}
```

Esto está probado también en combinación con `useInputArray`.

---

## Utilidades expuestas

Desde el `index` del módulo:

```ts
export { Path, useForm, useInputArray, useInput };
export { useAppDispatch } from "./store/hooks";
export { setAtPath } from "./store/dictSlice";
```

- `Path`: helper para paths (según implementación de `paths.ts`).
- `useForm` (`useEvent`): hook para acceder a los eventos del formulario (`SUBMIT`, `SUBMIT_SUCCESS`) si necesitas escucharlos manualmente.
- `useAppDispatch`: acceso al `dispatch` del store interno (casos avanzados).
- `setAtPath`: acción redux para escribir directamente en `form.data`.
