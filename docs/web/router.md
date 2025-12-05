# 🚀 Router de Agape

Este router proporciona **navegación basada en archivos**, soporte para **rutas dinámicas**, **layouts anidados**, **params**, y un hook `useRouter()` para interactuar con la navegación desde React.

Su diseño es similar a Next.js App Router, pero está optimizado para apps embebidas (microfrontends) y navegación basada en `history`.

---

# 📦 1. Cómo se definen las rutas

El router detecta automáticamente las rutas a partir de la estructura de archivos:

| Archivo                             | Ruta resultante          |
| ----------------------------------- | ------------------------ |
| `./users/page.tsx`                  | `/users`                 |
| `./users/[id]/page.tsx`             | `/users/:id`             |
| `./products/[sku]/details/page.tsx` | `/products/:sku/details` |

✔️ Los segmentos dinámicos usan `:param` internamente, pero en archivos se escriben como `[param]`.

✔️ Las páginas se definen dentro de `page.tsx`.

---

# 🧩 2. Layouts

Cada carpeta puede tener un archivo:

```
_layout.tsx
```

Ese layout envuelve las páginas dentro del mismo directorio.

Ejemplo:

```
pages/
  users/
    [id]/
      _layout.tsx   ← Layout dinámico
      page.tsx      ← Página concreta
```

El router resuelve **layout concreto** cuando la ruta tiene parámetros:

- Patrón del layout: `/users/:id`
- Ruta concreta: `/users/123`

Tu layout recibe automáticamente el contenido hijo:

```tsx
export default function UserLayout({ children }) {
  return <div className="user-layout">{children}</div>;
}
```

---

# 🧭 3. Hook `useRouter()`

Este es el principal API para navegar.

```tsx
import { useRouter } from "@/router";

const { pathname, params, navigate, listen } = useRouter();
```

### `pathname`

La ruta **relativa** al layout actual.

Ejemplo estando en `/cms/configuration`:

```ts
pathname; // "configuration"
```

### `params`

Los parámetros dinámicos:

```ts
// para /users/42
params.id; // "42"
```

### `navigate(path, options?)`

Navega a otra ruta absoluta o relativa.

```ts
navigate("/login"); // absoluta
navigate("details"); // relativa al layout actual
navigate("../edit"); // subir un nivel
navigate("products/list"); // múltiples segmentos
navigate("inventory", { replace: true });
```

---

# 🗂 4. Rutas relativas, absolutas y navegación inteligente

El router soporta:

### ✔️ Rutas absolutas

Comienzan con `/`:

```ts
navigate("/home");
```

### ✔️ Rutas relativas

Resueltas según el contexto del layout:

Si el layout actual es `/cms/configuration`:

```ts
navigate("inventory"); // → /cms/configuration/inventory
```

### ✔️ Navegación basada en ruta actual (`./`)

```ts
// en /cms/items/current
navigate("./details");
// → /cms/items/current/details
```

### ✔️ Navegación al padre (`../`)

```ts
// en /cms/items/products
navigate("../suppliers");
// → /cms/items/suppliers
```

### ✔️ Evita salir de la raíz (clamping)

```ts
navigate("../../../root");
// → /root
```

---

# 🧭 5. Parametrización automática

El router extrae los parámetros y los expone en `params`.

Ejemplo de archivo:

```
./posts/[postId]/comments/[commentId]/page.tsx
```

Ruta real:

```
/posts/10/comments/20
```

Entonces:

```ts
params = { postId: "10", commentId: "20" };
```

---

# ⚡ 6. `onInit` — Carga inicial de datos

Una página o layout puede exportar una función opcional:

```tsx
export async function onInit({ params }) {
  return {
    product: await fetchProduct(params.id),
  };
}
```

El router la ejecuta antes de renderizar la página.

✔️ Funciona igual para páginas y layouts.
✔️ Siempre recibe `{ params }`.
✔️ Aunque no declares parámetros, los recibe vacíos.

El resultado se pasa al componente mediante un store interno.

---

# 🔐 7. AuthGuard (si la app lo usa)

Si activas el guard:

- `/cms` y `/cms/*` requieren usuario autenticado.
- `/login` redirige a `/cms` si ya estás autenticado.
- Mutación automática: `ctx.replace = true` para evitar contaminar el history.

Esto es transparente para integradores; no deben llamar manualmente al guard.

---

# 🧱 8. Cómo crear una nueva página

### 1. Crear el archivo:

```
./products/[id]/page.tsx
```

### 2. Exportar un componente React:

```tsx
export default function ProductPage() {
  const { params } = useRouter();
  return <div>Product {params.id}</div>;
}
```

### 3. (Opcional) Cargar datos con `onInit`

```tsx
export async function onInit({ params }) {
  return {
    product: await api.products.get(params.id),
  };
}
```

¡Y listo! La ruta queda registrada automáticamente.

---

# 🧱 9. Cómo crear un layout dinámico

```
./products/[id]/_layout.tsx
```

```tsx
export default function ProductLayout({ children }) {
  return (
    <div>
      <h1>Product section</h1>
      {children}
    </div>
  );
}
```

El router usa siempre la **ruta concreta**, no el patrón.

---

# 📌 10. API del Router (solo lo necesario)

### `useRouter()`

- `pathname: string`
- `params: Record<string,string>`
- `navigate(path: string, options?)`
- `listen(cb) → cleanupFn`

### `RouterPathProvider`

Se usa solo internamente por layouts.
No necesario para desarrolladores externos.

### Estructura recomendada del proyecto:

```
pages/
  users/
    [id]/
      page.tsx
      _layout.tsx
  products/
    [sku]/
      page.tsx
```

---

# 🎯 Resumen para un desarrollador externo

1. **Las rutas se generan automáticamente según archivos.**
2. **Usa `useRouter()` para navegar y leer parámetros.**
3. **Crea páginas con `page.tsx`, layouts con `_layout.tsx`.**
4. **Los parámetros se definen como `[param]`.**
5. **`onInit` permite cargar datos antes del render.**
6. **La navegación soporta rutas absolutas, relativas, y directorios (`../`, `./`).**
