# Router - Guía de Uso

Sistema de enrutamiento para la aplicación web con soporte para:

- Rutas basadas en archivos (file-based routing)
- Layouts anidados
- Parámetros dinámicos
- Navegación relativa y absoluta
- Protección de rutas con autenticación y permisos

## Estructura de Archivos

El router escanea automáticamente los archivos en `web/app/`:

```
web/app/
├── page.tsx              → /
├── _layout.tsx           → Layout raíz
├── about/
│   └── page.tsx          → /about
├── users/
│   ├── page.tsx          → /users
│   ├── _layout.tsx       → Layout para /users/*
│   └── [id]/
│       ├── page.tsx      → /users/:id
│       └── profile/
│           └── page.tsx  → /users/:id/profile
└── cms/
    ├── _layout.tsx       → Layout para /cms/* (protegido)
    └── dashboard/
        └── page.tsx      → /cms/dashboard
```

### Convenciones

| Archivo       | Propósito                                          |
| ------------- | -------------------------------------------------- |
| `page.tsx`    | Componente de página (obligatorio para crear ruta) |
| `_layout.tsx` | Layout que envuelve las páginas hijas              |
| `[param]`     | Carpeta con parámetro dinámico → `:param`          |

---

## Crear una Página

```tsx
// web/app/products/page.tsx
export default function ProductsPage() {
  return <h1>Lista de Productos</h1>;
}
```

### Página con Parámetros

```tsx
// web/app/products/[id]/page.tsx
interface Props {
  params: { id: string };
}

export default function ProductDetailPage({ params }: Props) {
  return <h1>Producto: {params.id}</h1>;
}
```

### Página con Carga Inicial de Datos

```tsx
// web/app/products/[id]/page.tsx

// Se ejecuta antes de renderizar la página
export async function onInit({ params, query }) {
  const product = await fetchProduct(params.id);
  return { product };
}

// Recibe los datos de onInit como props
export default function ProductDetailPage({ product }) {
  return <h1>{product.name}</h1>;
}
```

---

## Crear un Layout

Los layouts envuelven todas las páginas dentro de su carpeta.

```tsx
// web/app/cms/_layout.tsx
interface Props {
  children: React.ReactNode;
}

export default function CmsLayout({ children }: Props) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

### Layout como Nueva Raíz

Si un layout necesita ser independiente (sin layouts padre):

```tsx
// web/app/auth/_layout.tsx
export const root = true; // Ignora layouts padre

export default function AuthLayout({ children }) {
  return <div className="auth-container">{children}</div>;
}
```

---

## Hook `useRouter`

El hook principal para navegación y acceso al estado del router.

```tsx
import { useRouter } from "#web/utils/components/router";

function MyComponent() {
  const { pathname, params, navigate, listen } = useRouter();

  // ...
}
```

### Propiedades

| Propiedad  | Tipo                     | Descripción                      |
| ---------- | ------------------------ | -------------------------------- |
| `pathname` | `string`                 | Ruta actual (relativa al layout) |
| `params`   | `Record<string, string>` | Parámetros de la URL             |
| `navigate` | `(to, options?) => void` | Función para navegar             |
| `listen`   | `(cb) => () => void`     | Escuchar cambios de ruta         |

---

## Navegación

### Tipos de Rutas

El router soporta 3 tipos de navegación:

#### 1. Rutas Absolutas (empiezan con `/`)

Navegan a una ruta específica sin importar el contexto actual.

```tsx
navigate("/login"); // → /login
navigate("/cms/dashboard"); // → /cms/dashboard
```

#### 2. Rutas Relativas (empiezan con `.`)

Navegan relativo a la **ruta actual del navegador**.

```tsx
// Estando en /cms/inventory/products
navigate("./edit"); // → /cms/inventory/products/edit
navigate("../"); // → /cms/inventory
navigate("../../sales"); // → /cms/sales
```

#### 3. Rutas de Layout (sin prefijo)

Navegan relativo al **layout actual**. Útil dentro de un módulo.

```tsx
// Dentro del layout /cms/inventory
navigate("products"); // → /cms/inventory/products
navigate("categories"); // → /cms/inventory/categories
navigate("config/settings"); // → /cms/inventory/config/settings
```

### Opciones de Navegación

```tsx
// Reemplazar en el historial (no agrega entrada)
navigate("/dashboard", { replace: true });

// Pasar estado a la nueva ruta
navigate("/product/123", {
  state: {
    fromSearch: true,
    scrollPosition: 150,
  },
});
```

---

## Ejemplos Prácticos

### Navegación desde un Botón

```tsx
function ProductCard({ id }) {
  const { navigate } = useRouter();

  return <div onClick={() => navigate(`products/${id}`)}>Ver Producto</div>;
}
```

### Menú de Navegación

```tsx
function Sidebar() {
  const { pathname, navigate } = useRouter();

  const items = [
    { path: "dashboard", label: "Dashboard" },
    { path: "products", label: "Productos" },
    { path: "orders", label: "Órdenes" },
  ];

  return (
    <nav>
      {items.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={pathname.startsWith(item.path) ? "active" : ""}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
```

### Leer Parámetros de URL

```tsx
// Ruta: /users/:userId/posts/:postId
// URL: /users/42/posts/99

function PostPage() {
  const { params } = useRouter();

  // params = { userId: "42", postId: "99" }

  return (
    <div>
      Post {params.postId} del usuario {params.userId}
    </div>
  );
}
```

### Escuchar Cambios de Ruta

```tsx
function Analytics() {
  const { listen } = useRouter();

  useEffect(() => {
    const unsubscribe = listen((newPath) => {
      trackPageView(newPath);
    });

    return unsubscribe;
  }, []);

  return null;
}
```

---

## Rutas Protegidas

Las rutas bajo `/cms` requieren autenticación automáticamente.

### Comportamiento Automático

| Situación                                   | Resultado                        |
| ------------------------------------------- | -------------------------------- |
| Usuario no autenticado accede a `/cms/*`    | Redirige a `/login`              |
| Usuario autenticado accede a `/login`       | Redirige a `/cms`                |
| Usuario sin permiso accede a ruta protegida | Muestra página "Acceso Denegado" |

### Permisos por Ruta

Los permisos se configuran en `web/utils/rbca.ts`:

```typescript
export const ROUTE_PERMISSIONS = {
  "/cms/inventory": "inventory.view",
  "/cms/sales": "sales.view",
  "/cms/config": "configuration.admin",
  // ...
};
```

---

## Tips y Buenas Prácticas

### ✅ Usar rutas de layout dentro de módulos

```tsx
// Dentro de /cms/inventory/_layout.tsx
navigate("products"); // ✅ Portable, funciona si mueves el módulo
```

### ✅ Usar rutas absolutas para cambios de sección

```tsx
navigate("/login"); // ✅ Claro e inequívoco
navigate("/cms"); // ✅ Siempre va al CMS
```

### ✅ Pasar datos via state para optimizar

```tsx
// En lugar de hacer fetch de nuevo
navigate(`/product/${id}`, {
  state: { product: productData },
});
```

### ❌ Evitar rutas relativas complejas

```tsx
navigate("../../../../other"); // ❌ Difícil de entender
navigate("/other"); // ✅ Claro
```

---

## Componentes de Error

El router incluye componentes para casos de error:

- **`NotFound`** - Se muestra cuando la ruta no existe
- **`Unauthorized`** - Se muestra cuando falta permiso

Ubicados en `web/components/`.
