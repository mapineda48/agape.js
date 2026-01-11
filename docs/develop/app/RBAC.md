# Role-Based Access Control (RBAC)

## Overview

Agape.js implements a comprehensive Role-Based Access Control (RBAC) system that secures:

1. **RPC Endpoints** - Backend API calls protected via `@permission` JSDoc tags
2. **Frontend Routes** - Navigation/menu visibility controlled by permission mapping
3. **Page Access** - Direct URL access blocked with "Unauthorized" page for users without permission

The system is designed to be declarative; developers define access requirements directly in the code, and the framework handles enforcement automatically at both client and server levels.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Permission Configuration                            │
│                                                                             │
│  lib/rpc/permissions.generated.ts                                           │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────┐    │
│  │ navigationPermissions   │    │ rpcPermissions (AUTO-GENERATED)     │    │
│  │ (CONSTANT - Manual)     │    │ Extracted from @permission JSDoc    │    │
│  │                         │    │                                     │    │
│  │ - cms.view              │    │ - /finance/invoice/create           │    │
│  │ - inventory.view        │    │ - /inventory/item/upsert            │    │
│  │ - sales.view            │    │ - /security/user/manage             │    │
│  └─────────────────────────┘    └─────────────────────────────────────┘    │
│                    │                              │                         │
│                    └──────────────┬───────────────┘                         │
│                                   ▼                                         │
│                        allPermissions (combined)                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
│  RPC Middleware   │    │  Router AuthGuard │    │    Sidebar Menu   │
│  (Server-side)    │    │  (Client-side)    │    │  (Client-side)    │
│                   │    │                   │    │                   │
│  Validates API    │    │  Validates route  │    │  Filters visible  │
│  calls against    │    │  access, shows    │    │  menu items based │
│  user permissions │    │  Unauthorized pg  │    │  on permissions   │
└───────────────────┘    └───────────────────┘    └───────────────────┘
```

---

## Permission Types

### 1. Navigation Permissions (CONSTANT)

Defined manually in `lib/rpc/permissions.generated.ts`. These control **module-level access** for the frontend.

```typescript
export const navigationPermissions = {
  // Core CMS access
  "cms.view": "Acceso básico al CMS",

  // Module views (appearing in sidebar)
  "inventory.view": "Acceso al módulo de inventario",
  "sales.view": "Acceso al módulo de ventas",
  "purchasing.view": "Acceso al módulo de compras",
  "invoicing.view": "Acceso al módulo de facturación",
  "crm.view": "Acceso al módulo de CRM/Clientes",
  "hr.view": "Acceso al módulo de recursos humanos",
  "report.view": "Acceso a reportes",
  "configuration.admin": "Acceso a configuración del sistema",
} as const;
```

**When to edit:** Add new permissions here when creating a new module or section in the CMS.

### 2. RPC Permissions (AUTO-GENERATED)

Extracted automatically from `@permission` JSDoc tags in service files (`svc/**/*.ts`). These control **action-level access** for API calls.

```typescript
// Example from svc/inventory/item.ts
/**
 * Updates or creates an item.
 * @permission inventory.item.manage
 */
export async function upsertItem(payload: ItemPayload) {
  // ...
}
```

**Do NOT edit** the `rpcPermissions` section manually - it's regenerated during build.

---

## Permission Naming Standard

Follow the `{module}.{resource}.{action}` convention:

| Segment | Description | Examples |
|---------|-------------|----------|
| **Module** | System module | `inventory`, `sales`, `finance`, `hr`, `crm` |
| **Resource** | Specific entity | `item`, `invoice`, `employee`, `client` |
| **Action** | Operation type | `read`, `manage`, `view`, `post` |

### Standard Actions

| Action | Use Case | Example |
|--------|----------|---------|
| `view` | Module-level navigation access | `inventory.view` |
| `read` | List, search, get by ID operations | `inventory.item.read` |
| `manage` | Create, update, delete, toggle | `inventory.item.manage` |
| `post` | Document posting (invoices, movements) | `finance.invoice.post` |
| `cancel` | Document cancellation | `inventory.movement.cancel` |
| `admin` | Administrative access | `configuration.admin` |

### Examples

```
inventory.view              → Can access inventory module
inventory.item.read         → Can list/view items
inventory.item.manage       → Can create/edit/delete items
inventory.movement.post     → Can post inventory movements

