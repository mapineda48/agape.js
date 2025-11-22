import { renderHook, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "./store";
import useInput from "./Input/useInput";
import { useInputArray } from "./hooks";
import React from "react";

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const store = createStore();
  return <Provider store={store}>{children}</Provider>;
};

describe("form hooks", () => {
  it("useInput should update state", () => {
    const { result } = renderHook(() => useInput(["user", "name"], "Alice"), {
      wrapper,
    });

    expect(result.current[0]).toBe("Alice");

    act(() => {
      result.current[1]("Bob");
    });

    expect(result.current[0]).toBe("Bob");
  });

  describe("useInputArray", () => {
    it("should initialize with correct length", () => {
      const { result } = renderHook(() => useInputArray<string[]>(["items"]), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore({ items: ["item1", "item2", "item3"] });
          return <Provider store={store}>{children}</Provider>;
        },
      });

      expect(result.current.length).toBe(3);
    });

    it("should set entire array with set()", () => {
      const { result } = renderHook(() => useInputArray<string[]>(["items"]), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore({ items: ["initial"] });
          return <Provider store={store}>{children}</Provider>;
        },
      });

      expect(result.current.length).toBe(1);

      act(() => {
        result.current.set(["a", "b", "c"]);
      });

      expect(result.current.length).toBe(3);
    });

    it("should add single item with addItem()", () => {
      const { result } = renderHook(() => useInputArray<string[]>(["items"]), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore({ items: ["first"] });
          return <Provider store={store}>{children}</Provider>;
        },
      });

      expect(result.current.length).toBe(1);

      act(() => {
        result.current.addItem("second");
      });

      expect(result.current.length).toBe(2);
    });

    it("should add multiple items with addItem()", () => {
      const { result } = renderHook(() => useInputArray<string[]>(["items"]), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore({ items: ["first"] });
          return <Provider store={store}>{children}</Provider>;
        },
      });

      expect(result.current.length).toBe(1);

      act(() => {
        result.current.addItem("second", "third", "fourth");
      });

      expect(result.current.length).toBe(4);
    });

    it("should remove single item by index with removeItem()", () => {
      const { result } = renderHook(() => useInputArray<string[]>(["items"]), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore({ items: ["a", "b", "c", "d"] });
          return <Provider store={store}>{children}</Provider>;
        },
      });

      expect(result.current.length).toBe(4);

      act(() => {
        result.current.removeItem(1); // Remove 'b'
      });

      expect(result.current.length).toBe(3);
    });

    it("should remove multiple items by indices with removeItem()", () => {
      const { result } = renderHook(() => useInputArray<string[]>(["items"]), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore({ items: ["a", "b", "c", "d", "e"] });
          return <Provider store={store}>{children}</Provider>;
        },
      });

      expect(result.current.length).toBe(5);

      act(() => {
        result.current.removeItem(1, 3); // Remove 'b' and 'd'
      });

      expect(result.current.length).toBe(3);
    });

    it("should handle removing items in any order", () => {
      const { result } = renderHook(() => useInputArray<string[]>(["items"]), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore({ items: ["a", "b", "c", "d", "e"] });
          return <Provider store={store}>{children}</Provider>;
        },
      });

      // Remove indices out of order: should work correctly due to sorting
      act(() => {
        result.current.removeItem(3, 0, 1); // Remove 'd', 'a', 'b'
      });

      expect(result.current.length).toBe(2);
    });

    it("should provide map function for rendering", () => {
      const { result } = renderHook(() => useInputArray<string[]>(["items"]), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore({ items: ["a", "b", "c"] });
          return <Provider store={store}>{children}</Provider>;
        },
      });

      const elements = result.current.map((item, index, path) => {
        // Verify that map provides correct parameters
        expect(typeof item).toBe("string");
        expect(typeof index).toBe("number");
        expect(Array.isArray(path)).toBe(true);
        return <div key={index}>{item}</div>;
      });

      expect(elements).toHaveLength(3);
      expect(Array.isArray(elements)).toBe(true);
    });

    it("should handle empty array", () => {
      const { result } = renderHook(() => useInputArray<string[]>(["items"]), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore({ items: [] });
          return <Provider store={store}>{children}</Provider>;
        },
      });

      expect(result.current.length).toBe(0);

      const elements = result.current.map((item) => <div>{item}</div>);
      expect(elements).toHaveLength(0);
    });

    it("should support chaining operations", () => {
      const { result } = renderHook(() => useInputArray<string[]>(["items"]), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore({ items: [] });
          return <Provider store={store}>{children}</Provider>;
        },
      });

      expect(result.current.length).toBe(0);

      act(() => {
        result.current.addItem("first", "second", "third");
      });

      expect(result.current.length).toBe(3);

      act(() => {
        result.current.removeItem(1);
      });

      expect(result.current.length).toBe(2);

      act(() => {
        result.current.addItem("fourth");
      });

      expect(result.current.length).toBe(3);

      act(() => {
        result.current.set(["new"]);
      });

      expect(result.current.length).toBe(1);
    });
  });
});
