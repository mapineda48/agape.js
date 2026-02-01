/**
 * Form Store Provider
 *
 * Re-exports the Zustand-based store provider as the default.
 * This module serves as the main entry point for the store provider,
 * allowing easy switching between implementations.
 *
 * @module store/provider
 */

export {
  ZustandStoreProvider as default,
  type ZustandStoreProviderProps as StoreProviderProps,
} from "./zustand-provider";