sales.view                  → Can access sales module  
sales.order.read            → Can view sales orders
sales.order.manage          → Can create/edit orders
sales.flow.deliver          → Can deliver sales orders

configuration.admin         → Can access system configuration
security.role.manage        → Can manage user roles
```

---

## Wildcards

The system supports wildcards (`*`) for flexible role definitions:

| Pattern | Matches | Use Case |
|---------|---------|----------|
| `*` | Everything | Super Admin |
| `inventory.*` | All inventory permissions | Inventory Manager |
| `inventory.item.*` | All item actions | Item Manager |

**Matching Algorithm:**
```typescript
function matchPermission(userPerm: string, required: string): boolean {
  // Exact match
  if (userPerm === required) return true;
  
  // Super admin
  if (userPerm === "*") return true;
  
  // Wildcard pattern: "inventory.*" matches "inventory.item.read"
  if (userPerm.endsWith(".*")) {
    const prefix = userPerm.slice(0, -2);
    return required === prefix || required.startsWith(prefix + ".");
  }
  
  return false;
}
```

---

## How to Protect a Service (RPC)

### Step 1: Add the `@permission` JSDoc tag

```typescript
// svc/inventory/item.ts

/**
 * Retrieves an item by its ID.
 * @param id The item ID.
 * @returns The item record.
 * @permission inventory.item.read
 */
export async function getItemById(id: number) {
  // Implementation...
}

/**
 * Creates or updates an item.
 * @param payload Item data.
 * @returns The saved item.
 * @permission inventory.item.manage
 */
export async function upsertItem(payload: ItemPayload) {
  // Implementation...
}
```

### Step 2: Regenerate permissions (automatic on build)

During development, permissions are parsed on-the-fly. For production:

```bash
pnpm build
```

This runs `extract-permissions.ts` which updates `dist/lib/rpc/permissions.generated.js`.

### Step 3: Enforcement at runtime

The RPC middleware automatically:
1. Looks up the required permission for the endpoint
2. Checks if the user's `permissions[]` array includes it (or a matching wildcard)
3. Throws `ForbiddenError (403)` if unauthorized

---

## How to Protect a Route (Frontend)

### Route Permission Mapping

Route permissions are defined in `web/lib/rbac/index.ts`:

```typescript
export const ROUTE_PERMISSIONS: Record<string, string> = {
  "/cms/configuration": "configuration.admin",
  "/cms/inventory": "inventory.view",
  "/cms/sales": "sales.view",
  "/cms/purchasing": "purchasing.view",
  "/cms/invoicing": "invoicing.view",
  "/cms/crm": "crm.view",
  "/cms/hr": "hr.view",
  "/cms/report": "report.view",
  "/cms": "cms.view",
};
```

**Rules:**
- Routes are matched by prefix (e.g., `/cms/inventory` matches `/cms/inventory/products/123`)
- More specific routes should come first
- Users without matching permission see the **Unauthorized** page

### Menu Permission Mapping

Controls which items appear in the Sidebar:

```typescript
export const MENU_PERMISSIONS: Record<string, string> = {
  "/cms": "cms.view",
  "/cms/inventory/movements": "inventory.view",
  "/cms/sales/orders": "sales.view",
  "/cms/configuration": "configuration.admin",
  // ...
};
```

### How it Works

1. **Sidebar** (`web/components/Sidebar.tsx`):
   - Filters menu items using `canViewMenuItem(path)`
   - Hides entire sections if no items are visible

2. **Router** (`web/components/router/router.ts`):
   - `AuthGuard.check()` validates permissions before navigation
   - If denied, renders `Unauthorized` component instead of the page

3. **Unauthorized Component** (`web/components/Unauthorized.tsx`):
   - Full-page "Access Denied" message
   - Shows which permission was required
   - Provides navigation back to CMS

---

## Adding a New Module

When creating a new module (e.g., `logistics`):

### 1. Add Navigation Permission

Edit `lib/rpc/permissions.generated.ts`:

```typescript
export const navigationPermissions = {
  // ...existing permissions
  "logistics.view": "Acceso al módulo de logística",
} as const;
```

### 2. Add Route Mapping

Edit `web/lib/rbac/index.ts`:

```typescript
export const ROUTE_PERMISSIONS: Record<string, string> = {
  "/cms/logistics": "logistics.view",
  // ...existing routes
};

