---
trigger: glob
globs: web/**/*
---

# Agape.js Router Rules

## 1. System Overview

The web client uses a **File-Based Routing** system similar to Next.js but runs entirely on the client-side (SPA).

- **Root Directory:** `web/app/`
- **Engine:** Custom Router (Not React Router).
- **Import Alias:** `#web/utils/components/router`

## 2. File Structure Conventions

The file system dictates the URL structure.

| File Name     | Role                                       | URL mapping example                           |
| :------------ | :----------------------------------------- | :-------------------------------------------- |
| `page.tsx`    | **Endpoint**. Renders the view.            | `web/app/users/page.tsx` -> `/users`          |
| `_layout.tsx` | **Wrapper**. Wraps all children in folder. | `web/app/cms/_layout.tsx` -> Wraps `/cms/*`   |
| `[param]/`    | **Dynamic Segment**.                       | `web/app/users/[id]/page.tsx` -> `/users/123` |

## 3. Component Templates

### A. Standard Page

```tsx
// web/app/about/page.tsx
export default function AboutPage() {
  return <h1>About Us</h1>;
}
```

### B. Dynamic Page with Data Loading (`onInit`)

**CRITICAL RULE:** Do not use `useEffect` for initial data fetching. Use the exported `onInit` function.

```tsx
// web/app/products/[id]/page.tsx

// 1. Runs BEFORE render. blocking.
// 2. Returns object injected as props to component.
export async function onInit({ params, query }) {
  const product = await fetchProduct(params.id); // Validates existence
  return { product };
}

// 3. Component receives data ready to use
export default function ProductPage({ product }) {
  return <h1>{product.name}</h1>;
}
```

### C. Layout

Layouts must export a component receiving `children`.

```tsx
// web/app/cms/_layout.tsx
export default function CmsLayout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

**Layout Override:** To break out of parent layouts (e.g., for a Login page), export `root = true`.

```tsx
// web/app/auth/_layout.tsx
export const root = true; // Ignores parent layouts
export default function AuthLayout({ children }) { ... }

```

## 4. Navigation Hook (`useRouter`)

Import: `import { useRouter } from "#web/utils/components/router";`

### The `Maps` Function

The router supports three specific navigation modes. Use the correct one for the context.

#### Mode 1: Absolute (Prefix `/`)

**Use for:** Jumping between distinct modules.

```tsx
navigate("/login");
navigate("/cms/dashboard");
```

#### Mode 2: Layout-Relative (No Prefix)

**Use for:** Navigation inside the current module. Preferred for portability.

```tsx
// Current: /cms/users
navigate("create"); // -> /cms/users/create
```

#### Mode 3: Relative (Prefix `.` or `..`)

**Use for:** Going back up the tree. Use sparingly.

```tsx
navigate("../"); // Go up one level
```

### Accessing Params

```tsx
const { params, query } = useRouter();
console.log(params.id); // From URL segment [id]
```

## 5. Security & Protection

Routes inside `/cms` are protected by default.

### Route Permissions

Permissions are NOT defined in the component. They are defined in the central configuration file.

**Location:** `web/utils/rbca.ts`

```typescript
export const ROUTE_PERMISSIONS = {
  "/cms/inventory": "inventory.view",
  "/cms/users": "admin.users.view",
};
```

## 6. Best Practices Checklist

1. **Data Fetching:** Is this initial page data? -> Use `export async function onInit`.
2. **Navigation:** Am I linking within the same module? -> Use **Layout-Relative** paths (no slash).
3. **State:** Do I need to pass complex objects (like a row selection) to the next page? -> Use state.

```tsx
navigate("details", { state: { preloadedData: myObject } });
```

4. **Links:** Do not use `<a>` tags. Use `onClick={() => navigate(...)}` or the system's Link component.
