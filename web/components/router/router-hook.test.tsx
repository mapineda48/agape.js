import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { act } from "react";

// Mock @agape/access before importing router
vi.mock("@agape/access", () => ({
  isAuthenticated: vi.fn().mockResolvedValue({ id: "test-user" }),
}));

import router from "./router";
import { useRouter } from "./router-hook";
import { RouterPathProvider } from "./path-context";

describe("RouterPathProvider", () => {
  it("should provide root path '/' by default", () => {
    const TestComponent = () => {
      const { pathname } = useRouter();
      return <div data-testid="pathname">{pathname}</div>;
    };

    // Mock router pathname
    vi.spyOn(router, "pathname", "get").mockReturnValue("/");

    render(createElement(TestComponent));

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

    const navigateSpy = vi.spyOn(router, "navigateTo");

    render(
      createElement(
        RouterPathProvider,
        { path: "/cms/configuration" },
        createElement(TestComponent)
      )
    );

    const button = screen.getByText("Navigate to inventory");
    button.click();

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

    const navigateSpy = vi.spyOn(router, "navigateTo");

    render(
      createElement(
        RouterPathProvider,
        { path: "/cms" },
        createElement(
          RouterPathProvider,
          { path: "/cms/configuration" },
          createElement(TestComponent)
        )
      )
    );

    const button = screen.getByText("Navigate to page");
    button.click();

    // The inner provider overrides, so it should use /cms/configuration
    expect(navigateSpy).toHaveBeenCalledWith(
      "/cms/configuration/page",
      undefined
    );
  });
});

describe("useRouter - pathname", () => {
  it("should return current pathname relative to context", () => {
    vi.spyOn(router, "pathname", "get").mockReturnValue("/test/path");

    const { result } = renderHook(() => useRouter());

    // In root context, pathname is still absolute but without leading slash
    expect(result.current.pathname).toBe("test/path");
  });

  it("should update pathname when router location changes", async () => {
    let listener: ((pathname: string) => void) | null = null;

    vi.spyOn(router, "listenPath").mockImplementation((cb) => {
      listener = cb;
      return () => {
        listener = null;
      };
    });

    vi.spyOn(router, "pathname", "get").mockReturnValue("/initial");

    const { result } = renderHook(() => useRouter());

    expect(result.current.pathname).toBe("initial");

    // Simulate pathname change
    act(() => {
      if (listener) listener("/new/path");
    });

    await waitFor(() => {
      expect(result.current.pathname).toBe("new/path");
    });
  });
});

describe("useRouter - navigate with absolute paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should navigate to absolute path without modification", () => {
    const navigateSpy = vi.spyOn(router, "navigateTo");

    const { result } = renderHook(() => useRouter());

    act(() => {
      result.current.navigate("/about");
    });

    expect(navigateSpy).toHaveBeenCalledWith("/about", undefined);
  });

  it("should navigate to absolute path regardless of context", () => {
    const navigateSpy = vi.spyOn(router, "navigateTo");

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(
        RouterPathProvider,
        { path: "/cms/configuration" },
        children
      );

    const { result } = renderHook(() => useRouter(), { wrapper });

    act(() => {
      result.current.navigate("/login");
    });

    expect(navigateSpy).toHaveBeenCalledWith("/login", undefined);
  });

  it("should pass navigate options correctly", () => {
    const navigateSpy = vi.spyOn(router, "navigateTo");

    const { result } = renderHook(() => useRouter());

    act(() => {
      result.current.navigate("/home", {
        replace: true,
        state: { foo: "bar" },
      });
    });

    expect(navigateSpy).toHaveBeenCalledWith("/home", {
      replace: true,
      state: { foo: "bar" },
    });
  });
});

describe("useRouter - navigate with relative paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should resolve relative path against root context", () => {
    const navigateSpy = vi.spyOn(router, "navigateTo");

    const { result } = renderHook(() => useRouter());

    act(() => {
      result.current.navigate("about");
    });

    expect(navigateSpy).toHaveBeenCalledWith("/about", undefined);
  });

  it("should resolve relative path against custom context", () => {
    const navigateSpy = vi.spyOn(router, "navigateTo");

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(RouterPathProvider, { path: "/cms" }, children);

    const { result } = renderHook(() => useRouter(), { wrapper });

    act(() => {
      result.current.navigate("configuration");
    });

    expect(navigateSpy).toHaveBeenCalledWith("/cms/configuration", undefined);
  });

  it("should resolve relative path with nested contexts", () => {
    const navigateSpy = vi.spyOn(router, "navigateTo");

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(
        RouterPathProvider,
        { path: "/cms" },
        createElement(
          RouterPathProvider,
          { path: "/cms/configuration" },
          children
        )
      );

    const { result } = renderHook(() => useRouter(), { wrapper });

    act(() => {
      result.current.navigate("inventory");
    });

    expect(navigateSpy).toHaveBeenCalledWith(
      "/cms/configuration/inventory",
      undefined
    );
  });

  it("should handle trailing slashes in context path", () => {
    const navigateSpy = vi.spyOn(router, "navigateTo");

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(RouterPathProvider, { path: "/cms/" }, children);

    const { result } = renderHook(() => useRouter(), { wrapper });

    act(() => {
      result.current.navigate("settings");
    });

    expect(navigateSpy).toHaveBeenCalledWith("/cms/settings", undefined);
  });

  it("should handle multi-segment relative paths", () => {
    const navigateSpy = vi.spyOn(router, "navigateTo");

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(
        RouterPathProvider,
        { path: "/cms/configuration" },
        children
      );

    const { result } = renderHook(() => useRouter(), { wrapper });

    act(() => {
      result.current.navigate("users/new");
    });

    expect(navigateSpy).toHaveBeenCalledWith(
      "/cms/configuration/users/new",
      undefined
    );
  });
});

describe("useRouter - listen", () => {
  it("should call router.listenPath", () => {
    const listenSpy = vi.spyOn(router, "listenPath").mockReturnValue(() => {});

    const { result } = renderHook(() => useRouter());

    const callback = vi.fn();
    result.current.listen(callback);

    expect(listenSpy).toHaveBeenCalled();
  });

  it("should return cleanup function", () => {
    const unlistenMock = vi.fn();
    vi.spyOn(router, "listenPath").mockReturnValue(unlistenMock);

    const { result } = renderHook(() => useRouter());

    const callback = vi.fn();
    const unlisten = result.current.listen(callback);

    expect(typeof unlisten).toBe("function");
    unlisten();
    expect(unlistenMock).toHaveBeenCalled();
  });
});

describe("useRouter - integration", () => {
  it("should handle complex nested navigation scenario", () => {
    const navigateSpy = vi.spyOn(router, "navigateTo");

    const NestedComponent = () => {
      const { navigate } = useRouter();
      return (
        <div>
          <button onClick={() => navigate("inventory")}>Inventory</button>
          <button onClick={() => navigate("/login")}>Login</button>
        </div>
      );
    };

    render(
      createElement(
        RouterPathProvider,
        { path: "/cms" },
        createElement(
          RouterPathProvider,
          { path: "/cms/configuration" },
          createElement(NestedComponent)
        )
      )
    );

    const inventoryButton = screen.getByText("Inventory");
    const loginButton = screen.getByText("Login");

    inventoryButton.click();
    expect(navigateSpy).toHaveBeenCalledWith(
      "/cms/configuration/inventory",
      undefined
    );

    loginButton.click();
    expect(navigateSpy).toHaveBeenCalledWith("/login", undefined);
  });
});
