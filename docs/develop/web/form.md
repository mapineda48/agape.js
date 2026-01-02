# Form Compound Components API

Una biblioteca de formularios para React robusta, basada en **Redux** (local) y el patrón **Compound Components**. Diseñada para manejar estados complejos, tipos de datos estrictos (Decimal, DateTime) y estructuras anidadas con alto rendimiento.

## 🚀 Características Principales

- **Arquitectura Compound**: API limpia y declarativa (`Form.Root`, `Form.Text`, `Form.Scope`).
- **Store Aislado**: Cada formulario crea su propio store de Redux, evitando renderizados innecesarios globales.
- **Tipado Estricto**: Soporte nativo para `Decimal.js` (finanzas), `DateTime` (fechas) y `File`.
- **Gestión de Rutas**: Manejo profundo de objetos y arrays mediante "paths" (ej. `"user.profile.name"`).
- **Hooks de Rendimiento**: `useForm` para lecturas/escrituras imperativas (sin re-render) y `Form.useState` para reactividad.

---

## 📦 Instalación y Uso Básico

Importa el objeto unificado `Form` para acceder a todos los componentes.

```tsx
import { Form } from "@/components/form";

// Define una interfaz para tipar el estado del formulario
interface UserFormState {
  user: {
    name: string;
    age: number;
  };
}

function UserForm() {
  const handleSubmit = async (data: UserFormState) => {
    console.log("Enviando:", data);
  };

  return (
    // ⚠️ IMPORTANTE: Siempre especifica el tipo genérico en Form.Root y Form.Submit
    <Form.Root<UserFormState> state={{ user: { name: "", age: 18 } }}>
      <Form.Scope path="user">
        <h3>Información Personal</h3>
        <Form.Text path="name" placeholder="Nombre completo" />
        <Form.Int path="age" min={0} />
      </Form.Scope>

      <Form.Submit<UserFormState> onSubmit={handleSubmit}>
        Guardar Usuario
      </Form.Submit>
    </Form.Root>
  );
}
```

> ⚠️ **Importante sobre Tipado**: Siempre utiliza el tipo genérico en `Form.Root<T>` y `Form.Submit<T>` para garantizar type-safety. Esto asegura que:
>
> - El `state` inicial tenga la estructura correcta
> - El callback `onSubmit` reciba datos con el tipo correcto
> - Los errores de tipado se detecten en tiempo de compilación

---

## 📚 API Reference: Contenedores

### `<Form.Root<T>>`

El contenedor principal. Provee el contexto del store y el bus de eventos.

**Sintaxis con Tipado (Recomendada):**

```tsx
<Form.Root<MyFormType> state={initialState}>{/* children */}</Form.Root>
```

| Prop       | Tipo        | Descripción                                                                                               |
| :--------- | :---------- | :-------------------------------------------------------------------------------------------------------- |
| `T`        | `type`      | **Tipo genérico obligatorio**. Define la estructura del estado del formulario.                            |
| `state`    | `T`         | Estado inicial del formulario. **Nota:** Cambiar esta prop después del montaje no reinicia el formulario. |
| `children` | `ReactNode` | Componentes hijos.                                                                                        |

### `<Form.Scope>`

Crea un contexto anidado para agrupar campos bajo una ruta específica (objeto o array).

| Prop          | Tipo      | Descripción                                                                                 |
| :------------ | :-------- | :------------------------------------------------------------------------------------------ | ------- | -------------------------------- |
| `path`        | `string`  | `number`                                                                                    | `Array` | La ruta relativa al scope padre. |
| `autoCleanup` | `boolean` | Si es `true`, elimina todos los datos de este scope del store al desmontarse el componente. |

---

## 📝 API Reference: Inputs

Todos los inputs comparten las siguientes **Props Comunes**:

- **`path`** (`string`): Ruta del campo en el store.
- **`materialize`** (`boolean`): Si es `true`, escribe el `defaultValue` en el store al montarse si no existe valor previo.
- **`autoCleanup`** (`boolean`): Si es `true`, elimina el valor del store al desmontarse.
- **Props HTML**: Soportan props estándar como `placeholder`, `disabled`, `className`, etc.

### Inputs Disponibles

