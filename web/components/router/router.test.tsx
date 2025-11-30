import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createElement, type JSX } from "react";

// Mock @agape/access before importing router
vi.mock("@agape/access", () => ({
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
      .mockImplementation(() => {});

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
