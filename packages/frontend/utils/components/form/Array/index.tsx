/**
 * Form.Array Component
 *
 * A declarative component for rendering dynamic arrays in forms.
 * Uses render props pattern for maximum flexibility.
 *
 * @module Array
 */

import { type ReactNode, useMemo, useId } from "react";
import { useFieldArray } from "../useFieldArray";
import { useFormStoreApi } from "../store/zustand-provider";
import PathProvider from "../paths";
import stringToPath from "#web/utils/stringToPath";
import { getByPath } from "../store/zustand";

// ============================================================================
// Types
// ============================================================================

/**
 * Represents a single field in an array with its metadata.
 */
export interface ArrayField {
  /**
   * Unique and stable key for React rendering.
   * Use this as the `key` prop when mapping.
   */
  key: string;

  /**
   * Index of the field in the array.
   */
  index: number;

  /**
   * Path to this specific array element.
   */
  path: string;
}

/**
 * Operations available for array manipulation.
 */
export interface ArrayOperations<T> {
  /**
   * Append one or more items to the end of the array.
   */
  append: (...items: T[]) => void;

  /**
   * Prepend one or more items to the beginning of the array.
   */
  prepend: (...items: T[]) => void;

  /**
   * Insert an item at a specific index.
   */
  insert: (index: number, item: T) => void;

  /**
   * Remove items at the specified indices.
   */
  remove: (...indices: number[]) => void;

  /**
   * Move an item from one index to another.
   */
  move: (fromIndex: number, toIndex: number) => void;

  /**
   * Swap two items by their indices.
   */
  swap: (indexA: number, indexB: number) => void;

  /**
   * Replace an item at a specific index.
   */
  replace: (index: number, item: T) => void;

  /**
   * Replace the entire array with new values.
   */
  set: (items: T[]) => void;

  /**
   * Clear all items from the array.
   */
  clear: () => void;
}

/**
 * Render prop function type for Form.Array.
 */
export type ArrayRenderProp<T> = (
  fields: ArrayField[],
  operations: ArrayOperations<T>,
  meta: ArrayMeta
) => ReactNode;

/**
 * Metadata about the array state.
 */
export interface ArrayMeta {
  /**
   * Number of items in the array.
   */
  length: number;

  /**
   * Whether the array is empty.
   */
  isEmpty: boolean;

  /**
   * The base path to the array.
   */
  path: string;
}

/**
 * Props for Form.Array component.
 */
export interface ArrayProps<T = unknown> {
  /**
   * Path to the array field in the form state.
   */
  name: string;

  /**
   * Render prop function that receives fields, operations, and metadata.
   */
  children: ArrayRenderProp<T>;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Form.Array - Declarative array field component
 *
 * Provides a clean API for rendering and manipulating dynamic arrays
 * in forms using the render props pattern.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Form.Array name="tags">
 *   {(fields, { append, remove }) => (
 *     <>
 *       {fields.map((field) => (
 *         <div key={field.key}>
 *           <Form.Text path={field.path} />
 *           <button onClick={() => remove(field.index)}>Remove</button>
 *         </div>
 *       ))}
 *       <button onClick={() => append("")}>Add Tag</button>
 *     </>
 *   )}
 * </Form.Array>
 *
 * // With objects
 * <Form.Array name="users">
 *   {(fields, { append, remove, move }) => (
 *     <>
 *       {fields.map((field, index) => (
 *         <Form.Scope key={field.key} path={field.index}>
 *           <Form.Text path="name" />
 *           <Form.Text path="email" />
 *           <button onClick={() => remove(field.index)}>Remove</button>
 *           {index > 0 && (
 *             <button onClick={() => move(field.index, field.index - 1)}>
 *               Move Up
 *             </button>
 *           )}
 *         </Form.Scope>
 *       ))}
 *       <button onClick={() => append({ name: "", email: "" })}>
 *         Add User
 *       </button>
 *     </>
 *   )}
 * </Form.Array>
 *
 * // With metadata
 * <Form.Array name="items">
 *   {(fields, ops, { length, isEmpty }) => (
 *     <div>
 *       <h3>Items ({length})</h3>
 *       {isEmpty && <p>No items yet</p>}
 *       {fields.map((field) => (
 *         <Form.Field key={field.key} name={`${field.index}`}>
 *           <Form.Text />
 *         </Form.Field>
 *       ))}
 *     </div>
 *   )}
 * </Form.Array>
 * ```
 */
export function FormArray<T = unknown>({
  name,
  children,
}: ArrayProps<T>): ReactNode {
  const uniqueId = useId();
  const fieldArray = useFieldArray<T[]>(name);
  const store = useFormStoreApi();
  const paths = useMemo(() => stringToPath(name), [name]);

  // Build array of field metadata
  const fields: ArrayField[] = useMemo(() => {
    return Array.from({ length: fieldArray.length }, (_, index) => ({
      key: `${uniqueId}-${index}`,
      index,
      path: `${name}.${index}`,
    }));
  }, [fieldArray.length, name, uniqueId]);

  // Create operations object with enhanced functionality
  const operations: ArrayOperations<T> = useMemo(() => {
    // Helper to get current array from store
    const getCurrentArray = (): T[] => {
      const state = store.getState();
      return (getByPath(state.data, paths) as T[]) || [];
    };

    return {
      append: (...items: T[]) => {
        fieldArray.addItem(...items);
      },

      prepend: (...items: T[]) => {
        const current = getCurrentArray();
        fieldArray.set([...items, ...current]);
      },

      insert: (index: number, item: T) => {
        const current = getCurrentArray();
        const newArray = [...current];
        newArray.splice(index, 0, item);
        fieldArray.set(newArray);
      },

      remove: (...indices: number[]) => {
        fieldArray.removeItem(...indices);
      },

      move: (fromIndex: number, toIndex: number) => {
        const current = getCurrentArray();
        if (fromIndex < 0 || fromIndex >= current.length) return;
        if (toIndex < 0 || toIndex >= current.length) return;
        
        const newArray = [...current];
        const [item] = newArray.splice(fromIndex, 1);
        newArray.splice(toIndex, 0, item);
        fieldArray.set(newArray);
      },

      swap: (indexA: number, indexB: number) => {
        const current = getCurrentArray();
        if (indexA < 0 || indexA >= current.length) return;
        if (indexB < 0 || indexB >= current.length) return;
        
        const newArray = [...current];
        [newArray[indexA], newArray[indexB]] = [newArray[indexB], newArray[indexA]];
        fieldArray.set(newArray);
      },

      replace: (index: number, item: T) => {
        const current = getCurrentArray();
        if (index < 0 || index >= current.length) return;
        
        const newArray = [...current];
        newArray[index] = item;
        fieldArray.set(newArray);
      },

      set: (items: T[]) => {
        fieldArray.set(items);
      },

      clear: () => {
        fieldArray.set([]);
      },
    };
  }, [fieldArray, store, paths]);

  // Build metadata
  const meta: ArrayMeta = useMemo(
    () => ({
      length: fieldArray.length,
      isEmpty: fieldArray.length === 0,
      path: name,
    }),
    [fieldArray.length, name]
  );

  // Wrap in PathProvider so children have correct path context
  return (
    <PathProvider value={name}>
      {children(fields, operations, meta)}
    </PathProvider>
  );
}

FormArray.displayName = "Form.Array";

export default FormArray;
