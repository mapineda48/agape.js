import { renderHook, act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  describe("useInputArray with array root", () => {
    it("should support array at root with empty path", () => {
      const { result } = renderHook(() => useInputArray<string[]>([]), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore(["a", "b", "c"]);
          return <Provider store={store}>{children}</Provider>;
        },
      });

      expect(result.current.length).toBe(3);
    });

    it("should support array at root without path argument", () => {
      const { result } = renderHook(() => useInputArray<string[]>(), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore(["item1", "item2"]);
          return <Provider store={store}>{children}</Provider>;
        },
      });

      expect(result.current.length).toBe(2);
    });

    it("should set entire array at root with set()", () => {
      const { result } = renderHook(() => useInputArray<string[]>(), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore(["initial"]);
          return <Provider store={store}>{children}</Provider>;
        },
      });

      expect(result.current.length).toBe(1);

      act(() => {
        result.current.set(["x", "y", "z"]);
      });

      expect(result.current.length).toBe(3);
    });

    it("should add items to root array with addItem()", () => {
      const { result } = renderHook(() => useInputArray<string[]>(), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore(["first"]);
          return <Provider store={store}>{children}</Provider>;
        },
      });

      expect(result.current.length).toBe(1);

      act(() => {
        result.current.addItem("second", "third");
      });

      expect(result.current.length).toBe(3);
    });

    it("should remove items from root array with removeItem()", () => {
      const { result } = renderHook(() => useInputArray<string[]>(), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore(["a", "b", "c", "d"]);
          return <Provider store={store}>{children}</Provider>;
        },
      });

      expect(result.current.length).toBe(4);

      act(() => {
        result.current.removeItem(1, 2); // Remove 'b' and 'c'
      });

      expect(result.current.length).toBe(2);
    });

    it("should provide map function for root array", () => {
      const { result } = renderHook(() => useInputArray<string[]>(), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore(["x", "y", "z"]);
          return <Provider store={store}>{children}</Provider>;
        },
      });

      const elements = result.current.map((item, index, path) => {
        expect(typeof item).toBe("string");
        expect(typeof index).toBe("number");
        expect(Array.isArray(path)).toBe(true);
        expect(path).toEqual([index]); // Path should be [0], [1], [2]
        return <div key={index}>{item}</div>;
      });

      expect(elements).toHaveLength(3);
    });

    it("should maintain backward compatibility with object root", () => {
      const { result } = renderHook(() => useInputArray<string[]>(["items"]), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore({ items: ["a", "b"] });
          return <Provider store={store}>{children}</Provider>;
        },
      });

      expect(result.current.length).toBe(2);

      act(() => {
        result.current.addItem("c");
      });

      expect(result.current.length).toBe(3);
    });

    it("should support empty array at root", () => {
      const { result } = renderHook(() => useInputArray<string[]>(), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore([]);
          return <Provider store={store}>{children}</Provider>;
        },
      });

      expect(result.current.length).toBe(0);

      act(() => {
        result.current.addItem("first");
      });

      expect(result.current.length).toBe(1);
    });

    it("should handle complex operations on root array", () => {
      const { result } = renderHook(() => useInputArray<string[]>(), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore([]);
          return <Provider store={store}>{children}</Provider>;
        },
      });

      // Start empty
      expect(result.current.length).toBe(0);

      // Add items
      act(() => {
        result.current.addItem("a", "b", "c");
      });
      expect(result.current.length).toBe(3);

      // Remove middle item
      act(() => {
        result.current.removeItem(1);
      });
      expect(result.current.length).toBe(2);

      // Replace entire array
      act(() => {
        result.current.set(["x", "y", "z", "w"]);
      });
      expect(result.current.length).toBe(4);

      // Remove multiple items
      act(() => {
        result.current.removeItem(0, 3);
      });
      expect(result.current.length).toBe(2);
    });
  });

  describe("Nested Array/Object Mixing", () => {
    it("should handle array of objects", () => {
      const { result } = renderHook(
        () => useInputArray<{ name: string; tags: string[] }[]>(["users"]),
        {
          wrapper: ({ children }: { children: React.ReactNode }) => {
            const store = createStore({
              users: [
                { name: "Alice", tags: ["admin"] },
                { name: "Bob", tags: ["viewer"] },
              ],
            });
            return <Provider store={store}>{children}</Provider>;
          },
        }
      );

      expect(result.current.length).toBe(2);

      // Verify we can access items
      const capturedItems: any[] = [];
      result.current.map((item) => {
        capturedItems.push(item);
        return <div key={item.name} />;
      });
      expect(capturedItems[0].name).toBe("Alice");
      expect(capturedItems[1].name).toBe("Bob");
    });

    it("should handle array inside object inside array", () => {
      // We want to test accessing ["users", 0, "tags"]
      const { result } = renderHook(
        () => useInputArray<string[]>(["users", 0, "tags"]),
        {
          wrapper: ({ children }: { children: React.ReactNode }) => {
            const store = createStore({
              users: [{ name: "Alice", tags: ["admin", "editor"] }],
            });
            return <Provider store={store}>{children}</Provider>;
          },
        }
      );

      expect(result.current.length).toBe(2);

      let capturedTags: string[] = [];
      result.current.map((t) => {
        capturedTags.push(t);
        return <div key={t} />;
      });
      expect(capturedTags).toEqual(["admin", "editor"]);

      act(() => {
        result.current.addItem("moderator");
      });

      expect(result.current.length).toBe(3);

      capturedTags = [];
      result.current.map((t) => {
        capturedTags.push(t);
        return <div key={t} />;
      });
      expect(capturedTags).toEqual(["admin", "editor", "moderator"]);
    });

    it("should handle value inside object inside array", () => {
      // We want to test accessing ["users", 0, "name"] using useInput
      const { result } = renderHook(() => useInput(["users", 0, "name"]), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore({
            users: [{ name: "Alice", tags: ["admin"] }],
          });
          return <Provider store={store}>{children}</Provider>;
        },
      });

      expect(result.current[0]).toBe("Alice");

      act(() => {
        result.current[1]("Alice Cooper");
      });

      expect(result.current[0]).toBe("Alice Cooper");
    });
  });

  describe("Root Array with Objects Integration", () => {
    it("should map inputs correctly when root is array of objects", async () => {
      const user = userEvent.setup();

      const Item = () => {
        const [name, setName] = useInput("name");
        return (
          <input
            data-testid="name-input"
            value={name as string}
            onChange={(e) => setName(e.target.value)}
          />
        );
      };

      const List = () => {
        const list = useInputArray<{ name: string }[]>();
        return (
          <div>
            {list.map((_item, index) => (
              <div key={index}>
                <Item />
              </div>
            ))}
            <button onClick={() => list.addItem({ name: "New" })}>Add</button>
          </div>
        );
      };

      const store = createStore([{ name: "Alice" }, { name: "Bob" }]);

      render(
        <Provider store={store}>
          <List />
        </Provider>
      );

      const inputs = screen.getAllByTestId("name-input") as HTMLInputElement[];
      expect(inputs).toHaveLength(2);
      expect(inputs[0].value).toBe("Alice");
      expect(inputs[1].value).toBe("Bob");

      // Update first input
      await user.type(inputs[0], " Cooper");
      expect(inputs[0].value).toBe("Alice Cooper");

      // Verify store update
      expect(store.getState().form.data[0].name).toBe("Alice Cooper");

      // Add new item
      await user.click(screen.getByText("Add"));

      const newInputs = screen.getAllByTestId(
        "name-input"
      ) as HTMLInputElement[];
      expect(newInputs).toHaveLength(3);
      expect(newInputs[2].value).toBe("New");
    });
  });

  describe("Stability", () => {
    it("should generate stable keys across renders", () => {
      const { result } = renderHook(() => useInputArray<string[]>(["items"]), {
        wrapper: ({ children }: { children: React.ReactNode }) => {
          const store = createStore({ items: ["a", "b", "c"] });
          return <Provider store={store}>{children}</Provider>;
        },
      });

      const elements1 = result.current.map((_item, _index) => <div />);
      const key1 = elements1[0].key;

      act(() => {
        result.current.addItem("d");
      });

      const elements2 = result.current.map((_item, _index) => <div />);
      const key2 = elements2[0].key;

      // This expectation fails with current implementation (bug reproduction)
      expect(key1).toBe(key2);
    });
  });
});
