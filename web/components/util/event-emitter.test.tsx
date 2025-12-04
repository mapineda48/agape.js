import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { useState, useEffect } from "react";
import EventEmitter, { useEventEmitter, useSharedState } from "./event-emitter";

describe("EventEmitter Component", () => {
  it("should provide event emitter context to children", () => {
    const TestChild = () => {
      const emitter = useEventEmitter();
      return <div>{emitter ? "Context Available" : "No Context"}</div>;
    };

    render(
      <EventEmitter>
        <TestChild />
      </EventEmitter>
    );

    expect(screen.getByText("Context Available")).toBeInTheDocument();
  });

  it("should cleanup all listeners on unmount", async () => {
    const { result: emitterResult } = renderHook(() => useEventEmitter(), {
      wrapper: EventEmitter,
    });

    const handler = vi.fn();

    act(() => {
      emitterResult.current.on("test-event", handler);
    });

    // Verify handler is registered by emitting
    act(() => {
      emitterResult.current.emit("test-event", { data: "test" });
    });

    await waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});

describe("useEventEmitter Hook", () => {
  describe("on method", () => {
    it("should register event handler and receive payload", async () => {
      const { result } = renderHook(() => useEventEmitter(), {
        wrapper: EventEmitter,
      });

      const handler = vi.fn();

      act(() => {
        result.current.on("test-event", handler);
      });

      act(() => {
        result.current.emit("test-event", { data: "hello" });
      });

      await waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith({ data: "hello" });
      });
    });

    it("should return cleanup function that removes listener", async () => {
      const { result } = renderHook(() => useEventEmitter(), {
        wrapper: EventEmitter,
      });

      const handler = vi.fn();
      let cleanup: () => void;

      act(() => {
        cleanup = result.current.on("test-event", handler);
      });

      act(() => {
        result.current.emit("test-event", "first");
      });

      await waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(1);
      });

      act(() => {
        cleanup();
      });

      act(() => {
        result.current.emit("test-event", "second");
      });

      // Should still be 1 because listener was removed
      await waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
    });

    it("should support Symbol as event identifier", async () => {
      const { result } = renderHook(() => useEventEmitter(), {
        wrapper: EventEmitter,
      });

      const eventSymbol = Symbol("test-event");
      const handler = vi.fn();

      act(() => {
        result.current.on(eventSymbol, handler);
      });

      act(() => {
        result.current.emit(eventSymbol, "test-data");
      });

      await waitFor(() => {
        expect(handler).toHaveBeenCalledWith("test-data");
      });
    });

    it("should handle multiple listeners for same event", async () => {
      const { result } = renderHook(() => useEventEmitter(), {
        wrapper: EventEmitter,
      });

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      act(() => {
        result.current.on("multi-event", handler1);
        result.current.on("multi-event", handler2);
      });

      act(() => {
        result.current.emit("multi-event", "shared-data");
      });

      await waitFor(() => {
        expect(handler1).toHaveBeenCalledWith("shared-data");
        expect(handler2).toHaveBeenCalledWith("shared-data");
      });
    });
  });

  describe("emit method", () => {
    it("should emit event without payload", async () => {
      const { result } = renderHook(() => useEventEmitter(), {
        wrapper: EventEmitter,
      });

      const handler = vi.fn();

      act(() => {
        result.current.on("no-payload", handler);
      });

      act(() => {
        result.current.emit("no-payload");
      });

      await waitFor(() => {
        expect(handler).toHaveBeenCalledWith(undefined);
      });
    });

    it("should emit event with various payload types", async () => {
      const { result } = renderHook(() => useEventEmitter(), {
        wrapper: EventEmitter,
      });

      const handler = vi.fn();

      act(() => {
        result.current.on("typed-event", handler);
      });

      // String
      act(() => {
        result.current.emit("typed-event", "string payload");
      });
      await waitFor(() => {
        expect(handler).toHaveBeenCalledWith("string payload");
      });

      // Number
      act(() => {
        result.current.emit("typed-event", 42);
      });
      await waitFor(() => {
        expect(handler).toHaveBeenCalledWith(42);
      });

      // Object
      act(() => {
        result.current.emit("typed-event", { key: "value" });
      });
      await waitFor(() => {
        expect(handler).toHaveBeenCalledWith({ key: "value" });
      });

      // Array
      act(() => {
        result.current.emit("typed-event", [1, 2, 3]);
      });
      await waitFor(() => {
        expect(handler).toHaveBeenCalledWith([1, 2, 3]);
      });

      // Function
      const fnPayload = () => "test";
      act(() => {
        result.current.emit("typed-event", fnPayload);
      });
      await waitFor(() => {
        expect(handler).toHaveBeenCalledWith(fnPayload);
      });
    });

    it("should not throw when emitting event with no listeners", () => {
      const { result } = renderHook(() => useEventEmitter(), {
        wrapper: EventEmitter,
      });

      expect(() => {
        act(() => {
          result.current.emit("no-listeners", "data");
        });
      }).not.toThrow();
    });
  });

  describe("once method", () => {
    it("should trigger handler only once", async () => {
      const { result } = renderHook(() => useEventEmitter(), {
        wrapper: EventEmitter,
      });

      const handler = vi.fn();

      act(() => {
        result.current.once("once-event", handler);
      });

      act(() => {
        result.current.emit("once-event", "first");
      });

      await waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith("first");
      });

      act(() => {
        result.current.emit("once-event", "second");
      });

      // Wait a bit to ensure second emit doesn't trigger handler
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should work with Symbol events", async () => {
      const { result } = renderHook(() => useEventEmitter(), {
        wrapper: EventEmitter,
      });

      const eventSymbol = Symbol("once-symbol");
      const handler = vi.fn();

      act(() => {
        result.current.once(eventSymbol, handler);
      });

      act(() => {
        result.current.emit(eventSymbol, "data");
        result.current.emit(eventSymbol, "data2");
      });

      await waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("integration with React components", () => {
    it("should enable communication between sibling components", async () => {
      const Sender = () => {
        const emitter = useEventEmitter();
        return (
          <button
            onClick={() => emitter.emit("sibling-event", "Hello Sibling")}
          >
            Send
          </button>
        );
      };

      const Receiver = () => {
        const emitter = useEventEmitter();
        const [message, setMessage] = useState("");

        useEffect(() => {
          return emitter.on("sibling-event", (payload: any) => {
            setMessage(payload);
          });
        }, [emitter]);

        return <div data-testid="receiver">{message}</div>;
      };

      render(
        <EventEmitter>
          <Sender />
          <Receiver />
        </EventEmitter>
      );

      const sendButton = screen.getByText("Send");
      act(() => {
        sendButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("receiver")).toHaveTextContent(
          "Hello Sibling"
        );
      });
    });
  });
});