export const MENU_PERMISSIONS: Record<string, string> = {
  "/cms/logistics/shipments": "logistics.view",
  // ...existing menus
};
```

### 3. Add Menu Item

Edit `web/components/Sidebar.tsx`:

```typescript
const NAV_SECTIONS = [
  // ...
  {
    label: "Operaciones",
    items: [
      // ...existing items
      { 
        path: "/cms/logistics/shipments", 
        icon: TruckIcon, 
        label: "Logística", 
        activePath: "/cms/logistics" 
      },
    ],
  },
];
```

### 4. Protect Services

Add `@permission` tags to your service functions:

```typescript
// svc/logistics/shipment.ts

/**
 * Lists all shipments.
 * @permission logistics.shipment.read
 */
export async function listShipments() { ... }

/**
 * Creates a new shipment.
 * @permission logistics.shipment.manage
 */
export async function createShipment(data: ShipmentPayload) { ... }
```

---

## Permission Catalog (UI Management)

The system includes a **roles management screen** (`/cms/configuration/security`) where administrators can assign permissions to roles. For a permission to appear in this UI, it must be registered in the **Permission Catalog**.

### Location

The catalog is defined in `svc/security/role.ts` in the function `getAvailablePermissions()`.

### Structure

```typescript
export async function getAvailablePermissions(): Promise<
    { module: string; permissions: { key: string; label: string }[] }[]
> {
    return [
        {
            module: "Navegación",  // Group name shown in UI
            permissions: [
                { key: "cms.view", label: "Acceso al CMS (requerido)" },
                { key: "inventory.view", label: "Ver módulo Inventario" },
                // ...
            ],
        },
        {
            module: "Inventario",
            permissions: [
                { key: "inventory.item.read", label: "Ver productos" },
                { key: "inventory.item.manage", label: "Gestionar productos" },
                { key: "inventory.*", label: "Acceso completo a Inventario" },
            ],
        },
        // ... more modules
    ];
}
```

### Adding a Permission to the Catalog

When adding new functionality that requires RBAC, you must:

1. **Add the `@permission` tag** to your service function (for RPC enforcement)
2. **Add the permission to the catalog** (for UI management)

Example for a new "logistics" module:

```typescript
// In svc/security/role.ts - getAvailablePermissions()
{
    module: "Logística",
    permissions: [
        { key: "logistics.view", label: "Ver módulo Logística" },  // Navigation
        { key: "logistics.shipment.read", label: "Ver envíos" },    // RPC
        { key: "logistics.shipment.manage", label: "Gestionar envíos" },
        { key: "logistics.*", label: "Acceso completo a Logística" },
    ],
},
```

### Current Modules in Catalog

| Module | Description |
|--------|-------------|
| **Navegación** | Navigation/view permissions for sidebar visibility |
| **Seguridad** | User and role management |
| **CRM** | Clients and client types |
| **Ventas** | Sales orders and sales flow |
| **Inventario** | Products, locations, movements, stock |
| **Finanzas** | Invoices, payments, currencies, taxes |
| **Compras** | Suppliers, purchase orders, goods receipt |
| **Recursos Humanos** | Employees, departments, job positions |
| **Configuración** | System config, numbering series |
| **Catálogos** | Items, categories, price lists |
| **Core** | Users, addresses, contact methods |

### Important Notes

1. **Navigation permissions must be first** - The "Navegación" module should be the first group, as these are prerequisite permissions
2. **Include wildcards** - Always include `module.*` as the last permission in each module for quick full-access assignment
3. **Labels should be in Spanish** - The UI displays labels in Spanish for end users
4. **sync with JSDoc** - Ensure the `key` matches the `@permission` tag in your services

---

## Database Integration

Permissions are stored in the `security_role` table as a `JSONB` array. Users are linked to roles via the `security_user_role` table.


### Schema

```sql
-- Roles with their permissions
security_role (
  id SERIAL PRIMARY KEY,
  code VARCHAR UNIQUE,
  name VARCHAR,
  permissions JSONB DEFAULT '[]'  -- ["inventory.*", "sales.view"]
)

