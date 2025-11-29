import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";

// Mock @agape/access before importing router
vi.mock("@agape/access", () => ({
  isAuthenticated: vi.fn().mockResolvedValue({ id: "test-user" }),
}));

import { HistoryManager, HistoryContext } from "./router";

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

    // Mock history to prevent real browser history changes
    let historyListener: any = null;
    const mockHistory = {
      location: { pathname: "/parent/child", state: {} },
      listen: vi.fn((cb: any) => {
        historyListener = cb;
        return () => {};
      }),
      push: vi.fn((path: string, state: any) => {
        mockHistory.location = { pathname: path, state };
        if (historyListener) {
          historyListener({
            location: { pathname: path, state },
            action: "PUSH",
          });
        }
      }),
      replace: vi.fn((path: string, state: any) => {
        mockHistory.location = { pathname: path, state };
        if (historyListener) {
          historyListener({
            location: { pathname: path, state },
            action: "REPLACE",
          });
        }
      }),
    } as any;

    // @ts-ignore
    router.navigator.history = mockHistory;

    // Spy on console.error to suppress debug logs
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Component to hold and render the router's page
    let renderedElement: JSX.Element | null = null;
    const { rerender } = render(
      createElement(HistoryContext.Provider, { value: router }, null)
    );

    // Set up page listener
    router.listenPage((element: JSX.Element) => {
      renderedElement = element;
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
