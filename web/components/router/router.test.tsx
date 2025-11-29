import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";

// Mock @agape/access before importing router
vi.mock("@agape/access", () => ({
  isAuthenticated: vi.fn().mockResolvedValue({ id: "test-user" }),
}));

import { HistoryManager } from "./router";

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
    const router = new HistoryManager();

    // Manually inject routes and layouts (bypassing private modifier for testing)
    // @ts-ignore
    router.routes["/parent/child"] = {
      Component: ChildPage,
    };

    // @ts-ignore
    router.layouts["/"] = {
      Component: RootLayout,
    };
    // @ts-ignore
    router.layouts["/parent"] = {
      Component: ParentLayout,
    };

    // Mock history location
    // @ts-ignore
    router.history = {
      location: { pathname: "/parent/child", state: {} },
      listen: (cb: any) => {
        // Trigger immediately for the test
        cb({
          location: { pathname: "/parent/child", state: {} },
          action: "PUSH",
        });
        return () => {};
      },
      push: vi.fn(),
      replace: vi.fn(),
    } as any;

    let renderedElement: any = null;
    router.listenPage((element) => {
      renderedElement = element;
    });

    // Wait for the callback to be called
    await waitFor(() => expect(renderedElement).not.toBeNull());

    render(renderedElement);

    const rootLayout = screen.getByTestId("root-layout");
    const parentLayout = screen.getByTestId("parent-layout");
    const childPage = screen.getByTestId("child-page");

    // Verify nesting structure
    expect(rootLayout).toContainElement(parentLayout);
    expect(parentLayout).toContainElement(childPage);
  });
});
