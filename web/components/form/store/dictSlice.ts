import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Path = Array<string | number>;

type DictState = { data: any };
const initialState: DictState = { data: {} };

function setByPath(target: any, path: Path, value: any) {
  let curr = target;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (curr[key] === undefined)
      curr[key] = typeof path[i + 1] === "number" ? [] : {};
    curr = curr[key];
  }
  curr[path[path.length - 1]] = value;
}

export function getByPath<T = unknown>(
  source: any,
  path: Path,
  fallback?: T
): T {
  let curr = source;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (curr == null || !(key in curr)) return fallback as T;
    curr = curr[key];
  }
  return curr as T;
}

const dictSlice = createSlice({
  name: "dict",
  initialState,
  reducers: {
    setAtPath(state, action: PayloadAction<{ path: Path; value: any }>) {
      // Handle empty path - replace root
      if (action.payload.path.length === 0) {
        state.data = action.payload.value;
      } else {
        setByPath(state.data, action.payload.path, action.payload.value);
      }
    },
    pushAtPath(state, action: PayloadAction<{ path: Path; value: any }>) {
      const { path, value } = action.payload;

      // Handle empty path - work on root array
      if (path.length === 0) {
        if (!Array.isArray(state.data)) {
          state.data = [];
        }
        (state.data as any[]).push(value);
        return;
      }

      // Check if array exists at path
      let arr = getByPath<any>(state.data, path, undefined);

      // If array doesn't exist, create and store it
      if (!Array.isArray(arr)) {
        arr = [];
        setByPath(state.data, path, arr);
      }

      arr.push(value);
    },
    removeAtPath(
      state,
      action: PayloadAction<{ path: Path; index: number[] }>
    ) {
      // Handle empty path - work on root array
      const arr =
        action.payload.path.length === 0
          ? state.data
          : getByPath(state.data, action.payload.path, []);
      if (Array.isArray(arr)) {
        // Sort indices in descending order to avoid shifting issues
        const indices = [...action.payload.index].sort((a, b) => b - a);
        for (const idx of indices) {
          if (idx >= 0 && idx < arr.length) {
            arr.splice(idx, 1);
          }
        }
      }
    },
    /**
     * Deletes a value at a specific path and cleans up empty parent containers.
     * This is useful for `autoCleanup` behavior where unmounting an input
     * should remove its value and any resulting empty parent objects/arrays.
     */
    deleteAtPath(state, action: PayloadAction<{ path: Path }>) {
      const { path } = action.payload;
      if (path.length === 0) {
        // Cannot delete root, reset to empty object instead
        state.data = {};
        return;
      }
      deleteByPathAndCleanup(state.data, path);
    },
  },
});

/**
 * Recursively deletes a key at the given path and cleans up empty parent containers.
 * Returns true if the container at the current level should be cleaned up (is empty).
 */
function deleteByPathAndCleanup(root: any, path: Path): boolean {
  if (path.length === 0) return false;

  const key = path[0];
  const isLastKey = path.length === 1;

  if (root == null || typeof root !== "object") {
    return false;
  }

  if (!(key in root)) {
    return false;
  }

  if (isLastKey) {
    // Delete the key
    if (Array.isArray(root) && typeof key === "number") {
      root.splice(key, 1);
    } else {
      delete root[key];
    }
  } else {
    // Recurse into the nested object/array
    const shouldCleanup = deleteByPathAndCleanup(root[key], path.slice(1));
    if (shouldCleanup) {
      // Child is now empty, delete it
      if (Array.isArray(root) && typeof key === "number") {
        root.splice(key, 1);
      } else {
        delete root[key];
      }
    }
  }

  // Check if current container is now empty
  if (Array.isArray(root)) {
    return root.length === 0;
  }
  return Object.keys(root).length === 0;
}

export const { setAtPath, pushAtPath, removeAtPath, deleteAtPath } =
  dictSlice.actions;
export default dictSlice.reducer;
