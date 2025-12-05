import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useContext } from "react";

// Mock @agape/security/access before importing router
vi.mock("@agape/security/access", () => ({
  isAuthenticated: vi.fn().mockResolvedValue({ id: "test-user" }),
}));

import { HistoryManager, HistoryContext } from "./router";
import { createMockHistory } from "@/test/helpers/mock-history";
import { RouterPathContext } from "./path-context";
import { useRouter } from "./router-hook";

// Mock structuredClone
global.structuredClone = (val) => JSON.parse(JSON.stringify(val));

describe("Dynamic Layouts", () => {
  describe("RouterPathProvider with dynamic layouts", () => {
    it("should use concrete path (not pattern) for dynamic layouts", async () => {
      // This is the key test for the dynamic layouts fix.
      // Previously, RouterPathProvider would receive "/users/:id" instead of "/users/123"

      // Component that checks the context value
      const ContextChecker = () => {
        const contextPath = useContext(RouterPathContext);
        return <div data-testid="context-path">{contextPath}</div>;
      };

      const layoutLoader = vi.fn().mockResolvedValue({
        default: ({ children }: any) => (
          <div>
            <ContextChecker />
            <div data-testid="layout-content">{children}</div>
          </div>
        ),
      });

      const pageLoader = vi.fn().mockResolvedValue({
        default: () => <div data-testid="page">User Page</div>,
      });

      const pageModules = {
        "./users/[id]/page.tsx": pageLoader,
      };

      const layoutModules = {
        "./users/[id]/_layout.tsx": layoutLoader,
      };

      const router = new HistoryManager(pageModules, layoutModules);
      const mockHistory = createMockHistory("/users/123");
      // @ts-ignore
      router.navigator.history = mockHistory;

      let renderedPage: any = null;
      const wrapper = createElement(
        HistoryContext.Provider,
        { value: router },
        null
      );

      const { rerender } = render(wrapper);

      router.listenPage((page) => {
        renderedPage = page;
      });

      await waitFor(
        () => {
          expect(renderedPage).not.toBeNull();
        },
        { timeout: 3000 }
      );

      // Render the page with layouts
      rerender(
        createElement(HistoryContext.Provider, { value: router }, renderedPage)
      );

      await waitFor(
        () => {
          // The key assertion: context should be "/users/123" NOT "/users/:id"
          expect(screen.getByTestId("context-path")).toHaveTextContent(
            "/users/123"
          );
        },
        { timeout: 3000 }
      );

      // Verify the page is also rendered
      expect(screen.getByTestId("page")).toHaveTextContent("User Page");
    });

    it("should enable relative navigation within dynamic layouts", async () => {
      // Component that uses useRouter to check relative path
      const NavigatorComponent = () => {
        const { pathname, navigate } = useRouter();
        return (
          <div>
            <div data-testid="relative-path">{pathname}</div>
            <button onClick={() => navigate("settings")}>Settings</button>
          </div>
        );
      };

      const layoutLoader = vi.fn().mockResolvedValue({
        default: ({ children }: any) => (
          <div>
            <NavigatorComponent />
            {children}
          </div>
        ),
      });

      const pageLoader = vi.fn().mockResolvedValue({
        default: () => <div>User Details</div>,
      });

      const pageModules = {
        "./users/[id]/details/page.tsx": pageLoader,
      };

      const layoutModules = {
        "./users/[id]/_layout.tsx": layoutLoader,
      };

      const router = new HistoryManager(pageModules, layoutModules);
      const mockHistory = createMockHistory("/users/456/details");
      // @ts-ignore
      router.navigator.history = mockHistory;

      let renderedPage: any = null;

      render(createElement(HistoryContext.Provider, { value: router }, null));

      router.listenPage((page) => {
        renderedPage = page;
      });

      await waitFor(
        () => {
          expect(renderedPage).not.toBeNull();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("getLayoutPaths with dynamic layouts", () => {
    it("should return both pattern and concretePath for dynamic layouts", () => {
      const layoutLoader = vi.fn().mockResolvedValue({
        default: ({ children }: any) => <div>{children}</div>,
      });

      const pageLoader = vi.fn().mockResolvedValue({
        default: () => <div>Page</div>,
      });

      const pageModules = {
        "./users/[userId]/profile/page.tsx": pageLoader,
      };

      const layoutModules = {
        "./users/[userId]/_layout.tsx": layoutLoader,
      };

      const router = new HistoryManager(pageModules, layoutModules);

      const layouts = router.registry.getLayoutPaths("/users/789/profile");

      // Find the dynamic layout match
      const dynamicLayout = layouts.find((l) => l.pattern.includes(":"));

      expect(dynamicLayout).toBeDefined();
      expect(dynamicLayout?.pattern).toBe("/users/:userId");
      expect(dynamicLayout?.concretePath).toBe("/users/789");
    });

    it("should handle multiple dynamic segments", () => {
      const layoutLoader = vi.fn().mockResolvedValue({
        default: ({ children }: any) => <div>{children}</div>,
      });

      const pageLoader = vi.fn().mockResolvedValue({
        default: () => <div>Page</div>,
      });

      const pageModules = {
        "./orgs/[orgId]/teams/[teamId]/page.tsx": pageLoader,
      };

      const layoutModules = {
        "./orgs/[orgId]/_layout.tsx": layoutLoader,
        "./orgs/[orgId]/teams/[teamId]/_layout.tsx": layoutLoader,
      };

      const router = new HistoryManager(pageModules, layoutModules);

      const layouts = router.registry.getLayoutPaths("/orgs/acme/teams/dev");

      // Should have org layout and team layout (plus possibly root)
      const orgLayout = layouts.find((l) => l.pattern === "/orgs/:orgId");
      const teamLayout = layouts.find(
        (l) => l.pattern === "/orgs/:orgId/teams/:teamId"
      );

      expect(orgLayout).toBeDefined();
      expect(orgLayout?.concretePath).toBe("/orgs/acme");

      expect(teamLayout).toBeDefined();
      expect(teamLayout?.concretePath).toBe("/orgs/acme/teams/dev");
    });
  });
});
