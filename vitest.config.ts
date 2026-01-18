import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    projects: [
      {
        // Proyecto App (Node, svc/lib/models)
        test: {
          maxConcurrency: 3, // limita la cantidad de tests que se ejecutan simultáneamente por postgres
          maxWorkers: 3,
          testTimeout: 30000, // 30 segundos
          hookTimeout: 30000, // beforeAll / afterAll también
          name: "app",
          environment: "node",
          root: path.resolve(__dirname), // importante: raíz del repo
          include: ["svc/**/*.test.ts", "lib/**/*.test.ts"],
          exclude: ["dist", "web"],
          sequence: {
            groupOrder: 1,
          },
        },
        resolve: {
          alias: {
            "#utils": path.resolve(__dirname, "lib/utils"),
            "#models": path.resolve(__dirname, "models"),
            "#lib": path.resolve(__dirname, "lib"),
            "#svc": path.resolve(__dirname, "svc"),
            "#session": path.resolve(__dirname, "lib/access/session.ts"),
            "#logger": path.resolve(__dirname, "lib/log/logger.ts"),
          },
        },
      },
      {
        test: {
          name: "frontend",
          environment: "jsdom",
          globals: true,
          setupFiles: "./web/test/setup.ts",
          include: ["web/**/*.test.ts", "web/**/*.test.tsx"],
          sequence: {
            groupOrder: 2,
          },
        },
        plugins: [react()],
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./web"),
            "@utils": path.resolve(__dirname, "./lib/utils"),
            "@agape/security/access": path.resolve(
              __dirname,
              "./web/test/mocks/access.ts"
            ),
            "@agape/spa": path.resolve(__dirname, "./web/test/mocks/spa.ts"),
            "@agape/cms/inventory/configuration/category": path.resolve(
              __dirname,
              "./web/test/mocks/category.ts"
            ),
            "@agape/core/user": path.resolve(
              __dirname,
              "./web/test/mocks/user.ts"
            ),
            "@agape/core/documentType": path.resolve(
              __dirname,
              "./web/test/mocks/documentType.ts"
            ),
            "@agape/hr/employee": path.resolve(
              __dirname,
              "./web/test/mocks/employee.ts"
            ),
            "@agape/hr/job_position": path.resolve(
              __dirname,
              "./web/test/mocks/hr/job_position.ts"
            ),
            "@agape/hr/department": path.resolve(
              __dirname,
              "./web/test/mocks/hr/department.ts"
            ),
            "@agape/catalogs/item": path.resolve(
              __dirname,
              "./web/test/mocks/catalogs/item.ts"
            ),
            "@agape/catalogs/category": path.resolve(
              __dirname,
              "./web/test/mocks/catalogs/category.ts"
            ),
            "@agape/crm/client": path.resolve(
              __dirname,
              "./web/test/mocks/crm/client.ts"
            ),
            "@agape/crm/clientType": path.resolve(
              __dirname,
              "./web/test/mocks/crm/clientType.ts"
            ),
            "@agape/crm/order": path.resolve(
              __dirname,
              "./web/test/mocks/crm/order.ts"
            ),
            "@agape/purchasing/purchase_order": path.resolve(
              __dirname,
              "./web/test/mocks/purchasing/purchaseOrder.ts"
            ),
            "@agape/purchasing/supplier": path.resolve(
              __dirname,
              "./web/test/mocks/purchasing/supplier.ts"
            ),
            "@agape/purchasing/supplierType": path.resolve(
              __dirname,
              "./web/test/mocks/purchasing/supplierType.ts"
            ),
            "@agape/inventory/location": path.resolve(
              __dirname,
              "./web/test/mocks/inventory/location.ts"
            ),
            "@agape/inventory/movement": path.resolve(
              __dirname,
              "./web/test/mocks/inventory/movement.ts"
            ),
            "@agape/inventory/movementType": path.resolve(
              __dirname,
              "./web/test/mocks/inventory/movementType.ts"
            ),
            "@agape/catalogs/price_list": path.resolve(
              __dirname,
              "./web/test/mocks/catalogs/price_list.ts"
            ),
            "@agape/finance/payment_terms": path.resolve(
              __dirname,
              "./web/test/mocks/finance/payment_terms.ts"
            ),
            "@agape/finance/purchase_invoice": path.resolve(
              __dirname,
              "./web/test/mocks/finance/purchase_invoice.ts"
            ),
            "@agape/finance/sales_invoice": path.resolve(
              __dirname,
              "./web/test/mocks/finance/sales_invoice.ts"
            ),
            "@agape/finance/payment_method": path.resolve(
              __dirname,
              "./web/test/mocks/finance/payment_method.ts"
            ),
            "@agape/finance/payment": path.resolve(
              __dirname,
              "./web/test/mocks/finance/payment.ts"
            ),
            "@agape/sales/sales_flow": path.resolve(
              __dirname,
              "./web/test/mocks/sales/sales_flow.ts"
            ),
          },
        },
      },
    ],
  },
});