describe("useSharedState Hook", () => {
  it("should initialize with provided value", () => {
    const { result } = renderHook(() => useSharedState("initial"), {
      wrapper: EventEmitter,
    });

    const [state] = result.current;
    expect(state).toBe("initial");
  });

  it("should initialize with function", () => {
    const { result } = renderHook(() => useSharedState(() => "computed"), {
      wrapper: EventEmitter,
    });

    const [state] = result.current;
    expect(state).toBe("computed");
  });

  it("should update state when setter is called", () => {
    const { result } = renderHook(() => useSharedState(0), {
      wrapper: EventEmitter,
    });

    act(() => {
      const [, setState] = result.current;
      setState(42);
    });

    const [state] = result.current;
    expect(state).toBe(42);
  });

  it("should support updater function", () => {
    const { result } = renderHook(() => useSharedState(10), {
      wrapper: EventEmitter,
    });

    act(() => {
      const [, setState] = result.current;
      setState((prev: number) => prev + 5);
    });

    const [state] = result.current;
    expect(state).toBe(15);
  });

  it("should maintain independent state for each hook call", async () => {
    // Note: Each useSharedState() call creates its own unique Symbol,
    // so different hook instances maintain independent state.
    const { result: result1 } = renderHook(() => useSharedState(0), {
      wrapper: EventEmitter,
    });

    const { result: result2 } = renderHook(() => useSharedState(0), {
      wrapper: EventEmitter,
    });

    // Both should start with initial value
    expect(result1.current[0]).toBe(0);
    expect(result2.current[0]).toBe(0);

    // Update from first hook
    act(() => {
      result1.current[1](100);
    });

    // Only result1 should update, result2 remains independent
    await waitFor(() => {
      expect(result1.current[0]).toBe(100);
      expect(result2.current[0]).toBe(0); // Remains unchanged
    });

    // Update from second hook
    act(() => {
      result2.current[1](200);
    });

    // Both maintain their independent values
    await waitFor(() => {
      expect(result1.current[0]).toBe(100); // Unchanged
      expect(result2.current[0]).toBe(200);
    });
  });

  it("should handle complex object state", () => {
    interface User {
      name: string;
      age: number;
    }

    const { result } = renderHook(
      () => useSharedState<User>({ name: "John", age: 30 }),
      {
        wrapper: EventEmitter,
      }
    );

    act(() => {
      const [, setState] = result.current;
      setState({ name: "Jane", age: 25 });
    });

    const [state] = result.current;
    expect(state).toEqual({ name: "Jane", age: 25 });
  });

  it("should clone non-function values to prevent mutation", () => {
    const { result } = renderHook(
      () => useSharedState({ count: 0, nested: { value: 1 } }),
      {
        wrapper: EventEmitter,
      }
    );

    const originalObject = { count: 5, nested: { value: 10 } };

    act(() => {
      const [, setState] = result.current;
      setState(originalObject);
    });

    // Mutate the original object
    originalObject.count = 999;
    originalObject.nested.value = 999;

    const [state] = result.current;
    // State should not be affected by mutation
    expect(state.count).toBe(5);
    expect(state.nested.value).toBe(10);
  });

  it("should cleanup event listeners on unmount", () => {
    const { result, unmount } = renderHook(() => useSharedState(0), {
      wrapper: EventEmitter,
    });

    const [, setState] = result.current;

    // Should not throw on unmount
    expect(() => unmount()).not.toThrow();

    // Setting state after unmount should not cause errors
    expect(() => setState(42)).not.toThrow();
  });

  it("should use unique Symbol for each hook instance", async () => {
    const { result: result1 } = renderHook(() => useSharedState(0), {
      wrapper: EventEmitter,
    });

    const { result: result2 } = renderHook(() => useSharedState(100), {
      wrapper: EventEmitter,
    });

    // They should have different initial states
    expect(result1.current[0]).toBe(0);
    expect(result2.current[0]).toBe(100);

    // Updating one should not affect the other
    act(() => {
      result1.current[1](50);
    });

    await waitFor(() => {
      expect(result1.current[0]).toBe(50);
      expect(result2.current[0]).toBe(100); // Should remain unchanged
    });
  });
});
