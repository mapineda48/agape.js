-- ============================================================
-- RBAC Permissions Seed
-- Populates the security_role table with permissions
-- ============================================================

BEGIN;

-- 1. Update existing roles with permissions
-- We use JSONB for the permissions array in PostgreSQL

UPDATE "agape_app_development_demo"."security_role"
SET "permissions" = '["*"]'::jsonb, "updated_at" = now()
WHERE "code" = 'ADMIN' OR "code" = 'SP';

UPDATE "agape_app_development_demo"."security_role"
SET "permissions" = '["sales.*", "crm.client.*", "inventory.item.read", "inventory.stock.read"]'::jsonb, "updated_at" = now()
WHERE "code" = 'VENDEDOR';

UPDATE "agape_app_development_demo"."security_role"
SET "permissions" = '["inventory.*", "catalogs.item.read", "catalogs.category.read"]'::jsonb, "updated_at" = now()
WHERE "code" = 'BODEGUERO';

UPDATE "agape_app_development_demo"."security_role"
SET "permissions" = '["sales.flow.invoice", "sales.order.read", "finance.sales_invoice.read", "finance.payment.read"]'::jsonb, "updated_at" = now()
WHERE "code" = 'CAJERO';

UPDATE "agape_app_development_demo"."security_role"
SET "permissions" = '["finance.*", "config.*", "security.user.read"]'::jsonb, "updated_at" = now()
WHERE "code" = 'CONTADOR';

UPDATE "agape_app_development_demo"."security_role"
SET "permissions" = '["purchasing.*", "inventory.item.read", "catalogs.supplier.read"]'::jsonb, "updated_at" = now()
WHERE "code" = 'COMPRADOR';

UPDATE "agape_app_development_demo"."security_role"
SET "permissions" = '["*"]'::jsonb, "updated_at" = now()
WHERE "code" = 'GERENTE';

COMMIT;
