import { renderHook, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "./store";
import { useForm } from "./useForm";
import { useFormState } from "./useFormState";
import EventEmitter from "#web/utils/components/event-emitter";
import FormProvider from "./provider";

describe("useForm", () => {
  const createWrapper = (initialState?: object) => {
    const store = createStore(initialState);
    return {
      store,
      Wrapper: ({ children }: { children: React.ReactNode }) => (
        <EventEmitter>
          <Provider store={store}>
            <FormProvider>{children}</FormProvider>
          </Provider>
        </EventEmitter>
      ),
    };
  };

  describe("reset", () => {
    it("should completely replace form state", () => {
      const { store, Wrapper } = createWrapper({ name: "John", age: 30 });

      const { result } = renderHook(() => useForm(), { wrapper: Wrapper });

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
      const { store, Wrapper } = createWrapper({
        name: "John",
        complex: { nested: "value" },
      });

      const { result } = renderHook(() => useForm(), { wrapper: Wrapper });

      act(() => {
        result.current.reset({});
      });

      const state = store.getState();
      expect(state.form.data).toEqual({});
    });

    it("should reset to complex nested structure", () => {
      const { store, Wrapper } = createWrapper({ old: "data" });

      const { result } = renderHook(() => useForm(), { wrapper: Wrapper });

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
      const { store, Wrapper } = createWrapper({});

      const { result } = renderHook(() => useForm(), { wrapper: Wrapper });

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
      const { store, Wrapper } = createWrapper({ name: "John", age: 30 });

      const { result } = renderHook(() => useForm(), { wrapper: Wrapper });

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
      const { store, Wrapper } = createWrapper({ name: "John", age: 30 });

      const { result } = renderHook(() => useForm(), { wrapper: Wrapper });

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
      const { store, Wrapper } = createWrapper({ existing: "value" });

      const { result } = renderHook(() => useForm(), { wrapper: Wrapper });

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
      const { store, Wrapper } = createWrapper({
        user: { name: "John" },
      });

      const { result } = renderHook(() => useForm(), { wrapper: Wrapper });

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
      const { store, Wrapper } = createWrapper({ user: { name: "John" } });

      const { result } = renderHook(() => useForm(), { wrapper: Wrapper });

      act(() => {
        result.current.setAt(["user", "email"], "john@example.com");
      });

      const state = store.getState();
      expect(state.form.data.user.email).toBe("john@example.com");
    });

    it("should create nested path if it doesn't exist", () => {
      const { store, Wrapper } = createWrapper({});

      const { result } = renderHook(() => useForm(), { wrapper: Wrapper });

      act(() => {
        result.current.setAt(["user", "profile", "name"], "Alice");
      });

      const state = store.getState();
      expect(state.form.data.user.profile.name).toBe("Alice");
    });

    it("should set nested object at path", () => {
      const { store, Wrapper } = createWrapper({ user: { name: "John" } });

      const { result } = renderHook(() => useForm(), { wrapper: Wrapper });

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
      const { store, Wrapper } = createWrapper({ items: ["a", "b", "c"] });

      const { result } = renderHook(() => useForm(), { wrapper: Wrapper });

      act(() => {
        result.current.setAt(["items"], ["x", "y"]);
      });

      const state = store.getState();
      expect(state.form.data.items).toEqual(["x", "y"]);
    });

    it("should handle array paths", () => {
      const { store, Wrapper } = createWrapper({
        users: [{ name: "John" }, { name: "Jane" }],
      });

      const { result } = renderHook(() => useForm(), { wrapper: Wrapper });

      act(() => {
        result.current.setAt(["users", 0, "name"], "Updated John");
      });

      const state = store.getState();
      expect(state.form.data.users[0].name).toBe("Updated John");
      expect(state.form.data.users[1].name).toBe("Jane");
    });
  });

  describe("getValues", () => {
    it("should return current form values as snapshot", () => {
      const { Wrapper } = createWrapper({ name: "John", age: 30 });

      const { result } = renderHook(() => useForm(), { wrapper: Wrapper });

      const values = result.current.getValues<{ name: string; age: number }>();
      expect(values).toEqual({ name: "John", age: 30 });
    });

    it("should return updated values after reset", () => {
      const { Wrapper } = createWrapper({ name: "John" });

      const { result } = renderHook(() => useForm(), { wrapper: Wrapper });

      act(() => {
        result.current.reset({ email: "test@example.com" });
      });

      const values = result.current.getValues<{ email: string }>();
      expect(values).toEqual({ email: "test@example.com" });
    });
  });

  describe("callback stability", () => {
    it("should return stable function references", () => {
      const { Wrapper } = createWrapper({});

      const { result, rerender } = renderHook(() => useForm(), {
        wrapper: Wrapper,
      });

      const firstReset = result.current.reset;
      const firstMerge = result.current.merge;
      const firstSetAt = result.current.setAt;
      const firstGetValues = result.current.getValues;

      rerender();

      expect(result.current.reset).toBe(firstReset);
      expect(result.current.merge).toBe(firstMerge);
      expect(result.current.setAt).toBe(firstSetAt);
      expect(result.current.getValues).toBe(firstGetValues);
    });
  });
});

describe("useFormState", () => {
  const createWrapper = (initialState?: object) => {
    const store = createStore(initialState);
    return {
      store,
      Wrapper: ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      ),
    };
  };

  it("should return current form values reactively", () => {
    const { Wrapper } = createWrapper({ name: "John", age: 30 });

    const { result } = renderHook(
      () => useFormState<{ name: string; age: number }>(),
      {
        wrapper: Wrapper,
      },
    );

    expect(result.current).toEqual({ name: "John", age: 30 });
  });

  it("should update when state changes", () => {
    const { store, Wrapper } = createWrapper({ name: "John" });

    const { result } = renderHook(
      () => useFormState<{ name?: string; email?: string }>(),
      {
        wrapper: Wrapper,
      },
    );

    expect(result.current).toEqual({ name: "John" });

    // Directly dispatch to simulate state change
    act(() => {
      store.dispatch({
        type: "dict/resetState",
        payload: { state: { email: "test@example.com" } },
      });
    });

    expect(result.current).toEqual({ email: "test@example.com" });
  });
});
