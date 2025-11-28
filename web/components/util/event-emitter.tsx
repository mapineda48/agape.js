import { cloneWithHelpers } from "@/utils/structuredClone";
import mitt from "mitt";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  createElement,
  useState,
  type ReactNode,
  type JSX,
} from "react";

/**
 * React Context that provides the event emitter instance.
 */
const Context = createContext<Emitter>(null as unknown as Emitter);

/**
 * EventEmitter Component.
 *
 * This component initializes an event emitter using `mitt` and provides it
 * to child components via React Context. It also handles cleanup of registered
 * listeners when the component unmounts.
 *
 * @param {Object} props - Component properties.
 * @param {ReactNode} props.children - Child components that require the emitter.
 * @returns {JSX.Element} Event emitter context provider.
 */
export default function EventEmitter({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  // Create a memoized event emitter instance.
  const emitter = useMemo(mitt, []);

  // Cleanup all registered listeners on unmount.
  useEffect(() => {
    return () => {
      emitter.all.clear();
    };
  }, [emitter]);

  return createElement(Context.Provider, {
    value: emitter,
    children,
  });
}

/**
 * Custom hook to access and use the event emitter.
 *
 * Provides methods to emit events, subscribe to events, and subscribe to
 * one-time events. This is the primary API for event-driven communication
 * between components.
 *
 * @returns {EventEmitterAPI} Object with methods to interact with the event emitter.
 *
 * @example
 * ```tsx
 * const emitter = useEventEmitter();
 *
 * // Subscribe to an event
 * useEffect(() => {
 *   return emitter.on('user-login', (user) => {
 *     console.log('User logged in:', user);
 *   });
 * }, [emitter]);
 *
 * // Emit an event
 * emitter.emit('user-login', { id: 1, name: 'John' });
 *
 * // Subscribe to one-time event
 * emitter.once('init', () => {
 *   console.log('Initialized');
 * });
 * ```
 */
export function useEventEmitter(): EventEmitterAPI {
  const emitter = useContext(Context);

  return useMemo(() => {
    /**
     * Subscribe to an event.
     *
     * @param {string | symbol} event - Event name or symbol.
     * @param {Handler} handler - Callback executed when the event is emitted.
     * @returns {() => void} Function to unsubscribe from the event.
     */
    const on = (event: string | symbol, handler: Handler): (() => void) => {
      emitter.on(event, handler);
      return () => emitter.off(event, handler);
    };

    /**
     * Emit an event with an optional payload.
     *
     * @param {string | symbol} event - Event name or symbol.
     * @param {unknown} payload - Data associated with the event.
     */
    const emit = (event: string | symbol, payload?: unknown) => {
      setTimeout(() => emitter.emit(event, payload), 0);
    };

    /**
     * Subscribe to an event that will only trigger once.
     *
     * The handler will be automatically removed after the first emission.
     *
     * @param {string | symbol} event - Event name or symbol.
     * @param {Handler} handler - Callback executed once when the event is emitted.
     */
    const once = (event: string | symbol, handler: Handler) => {
      const wrappedHandler: Handler = (payload: any) => {
        handler(payload);
        emitter.off(event, wrappedHandler);
      };
      emitter.on(event, wrappedHandler);
    };

    return { on, emit, once };
  }, [emitter]);
}

/**
 * Custom hook for managing shared state across components using events.
 *
 * This hook creates a state that is automatically synchronized across all
 * components that use the same hook instance. Each hook instance uses a
 * unique Symbol as the event identifier, ensuring state isolation.
 *
 * @template T - Type of the state value.
 * @param {T | (() => T)} initialState - Initial state value or function that returns initial state.
 * @returns {[T, (state: T | ((prev: T) => T)) => void]} Tuple of [state, setState].
 *
 * @example
 * ```tsx
 * // In Component A
 * const [count, setCount] = useSharedState(0);
 * <button onClick={() => setCount(count + 1)}>Increment</button>
 *
 * // In Component B (same hook instance)
 * const [count] = useSharedState(0);
 * <div>Count: {count}</div>
 * ```
 */
export function useSharedState<T = unknown>(
  initialState: T | ((state?: T) => T)
): [T, (state: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialState);
  const emitter = useContext(Context);

  // Memoize the event identifier and setter to keep them stable.
  const { event, setValue } = useMemo(() => {
    const event = Symbol();

    const setValue = (value: T | ((prev: T) => T)) => {
      // Clone non-function values to prevent unintended mutations
      const payload =
        typeof value === "function" ? value : cloneWithHelpers(value);

      emitter.emit(event, payload);
    };

    return { event, setValue };
  }, [emitter]);

  useEffect(() => {
    const handler: any = setState;

    emitter.on(event, handler);
    return () => {
      emitter.off(event, handler);
    };
  }, [emitter, event]);

  return [state, setValue];
}

/**
 * Type Definitions
 */

/**
 * Event handler function type.
 */
type Handler = <T = any>(payload: T) => void;

/**
 * Event emitter API interface.
 */
type EventEmitterAPI = {
  /**
   * Subscribe to an event.
   */
  on: (event: string | symbol, handler: Handler) => () => void;
  /**
   * Emit an event with optional payload.
   */
  emit: (event: string | symbol, payload?: unknown) => void;
  /**
   * Subscribe to a one-time event.
   */
  once: (event: string | symbol, handler: Handler) => void;
};

/**
 * Type representing the event emitter instance created by `mitt`.
 */
type Emitter = ReturnType<typeof mitt>;
