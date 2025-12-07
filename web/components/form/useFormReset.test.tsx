import { renderHook, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "./store";
import { useFormReset } from "./useFormReset";

describe("useFormReset", () => {
  describe("reset", () => {
    it("should completely replace form state", () => {
      const store = createStore({ name: "John", age: 30 });

      const { result } = renderHook(() => useFormReset(), {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });

      act(() => {
        result.current.reset({ email: "test@example.com", phone: "555-1234" });
      });

      const state = store.getState();
      expect(state.form.data).toEqual({
        email: "test@example.com",
        phone: "555-1234",
      });
    });

    it("should reset to empty object", () => {
      const store = createStore({ name: "John", complex: { nested: "value" } });

      const { result } = renderHook(() => useFormReset(), {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });

      act(() => {
        result.current.reset({});
      });

      const state = store.getState();
      expect(state.form.data).toEqual({});
    });

    it("should reset to complex nested structure", () => {
      const store = createStore({ old: "data" });

      const { result } = renderHook(() => useFormReset(), {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });

      const newState = {
        user: {
          profile: { name: "Alice", age: 25 },
          settings: { theme: "dark" },
        },
        items: [1, 2, 3],
      };

      act(() => {
        result.current.reset(newState);
      });

      const state = store.getState();
      expect(state.form.data).toEqual(newState);
    });

    it("should handle reset with serialize: false option", () => {
      const store = createStore({});

      const { result } = renderHook(() => useFormReset(), {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });

      const newState = { name: "Test" };

      act(() => {
        result.current.reset(newState, { serialize: false });
      });

      const state = store.getState();
      expect(state.form.data).toEqual({ name: "Test" });
    });
  });

  describe("merge", () => {
    it("should merge partial state into existing state", () => {
      const store = createStore({ name: "John", age: 30 });

      const { result } = renderHook(() => useFormReset(), {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });

      act(() => {
        result.current.merge({ email: "john@example.com" });
      });

      const state = store.getState();
      expect(state.form.data).toEqual({
        name: "John",
        age: 30,
        email: "john@example.com",
      });
    });

    it("should overwrite existing keys during merge", () => {
      const store = createStore({ name: "John", age: 30 });

      const { result } = renderHook(() => useFormReset(), {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });

      act(() => {
        result.current.merge({ name: "Alice", email: "alice@example.com" });
      });

      const state = store.getState();
      expect(state.form.data).toEqual({
        name: "Alice",
        age: 30,
        email: "alice@example.com",
      });
    });

    it("should handle merging multiple keys at once", () => {
      const store = createStore({ existing: "value" });

      const { result } = renderHook(() => useFormReset(), {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });

      act(() => {
        result.current.merge({
          email: "test@example.com",
          phone: "555-1234",
          address: "123 Main St",
        });
      });

      const state = store.getState();
      expect(state.form.data).toEqual({
        existing: "value",
        email: "test@example.com",
        phone: "555-1234",
        address: "123 Main St",
      });
    });

    it("should merge nested objects as complete values", () => {
      const store = createStore({
        user: { name: "John" },
      });

      const { result } = renderHook(() => useFormReset(), {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });

      act(() => {
        result.current.merge({
          user: { firstName: "Alice", lastName: "Smith" },
        });
      });

      const state = store.getState();
      // Note: This replaces the entire user object, not deep merge
      expect(state.form.data.user).toEqual({
        firstName: "Alice",
        lastName: "Smith",
      });
    });
  });

  describe("setAt", () => {
    it("should set value at specific path", () => {
      const store = createStore({ user: { name: "John" } });

      const { result } = renderHook(() => useFormReset(), {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });

      act(() => {
        result.current.setAt(["user", "email"], "john@example.com");
      });

      const state = store.getState();
      expect(state.form.data.user.email).toBe("john@example.com");
    });

    it("should create nested path if it doesn't exist", () => {
      const store = createStore({});

      const { result } = renderHook(() => useFormReset(), {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });

      act(() => {
        result.current.setAt(["user", "profile", "name"], "Alice");
      });

      const state = store.getState();
      expect(state.form.data.user.profile.name).toBe("Alice");
    });

    it("should set nested object at path", () => {
      const store = createStore({ user: { name: "John" } });

      const { result } = renderHook(() => useFormReset(), {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });

      act(() => {
        result.current.setAt(["user", "profile"], {
          firstName: "Alice",
          lastName: "Smith",
          age: 28,
        });
      });

      const state = store.getState();
      expect(state.form.data.user.profile).toEqual({
        firstName: "Alice",
        lastName: "Smith",
        age: 28,
      });
    });

    it("should replace value at path", () => {
      const store = createStore({ items: ["a", "b", "c"] });

      const { result } = renderHook(() => useFormReset(), {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });

      act(() => {
        result.current.setAt(["items"], ["x", "y"]);
      });

      const state = store.getState();
      expect(state.form.data.items).toEqual(["x", "y"]);
    });

    it("should handle array paths", () => {
      const store = createStore({
        users: [{ name: "John" }, { name: "Jane" }],
      });

      const { result } = renderHook(() => useFormReset(), {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });

      act(() => {
        result.current.setAt(["users", 0, "name"], "Updated John");
      });

      const state = store.getState();
      expect(state.form.data.users[0].name).toBe("Updated John");
      expect(state.form.data.users[1].name).toBe("Jane");
    });
  });

  describe("callback stability", () => {
    it("should return stable function references", () => {
      const store = createStore({});

      const { result, rerender } = renderHook(() => useFormReset(), {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });

      const firstReset = result.current.reset;
      const firstMerge = result.current.merge;
      const firstSetAt = result.current.setAt;

      rerender();

      expect(result.current.reset).toBe(firstReset);
      expect(result.current.merge).toBe(firstMerge);
      expect(result.current.setAt).toBe(firstSetAt);
    });
  });
});
