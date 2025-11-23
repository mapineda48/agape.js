import { useContext, useEffect, useState } from "react";
import router from "./router";
import { RouterPathContext } from "./router-context";

/**
 * Helper function to convert an absolute path to relative based on a base path
 */
function toRelativePathHelper(absolutePath: string, basePath: string): string {
  // If not within our base path context, return the absolute path
  if (!absolutePath.startsWith(basePath)) {
    return absolutePath;
  }

  // Remove the base path prefix
  const relativePart = absolutePath.slice(basePath.length);

  // Remove leading slash if present
  return relativePart.startsWith("/")
    ? relativePart.slice(1)
    : relativePart || "/"; // Return "/" if we're exactly at the base path
}

interface INavigateTo {
  replace?: boolean;
  state?: Record<string, unknown>;
}

interface RouterHookAPI {
  /** Current pathname */
  pathname: string;
  /** Navigate to a path (absolute or relative) */
  navigate(to: string, opt?: INavigateTo): void;
  /** Listen to pathname changes */
  listen(cb: (pathname: string) => void): () => void;
}

/**
 * Hook that provides router functionality with automatic path resolution.
 *
 * The router automatically provides path context for each layout based on its location.
 * This allows layouts to use relative paths without knowing their full path.
 *
 * - Absolute paths (starting with `/`) are used as-is
 * - Relative paths are resolved against the current path context
 *
 * @example
 * ```tsx
 * const { navigate, pathname } = useRouter();
 *
 * // In context of "/cms/configuration":
 * navigate("inventory"); // navigates to "/cms/configuration/inventory"
 * navigate("/home");     // navigates to "/home"
 * ```
 */
export function useRouter(): RouterHookAPI {
  const basePath = useContext(RouterPathContext);
  const [pathname, setPathname] = useState(() => {
    // Initialize with relative path
    return toRelativePathHelper(router.pathname, basePath);
  });

  useEffect(() => {
    // Update pathname immediately if router.pathname changed
    setPathname(toRelativePathHelper(router.pathname, basePath));

    // Listen for future changes
    return router.listenPath((path) => {
      // Update with relative path
      setPathname(toRelativePathHelper(path, basePath));
    });
  }, [basePath]);

  /**
   * Resolves a path (absolute or relative) against the current context
   */
  const resolvePath = (to: string): string => {
    // Absolute path: use as-is
    if (to.startsWith("/")) {
      return to;
    }

    // Relative path: resolve against basePath
    const normalizedBase = basePath.endsWith("/")
      ? basePath.slice(0, -1)
      : basePath;

    return `${normalizedBase}/${to}`;
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
      const relativePath = toRelativePathHelper(absolutePath, basePath);
      cb(relativePath);
    });
  };

  return {
    pathname,
    navigate,
    listen,
  };
}
