import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { createElement, type JSX } from "react";

// Mock @agape/security/access before importing router
vi.mock("@agape/security/access", () => ({
  isAuthenticated: vi.fn().mockResolvedValue({ id: "test-user" }),
}));

import { HistoryManager, HistoryContext } from "./router";
import { createMockHistory } from "@/test/helpers/mock-history";

// Mock structuredClone
global.structuredClone = (val) => JSON.parse(JSON.stringify(val));

describe("Router onInit Params", () => {
  it("should pass params to page onInit", async () => {
    const onInitSpy = vi.fn().mockResolvedValue({ loaded: true });

    const pageLoader = vi.fn().mockResolvedValue({
      default: () => <div>Page</div>,
      onInit: onInitSpy,
    });

    const pageModules = {
      "./users/[id]/page.tsx": pageLoader,
    };

    const router = new HistoryManager(pageModules, {});
    const mockHistory = createMockHistory("/users/123");
    // @ts-ignore
    router.navigator.history = mockHistory;

    // Spy on console.error to suppress debug logs
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => { });

    render(createElement(HistoryContext.Provider, { value: router }, null));

    router.listenPage(() => { });

    await waitFor(
      () => {
        expect(onInitSpy).toHaveBeenCalledWith({
          params: { id: "123" },
          query: {},
        });
      },
      { timeout: 3000 }
    );

    consoleErrorSpy.mockRestore();
  });

  it("should pass params to layout onInit", async () => {
    const onInitSpy = vi.fn().mockResolvedValue({ layoutLoaded: true });

    const layoutLoader = vi.fn().mockResolvedValue({
      default: ({ children }: any) => <div>{children}</div>,
      onInit: onInitSpy,
    });

    const pageLoader = vi.fn().mockResolvedValue({
      default: () => <div>Page</div>,
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

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => { });

    render(createElement(HistoryContext.Provider, { value: router }, null));
    router.listenPage(() => { });

    await waitFor(
      () => {
        expect(onInitSpy).toHaveBeenCalledWith({
          params: { id: "456" },
          query: {},
        });
      },
      { timeout: 3000 }
    );

    consoleErrorSpy.mockRestore();
  });

  it("should handle multiple params", async () => {
    const onInitSpy = vi.fn().mockResolvedValue({});

    const pageLoader = vi.fn().mockResolvedValue({
      default: () => <div>Page</div>,
      onInit: onInitSpy,
    });

    const pageModules = {
      "./posts/[postId]/comments/[commentId]/page.tsx": pageLoader,
    };

    const router = new HistoryManager(pageModules, {});
    const mockHistory = createMockHistory("/posts/10/comments/20");
    // @ts-ignore
    router.navigator.history = mockHistory;

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => { });

    render(createElement(HistoryContext.Provider, { value: router }, null));
    router.listenPage(() => { });

    await waitFor(
      () => {
        expect(onInitSpy).toHaveBeenCalledWith({
          params: { postId: "10", commentId: "20" },
          query: {},
        });
      },
      { timeout: 3000 }
    );

    consoleErrorSpy.mockRestore();
  });

  it("should be backward compatible with onInit without args", async () => {
    // This simulates an old onInit that doesn't declare args
    const onInitSpy = vi.fn().mockResolvedValue({});

    const pageLoader = vi.fn().mockResolvedValue({
      default: () => <div>Page</div>,
      onInit: onInitSpy,
    });

    const pageModules = {
      "./static/page.tsx": pageLoader,
    };

    const router = new HistoryManager(pageModules, {});
    const mockHistory = createMockHistory("/static");
    // @ts-ignore
    router.navigator.history = mockHistory;

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => { });

    render(createElement(HistoryContext.Provider, { value: router }, null));
    router.listenPage(() => { });

    await waitFor(
      () => {
        // It is called with { params: {} } even if it doesn't use it
        expect(onInitSpy).toHaveBeenCalledWith({
          params: {},
          query: {},
        });
      },
      { timeout: 3000 }
    );

    consoleErrorSpy.mockRestore();
  });

  it("should pass query params from initial URL to onInit", async () => {
    const onInitSpy = vi.fn().mockResolvedValue({});

    const pageLoader = vi.fn().mockResolvedValue({
      default: () => <div>Search Page</div>,
      onInit: onInitSpy,
    });

    const pageModules = {
      "./search/page.tsx": pageLoader,
    };

    const router = new HistoryManager(pageModules, {});
    // Initial history with query params
    const mockHistory = createMockHistory("/search?q=foo&sort=asc");
    // @ts-ignore
    router.navigator.history = mockHistory;

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => { });

    render(createElement(HistoryContext.Provider, { value: router }, null));
    router.listenPage(() => { });

    await waitFor(
      () => {
        expect(onInitSpy).toHaveBeenCalledWith({
          params: {},
          query: { q: "foo", sort: "asc" },
        });
      },
      { timeout: 3000 }
    );

    consoleErrorSpy.mockRestore();
  });

  it("should pass query params from navigateTo calls to onInit", async () => {
    const onInitSpy = vi.fn().mockResolvedValue({});

    const pageLoader = vi.fn().mockResolvedValue({
      default: () => <div>Search Page</div>,
      onInit: onInitSpy,
    });

    const pageModules = {
      "./search/page.tsx": pageLoader,
    };

    const router = new HistoryManager(pageModules, {});
    const mockHistory = createMockHistory("/search");
    // @ts-ignore
    router.navigator.history = mockHistory;

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => { });

    render(createElement(HistoryContext.Provider, { value: router }, null));

    let rendered = false;
    router.listenPage(() => { rendered = true; });

    // Wait for initial render
    await waitFor(() => expect(rendered).toBe(true));

    // Clear initial call
    onInitSpy.mockClear();

    // Navigate with query params
    router.navigateTo("/search?query=bar&page=2");

    await waitFor(
      () => {
        expect(onInitSpy).toHaveBeenCalledWith({
          params: {},
          query: { query: "bar", page: "2" },
        });
      },
      { timeout: 3000 }
    );

    consoleErrorSpy.mockRestore();
  });
});
