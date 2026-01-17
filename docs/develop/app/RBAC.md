# Role-Based Access Control (RBAC)

## Overview

Agape.js implements a comprehensive Role-Based Access Control (RBAC) system that secures:

1. **RPC Endpoints** - Backend API calls protected via `@permission` JSDoc tags
2. **Frontend Routes** - Navigation/menu visibility controlled by permission mapping
3. **Page Access** - Direct URL access blocked with "Unauthorized" page for users without permission

The system is designed to be **declarative** with a **single source of truth**: the RBAC Catalog.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RBAC CATALOG (Single Source of Truth)               │
│                         lib/utils/rbac/catalog.ts                           │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  rbacModules: RbacModule[]                                          │   │
│   │                                                                     │   │
│   │  • configuration  { navigation, permissions[] }                     │   │
│   │  • inventory      { navigation, permissions[] }                     │   │
│   │  • sales          { navigation, permissions[] }                     │   │
│   │  • purchasing     { navigation, permissions[] }                     │   │
│   │  • crm            { navigation, permissions[] }                     │   │
│   │  • hr             { navigation, permissions[] }                     │   │
│   │  • finance        { navigation, permissions[] }                     │   │
│   │  • catalogs       { permissions[] }                                 │   │
│   │  • core           { permissions[] }                                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│         ┌───────────────────────────┼───────────────────────────────┐       │
│         ▼                           ▼                               ▼       │
│  buildRoutePermissions()    buildMenuPermissions()     buildNavigationPermissions()
└─────────────────────────────────────────────────────────────────────────────┘
                │                           │                  │
    ┌───────────┴───────────┐               │                  │
    ▼                       ▼               ▼                  ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ web/lib/rbac/  │  │ Sidebar.tsx    │  │ RPC Middleware │  │ Roles UI       │
