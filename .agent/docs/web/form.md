# Sistema de Formularios

> **Guía de Uso para Desarrolladores**  
> Sistema de formularios basado en React con validación Zod y estado Zustand

---

## Tabla de Contenidos

1. [Inicio Rápido](#inicio-rápido)
2. [Componentes Principales](#componentes-principales)
3. [Inputs Disponibles](#inputs-disponibles)
4. [Validación con Zod](#validación-con-zod)
5. [Manejo de Errores](#manejo-de-errores)
6. [Arrays Dinámicos](#arrays-dinámicos)
7. [Hooks Disponibles](#hooks-disponibles)
8. [Patrones Avanzados](#patrones-avanzados)
9. [Accesibilidad](#accesibilidad)
10. [Referencia Rápida](#referencia-rápida)

---

## Inicio Rápido

### Instalación

El sistema de formularios está disponible en `#web/utils/components/form`:

```tsx
import Form from "#web/utils/components/form";
import EventEmitter from "#web/utils/components/event-emitter";
```

### Formulario Básico

```tsx
import Form from "#web/utils/components/form";
import EventEmitter from "#web/utils/components/event-emitter";

function ContactForm() {
  const handleSubmit = async (data) => {
    console.log("Datos enviados:", data);
    await api.saveContact(data);
  };

  return (
    <EventEmitter>
      <Form.Root state={{ name: "", email: "", message: "" }}>
        <Form.Text path="name" placeholder="Nombre" />
        <Form.Text path="email" type="email" placeholder="Email" />
        <Form.TextArea path="message" placeholder="Mensaje" />
        
        <Form.Submit onSubmit={handleSubmit}>
          Enviar
        </Form.Submit>
      </Form.Root>
    </EventEmitter>
  );
}
```

### Formulario con Validación

```tsx
import { z } from "zod";
import Form from "#web/utils/components/form";
import EventEmitter from "#web/utils/components/event-emitter";

const schema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  email: z.string().email("Email inválido"),
  age: z.number().min(18, "Debes ser mayor de edad"),
});

function UserForm() {
  return (
    <EventEmitter>
      <Form.Root 
        state={{ name: "", email: "", age: 0 }} 
        schema={schema}
        mode="onBlur"
      >
        <Form.Field name="name">
          <Form.Label>Nombre</Form.Label>
          <Form.Text />
          <Form.Error />
        </Form.Field>

        <Form.Field name="email">
          <Form.Label>Email</Form.Label>
          <Form.Text type="email" />
          <Form.Error />
        </Form.Field>

        <Form.Field name="age">
          <Form.Label>Edad</Form.Label>
          <Form.Int />
          <Form.Error />
        </Form.Field>

        <Form.Submit onSubmit={handleSubmit}>
          Registrar
        </Form.Submit>
      </Form.Root>
    </EventEmitter>
  );
}
```

---

## Componentes Principales

### Form.Root

Contenedor principal del formulario. Proporciona el store Zustand aislado y el contexto de validación.

```tsx
<Form.Root
  state={{ /* estado inicial */ }}
  schema={zodSchema}           // Opcional: schema de validación
  mode="onSubmit"              // Cuándo validar: "onSubmit" | "onBlur" | "onChange" | "onTouched"
  reValidateMode="onChange"    // Cuándo re-validar después del primer error
  onValidationError={(errors) => console.log(errors)}
>
  {/* Contenido del formulario */}
</Form.Root>
```

**Props principales:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `state` | `object` | `{}` | Estado inicial del formulario |
| `schema` | `z.ZodType` | - | Schema Zod para validación |
| `mode` | `ValidationMode` | `"onSubmit"` | Momento de validación inicial |
| `reValidateMode` | `ReValidateMode` | `"onChange"` | Momento de re-validación |
| `onValidationError` | `function` | - | Callback cuando falla la validación |

### Form.Field

Wrapper semántico que proporciona contexto para Label, Error y Description. Habilita accesibilidad automática.

```tsx
<Form.Field name="email" required>
  <Form.Label>Email</Form.Label>
  <Form.Text type="email" />
  <Form.Description>Usaremos tu email para notificaciones</Form.Description>
  <Form.Error />
</Form.Field>
```

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `name` | `string` | Path del campo en el estado |
| `required` | `boolean` | Marca el campo como requerido |
| `disabled` | `boolean` | Deshabilita el campo |
| `as` | `"div" \| "fieldset" \| "span"` | Elemento contenedor |

### Form.Scope

Crea un contexto de path anidado. Los inputs hijos heredan el prefijo automáticamente.

```tsx
<Form.Root state={{ user: { profile: { name: "", bio: "" } } }}>
  <Form.Scope path="user">
    <Form.Scope path="profile">
      <Form.Text path="name" />  {/* Path real: user.profile.name */}
      <Form.Text path="bio" />   {/* Path real: user.profile.bio */}
    </Form.Scope>
  </Form.Scope>
</Form.Root>
```

### Form.Submit

Botón de envío con manejo automático del estado de carga.

```tsx
<Form.Submit 
  onSubmit={async (data) => {
    await api.save(data);
  }}
  onSuccess={() => toast.success("Guardado!")}
  onError={(error) => toast.error(error.message)}
>
  Guardar
</Form.Submit>

{/* O con render prop para personalizar */}
<Form.Submit onSubmit={handleSubmit}>
  {({ isLoading, isDisabled }) => (
    <button disabled={isDisabled}>
      {isLoading ? "Guardando..." : "Guardar"}
    </button>
  )}
</Form.Submit>
```

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `onSubmit` | `(data) => Promise<void>` | Handler del submit |
| `onSuccess` | `() => void` | Callback en éxito |
| `onError` | `(error) => void` | Callback en error |
| `onLoadingChange` | `(loading) => void` | Notifica cambios de loading |

---

## Inputs Disponibles

### Texto

```tsx
// Input de texto simple
<Form.Text path="name" placeholder="Nombre" />

// Email
<Form.Text path="email" type="email" />

// Password
<Form.Text path="password" type="password" />

// Con todas las props HTML
<Form.Text 
  path="username"
  placeholder="Usuario"
  disabled={false}
  className="input-custom"
  maxLength={50}
/>
```

### TextArea

```tsx
<Form.TextArea 
  path="description" 
  rows={4}
  placeholder="Describe tu proyecto..."
/>
```

### Números

```tsx
// Enteros
<Form.Int path="age" min={0} max={120} />

// Decimales (JavaScript float)
<Form.Float path="price" step={0.01} />

// Alta precisión (Decimal.js)
<Form.Decimal path="amount" />
```

### Fecha y Hora

```tsx
<Form.DateTime path="birthdate" />
```

### Checkbox

```tsx
<Form.Checkbox path="acceptTerms" />

{/* Con label clickeable */}
<label>
  <Form.Checkbox path="newsletter" />
  Suscribirse al newsletter
</label>
```

### Select

Los componentes Select se usan **directamente con `path`**, no dentro de `Form.Field`:

```tsx
// Select de strings
<Form.Select.String path="country" placeholder="Selecciona país">
  <option value="mx">México</option>
  <option value="us">Estados Unidos</option>
  <option value="es">España</option>
</Form.Select.String>

// Select booleano (Sí/No)
<Form.Select.Boolean 
  path="isActive" 
  trueLabel="Activo"
  falseLabel="Inactivo"
/>

// Select de enteros
<Form.Select.Int path="quantity">
  <option value={1}>Uno</option>
  <option value={2}>Dos</option>
  <option value={3}>Tres</option>
</Form.Select.Int>
```

### Archivos

```tsx
// Un solo archivo
<Form.File path="avatar" accept="image/*" />

// Múltiples archivos
<Form.File path="documents" multiple accept=".pdf,.doc" />
```

---

## Validación con Zod

### Modos de Validación

```tsx
// Solo al enviar (default)
<Form.Root schema={schema} mode="onSubmit">

// Al perder foco
<Form.Root schema={schema} mode="onBlur">

// En cada cambio
<Form.Root schema={schema} mode="onChange">

// En blur, luego en cada cambio
<Form.Root schema={schema} mode="onTouched">
```

### Schemas Comunes

```tsx
import { z } from "zod";

// Schema básico
const userSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  age: z.number().min(18, "Debes ser mayor de edad"),
});

// Campos opcionales
const profileSchema = z.object({
  bio: z.string().optional(),
  website: z.string().url().optional(),
});

// Validación condicional
const addressSchema = z.object({
  country: z.string(),
  state: z.string(),
  zipCode: z.string().regex(/^\d{5}$/, "Código postal inválido"),
});

// Arrays
const teamSchema = z.object({
  name: z.string(),
  members: z.array(z.object({
    name: z.string(),
    role: z.string(),
  })).min(1, "Mínimo un miembro"),
});

// Transformaciones
const formSchema = z.object({
  price: z.string().transform((val) => parseFloat(val)),
});
```

### Validación Asíncrona

```tsx
const schema = z.object({
  username: z.string().refine(
    async (username) => {
      const available = await checkUsernameAvailable(username);
      return available;
    },
    { message: "Usuario ya existe" }
  ),
});
```

---

## Manejo de Errores

### Form.Error

Muestra el error del campo padre:

```tsx
<Form.Field name="email">
  <Form.Label>Email</Form.Label>
  <Form.Text type="email" />
  <Form.Error />  {/* Muestra error de "email" */}
</Form.Field>
```

Con render personalizado:

```tsx
<Form.Error>
  {(error) => (
    <span className="text-red-500 flex items-center gap-1">
      <AlertIcon /> {error}
    </span>
  )}
</Form.Error>
```

Siempre renderizar (incluso sin error):

```tsx
<Form.Error renderEmpty />
```

### Errores Manuales

```tsx
function MyForm() {
  const { setError, clearError, clearErrors } = Form.useValidationActions();
  
  const handleCustomValidation = () => {
    if (someCondition) {
      setError("fieldName", "Mensaje de error personalizado");
    }
  };
  
  return (
    <button type="button" onClick={() => clearErrors()}>
      Limpiar todos los errores
    </button>
  );
}
```

### Estado de Validación

```tsx
function FormStatus() {
  const isValid = Form.useFormIsValid();
  const errors = Form.useFormErrors();
  const isValidating = Form.useFormIsValidating();
  
  return (
    <div>
      {isValidating && <Spinner />}
      {!isValid && <p>Hay {Object.keys(errors).length} errores</p>}
    </div>
  );
}
```

---

## Arrays Dinámicos

### Form.Array (Componente Declarativo)

```tsx
<Form.Root state={{ items: [{ name: "" }] }}>
  <Form.Array path="items">
    {(fields, { append, remove, move }) => (
      <div>
        {fields.map((field, index) => (
          <div key={field.key}>
            <Form.Text path={`${index}.name`} />
            <button type="button" onClick={() => remove(index)}>
              Eliminar
            </button>
          </div>
        ))}
        
        <button type="button" onClick={() => append({ name: "" })}>
          Agregar Item
        </button>
      </div>
    )}
  </Form.Array>
</Form.Root>
```

### useArray Hook

```tsx
function ItemsList() {
  const { 
    items,      // Array actual
    map,        // Iterador con keys estables
    addItem,    // Agregar al final
    removeItem, // Eliminar por índice
    length,     // Cantidad de items
    set,        // Reemplazar array completo
  } = Form.useArray("items");
  
  return (
    <div>
      {map((item, index, key) => (
        <div key={key}>
          <Form.Text path={`items.${index}.name`} />
          <button type="button" onClick={() => removeItem(index)}>X</button>
        </div>
      ))}
      
      <button type="button" onClick={() => addItem({ name: "" })}>
        + Agregar
      </button>
    </div>
  );
}
```

### Operaciones de Array

```tsx
const { append, prepend, insert, remove, move, swap, replace } = arrayHelpers;

// Agregar al final
append({ name: "Nuevo" });

// Agregar al inicio
prepend({ name: "Primero" });

// Insertar en posición
insert(2, { name: "Tercero" });

// Eliminar por índice
remove(1);

// Mover elemento
move(0, 3);  // De índice 0 a índice 3

// Intercambiar posiciones
swap(1, 2);

// Reemplazar elemento
replace(0, { name: "Reemplazado" });
```

---

## Hooks Disponibles

### Form.useForm()

Acceso a acciones del formulario **sin suscripción reactiva**:

```tsx
function FormActions() {
  const { getValues, reset, merge, setAt } = Form.useForm();
  
  return (
    <>
      <button type="button" onClick={() => console.log(getValues())}>
        Ver valores
      </button>
      <button type="button" onClick={() => reset()}>
        Resetear
      </button>
      <button type="button" onClick={() => reset({ name: "Nuevo" })}>
        Resetear con nuevos valores
      </button>
      <button type="button" onClick={() => merge({ status: "draft" })}>
        Merge parcial
      </button>
      <button type="button" onClick={() => setAt("user.name", "Juan")}>
        Actualizar path específico
      </button>
    </>
  );
}
```

### Form.useState()

Suscripción reactiva al estado completo:

```tsx
function FormPreview() {
  const state = Form.useState();  // Re-render en cualquier cambio
  
  return <pre>{JSON.stringify(state, null, 2)}</pre>;
}
```

### Form.useSelector()

Suscripción selectiva (mejor performance):

```tsx
function UserName() {
  // Solo re-render cuando cambia user.name
  const name = Form.useSelector((state) => state.user?.name);
  
  return <p>Hola, {name}</p>;
}
```

### Hooks de Validación

```tsx
// Error de un campo específico
const error = Form.useFieldError("email");

// Estado touched/dirty
const isTouched = Form.useFieldTouched("email");
const isDirty = Form.useFieldDirty("email");

// Todo el estado del campo
const { error, touched, dirty } = Form.useFieldState("email");

// Estado global del formulario
const isValid = Form.useFormIsValid();
const isSubmitting = Form.useFormIsSubmitting();
const allErrors = Form.useFormErrors();

// Acciones de validación
const { setError, clearError, clearErrors, validateField } = Form.useValidationActions();
```

---

## Patrones Avanzados

### Formularios Anidados con Scope

```tsx
<Form.Root state={{
  billing: { address: "", city: "" },
  shipping: { address: "", city: "" },
  sameAsBilling: false,
}}>
  <h3>Dirección de Facturación</h3>
  <Form.Scope path="billing">
    <Form.Text path="address" placeholder="Dirección" />
    <Form.Text path="city" placeholder="Ciudad" />
  </Form.Scope>

  <Form.Checkbox path="sameAsBilling" />
  <label>Igual que facturación</label>

  <h3>Dirección de Envío</h3>
  <Form.Scope path="shipping">
    <Form.Text path="address" placeholder="Dirección" />
    <Form.Text path="city" placeholder="Ciudad" />
  </Form.Scope>
</Form.Root>
```

### Campos Condicionales

```tsx
function PaymentForm() {
  const paymentMethod = Form.useSelector((s) => s.paymentMethod);
  
  return (
    <Form.Root state={{ paymentMethod: "card", cardNumber: "", bankAccount: "" }}>
      <Form.Select.String path="paymentMethod">
        <option value="card">Tarjeta</option>
        <option value="bank">Transferencia</option>
      </Form.Select.String>
      
      {paymentMethod === "card" && (
        <Form.Text path="cardNumber" placeholder="Número de tarjeta" />
      )}
      
      {paymentMethod === "bank" && (
        <Form.Text path="bankAccount" placeholder="Cuenta bancaria" />
      )}
    </Form.Root>
  );
}
```

### Componente Input Personalizado

```tsx
function CustomInput({ path, label }) {
  const { value, onChange, onBlur, error, isTouched } = Form.useInput(path, "");
  
  return (
    <div className={`field ${error && isTouched ? "error" : ""}`}>
      <label>{label}</label>
      <input 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {isTouched && error && <span className="error">{error}</span>}
    </div>
  );
}

// Uso
<CustomInput path="email" label="Correo electrónico" />
```

### Multi-paso con Estado Persistente

```tsx
function MultiStepForm() {
  const [step, setStep] = useState(1);
  
  return (
    <Form.Root state={{ step1: {}, step2: {}, step3: {} }}>
      {step === 1 && (
        <Form.Scope path="step1">
          <Form.Text path="name" />
          <button type="button" onClick={() => setStep(2)}>Siguiente</button>
        </Form.Scope>
      )}
      
      {step === 2 && (
        <Form.Scope path="step2">
          <Form.Text path="email" />
          <button type="button" onClick={() => setStep(1)}>Anterior</button>
          <button type="button" onClick={() => setStep(3)}>Siguiente</button>
        </Form.Scope>
      )}
      
      {step === 3 && (
        <Form.Scope path="step3">
          <Form.TextArea path="comments" />
          <button type="button" onClick={() => setStep(2)}>Anterior</button>
          <Form.Submit onSubmit={handleSubmit}>Enviar</Form.Submit>
        </Form.Scope>
      )}
    </Form.Root>
  );
}
```

### Valores Calculados

```tsx
function OrderTotal() {
  const subtotal = Form.useSelector((s) => 
    s.items?.reduce((sum, item) => sum + (item.price * item.qty), 0) ?? 0
  );
  const tax = subtotal * 0.16;
  const total = subtotal + tax;
  
  return (
    <div>
      <p>Subtotal: ${subtotal.toFixed(2)}</p>
      <p>IVA (16%): ${tax.toFixed(2)}</p>
      <p><strong>Total: ${total.toFixed(2)}</strong></p>
    </div>
  );
}
```

---

## Accesibilidad

El sistema incluye características de accesibilidad automáticas:

### Labels y Inputs Asociados

```tsx
<Form.Field name="email">
  <Form.Label>Email</Form.Label>      {/* Genera htmlFor automático */}
  <Form.Text />                        {/* Recibe id automático */}
  <Form.Error />                       {/* Tiene role="alert" */}
</Form.Field>
```

### Atributos ARIA Automáticos

- `aria-describedby`: Vincula input con Error y Description
- `aria-invalid="true"`: Se agrega cuando hay errores
- `role="alert"`: En elementos de error
- `aria-live="polite"`: Para anunciar errores a lectores de pantalla

### Campos Requeridos

```tsx
<Form.Field name="email" required>
  <Form.Label>Email</Form.Label>  {/* Muestra asterisco * */}
  <Form.Text required />          {/* Atributo required en el input */}
</Form.Field>
```

### Descripciones de Ayuda

```tsx
<Form.Field name="password">
  <Form.Label>Contraseña</Form.Label>
  <Form.Text type="password" />
  <Form.Description>
    Mínimo 8 caracteres, una mayúscula y un número
  </Form.Description>
  <Form.Error />
</Form.Field>
```

---

## Referencia Rápida

### Componentes

| Componente | Descripción |
|------------|-------------|
| `Form.Root` | Contenedor principal con store y validación |
| `Form.Field` | Wrapper con contexto para Label/Error/Description |
| `Form.Scope` | Crea prefijo de path para inputs hijos |
| `Form.Submit` | Botón de envío con estado de carga |
| `Form.Label` | Label accesible asociado al input |
| `Form.Error` | Muestra mensaje de error del campo |
| `Form.Description` | Texto de ayuda para el campo |
| `Form.Array` | Renderiza arrays dinámicos |

### Inputs

| Input | Tipo de Valor | Uso |
|-------|---------------|-----|
| `Form.Text` | `string` | Texto, email, password |
| `Form.TextArea` | `string` | Texto multilínea |
| `Form.Int` | `number` | Enteros |
| `Form.Float` | `number` | Decimales |
| `Form.Decimal` | `Decimal` | Alta precisión |
| `Form.DateTime` | `Date` | Fecha y hora |
| `Form.Checkbox` | `boolean` | Verdadero/falso |
| `Form.File` | `File \| FileList` | Archivos |
| `Form.Select.String` | `string` | Selección de texto |
| `Form.Select.Int` | `number` | Selección numérica |
| `Form.Select.Boolean` | `boolean` | Selección Sí/No |

### Hooks

| Hook | Descripción |
|------|-------------|
| `Form.useForm()` | Acciones sin re-render |
| `Form.useState()` | Estado reactivo completo |
| `Form.useSelector(fn)` | Selección con re-render optimizado |
| `Form.useArray(path)` | Manejo de arrays |
| `Form.useInput(path, default)` | Crear input personalizado |
| `Form.useFieldError(path)` | Error de un campo |
| `Form.useFieldTouched(path)` | Estado touched |
| `Form.useFieldDirty(path)` | Estado dirty |
| `Form.useFormIsValid()` | Validez del formulario |
| `Form.useFormIsSubmitting()` | Estado de envío |
| `Form.useValidationActions()` | Acciones de validación |

### Modos de Validación

| Modo | Cuándo Valida |
|------|---------------|
| `onSubmit` | Solo al enviar |
| `onBlur` | Al perder foco |
| `onChange` | En cada cambio |
| `onTouched` | En blur, luego en cada cambio |

---

## Notas Importantes

1. **EventEmitter**: Siempre envuelve `Form.Root` con `<EventEmitter>` para que funcione el submit.

2. **Select fuera de Field**: Los componentes `Form.Select.*` deben usarse directamente con `path`, no dentro de `Form.Field`.

3. **Estado Inicial**: El prop `state` solo se usa en el montaje inicial. Cambios posteriores no afectan el store.

4. **Keys en Arrays**: Usa siempre el `key` proporcionado por `Form.Array` o `useArray.map()` para mantener el estado correcto.

5. **Performance**: Prefiere `Form.useSelector()` sobre `Form.useState()` para minimizar re-renders.
