import { createContext, type ReactNode } from "react";

/**
 * Context that holds the parent path for nested layouts.
 * This allows child components to use relative paths.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const RouterPathContext = createContext<string>("/");

/**
 * Provider that sets the current path context for nested layouts.
 * This is automatically applied by the Router when wrapping layouts.
 *
 * @internal - This is used internally by the Router.
 * Layouts should use the useRouter hook instead of manually setting this provider.
 *
 * @example
 * ```tsx
 * // Used internally by Router
 * <RouterPathProvider path="/cms/configuration">
 *   <ConfigurationLayout />
 * </RouterPathProvider>
 * ```
 */
export function RouterPathProvider({
  path,
  children,
}: {
  path: string;
  children?: ReactNode;
}) {
  return (
    <RouterPathContext.Provider value={path}>
      {children}
    </RouterPathContext.Provider>
  );
}
