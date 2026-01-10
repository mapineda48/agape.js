# Role-Based Access Control (RBAC)

## Overview
Agape.js implements a robust Role-Based Access Control (RBAC) system to secure RPC endpoints. The system is designed to be declarative; developers define access requirements directly in the code using JSDoc tags, and the framework handles enforcement automatically.

## How to Protect a Service
To secure an RPC service, you only need to add a `@permission` tag to the function's JSDoc comment.

```typescript
/**
 * Retrieves a client by its ID.
 * @param id The client ID.
 * @returns The client record.
 * @permission crm.client.read
 */
export async function getClientById(id: number) {
  // ...
}
```

### Automatic Discovery
The build process scans all files in the `svc/` directory (excluding `svc/public/`) to extract these tags. It generates a permission map that the RPC middleware uses at runtime to validate requests.

## Permission Naming Convention
To keep the permission system organized, we follow the `module.entity.action` convention:

- **Module**: The system module (e.g., `finance`, `inventory`, `sales`, `hr`).
- **Entity**: The specific resource being accessed (e.g., `invoice`, `item`, `employee`).
- **Action**: The type of operation performed.
  - `read`: For list, search, and view operations.
  - `manage`: For create, update, delete, and toggle operations.
  - *Custom*: Specific actions like `post` (for invoices) or `next` (for sequences).

**Example:** `inventory.item.manage`

## Wildcards
The system supports wildcards (`*`) for flexible role definitions:

- `*`: Full access to every protected endpoint (typically for the **Admin** role).
- `sales.*`: Access to all entities and actions within the `sales` module.
- `inventory.item.*`: Access to both `read` and `manage` actions for items.

## Enforcement Mechanism
When an RPC call is made:
1. The **RPC Middleware** identifies the requested endpoint.
2. It looks up the required permission defined in the JSDoc.
3. It checks if the current user (from `IContext`) has that specific permission or a matching wildcard.
4. If unauthorized, it throws a `ForbiddenError` (403).

## Best Practices
1. **Granularity**: Use `read` and `manage` to separate view-only access from modification rights.
2. **Consistency**: Always use the module name as the first segment to avoid collisions.
3. **Public Services**: If a service must be accessible without login, place it in `svc/public/`.
4. **No Placeholders**: Avoid using temporary permissions. Define a clear `module.entity.action` from the start.

## Database Integration
Permissions are stored in the `security_role` table as a `JSONB` array. Users are linked to roles via the `security_user_role` table.

To add permissions to a role via SQL:
```sql
UPDATE security_role 
SET permissions = permissions || '["new.permission.read"]'::jsonb 
WHERE name = 'Some Role';
```