│ ROUTE_PERMS    │  │ MENU_PERMS     │  │ (Server-side)  │  │ (role.ts)      │
│ (Client-side)  │  │ (Client-side)  │  │ @permission    │  │                │
└────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘
```

---

## RBAC Catalog (lib/utils/rbac/catalog.ts)

This is the **single source of truth** for all RBAC metadata in the system.

### Structure

```typescript
export type RbacModule = {
  key: string;           // Module identifier (e.g., "inventory")
  label: string;         // Human-readable name (e.g., "Inventario")
  navigation?: {
    key: string;         // Navigation permission key (e.g., "inventory.view")
    label: string;       // Description
    routes: string[];    // Protected route prefixes (e.g., ["/cms/inventory"])
    menu: string[];      // Menu paths controlled by this permission
  };
  permissions: {         // Action permissions for this module
    key: string;
    label: string;
  }[];
};
```

### Current Modules

| Module | Key | Has Navigation | Permissions |
|--------|-----|----------------|-------------|
| Configuración | `configuration` | ✅ `/cms/configuration` | 7 |
| Inventario | `inventory` | ✅ `/cms/inventory` | 11 |
| Ventas | `sales` | ✅ `/cms/sales` | 4 |
| Compras | `purchasing` | ✅ `/cms/purchasing` | 8 |
| CRM | `crm` | ✅ `/cms/crm` | 4 |
| Recursos Humanos | `hr` | ✅ `/cms/hr` | 6 |
| Finanzas | `finance` | ✅ `/cms/invoicing` | 14 |
| Catálogos | `catalogs` | ❌ (backend only) | 6 |
| Core | `core` | ❌ (backend only) | 8 |

---

## Permission Types

### 1. Navigation Permissions

Control **module-level access** in the frontend. Defined in the catalog's `navigation` property.

```typescript
{
  key: "inventory",
  label: "Inventario",
  navigation: {
    key: "inventory.view",                    // ← Navigation permission
    label: "Acceso al módulo de inventario",
    routes: ["/cms/inventory"],               // ← Protected routes
    menu: ["/cms/inventory", "/cms/inventory/movements", ...],  // ← Menu visibility
  },
  // ...
}
```

### 2. Action Permissions

Control **RPC/API access**. Defined in the catalog's `permissions` array and enforced via `@permission` JSDoc tags.

```typescript
permissions: [
  { key: "inventory.item.read", label: "Ver productos" },
  { key: "inventory.item.manage", label: "Gestionar productos" },
  { key: "inventory.movement.read", label: "Ver movimientos" },
  { key: "inventory.movement.manage", label: "Gestionar movimientos" },
  // ...
]
```

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
| `post` | Document posting | `inventory.movement.manage` |
| `cancel` | Document cancellation | `inventory.movement.manage` |
| `admin` | Administrative access | `configuration.admin` |

---

## Wildcards

The system supports wildcards (`*`) for flexible role definitions:

| Pattern | Matches | Use Case |
|---------|---------|----------|
| `*` | Everything | Super Admin |
| `inventory.*` | All inventory permissions | Inventory Manager |

---

## How to Add a New Module

### Step 1: Add to RBAC Catalog

Edit `lib/utils/rbac/catalog.ts`:

```typescript
export const rbacModules: RbacModule[] = [
  // ... existing modules
  {
    key: "logistics",
    label: "Logística",
    navigation: {
      key: "logistics.view",
      label: "Acceso al módulo de logística",
      routes: ["/cms/logistics"],
      menu: ["/cms/logistics", "/cms/logistics/shipments"],
    },
    permissions: [
      { key: "logistics.shipment.read", label: "Ver envíos" },
      { key: "logistics.shipment.manage", label: "Gestionar envíos" },
      { key: "logistics.route.read", label: "Ver rutas" },
      { key: "logistics.route.manage", label: "Gestionar rutas" },
    ],
  },
];
```

### Step 2: Update Roles UI (svc/security/role.ts)

Add the module to `getAvailablePermissions()`:

```typescript
{
    module: "Logística",
    permissions: [
        ...(rbacModules.find((m) => m.key === "logistics")?.permissions ?? []),
        { key: "logistics.*", label: "Acceso completo a Logística" },
    ],
},
```

### Step 3: Add `@permission` Tags to Services

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

### Step 4: Add Menu Item (Optional)

Edit `web/components/Sidebar.tsx`:

```typescript
const NAV_SECTIONS = [
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

**That's it!** The route and menu permissions are automatically generated from the catalog.

---

## How the Catalog is Consumed

### 1. Frontend Routes (`web/lib/rbac/index.ts`)

```typescript
import { buildRoutePermissions, buildMenuPermissions } from "@utils/rbac/catalog";

export const ROUTE_PERMISSIONS: Record<string, string> = {
    ...buildRoutePermissions(),  // ← Auto-generated from catalog
    
    // Manual additions (modules not yet in catalog)
    "/cms/hr": "hr.view",
    "/cms": "cms.view",
};

export const MENU_PERMISSIONS: Record<string, string> = {
    ...buildMenuPermissions(),   // ← Auto-generated from catalog
    
    // Manual additions
    "/cms": "cms.view",
};
```

### 2. Roles Management UI (`svc/security/role.ts`)

```typescript
import { rbacModules } from "#utils/rbac/catalog";

export async function getAvailablePermissions() {
    return [
        {
            module: "Inventario",
            permissions: [
                ...(rbacModules.find((m) => m.key === "inventory")?.permissions ?? []),
                { key: "inventory.*", label: "Acceso completo a Inventario" },
            ],
        },
        // ... other modules
    ];
}
```

### 3. RPC Middleware

The RPC middleware reads `@permission` tags from services and validates against user permissions. This is independent of the catalog but should use matching permission keys.

---

## Database Integration

Permissions are stored in the `security_role` table as a `JSONB` array:

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

1. **Single Source of Truth**: Always add new modules to the RBAC catalog first
2. **Use Standard Naming**: Follow `{module}.{resource}.{action}` pattern
3. **Granularity**: Separate `read` from `manage` for view-only access
4. **Wildcards**: Include `module.*` permission for admin roles
5. **Sync @permission Tags**: Ensure service tags match catalog keys
6. **Document New Modules**: Update this file when adding new modules

---

## Common Issues

### Menu item not appearing
- Verify the menu path is in the catalog's `navigation.menu` array
- Check user has the navigation permission

### 403 Forbidden on RPC call
- Check the `@permission` tag on the service function
- Verify user's role has the required permission
- Ensure permission key matches between service and catalog

### Unauthorized page on direct URL access
- Verify the route is in the catalog's `navigation.routes` array
- Check the route prefix matches correctly

### Permissions not updating after role change
- User needs to re-login to refresh the JWT token
- Or call `isAuthenticated()` to refresh session

---

## Migration Notes (v2.0)

The RBAC system was refactored to use a centralized catalog. Key changes:

1. **Old approach**: Permissions defined separately in multiple files
2. **New approach**: Single `rbacModules` array in `lib/utils/rbac/catalog.ts`

Benefits:
- ✅ Single source of truth
- ✅ Consistent permission keys across backend and frontend
- ✅ Easier to audit and maintain
- ✅ Route/menu permissions auto-generated from catalog
