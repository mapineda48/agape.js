import { vi } from "vitest";
import type { History } from "history";

/**
 * Creates a mock history object for testing purposes.
 *
 * This helper creates a lightweight mock of the browser history API that can be
 * injected into the Navigator class for testing. We mock the history object
 * directly on the navigator instance instead of mocking the entire 'history'
 * module. This approach provides:
 *
 * - Fine-grained control over navigation behavior in tests
 * - Faster test execution (no real history API construction)
 * - Easier simulation of edge cases
 * - Better test isolation
 *
 * @param initialPath - The initial pathname for the mock history (default: '/')
 * @returns A mock history object compatible with the History interface
 *
 */
export function createMockHistory(initialPath = "/"): History {
  let historyListener: any = null;
  const initialUrl = new URL(initialPath, "http://dummy");

  const mockHistory = {
    location: {
      pathname: initialUrl.pathname,
      state: {},
      search: initialUrl.search,
      hash: initialUrl.hash,
      key: "default",
    },
    listen: vi.fn((cb: any) => {
      historyListener = cb;
      return () => {
        historyListener = null;
      };
    }),
    push: vi.fn((path: string, state: any) => {
      const url = new URL(path, "http://dummy");
      mockHistory.location = {
        pathname: url.pathname,
        state,
        search: url.search,
        hash: url.hash,
        key: `key-${Date.now()}`,
      };
      if (historyListener) {
        historyListener({
          location: mockHistory.location,
          action: "PUSH",
        });
      }
    }),
    replace: vi.fn((path: string, state: any) => {
      const url = new URL(path, "http://dummy");
      mockHistory.location = {
        pathname: url.pathname,
        state,
        search: url.search,
        hash: url.hash,
        key: mockHistory.location.key,
      };
      if (historyListener) {
        historyListener({
          location: mockHistory.location,
          action: "REPLACE",
        });
      }
    }),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    createHref: vi.fn((to: any) => (typeof to === "string" ? to : to.pathname)),
    action: "POP" as const,
  } as any;

  return mockHistory;
}
