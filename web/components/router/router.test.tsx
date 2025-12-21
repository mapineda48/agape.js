import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createElement, type JSX } from "react";

// Mock @agape/security/access before importing router
vi.mock("@agape/security/access", () => ({
  isAuthenticated: vi.fn().mockResolvedValue({ id: "test-user" }),
}));

import { HistoryManager, HistoryContext } from "./router";
import { createMockHistory } from "@/test/helpers/mock-history";

// Mock components
const RootLayout = ({ children }: { children?: any }) => (
  <div data-testid="root-layout">
    <h1>Root Layout</h1>
    {children}
  </div>
);

const ParentLayout = ({ children }: { children?: any }) => (
  <div data-testid="parent-layout">
    <h2>Parent Layout</h2>
    {children}
  </div>
);

const GrandParentLayout = ({ children }: { children?: any }) => (
  <div data-testid="grandparent-layout">
    <h2>GrandParent Layout</h2>
    {children}
  </div>
);

const ChildPage = () => <div data-testid="child-page">Child Page Content</div>;

describe("Router Layout Nesting", () => {
  it("should nest layouts in correct order (Root > Parent > Page)", async () => {
    // Create page and layout components that are immediately loadable
    const pageLoader = vi.fn().mockResolvedValue({
      default: ChildPage,
    });

    const rootLayoutLoader = vi.fn().mockResolvedValue({
      default: RootLayout,
    });

    const parentLayoutLoader = vi.fn().mockResolvedValue({
      default: ParentLayout,
    });

    // Define modules for constructor injection
    const pageModules = {
      "/parent/child": pageLoader,
    };

    const layoutModules = {
      "/": rootLayoutLoader,
      "/parent": parentLayoutLoader,
    };

    const router = new HistoryManager(pageModules, layoutModules);

    // Use mock history instead of real browser history to control navigation
    // in tests and prevent side effects. See test/helpers/mock-history.ts for details.
    const mockHistory = createMockHistory("/parent/child");

    // @ts-ignore - Injecting mock for testing purposes
    router.navigator.history = mockHistory;

    // Spy on console.error to suppress debug logs
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => { });

    // Component to hold and render the router's page
    const { rerender } = render(
      createElement(HistoryContext.Provider, { value: router }, null)
    );

    // Set up page listener
    router.listenPage((element: JSX.Element) => {
      rerender(
        createElement(HistoryContext.Provider, { value: router }, element)
      );
    });

    // Wait for all loaders to be called and page to render
    await waitFor(
      () => {
        expect(pageLoader).toHaveBeenCalled();
        expect(rootLayoutLoader).toHaveBeenCalled();
        expect(parentLayoutLoader).toHaveBeenCalled();
        expect(screen.queryByTestId("child-page")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    consoleErrorSpy.mockRestore();

    // Verify the rendered structure
    const rootLayout = screen.getByTestId("root-layout");
    const parentLayout = screen.getByTestId("parent-layout");
    const childPage = screen.getByTestId("child-page");

    // Verify nesting structure: Root > Parent > Page
    expect(rootLayout).toContainElement(parentLayout);
    expect(parentLayout).toContainElement(childPage);
  });
});

describe("Router Layout root property", () => {
  it("should ignore parent layouts when a layout has root: true", async () => {
    // Layout with root: true should become the new root
    const pageLoader = vi.fn().mockResolvedValue({
      default: ChildPage,
    });

    const rootLayoutLoader = vi.fn().mockResolvedValue({
      default: RootLayout,
    });

    // This layout has root: true, so RootLayout should be ignored
    const parentLayoutLoader = vi.fn().mockResolvedValue({
      default: ParentLayout,
      root: true,
    });

    const pageModules = {
      "/parent/child": pageLoader,
    };

    const layoutModules = {
      "/": rootLayoutLoader,
      "/parent": parentLayoutLoader,
    };

    const router = new HistoryManager(pageModules, layoutModules);
    const mockHistory = createMockHistory("/parent/child");

    // @ts-ignore
    router.navigator.history = mockHistory;

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => { });

    const { rerender } = render(
      createElement(HistoryContext.Provider, { value: router }, null)
    );

    router.listenPage((element: JSX.Element) => {
      rerender(
        createElement(HistoryContext.Provider, { value: router }, element)
      );
    });

    await waitFor(
      () => {
        expect(pageLoader).toHaveBeenCalled();
        expect(rootLayoutLoader).toHaveBeenCalled();
        expect(parentLayoutLoader).toHaveBeenCalled();
        expect(screen.queryByTestId("child-page")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    consoleErrorSpy.mockRestore();

    // RootLayout should NOT be rendered because ParentLayout has root: true
    expect(screen.queryByTestId("root-layout")).not.toBeInTheDocument();

    // ParentLayout and ChildPage should be rendered
    const parentLayout = screen.getByTestId("parent-layout");
    const childPage = screen.getByTestId("child-page");

    expect(parentLayout).toContainElement(childPage);
  });

  it("should use innermost layout with root: true when multiple have it", async () => {
    // When multiple layouts have root: true, the innermost one takes precedence
    const pageLoader = vi.fn().mockResolvedValue({
      default: ChildPage,
    });

    // All three have root: true, but ParentLayout (innermost) should win
    const rootLayoutLoader = vi.fn().mockResolvedValue({
      default: RootLayout,
      root: true,
    });

    const grandParentLayoutLoader = vi.fn().mockResolvedValue({
      default: GrandParentLayout,
      root: true,
    });

    const parentLayoutLoader = vi.fn().mockResolvedValue({
      default: ParentLayout,
      root: true,
    });

    const pageModules = {
      "/grandparent/parent/child": pageLoader,
    };

    const layoutModules = {
      "/": rootLayoutLoader,
      "/grandparent": grandParentLayoutLoader,
      "/grandparent/parent": parentLayoutLoader,
    };

    const router = new HistoryManager(pageModules, layoutModules);
    const mockHistory = createMockHistory("/grandparent/parent/child");

    // @ts-ignore
    router.navigator.history = mockHistory;

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => { });

    const { rerender } = render(
      createElement(HistoryContext.Provider, { value: router }, null)
    );

    router.listenPage((element: JSX.Element) => {
      rerender(
        createElement(HistoryContext.Provider, { value: router }, element)
      );
    });

    await waitFor(
      () => {
        expect(pageLoader).toHaveBeenCalled();
        expect(screen.queryByTestId("child-page")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    consoleErrorSpy.mockRestore();

    // Only ParentLayout (innermost with root: true) should be rendered
    expect(screen.queryByTestId("root-layout")).not.toBeInTheDocument();
    expect(screen.queryByTestId("grandparent-layout")).not.toBeInTheDocument();

    const parentLayout = screen.getByTestId("parent-layout");
    const childPage = screen.getByTestId("child-page");

    expect(parentLayout).toContainElement(childPage);
  });

  it("should keep default behavior when no layout has root: true", async () => {
    // Without root: true, all layouts should be nested as usual
    const pageLoader = vi.fn().mockResolvedValue({
      default: ChildPage,
    });

    const rootLayoutLoader = vi.fn().mockResolvedValue({
      default: RootLayout,
      // No root property
    });

    const parentLayoutLoader = vi.fn().mockResolvedValue({
      default: ParentLayout,
      root: false, // Explicit false should also not change behavior
    });

    const pageModules = {
      "/parent/child": pageLoader,
    };

    const layoutModules = {
      "/": rootLayoutLoader,
      "/parent": parentLayoutLoader,
    };

    const router = new HistoryManager(pageModules, layoutModules);
    const mockHistory = createMockHistory("/parent/child");

    // @ts-ignore
    router.navigator.history = mockHistory;

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => { });

    const { rerender } = render(
      createElement(HistoryContext.Provider, { value: router }, null)
    );

    router.listenPage((element: JSX.Element) => {
      rerender(
        createElement(HistoryContext.Provider, { value: router }, element)
      );
    });

    await waitFor(
      () => {
        expect(pageLoader).toHaveBeenCalled();
        expect(screen.queryByTestId("child-page")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    consoleErrorSpy.mockRestore();

    // Both layouts should be rendered with proper nesting
    const rootLayout = screen.getByTestId("root-layout");
    const parentLayout = screen.getByTestId("parent-layout");
    const childPage = screen.getByTestId("child-page");

    expect(rootLayout).toContainElement(parentLayout);
    expect(parentLayout).toContainElement(childPage);
  });

  it("should only ignore layouts BEFORE the root layout, not after", async () => {
    // GrandParent has root: true, so Root is ignored but Parent is still nested
    const pageLoader = vi.fn().mockResolvedValue({
      default: ChildPage,
    });

    const rootLayoutLoader = vi.fn().mockResolvedValue({
      default: RootLayout,
    });

    const grandParentLayoutLoader = vi.fn().mockResolvedValue({
      default: GrandParentLayout,
      root: true, // This becomes the new root
    });

    const parentLayoutLoader = vi.fn().mockResolvedValue({
      default: ParentLayout,
      // No root, so this should be nested inside GrandParent
    });

    const pageModules = {
      "/grandparent/parent/child": pageLoader,
    };

    const layoutModules = {
      "/": rootLayoutLoader,
      "/grandparent": grandParentLayoutLoader,
      "/grandparent/parent": parentLayoutLoader,
    };

    const router = new HistoryManager(pageModules, layoutModules);
    const mockHistory = createMockHistory("/grandparent/parent/child");

    // @ts-ignore
    router.navigator.history = mockHistory;

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => { });

    const { rerender } = render(
      createElement(HistoryContext.Provider, { value: router }, null)
    );

    router.listenPage((element: JSX.Element) => {
      rerender(
        createElement(HistoryContext.Provider, { value: router }, element)
      );
    });

    await waitFor(
      () => {
        expect(pageLoader).toHaveBeenCalled();
        expect(screen.queryByTestId("child-page")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    consoleErrorSpy.mockRestore();

    // RootLayout should be ignored
    expect(screen.queryByTestId("root-layout")).not.toBeInTheDocument();

    // GrandParent > Parent > Child structure
    const grandParentLayout = screen.getByTestId("grandparent-layout");
    const parentLayout = screen.getByTestId("parent-layout");
    const childPage = screen.getByTestId("child-page");

    expect(grandParentLayout).toContainElement(parentLayout);
    expect(parentLayout).toContainElement(childPage);
  });
});

