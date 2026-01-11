/**
 * Tests for RBAC (Role-Based Access Control) utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    matchPermission,
    hasPermission,
    getRoutePermission,
    canAccessRoute,
    canViewMenuItem,
    filterMenuItems,
    ROUTE_PERMISSIONS,
    MENU_PERMISSIONS,
} from "./index";

// Mock the session module
vi.mock("@agape/security/access", () => ({
    session: {
        permissions: ["cms.view", "inventory.*", "sales.view"],
    },
}));

describe("RBAC Utilities", () => {
    describe("matchPermission", () => {
        it("should match exact permissions", () => {
            expect(matchPermission("cms.view", "cms.view")).toBe(true);
            expect(matchPermission("inventory.view", "inventory.view")).toBe(true);
        });

        it("should not match different permissions", () => {
            expect(matchPermission("cms.view", "sales.view")).toBe(false);
            expect(matchPermission("inventory.view", "inventory.product.create")).toBe(
                false
            );
        });

        it("should match super admin wildcard '*'", () => {
            expect(matchPermission("*", "anything")).toBe(true);
            expect(matchPermission("*", "inventory.product.create")).toBe(true);
            expect(matchPermission("*", "cms.view")).toBe(true);
        });

        it("should match module wildcard patterns", () => {
            expect(matchPermission("inventory.*", "inventory.view")).toBe(true);
            expect(matchPermission("inventory.*", "inventory.product.create")).toBe(
                true
            );
            expect(matchPermission("inventory.*", "inventory.movement.post")).toBe(
                true
            );
            expect(matchPermission("inventory.*", "inventory")).toBe(true);
        });

        it("should not match unrelated modules with wildcard", () => {
            expect(matchPermission("inventory.*", "sales.view")).toBe(false);
            expect(matchPermission("inventory.*", "inventoryother.view")).toBe(false);
        });

        it("should match nested wildcards", () => {
            expect(
                matchPermission("inventory.product.*", "inventory.product.create")
            ).toBe(true);
            expect(
                matchPermission("inventory.product.*", "inventory.product.delete")
            ).toBe(true);
            expect(matchPermission("inventory.product.*", "inventory.product")).toBe(
                true
            );
        });

        it("should not match sibling resources with nested wildcard", () => {
            expect(
                matchPermission("inventory.product.*", "inventory.movement.create")
            ).toBe(false);
        });
    });

    describe("hasPermission", () => {
        it("should return true for permissions in the list", () => {
            const perms = ["cms.view", "inventory.*"];
            expect(hasPermission("cms.view", perms)).toBe(true);
            expect(hasPermission("inventory.view", perms)).toBe(true);
            expect(hasPermission("inventory.product.create", perms)).toBe(true);
        });

        it("should return false for permissions not in the list", () => {
            const perms = ["cms.view", "inventory.*"];
            expect(hasPermission("sales.view", perms)).toBe(false);
            expect(hasPermission("configuration.admin", perms)).toBe(false);
        });

        it("should return true for empty required permission", () => {
            expect(hasPermission("", [])).toBe(true);
        });

        it("should work with super admin", () => {
            const perms = ["*"];
            expect(hasPermission("anything", perms)).toBe(true);
            expect(hasPermission("inventory.product.delete", perms)).toBe(true);
        });
    });

    describe("getRoutePermission", () => {
        it("should return correct permission for known routes", () => {
            expect(getRoutePermission("/cms")).toBe("cms.view");
            expect(getRoutePermission("/cms/inventory")).toBe("inventory.view");
            expect(getRoutePermission("/cms/sales")).toBe("sales.view");
            expect(getRoutePermission("/cms/configuration")).toBe(
                "configuration.admin"
            );
        });

        it("should match nested routes to parent permission", () => {
            expect(getRoutePermission("/cms/inventory/movements")).toBe(
                "inventory.view"
            );
            expect(getRoutePermission("/cms/inventory/products/123")).toBe(
                "inventory.view"
            );
            expect(getRoutePermission("/cms/sales/orders/new")).toBe("sales.view");
        });

        it("should return null for unknown routes", () => {
            expect(getRoutePermission("/login")).toBe(null);
            expect(getRoutePermission("/")).toBe(null);
            expect(getRoutePermission("/about")).toBe(null);
        });
    });

    describe("canAccessRoute", () => {
        it("should allow access to routes user has permission for", () => {
            const perms = ["cms.view", "inventory.*", "sales.view"];
            expect(canAccessRoute("/cms", perms)).toBe(true);
            expect(canAccessRoute("/cms/inventory", perms)).toBe(true);
            expect(canAccessRoute("/cms/inventory/products", perms)).toBe(true);
            expect(canAccessRoute("/cms/sales", perms)).toBe(true);
        });

        it("should deny access to routes user lacks permission for", () => {
            const perms = ["cms.view", "inventory.*"];
            expect(canAccessRoute("/cms/configuration", perms)).toBe(false);
            expect(canAccessRoute("/cms/hr", perms)).toBe(false);
        });

        it("should allow access to routes without defined permissions", () => {
            const perms = ["cms.view"];
            expect(canAccessRoute("/login", perms)).toBe(true);
            expect(canAccessRoute("/", perms)).toBe(true);
        });

        it("should allow super admin access to all routes", () => {
            const perms = ["*"];
            expect(canAccessRoute("/cms", perms)).toBe(true);
            expect(canAccessRoute("/cms/configuration", perms)).toBe(true);
            expect(canAccessRoute("/cms/hr", perms)).toBe(true);
        });
    });

    describe("canViewMenuItem", () => {
        it("should show menu items user has permission for", () => {
            const perms = ["cms.view", "inventory.*", "sales.view"];
            expect(canViewMenuItem("/cms", perms)).toBe(true);
            expect(canViewMenuItem("/cms/inventory/movements", perms)).toBe(true);
            expect(canViewMenuItem("/cms/sales/orders", perms)).toBe(true);
        });

        it("should hide menu items user lacks permission for", () => {
            const perms = ["cms.view", "inventory.*"];
            expect(canViewMenuItem("/cms/configuration", perms)).toBe(false);
            expect(canViewMenuItem("/cms/hr", perms)).toBe(false);
        });

        it("should show items without defined permissions", () => {
            const perms = ["cms.view"];
            expect(canViewMenuItem("/unknown/path", perms)).toBe(true);
        });
    });

    describe("filterMenuItems", () => {
        it("should filter items based on permissions", () => {
            const items = [
                { path: "/cms", label: "Dashboard" },
                { path: "/cms/inventory/movements", label: "Inventory" },
                { path: "/cms/sales/orders", label: "Sales" },
                { path: "/cms/configuration", label: "Settings" },
            ];
            const perms = ["cms.view", "inventory.*"];

            const filtered = filterMenuItems(items, perms);

            expect(filtered).toHaveLength(2);
            expect(filtered.map((i) => i.label)).toEqual(["Dashboard", "Inventory"]);
        });

        it("should include all items for super admin", () => {
            const items = [
                { path: "/cms", label: "Dashboard" },
                { path: "/cms/inventory/movements", label: "Inventory" },
                { path: "/cms/configuration", label: "Settings" },
            ];
            const perms = ["*"];

            const filtered = filterMenuItems(items, perms);

            expect(filtered).toHaveLength(3);
        });
    });

    describe("Permission maps", () => {
        it("ROUTE_PERMISSIONS should have required routes", () => {
            expect(ROUTE_PERMISSIONS["/cms"]).toBeDefined();
            expect(ROUTE_PERMISSIONS["/cms/inventory"]).toBe("inventory.view");
            expect(ROUTE_PERMISSIONS["/cms/sales"]).toBe("sales.view");
        });

        it("MENU_PERMISSIONS should match sidebar paths", () => {
            expect(MENU_PERMISSIONS["/cms"]).toBeDefined();
            expect(MENU_PERMISSIONS["/cms/inventory/movements"]).toBe("inventory.view");
            expect(MENU_PERMISSIONS["/cms/sales/orders"]).toBe("sales.view");
        });
    });
});