-- User-Role association
security_user_role (
  user_id INT REFERENCES security_user(id),
  role_id INT REFERENCES security_role(id)
)
```

### Managing Permissions via SQL

```sql
-- Add a permission to a role
UPDATE security_role 
SET permissions = permissions || '["logistics.view"]'::jsonb 
WHERE code = 'warehouse_manager';

-- View all permissions for a user
SELECT DISTINCT jsonb_array_elements_text(sr.permissions) as permission
FROM security_user_role sur
JOIN security_role sr ON sr.id = sur.role_id
WHERE sur.user_id = 1;

-- Create a new role with permissions
INSERT INTO security_role (code, name, permissions) VALUES
('logistics_admin', 'Administrador de Logística', 
 '["logistics.*", "inventory.view"]');
```

---

## RBAC Utilities Reference

### Server-side (`lib/rpc/permissions.ts`)

```typescript
// Get required permission for an RPC endpoint
getRequiredPermission("/inventory/item/upsertItem") // => "inventory.item.manage"

// Check if endpoint is protected
isProtectedEndpoint("/public/health") // => false
```

### Client-side (`web/lib/rbac/index.ts`)

```typescript
import { 
  hasPermission, 
  canAccessRoute, 
  canViewMenuItem,
  filterMenuItems 
} from "@/lib/rbac";

// Check if user has a specific permission
hasPermission("inventory.view", userPermissions) // => true/false

// Check if user can access a route
canAccessRoute("/cms/inventory/products", userPermissions) // => true/false

// Check if menu item should be visible
canViewMenuItem("/cms/inventory/movements", userPermissions) // => true/false

// Filter menu items based on permissions
const visible = filterMenuItems(menuItems, userPermissions);
```

---

## Best Practices

1. **Use Standard Naming**: Always follow `{module}.{resource}.{action}` pattern
2. **Granularity**: Separate `read` from `manage` to allow view-only access
3. **Module-Level First**: Define `.view` permission for module access before resource permissions
4. **Public Services**: Place public endpoints in `svc/public/` (no `@permission` needed)
5. **Test Permissions**: Write tests for permission checking logic
6. **Document New Permissions**: Update this file when adding new modules

---

## Common Issues

### Menu item not appearing
- Check `MENU_PERMISSIONS` mapping in `web/lib/rbac/index.ts`
- Verify user has the required permission (or a wildcard that matches)

### 403 Forbidden on RPC call
- Check the `@permission` tag on the service function
- Verify user's role has the required permission
- Run `pnpm build` to regenerate permissions map

### Unauthorized page on direct URL access
- Check `ROUTE_PERMISSIONS` mapping in `web/lib/rbac/index.ts`
- Verify the route prefix matches correctly

### Permissions not updating after role change
- User needs to re-login to refresh the JWT token
- Or call `isAuthenticated()` to refresh session
