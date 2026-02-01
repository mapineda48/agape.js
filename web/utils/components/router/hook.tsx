import { useContext, useEffect, useState } from "react";
import { join } from "pathe";
import { RouterPathContext } from "./path-context";
import { useHistory } from "./HistoryContext";
import { toRelativePath } from "./path-utils";
import type { RouteParams, INavigateTo } from "./types";

interface RouterHookAPI {
  /** Current pathname */
  pathname: string;
  /** Route parameters extracted from URL */
  params: RouteParams;
  /** Navigate to a path (absolute or relative) */
  navigate(to: string, opt?: INavigateTo): void;
  /** Listen to pathname changes */
  listen(cb: (pathname: string) => void): () => void;
}

/**
 * Custom hook that provides router functionality with intelligent path resolution.
 *
 * This hook supports three types of navigation paths, each suited for different use cases:
 *
 * ## Navigation Types
 *
 * ### 1. Absolute Paths (starts with `/`)
 * Navigate to a specific route regardless of current context.
 * These paths are used as-is without any transformation.
 *
 * **Use when:** Navigating to top-level routes or completely different sections
 *
 * @example
 * ```tsx
 * const { navigate } = useRouter();
 * navigate("/login");        // Always goes to /login
 * navigate("/cms/dashboard"); // Always goes to /cms/dashboard
 * ```
 *
 * ### 2. Relative Paths (starts with `.`)
 * Navigate relative to the **current pathname** (actual browser location).
 * Uses `pathe` library for proper path resolution with support for:
 * - Current directory: `./path`
 * - Parent directory: `../path`
 * - Multiple levels: `../../path`
 *
 * **Use when:** Navigating based on the actual current route, like sibling or parent pages
 *
 * @example
 * ```tsx
 * // Current pathname: /cms/inventory/products
 * const { navigate } = useRouter();
 *
 * navigate("./categories");   // → /cms/inventory/products/categories
 * navigate("../product");     // → /cms/inventory/product
 * navigate("../../config");   // → /cms/config
 * ```
 *
 * ### 3. Layout-Level Paths (no prefix)*
 * Navigate within the current layout context (from `RouterPathProvider`).
 * These paths are resolved against the `basePath` context, making them
 * portable across different layout implementations.
 *
 * **Use when:** Navigating between pages within the same layout/module
 *
 * @example
 * ```tsx
 * // Inside a layout with basePath="/cms/inventory"
 * const { navigate } = useRouter();
 *
 * navigate("products");       // → /cms/inventory/products
 * navigate("categories");     // → /cms/inventory/categories
 * navigate("config/settings"); // → /cms/inventory/config/settings
 * ```
 *
 * ## Additional Features
 *
 * ### pathname
 * Returns the current pathname relative to the layout context for easier
 * path matching within nested layouts.
 *
 * ### params
 * Route parameters extracted from dynamic route segments (e.g., `:id`).
 *
 * ### listen
 * Subscribe to pathname changes, receiving relative paths based on context.
 *
 * @returns {RouterHookAPI} Router API with navigate, pathname, params, and listen
 *
 * @see {@link https://github.com/unjs/pathe} for pathe path resolution details
 */
export function useRouter(): RouterHookAPI {
  const router = useHistory();

  const basePath = useContext(RouterPathContext);
  const [pathname, setPathname] = useState(() => {
    // Initialize with relative path
    return toRelativePath(router.pathname, basePath);
  });

  const [params, setParams] = useState<RouteParams>(() => router.params);

  useEffect(() => {
    // Update pathname immediately if router.pathname changed
    setPathname(toRelativePath(router.pathname, basePath));

    // Update params immediately
    setParams(router.params);

    // Listen for future pathname changes
    const unlistenPath = router.listenPath((path) => {
      // Update with relative path
      setPathname(toRelativePath(path, basePath));
    });

    // Listen for future param changes
    const unlistenParams = router.listenParams((newParams) => {
      setParams(newParams);
    });

    return () => {
      unlistenPath();
      unlistenParams();
    };
  }, [basePath]);

  /**
   * Resolves a navigation path based on its type (absolute, relative, or layout-level).
   *
   * @param to - The target path to navigate to
   * @returns The resolved absolute path ready for navigation
   *
   * @internal
   */
  const resolvePath = (to: string): string => {
    // Type 1: Absolute path - use as-is
    // Example: "/login" → "/login"
    if (to.startsWith("/")) {
      return to;
    }

    // Type 2: Relative path - resolve against current pathname using pathe
    // Example: from "/cms/products", navigate("../config") → "/cms/config"
    if (to.startsWith(".")) {
      return join(router.pathname, to);
    }

    // Type 3: Layout-level path - resolve against basePath context
    // Example: with basePath="/cms", navigate("products") → "/cms/products"
    return join(basePath, to);
  };

  const navigate = (to: string, opt?: INavigateTo) => {
    // Use setTimeout to avoid race condition with router.loading
    setTimeout(() => {
      const resolvedPath = resolvePath(to);
      router.navigateTo(resolvedPath, opt);
    }, 0);
  };

  const listen = (cb: (pathname: string) => void) => {
    return router.listenPath((absolutePath) => {
      // Convert to relative path before calling the callback
      const relativePath = toRelativePath(absolutePath, basePath);
      cb(relativePath);
    });
  };

  return {
    pathname,
    params,
    navigate,
    listen,
  };
}
