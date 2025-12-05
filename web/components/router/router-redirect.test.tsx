import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement, useEffect } from "react";

// Mock @agape/security/access before importing router
vi.mock("@agape/security/access", () => ({
  isAuthenticated: vi.fn().mockResolvedValue({ id: "test-user" }),
}));

import { HistoryManager, HistoryContext } from "./router";
import { useRouter } from "./router-hook";
import { RouterPathProvider } from "./path-context";

describe("useRouter - auto-redirect on root path", () => {
  let router: HistoryManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    router = new HistoryManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should auto-redirect to first tab when pathname is root (async)", () => {
    const navigateSpy = vi.spyOn(router, "navigateTo");

    // Mock the pathname to be the configuration root
    vi.spyOn(router, "pathname", "get").mockReturnValue("/cms/configuration");

    // Mock listenPath
    vi.spyOn(router, "listenPath").mockImplementation(() => {
      return () => {};
    });

    // Mock listenParams (required by useRouter hook)
    vi.spyOn(router, "listenParams").mockReturnValue(() => {});

    // Mock params getter
    vi.spyOn(router, "params", "get").mockReturnValue({});

    // Component that mimics the ConfigurationLayout behavior with setTimeout
    const TestLayout = () => {
      const { pathname, navigate } = useRouter();

      useEffect(() => {
        // This is the same logic as in ConfigurationLayout
        if (pathname === "/" || pathname === "") {
          // Use setTimeout to avoid race condition with router.loading
          setTimeout(() => {
            navigate("inventory", { replace: true });
          }, 0);
        }
      }, [pathname, navigate]);

      return <div data-testid="layout">Pathname: {pathname}</div>;
    };

    render(
      createElement(
        HistoryContext.Provider,
        { value: router },
        createElement(
          RouterPathProvider,
          { path: "/cms/configuration" },
          createElement(TestLayout)
        )
      )
    );

    // Navigate should not be called immediately
    expect(navigateSpy).not.toHaveBeenCalled();

    // Advance timers to execute setTimeout
    vi.runAllTimers();

    // Now navigate should have been called
    expect(navigateSpy).toHaveBeenCalledWith("/cms/configuration/inventory", {
      replace: true,
    });
  });

  it("should NOT redirect when pathname is already a child path", () => {
    const navigateSpy = vi.spyOn(router, "navigateTo");

    // Mock the pathname to be already in inventory
    vi.spyOn(router, "pathname", "get").mockReturnValue(
      "/cms/configuration/inventory"
    );

    // Mock listenPath
    vi.spyOn(router, "listenPath").mockImplementation(() => {
      return () => {};
    });

    // Mock listenParams (required by useRouter hook)
    vi.spyOn(router, "listenParams").mockReturnValue(() => {});

    // Mock params getter
    vi.spyOn(router, "params", "get").mockReturnValue({});

    const TestLayout = () => {
      const { pathname, navigate } = useRouter();

      useEffect(() => {
        if (pathname === "/" || pathname === "") {
          setTimeout(() => {
            navigate("inventory", { replace: true });
          }, 0);
        }
      }, [pathname, navigate]);

      return <div data-testid="layout">Pathname: {pathname}</div>;
    };

    render(
      createElement(
        HistoryContext.Provider,
        { value: router },
        createElement(
          RouterPathProvider,
          { path: "/cms/configuration" },
          createElement(TestLayout)
        )
      )
    );

    // Should show "inventory" as the relative path
    expect(screen.getByTestId("layout")).toHaveTextContent(
      "Pathname: inventory"
    );

    // Run timers
    vi.runAllTimers();

    // Should NOT call navigate because we're already in a subpath
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("should handle rapid navigation to root path without race conditions", () => {
    const navigateSpy = vi.spyOn(router, "navigateTo");
    let pathListener: ((path: string) => void) | null = null;

    // Mock the pathname to start at root
    const mockPathname = vi
      .spyOn(router, "pathname", "get")
      .mockReturnValue("/cms/configuration");

    // Mock listenPath to capture the listener
    vi.spyOn(router, "listenPath").mockImplementation((cb: any) => {
      pathListener = cb;
      return () => {
        pathListener = null;
      };
    });

    // Mock listenParams (required by useRouter hook)
    vi.spyOn(router, "listenParams").mockReturnValue(() => {});

    // Mock params getter
    vi.spyOn(router, "params", "get").mockReturnValue({});

    const TestLayout = () => {
      const { pathname, navigate } = useRouter();

      useEffect(() => {
        if (pathname === "/" || pathname === "") {
          setTimeout(() => {
            navigate("inventory", { replace: true });
          }, 0);
        }
      }, [pathname, navigate]);

      return <div data-testid="layout">Pathname: {pathname}</div>;
    };

    const { rerender } = render(
      createElement(
        HistoryContext.Provider,
        { value: router },
        createElement(
          RouterPathProvider,
          { path: "/cms/configuration" },
          createElement(TestLayout)
        )
      )
    );

    // Advance timers for first redirect
    vi.runAllTimers();
    expect(navigateSpy).toHaveBeenCalledTimes(1);

    // Simulate navigating back to root (like clicking Configuration again)
    mockPathname.mockReturnValue("/cms/configuration");
    if (pathListener) {
      (pathListener as any)("/cms/configuration");
    }

    // Force re-render
    rerender(
      createElement(
        HistoryContext.Provider,
        { value: router },
        createElement(
          RouterPathProvider,
          { path: "/cms/configuration" },
          createElement(TestLayout)
        )
      )
    );

    // Advance timers for second redirect
    vi.runAllTimers();

    // Should redirect again
    expect(navigateSpy).toHaveBeenCalledTimes(2);
  });
});
