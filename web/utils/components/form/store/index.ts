/**
 * Form Store Module
 *
 * This module provides the state management layer for the form system.
 * It uses Zustand for lightweight, performant state management with
 * granular subscriptions.
 *
 * @module store
 */

// Main store exports
export {
  createFormStore,
  createFormStore as createStore, // Alias for backward compatibility with tests
  getByPath,
  type Path,
  type FormStore,
  type FormStoreApi,
  type FormState,
  type FormActions,
} from "./zustand";

// Provider exports
export { default as StoreProvider } from "./provider";
export type { StoreProviderProps } from "./provider";

// Hook exports
export {
  useSelectPath,
  useAppDispatch,
  useAppSelector,
} from "./hooks";

// Zustand provider hooks (new API)
export {
  useFormStoreApi,
  useFormActions,
  useFormData,
} from "./zustand-provider";
