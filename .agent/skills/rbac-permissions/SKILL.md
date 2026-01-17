---
name: rbac-permissions
description: Usa este skill cuando el usuario pida agregar permisos, módulos de navegación o expandir el catálogo RBAC.
---

# Gestión de Permisos RBAC

## Ubicación de Archivos

- **Catálogo RBAC:** `lib/utils/rbac/catalog.ts`
- **Validación Frontend:** `web/lib/rbac/index.ts`
- **Permisos Disponibles:** `svc/security/role.ts`

## Estructura del Catálogo

```typescript
export type RbacModule = {
  key: string;
  label: string;
  navigation?: {
    key: string;
    label: string;
    routes: string[];
    menu: string[];
  };
  permissions: { key: string; label: string; }[];
};
```

## Agregar Módulo

```typescript
{
  key: "nuevo_modulo",
  label: "Nuevo Módulo",
  navigation: {
    key: "nuevo_modulo.view",
    label: "Acceso al módulo",
    routes: ["/cms/nuevo-modulo"],
    menu: ["/cms/nuevo-modulo", "/cms/nuevo-modulo/lista"],
  },
  permissions: [
    { key: "nuevo_modulo.entidad.read", label: "Ver registros" },
    { key: "nuevo_modulo.entidad.manage", label: "Gestionar registros" },
  ],
},
```

## Convenciones de Permisos

```
[modulo].[entidad].[accion]

Acciones: read, manage, * (wildcard)
```

## Documentar en Servicios

```typescript
/**
 * @permission catalogs.item.read
 */
export async function getItemById(id: number) { ... }
```

## Checklist

- [ ] Agregar en `lib/utils/rbac/catalog.ts`
- [ ] Documentar `@permission` en servicios
- [ ] Actualizar `getAvailablePermissions()` en `svc/security/role.ts`
- [ ] Compilar con `pnpm tsc:app`
