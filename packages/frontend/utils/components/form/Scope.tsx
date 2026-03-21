import { type ReactNode } from "react";
import PathProvider, { type Path } from "./paths";

/**
 * Props for the Form.Scope component.
 */
export interface ScopeProps {
  /**
   * The path or path segment for this scope.
   * Can be a string key, number index, or array of path segments.
   */
  path: Path;

  /**
   * If true, cleans up data from the store when this scope unmounts.
   * Useful for conditional sections where the entire subtree should be
   * removed when hidden.
   *
   * @example
   * ```tsx
   * {showAdvanced && (
   *   <Form.Scope path="advanced" autoCleanup>
   *     <Form.Text path="notes" />
   *     <Form.Int path="priority" />
   *   </Form.Scope>
   * )}
   * ```
   */
  autoCleanup?: boolean;

  children: ReactNode;
}

/**
 * Creates a nested scope for form fields.
 * Useful for organizing data into objects or arrays.
 *
 * @example
 * ```tsx
 * <Form.Root>
 *   <Form.Scope path="user">
 *     <Form.Scope path="profile">
 *       <Form.Text path="name" />
 *     </Form.Scope>
 *   </Form.Scope>
 * </Form.Root>
 * // Results in: { user: { profile: { name: "..." } } }
 * ```
 */
export function Scope({ path, autoCleanup, children }: ScopeProps) {
  return (
    <PathProvider value={path} autoCleanup={autoCleanup}>
      {children}
    </PathProvider>
  );
}

export default Scope;