| Componente        | Tipo de Dato | Detalles Específicos                                                                          |
| :---------------- | :----------- | :-------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `<Form.Text>`     | `string`     | Soporta `type="text"`, `"email"`, `"password"`.                                               |
| `<Form.TextArea>` | `string`     | Input multilínea.                                                                             |
| `<Form.Int>`      | `number`     | Parsea a entero. Prop `nullable`: si es `true`, el input vacío guarda `null` en lugar de `0`. |
| `<Form.Float>`    | `number`     | Parsea a flotante. Prop `nullable`: permite guardar `null`.                                   |
| `<Form.Decimal>`  | `Decimal`    | Usa `decimal.js` para alta precisión financiera. Maneja instancias de `Decimal` internamente. |
| `<Form.DateTime>` | `DateTime`   | Usa input `datetime-local`. Almacena instancias de `DateTime`.                                |
| `<Form.Checkbox>` | `boolean`    | Alterna entre `true`/`false`.                                                                 |
| `<Form.File>`     | `File`       | `File[]`                                                                                      | Soporta `multiple`. Almacena objetos `File` nativos. |

---

## 🔽 API Reference: Selects

Componentes nativos `<select>` conectados al store.

- **`<Form.Select.String>`**: Para valores de texto.
- **`<Form.Select.Int>`**: Parsea la selección a entero.
- **`<Form.Select.Boolean>`**: Renderiza opciones Sí/No y parsea a booleano.

---

## ⚡ API Reference: Botones

### `<Form.Submit<T>>`

Botón de envío con gestión automática de estado de carga y manejo de errores.

**Sintaxis con Tipado (Recomendada):**

```tsx
<Form.Submit<MyFormType> onSubmit={handleSubmit}>Guardar</Form.Submit>
```

| Prop              | Tipo                   | Descripción                                                                                     |
| :---------------- | :--------------------- | :---------------------------------------------------------------------------------------------- |
| `T`               | `type`                 | **Tipo genérico obligatorio**. Debe coincidir con el tipo usado en `Form.Root<T>`.              |
| `onSubmit`        | `(data: T) => Promise` | Función ejecutada al enviar. Recibe el objeto plano tipado (`data`). Debe retornar una Promesa. |
| `onSuccess`       | `(payload) => void`    | Ejecutada si `onSubmit` resuelve exitosamente.                                                  |
| `onError`         | `(error) => void`      | Ejecutada si `onSubmit` lanza un error. El error se captura internamente para no romper la app. |
| `onLoadingChange` | `(isLoading) => void`  | Callback para notificar cambios en el estado de carga.                                          |

---

## 🪝 API Reference: Hooks

### `Form.useForm()`

Hook imperativo para manipular el formulario **sin provocar re-renders**. Ideal para acciones programáticas.

```tsx
const { reset, merge, setAt, getValues } = Form.useForm();

// Reinicia todo el estado
reset({ name: "Nuevo" });

// Fusiona datos parciales
merge({ email: "test@test.com" });

// Actualiza una ruta específica
setAt(["user", "active"], true);

// Lee el estado actual (snapshot)
const data = getValues();
```

### `Form.useState()`

Hook reactivo. Retorna el estado actual del formulario. **Provoca re-render en cada cambio**.

```tsx
const values = Form.useState<MyFormType>();
return <div>Hola, {values.name}</div>;
```

### `Form.useArray(path)` (alias `useFieldArray`)

Hook esencial para manejar listas dinámicas (arrays). Garantiza la estabilidad de keys y el contexto de rutas.

```tsx
const { map, addItem, removeItem } = Form.useArray("items");

return (
  <div>
    {/* map inyecta automáticamente el contexto de ruta para inputs hijos */}
    {map((item, index) => (
      <div key={index}>
        <Form.Text path="name" /> {/* Se convierte en items[0].name, etc. */}
        <button onClick={() => removeItem(index)}>Borrar</button>
      </div>
    ))}
    <button onClick={() => addItem({ name: "" })}>Agregar</button>
  </div>
);
```

---

## ⚙️ Conceptos Avanzados

### AutoCleanup (Limpieza Automática)

Útil para formularios condicionales o "Wizards". Si un `<Form.Scope>` o Input tiene `autoCleanup`, al desmontarse (ej. ocultarse por un `v-if` o ternario), sus datos se eliminan del store automáticamente, limpiando también los objetos padres si quedan vacíos.

### Tipos Especiales (Serialización)

A diferencia de Redux estándar, este store está diseñado para vivir solo en el navegador y permite tipos no serializables en JSON:

- **Decimal**: Se preservan como instancias de `decimal.js` para cálculos precisos.
- **DateTime**: Se preservan como objetos `Date` extendidos.
- **File**: Se mantienen como referencias al archivo del navegador.

El sistema clona estos objetos correctamente para evitar mutaciones, pero no están diseñados para persistencia en `localStorage` o envío directo por red sin transformación previa.
