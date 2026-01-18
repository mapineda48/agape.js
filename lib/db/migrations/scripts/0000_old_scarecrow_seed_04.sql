-- ============================================================
-- RBAC Permissions Seed
-- Populates the security_role table with navigation and RPC permissions
-- 
-- Permission Convention: {module}.{resource}.{action}
-- - Navigation: module.view (access to sidebar/routes)
-- - RPC: module.resource.read|manage
-- ============================================================

BEGIN;

-- 1. Super Admin Roles - Full access to everything
UPDATE "agape_app_development_demo"."security_role"
SET "permissions" = '["*"]'::jsonb, "updated_at" = now()
WHERE "code" IN ('ADMIN', 'SP', 'GERENTE');

-- 2. VENDEDOR - Sales staff
-- Navigation: Sales, CRM, Inventory (read-only for stock)
-- RPC: Full sales control, CRM clients, inventory read
UPDATE "agape_app_development_demo"."security_role"
SET "permissions" = '[
    "cms.view",
    "sales.view",
    "crm.view",
    "inventory.view",
    "invoicing.view",
    "sales.*",
    "crm.client.*",
    "inventory.item.read",
    "inventory.stock.read",
    "inventory.location.read",
    "finance.sales_invoice.read"
]'::jsonb, "updated_at" = now()
WHERE "code" = 'VENDEDOR';

-- 3. BODEGUERO - Warehouse staff
-- Navigation: Inventory (full)
-- RPC: Full inventory control, catalogs for items/categories
UPDATE "agape_app_development_demo"."security_role"
SET "permissions" = '[
    "cms.view",
    "inventory.view",
    "inventory.*",
    "catalogs.item.read",
    "catalogs.category.read",
    "catalogs.subcategory.read"
]'::jsonb, "updated_at" = now()
WHERE "code" = 'BODEGUERO';

-- 4. CAJERO - Cashier
-- Navigation: Invoicing (limited to receipts)
-- RPC: Sales order read, sales flow, payments
UPDATE "agape_app_development_demo"."security_role"
SET "permissions" = '[
    "cms.view",
    "invoicing.view",
    "sales.view",
    "sales.flow.invoice",
    "sales.order.read",
    "crm.client.read",
    "finance.sales_invoice.read",
    "finance.sales_invoice.manage",
    "finance.payment.read",
    "finance.payment.manage",
    "finance.payment_method.read"
]'::jsonb, "updated_at" = now()
WHERE "code" = 'CAJERO';

-- 5. CONTADOR - Accountant
-- Navigation: Invoicing, Reports, Configuration (financial)
-- RPC: Full finance control, config access, security read
UPDATE "agape_app_development_demo"."security_role"
SET "permissions" = '[
    "cms.view",
    "invoicing.view",
    "report.view",
    "configuration.admin",
    "finance.*",
    "config.*",
    "security.user.read",
    "crm.client.read",
    "purchasing.supplier.read",
    "inventory.stock.read"
]'::jsonb, "updated_at" = now()
WHERE "code" = 'CONTADOR';

-- 6. COMPRADOR - Purchasing agent
-- Navigation: Purchasing, Inventory (for stock levels)
-- RPC: Full purchasing control, inventory read, supplier management
UPDATE "agape_app_development_demo"."security_role"
SET "permissions" = '[
    "cms.view",
    "purchasing.view",
    "inventory.view",
    "purchasing.*",
    "inventory.item.read",
    "inventory.stock.read",
    "inventory.location.read",
    "catalogs.item.read",
    "catalogs.category.read"
]'::jsonb, "updated_at" = now()
WHERE "code" = 'COMPRADOR';

COMMIT;
