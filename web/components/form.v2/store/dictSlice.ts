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
      setByPath(state.data, action.payload.path, action.payload.value);
    },
    pushAtPath(state, action: PayloadAction<{ path: Path; value: any }>) {
      const arr = getByPath(state.data, action.payload.path, []);
      if (Array.isArray(arr)) {
        arr.push(action.payload.value);
      }
    },
    removeAtPath(state, action: PayloadAction<{ path: Path; index: number[] }>) {
      const arr = getByPath(state.data, action.payload.path, []);
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
  },
});

export const { setAtPath, pushAtPath, removeAtPath } = dictSlice.actions;
export default dictSlice.reducer;
