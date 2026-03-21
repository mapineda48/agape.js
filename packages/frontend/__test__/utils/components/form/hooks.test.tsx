import { renderHook, act } from "@testing-library/react";
import StoreProvider from "#web/utils/components/form/store/provider";
import PathProvider from "#web/utils/components/form/paths";
import useInput from "#web/utils/components/form/Input/useInput";
import { useInputArray } from "#web/utils/components/form/hooks";
import React from "react";

const wrapper = ({ children }: { children: React.ReactNode }) => {
  return <StoreProvider>{children}</StoreProvider>;
};

describe("form hooks", () => {
  describe("useInput hook", () => {
    it("should update state", () => {
      const { result } = renderHook(
        () => useInput(["user", "name"], "Alice"),
        { wrapper }
      );

      expect(result.current.value).toBe("Alice");

      act(() => {
        result.current.setValue("Bob");
      });

      expect(result.current.value).toBe("Bob");
    });

    it("should initialize with boolean true", () => {
      const { result } = renderHook(
        () => useInput(["settings", "enabled"], true),
        { wrapper }
      );

      expect(result.current.value).toBe(true);
    });

    it("should initialize with boolean false", () => {
      const { result } = renderHook(
        () => useInput(["settings", "enabled"], false),
        { wrapper }
      );

      expect(result.current.value).toBe(false);
    });

    it("should toggle boolean values", () => {
      const { result } = renderHook(
        () => useInput(["settings", "enabled"], false),
        { wrapper }
      );

      expect(result.current.value).toBe(false);

      act(() => {
        result.current.setValue(true);
      });

      expect(result.current.value).toBe(true);

      act(() => {
        result.current.setValue(false);
      });

      expect(result.current.value).toBe(false);
    });

    it("should initialize with numeric value", () => {
      const { result } = renderHook(
        () => useInput(["count"], 42),
        { wrapper }
      );

      expect(result.current.value).toBe(42);
    });

    it("should update numeric values", () => {
      const { result } = renderHook(
        () => useInput(["count"], 0),
        { wrapper }
      );

      expect(result.current.value).toBe(0);

      act(() => {
        result.current.setValue(100);
      });

      expect(result.current.value).toBe(100);
    });

    it("should handle negative numbers", () => {
      const { result } = renderHook(
        () => useInput(["temperature"], 0),
        { wrapper }
      );

      act(() => {
        result.current.setValue(-20);
      });

      expect(result.current.value).toBe(-20);
    });

    it("should handle decimal numbers", () => {
      const { result } = renderHook(
        () => useInput(["price"], 0),
        { wrapper }
      );

      act(() => {
        result.current.setValue(19.99);
      });

      expect(result.current.value).toBe(19.99);
    });

    it("should handle deeply nested paths", () => {
      const { result } = renderHook(
        () => useInput(["user", "profile", "settings", "theme"], "dark"),
        { wrapper }
      );

      expect(result.current.value).toBe("dark");

      act(() => {
        result.current.setValue("light");
      });

      expect(result.current.value).toBe("light");
    });

    it("should handle array index in path", () => {
      const { result } = renderHook(
        () => useInput(["items", 0, "name"], "First"),
        { wrapper }
      );

      expect(result.current.value).toBe("First");

      act(() => {
        result.current.setValue("Updated");
      });

      expect(result.current.value).toBe("Updated");
    });
  });

  describe("useInput with PathProvider context", () => {
    it("should combine context path with relative path", () => {
      const contextWrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider>
          <PathProvider value="user">{children}</PathProvider>
        </StoreProvider>
      );

      const { result } = renderHook(
        () => useInput(["name"], "John"),
        { wrapper: contextWrapper }
      );

      expect(result.current.value).toBe("John");

      act(() => {
        result.current.setValue("Jane");
      });

      expect(result.current.value).toBe("Jane");
    });

    it("should handle nested PathProvider", () => {
      const nestedWrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider>
          <PathProvider value="user">
            <PathProvider value="profile">{children}</PathProvider>
          </PathProvider>
        </StoreProvider>
      );

      const { result } = renderHook(
        () => useInput(["name"], "Alice"),
        { wrapper: nestedWrapper }
      );

      expect(result.current.value).toBe("Alice");
    });
  });

  describe("useInputArray hook", () => {
    it("should initialize with empty array", () => {
      const arrayWrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider initialState={{ items: [] }}>
          <PathProvider value="items">{children}</PathProvider>
        </StoreProvider>
      );

      const { result } = renderHook(() => useInputArray<string[]>(), {
        wrapper: arrayWrapper,
      });

      expect(result.current.length).toBe(0);
    });

    it("should initialize with existing array", () => {
      const arrayWrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider initialState={{ items: ["a", "b", "c"] }}>
          <PathProvider value="items">{children}</PathProvider>
        </StoreProvider>
      );

      const { result } = renderHook(() => useInputArray<string[]>(), {
        wrapper: arrayWrapper,
      });

      expect(result.current.length).toBe(3);
    });

    it("should add items to array", () => {
      const arrayWrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider initialState={{ items: [] }}>
          <PathProvider value="items">{children}</PathProvider>
        </StoreProvider>
      );

      const { result } = renderHook(() => useInputArray<string[]>(), {
        wrapper: arrayWrapper,
      });

      expect(result.current.length).toBe(0);

      act(() => {
        result.current.addItem("first");
      });

      expect(result.current.length).toBe(1);

      act(() => {
        result.current.addItem("second", "third");
      });

      expect(result.current.length).toBe(3);
    });

    it("should remove items from array", () => {
      const arrayWrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider initialState={{ items: ["a", "b", "c", "d"] }}>
          <PathProvider value="items">{children}</PathProvider>
        </StoreProvider>
      );

      const { result } = renderHook(() => useInputArray<string[]>(), {
        wrapper: arrayWrapper,
      });

      expect(result.current.length).toBe(4);

      act(() => {
        result.current.removeItem(1); // Remove "b"
      });

      expect(result.current.length).toBe(3);
    });

    it("should remove multiple items at once", () => {
      const arrayWrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider initialState={{ items: ["a", "b", "c", "d", "e"] }}>
          <PathProvider value="items">{children}</PathProvider>
        </StoreProvider>
      );

      const { result } = renderHook(() => useInputArray<string[]>(), {
        wrapper: arrayWrapper,
      });

      expect(result.current.length).toBe(5);

      act(() => {
        result.current.removeItem(0, 2, 4); // Remove "a", "c", "e"
      });

      expect(result.current.length).toBe(2);
    });

    it("should set entire array", () => {
      const arrayWrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider initialState={{ items: ["old"] }}>
          <PathProvider value="items">{children}</PathProvider>
        </StoreProvider>
      );

      const { result } = renderHook(() => useInputArray<string[]>(), {
        wrapper: arrayWrapper,
      });

      act(() => {
        result.current.set(["new", "array", "values"]);
      });

      expect(result.current.length).toBe(3);
    });

    it("should map over array items with stable keys", () => {
      const arrayWrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider initialState={{ items: ["a", "b", "c"] }}>
          <PathProvider value="items">{children}</PathProvider>
        </StoreProvider>
      );

      const { result } = renderHook(() => useInputArray<string[]>(), {
        wrapper: arrayWrapper,
      });

      const mapped = result.current.map((item, index) => (
        <div key={index} data-item={item} data-index={index} />
      ));

      expect(mapped).toHaveLength(3);
      // Each element is wrapped by PathProvider from useFieldArray.map
      expect(mapped[0]).toBeDefined();
      expect(mapped[1]).toBeDefined();
      expect(mapped[2]).toBeDefined();
    });

    it("should handle array of objects", () => {
      interface Item {
        id: number;
        name: string;
      }

      const arrayWrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider
          initialState={{
            items: [
              { id: 1, name: "First" },
              { id: 2, name: "Second" },
            ],
          }}
        >
          <PathProvider value="items">{children}</PathProvider>
        </StoreProvider>
      );

      const { result } = renderHook(() => useInputArray<Item[]>(), {
        wrapper: arrayWrapper,
      });

      expect(result.current.length).toBe(2);

      act(() => {
        result.current.addItem({ id: 3, name: "Third" });
      });

      expect(result.current.length).toBe(3);
    });
  });
});
