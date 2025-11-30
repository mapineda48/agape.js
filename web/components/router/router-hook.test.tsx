import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { act } from "react";

// Mock @agape/access before importing router
vi.mock("@agape/access", () => ({
  isAuthenticated: vi.fn().mockResolvedValue({ id: "test-user" }),
}));

import { HistoryManager, HistoryContext } from "./router";
import { useRouter } from "./router-hook";
import { RouterPathProvider } from "./path-context";

/**
 * Testing Strategy: Spy-based Mocking
 *
 * These tests use Vitest spies on actual HistoryManager instances rather than
 * mocking the entire 'history' module or creating full mock implementations.
 * This approach:
 *
 * - Tests behavior closer to production (real router logic)
 * - Reduces false positives from over-mocking
 * - Makes tests more resilient to implementation changes
 * - Follows Testing Library best practices
 *
 * For integration tests that need full control over history behavior,
 * see router.test.tsx which uses the createMockHistory helper.
 */

describe("RouterPathProvider", () => {
  let router: HistoryManager;

  beforeEach(() => {
    vi.useFakeTimers();
    router = new HistoryManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should provide root path '/' by default", () => {
    const TestComponent = () => {
      const { pathname } = useRouter();
      return <div data-testid="pathname">{pathname}</div>;
    };

    // Mock router pathname
    vi.spyOn(router, "pathname", "get").mockReturnValue("/");
    vi.spyOn(router, "listenPath").mockReturnValue(() => {});

    act(() => {
      render(
        createElement(
          HistoryContext.Provider,
          { value: router },
          createElement(TestComponent)
        )
      );
    });

    expect(screen.getByTestId("pathname")).toHaveTextContent("/");
  });

  it("should provide custom path when specified", () => {
    const TestComponent = () => {
      const { navigate } = useRouter();
      return (
        <button onClick={() => navigate("inventory")}>
          Navigate to inventory
        </button>
      );
    };

    const navigateSpy = vi
      .spyOn(router, "navigateTo")
      .mockImplementation(() => {});
    vi.spyOn(router, "listenPath").mockReturnValue(() => {});

    act(() => {
      render(
        createElement(
          HistoryContext.Provider,
          { value: router },
          createElement(
            RouterPathProvider,
            { path: "/cms/configuration" },
            createElement(TestComponent)
          )
        )
      );
    });

    const button = screen.getByText("Navigate to inventory");
    act(() => {
      button.click();
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(navigateSpy).toHaveBeenCalledWith(
      "/cms/configuration/inventory",
      undefined
    );
  });

  it("should allow nested providers", () => {
    const TestComponent = () => {
      const { navigate } = useRouter();
      return <button onClick={() => navigate("page")}>Navigate to page</button>;
    };

    const navigateSpy = vi
      .spyOn(router, "navigateTo")
      .mockImplementation(() => {});
    vi.spyOn(router, "listenPath").mockReturnValue(() => {});

    act(() => {
      render(
        createElement(
          HistoryContext.Provider,
          { value: router },
          createElement(
            RouterPathProvider,
            { path: "/cms" },
            createElement(
              RouterPathProvider,
              { path: "/cms/configuration" },
              createElement(TestComponent)
            )
          )
        )
      );
    });

    const button = screen.getByText("Navigate to page");
    act(() => {
      button.click();
    });

    act(() => {
      vi.runAllTimers();
    });

    // The inner provider overrides, so it should use /cms/configuration
    expect(navigateSpy).toHaveBeenCalledWith(
      "/cms/configuration/page",
      undefined
    );
  });
});

describe("useRouter - pathname", () => {
  let router: HistoryManager;

  beforeEach(() => {
    vi.useFakeTimers();
    router = new HistoryManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return current pathname relative to context", () => {
    vi.spyOn(router, "pathname", "get").mockReturnValue("/test/path");
    vi.spyOn(router, "listenPath").mockReturnValue(() => {});

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(HistoryContext.Provider, { value: router }, children);

    let result: any;
    act(() => {
      result = renderHook(() => useRouter(), { wrapper }).result;
    });

    // In root context, pathname is still absolute but without leading slash
    expect(result.current.pathname).toBe("test/path");
  });

  it("should update pathname when router location changes", async () => {
    // Don't use fake timers for this test as waitFor needs real timers
    vi.useRealTimers();

    let listener: ((pathname: string) => void) | null = null;

    vi.spyOn(router, "listenPath").mockImplementation((cb: any) => {
      listener = cb;
      return () => {
        listener = null;
      };
    });

    vi.spyOn(router, "pathname", "get").mockReturnValue("/initial");

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(HistoryContext.Provider, { value: router }, children);

    const { result } = renderHook(() => useRouter(), { wrapper });

    expect(result.current.pathname).toBe("initial");

    // Simulate pathname change
    act(() => {
      if (listener) (listener as any)("/new/path");
    });

    await waitFor(() => {
      expect(result.current.pathname).toBe("new/path");
    });

    // Restore fake timers for subsequent tests
    vi.useFakeTimers();
  });
});

describe("useRouter - navigate with absolute paths", () => {
  let router: HistoryManager;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    router = new HistoryManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should navigate to absolute path without modification", () => {
    const navigateSpy = vi
      .spyOn(router, "navigateTo")
      .mockImplementation(() => {});
    vi.spyOn(router, "listenPath").mockReturnValue(() => {});

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(HistoryContext.Provider, { value: router }, children);

    let result: any;
    act(() => {
      result = renderHook(() => useRouter(), { wrapper }).result;
    });

    act(() => {
      result.current.navigate("/about");
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(navigateSpy).toHaveBeenCalledWith("/about", undefined);
  });

  it("should navigate to absolute path regardless of context", () => {
    const navigateSpy = vi
      .spyOn(router, "navigateTo")
      .mockImplementation(() => {});
    vi.spyOn(router, "listenPath").mockReturnValue(() => {});

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(
        HistoryContext.Provider,
        { value: router },
        createElement(
          RouterPathProvider,
          { path: "/cms/configuration" },
          children
        )
      );

    let result: any;
    act(() => {
      result = renderHook(() => useRouter(), { wrapper }).result;
    });

    act(() => {
      result.current.navigate("/login");
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(navigateSpy).toHaveBeenCalledWith("/login", undefined);
  });

  it("should pass navigate options correctly", () => {
    const navigateSpy = vi
      .spyOn(router, "navigateTo")
      .mockImplementation(() => {});
    vi.spyOn(router, "listenPath").mockReturnValue(() => {});

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(HistoryContext.Provider, { value: router }, children);

    let result: any;
    act(() => {
      result = renderHook(() => useRouter(), { wrapper }).result;
    });

    act(() => {
      result.current.navigate("/home", {
        replace: true,
        state: { foo: "bar" },
      });
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(navigateSpy).toHaveBeenCalledWith("/home", {
      replace: true,
      state: { foo: "bar" },
    });
  });
});

describe("useRouter - navigate with relative paths", () => {
  let router: HistoryManager;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    router = new HistoryManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should resolve relative path against root context", () => {
    const navigateSpy = vi
      .spyOn(router, "navigateTo")
      .mockImplementation(() => {});
    vi.spyOn(router, "listenPath").mockReturnValue(() => {});

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(HistoryContext.Provider, { value: router }, children);

    let result: any;
    act(() => {
      result = renderHook(() => useRouter(), { wrapper }).result;
    });

    act(() => {
      result.current.navigate("about");
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(navigateSpy).toHaveBeenCalledWith("/about", undefined);
  });

  it("should resolve relative path against custom context", () => {
    const navigateSpy = vi
      .spyOn(router, "navigateTo")
      .mockImplementation(() => {});
    vi.spyOn(router, "listenPath").mockReturnValue(() => {});

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(
        HistoryContext.Provider,
        { value: router },
        createElement(RouterPathProvider, { path: "/cms" }, children)
      );

    let result: any;
    act(() => {
      result = renderHook(() => useRouter(), { wrapper }).result;
    });

    act(() => {
      result.current.navigate("configuration");
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(navigateSpy).toHaveBeenCalledWith("/cms/configuration", undefined);
  });

  it("should resolve relative path with nested contexts", () => {
    const navigateSpy = vi
      .spyOn(router, "navigateTo")
      .mockImplementation(() => {});
    vi.spyOn(router, "listenPath").mockReturnValue(() => {});

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(
        HistoryContext.Provider,
        { value: router },
        createElement(
          RouterPathProvider,
          { path: "/cms" },
          createElement(
            RouterPathProvider,
            { path: "/cms/configuration" },
            children
          )
        )
      );

    let result: any;
    act(() => {
      result = renderHook(() => useRouter(), { wrapper }).result;
    });

    act(() => {
      result.current.navigate("inventory");
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(navigateSpy).toHaveBeenCalledWith(
      "/cms/configuration/inventory",
      undefined
    );
  });

  it("should handle trailing slashes in context path", () => {
    const navigateSpy = vi
      .spyOn(router, "navigateTo")
      .mockImplementation(() => {});
    vi.spyOn(router, "listenPath").mockReturnValue(() => {});

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(
        HistoryContext.Provider,
        { value: router },
        createElement(RouterPathProvider, { path: "/cms/" }, children)
      );

    let result: any;
    act(() => {
      result = renderHook(() => useRouter(), { wrapper }).result;
    });

    act(() => {
      result.current.navigate("settings");
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(navigateSpy).toHaveBeenCalledWith("/cms/settings", undefined);
  });

  it("should handle multi-segment relative paths", () => {
    const navigateSpy = vi
      .spyOn(router, "navigateTo")
      .mockImplementation(() => {});
    vi.spyOn(router, "listenPath").mockReturnValue(() => {});

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(
        HistoryContext.Provider,
        { value: router },
        createElement(
          RouterPathProvider,
          { path: "/cms/configuration" },
          children
        )
      );

    let result: any;
    act(() => {
      result = renderHook(() => useRouter(), { wrapper }).result;
    });

    act(() => {
      result.current.navigate("users/new");
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(navigateSpy).toHaveBeenCalledWith(
      "/cms/configuration/users/new",
      undefined
    );
  });
});

describe("useRouter - listen", () => {
  let router: HistoryManager;

  beforeEach(() => {
    router = new HistoryManager();
  });

  it("should call router.listenPath", () => {
    const listenSpy = vi.spyOn(router, "listenPath").mockReturnValue(() => {});

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(HistoryContext.Provider, { value: router }, children);

    const { result } = renderHook(() => useRouter(), { wrapper });

    const callback = vi.fn();
    result.current.listen(callback);

    expect(listenSpy).toHaveBeenCalled();
  });

  it("should return cleanup function", () => {
    const unlistenMock = vi.fn();
    vi.spyOn(router, "listenPath").mockReturnValue(unlistenMock);

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(HistoryContext.Provider, { value: router }, children);

    const { result } = renderHook(() => useRouter(), { wrapper });

    const callback = vi.fn();
    const unlisten = result.current.listen(callback);

    expect(typeof unlisten).toBe("function");
    unlisten();
    expect(unlistenMock).toHaveBeenCalled();
  });
});

describe("useRouter - integration", () => {
  let router: HistoryManager;

  beforeEach(() => {
    vi.useFakeTimers();
    router = new HistoryManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should handle complex nested navigation scenario", () => {
    const navigateSpy = vi
      .spyOn(router, "navigateTo")
      .mockImplementation(() => {});
    vi.spyOn(router, "listenPath").mockReturnValue(() => {});

    const NestedComponent = () => {
      const { navigate } = useRouter();
      return (
        <div>
          <button onClick={() => navigate("inventory")}>Inventory</button>
          <button onClick={() => navigate("/login")}>Login</button>
        </div>
      );
    };

    act(() => {
      render(
        createElement(
          HistoryContext.Provider,
          { value: router },
          createElement(
            RouterPathProvider,
            { path: "/cms" },
            createElement(
              RouterPathProvider,
              { path: "/cms/configuration" },
              createElement(NestedComponent)
            )
          )
        )
      );
    });

    const inventoryButton = screen.getByText("Inventory");
    const loginButton = screen.getByText("Login");

    act(() => {
      inventoryButton.click();
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(navigateSpy).toHaveBeenCalledWith(
      "/cms/configuration/inventory",
      undefined
    );

    act(() => {
      loginButton.click();
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(navigateSpy).toHaveBeenCalledWith("/login", undefined);
  });
});

describe("useRouter - params", () => {
  let router: HistoryManager;

  beforeEach(() => {
    router = new HistoryManager();
  });

  it("should return empty params by default", () => {
    vi.spyOn(router, "params", "get").mockReturnValue({});
    vi.spyOn(router, "listenPath").mockReturnValue(() => {});
    vi.spyOn(router, "listenParams").mockReturnValue(() => {});

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(HistoryContext.Provider, { value: router }, children);

    const { result } = renderHook(() => useRouter(), { wrapper });

    expect(result.current.params).toEqual({});
  });

  it("should expose route params from router", () => {
    vi.spyOn(router, "params", "get").mockReturnValue({ id: "123" });
    vi.spyOn(router, "listenPath").mockReturnValue(() => {});
    vi.spyOn(router, "listenParams").mockReturnValue(() => {});

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(HistoryContext.Provider, { value: router }, children);

    const { result } = renderHook(() => useRouter(), { wrapper });

    expect(result.current.params).toEqual({ id: "123" });
  });

  it("should update params when router params change", async () => {
    // Don't use fake timers for this test as waitFor needs real timers
    let listener: ((params: Record<string, string>) => void) | null = null;

    vi.spyOn(router, "listenPath").mockReturnValue(() => {});
    vi.spyOn(router, "listenParams").mockImplementation((cb: any) => {
      listener = cb;
      return () => {
        listener = null;
      };
    });

    vi.spyOn(router, "params", "get").mockReturnValue({});

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(HistoryContext.Provider, { value: router }, children);

    const { result } = renderHook(() => useRouter(), { wrapper });

    expect(result.current.params).toEqual({});

    // Simulate params change
    act(() => {
      if (listener) {
        (listener as any)({ id: "456", type: "user" });
      }
    });

    await waitFor(() => {
      expect(result.current.params).toEqual({ id: "456", type: "user" });
    });
  });

  it("should handle multiple params", () => {
    vi.spyOn(router, "params", "get").mockReturnValue({
      postId: "42",
      commentId: "99",
    });
    vi.spyOn(router, "listenPath").mockReturnValue(() => {});
    vi.spyOn(router, "listenParams").mockReturnValue(() => {});

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(HistoryContext.Provider, { value: router }, children);

    const { result } = renderHook(() => useRouter(), { wrapper });

    expect(result.current.params).toEqual({
      postId: "42",
      commentId: "99",
    });
  });

  it("should clear params when navigating to non-param route", async () => {
    let listener: ((params: Record<string, string>) => void) | null = null;

    vi.spyOn(router, "listenPath").mockReturnValue(() => {});
    vi.spyOn(router, "listenParams").mockImplementation((cb: any) => {
      listener = cb;
      return () => {
        listener = null;
      };
    });

    vi.spyOn(router, "params", "get").mockReturnValue({ id: "123" });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(HistoryContext.Provider, { value: router }, children);

    const { result } = renderHook(() => useRouter(), { wrapper });

    expect(result.current.params).toEqual({ id: "123" });

    // Simulate navigation to route without params
    act(() => {
      if (listener) {
        (listener as any)({});
      }
    });

    await waitFor(() => {
      expect(result.current.params).toEqual({});
    });
  });

  it("should work with nested providers and params", () => {
    vi.spyOn(router, "params", "get").mockReturnValue({ id: "789" });
    vi.spyOn(router, "listenPath").mockReturnValue(() => {});
    vi.spyOn(router, "listenParams").mockReturnValue(() => {});

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(
        HistoryContext.Provider,
        { value: router },
        createElement(RouterPathProvider, { path: "/users/:id" }, children)
      );

    const { result } = renderHook(() => useRouter(), { wrapper });

    expect(result.current.params).toEqual({ id: "789" });
  });
});
