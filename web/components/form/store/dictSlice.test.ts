import dictReducer, { setAtPath, pushAtPath, removeAtPath } from "./dictSlice";

describe("dictSlice", () => {
  const initialState = { data: {} };

  it("should handle initial state", () => {
    expect(dictReducer(undefined, { type: "unknown" })).toEqual({ data: {} });
  });

  it("should handle setAtPath", () => {
    const actual = dictReducer(
      initialState,
      setAtPath({ path: ["user", "name"], value: "John" })
    );
    expect(actual.data).toEqual({ user: { name: "John" } });
  });

  it("should handle pushAtPath", () => {
    const state = { data: { items: ["a"] } };
    const actual = dictReducer(
      state,
      pushAtPath({ path: ["items"], value: "b" })
    );
    expect(actual.data.items).toEqual(["a", "b"]);
  });

  it("should handle removeAtPath", () => {
    const state = { data: { items: ["a", "b", "c"] } };
    const actual = dictReducer(
      state,
      removeAtPath({ path: ["items"], index: [1] })
    );
    expect(actual.data.items).toEqual(["a", "c"]);
  });

  it("should handle multiple removeAtPath", () => {
    const state = { data: { items: ["a", "b", "c", "d"] } };
    const actual = dictReducer(
      state,
      removeAtPath({ path: ["items"], index: [1, 3] })
    );
    expect(actual.data.items).toEqual(["a", "c"]);
  });

  describe("root level operations (empty path)", () => {
    it("should handle setAtPath with empty path to replace root with array", () => {
      const state = { data: { user: "John" } };
      const actual = dictReducer(
        state,
        setAtPath({ path: [], value: ["a", "b", "c"] })
      );
      expect(actual.data).toEqual(["a", "b", "c"]);
    });

    it("should handle setAtPath with empty path to replace root array with object", () => {
      const state = { data: ["a", "b"] };
      const actual = dictReducer(
        state,
        setAtPath({ path: [], value: { user: "John" } })
      );
      expect(actual.data).toEqual({ user: "John" });
    });

    it("should handle pushAtPath with empty path on array root", () => {
      const state = { data: ["a", "b"] };
      const actual = dictReducer(state, pushAtPath({ path: [], value: "c" }));
      expect(actual.data).toEqual(["a", "b", "c"]);
    });

    it("should handle pushAtPath with empty path on empty array root", () => {
      const state = { data: [] };
      const actual = dictReducer(
        state,
        pushAtPath({ path: [], value: "first" })
      );
      expect(actual.data).toEqual(["first"]);
    });

    it("should handle removeAtPath with empty path on array root", () => {
      const state = { data: ["a", "b", "c", "d"] };
      const actual = dictReducer(state, removeAtPath({ path: [], index: [1] }));
      expect(actual.data).toEqual(["a", "c", "d"]);
    });

    it("should handle removeAtPath with empty path removing multiple indices", () => {
      const state = { data: ["a", "b", "c", "d", "e"] };
      const actual = dictReducer(
        state,
        removeAtPath({ path: [], index: [1, 3] })
      );
      expect(actual.data).toEqual(["a", "c", "e"]);
    });

    it("should handle removeAtPath with empty path and unsorted indices", () => {
      const state = { data: ["a", "b", "c", "d", "e"] };
      const actual = dictReducer(
        state,
        removeAtPath({ path: [], index: [3, 0, 1] })
      );
      expect(actual.data).toEqual(["c", "e"]);
    });
  });

  describe("boolean values", () => {
    it("should handle setAtPath with boolean values", () => {
      const state = { data: {} };
      const actual = dictReducer(
        state,
        setAtPath({ path: ["settings", "enabled"], value: true })
      );
      expect(actual.data).toEqual({ settings: { enabled: true } });
    });

    it("should handle setAtPath updating boolean from true to false", () => {
      const state = { data: { settings: { enabled: true } } };
      const actual = dictReducer(
        state,
        setAtPath({ path: ["settings", "enabled"], value: false })
      );
      expect(actual.data).toEqual({ settings: { enabled: false } });
    });

    it("should handle setAtPath updating boolean from false to true", () => {
      const state = { data: { settings: { enabled: false } } };
      const actual = dictReducer(
        state,
        setAtPath({ path: ["settings", "enabled"], value: true })
      );
      expect(actual.data).toEqual({ settings: { enabled: true } });
    });

    it("should handle array of booleans with pushAtPath", () => {
      const state = { data: { flags: [true, false] } };
      const actual = dictReducer(
        state,
        pushAtPath({ path: ["flags"], value: true })
      );
      expect(actual.data.flags).toEqual([true, false, true]);
    });

    it("should handle multiple boolean fields", () => {
      const state = { data: {} };
      let actual = dictReducer(
        state,
        setAtPath({ path: ["user", "active"], value: true })
      );
      actual = dictReducer(
        actual,
        setAtPath({ path: ["user", "verified"], value: false })
      );
      actual = dictReducer(
        actual,
        setAtPath({ path: ["user", "premium"], value: true })
      );
      expect(actual.data).toEqual({
        user: { active: true, verified: false, premium: true },
      });
    });
  });

  describe("numeric values", () => {
    it("should handle setAtPath with number values", () => {
      const actual = dictReducer(
        initialState,
        setAtPath({ path: ["user", "age"], value: 25 })
      );
      expect(actual.data).toEqual({ user: { age: 25 } });
    });

    it("should handle setAtPath with zero", () => {
      const actual = dictReducer(
        initialState,
        setAtPath({ path: ["count"], value: 0 })
      );
      expect(actual.data).toEqual({ count: 0 });
    });

    it("should handle setAtPath with negative numbers", () => {
      const actual = dictReducer(
        initialState,
        setAtPath({ path: ["temperature"], value: -10 })
      );
      expect(actual.data).toEqual({ temperature: -10 });
    });

    it("should handle setAtPath with floating point numbers", () => {
      const actual = dictReducer(
        initialState,
        setAtPath({ path: ["price"], value: 19.99 })
      );
      expect(actual.data).toEqual({ price: 19.99 });
    });

    it("should handle array of numbers with pushAtPath", () => {
      const state = { data: { scores: [10, 20] } };
      const actual = dictReducer(
        state,
        pushAtPath({ path: ["scores"], value: 30 })
      );
      expect(actual.data.scores).toEqual([10, 20, 30]);
    });
  });

  describe("null and undefined values", () => {
    it("should handle setAtPath with null", () => {
      const actual = dictReducer(
        initialState,
        setAtPath({ path: ["user", "avatar"], value: null })
      );
      expect(actual.data).toEqual({ user: { avatar: null } });
    });

    it("should handle setAtPath with undefined", () => {
      const actual = dictReducer(
        initialState,
        setAtPath({ path: ["user", "avatar"], value: undefined })
      );
      expect(actual.data).toEqual({ user: { avatar: undefined } });
    });

    it("should handle overwriting value with null", () => {
      const state = { data: { user: { name: "John" } } };
      const actual = dictReducer(
        state,
        setAtPath({ path: ["user", "name"], value: null })
      );
      expect(actual.data).toEqual({ user: { name: null } });
    });
  });

  describe("mixed type scenarios", () => {
    it("should handle object with mixed types", () => {
      const state = { data: {} };
      let actual = dictReducer(
        state,
        setAtPath({ path: ["profile", "name"], value: "Alice" })
      );
      actual = dictReducer(
        actual,
        setAtPath({ path: ["profile", "age"], value: 30 })
      );
      actual = dictReducer(
        actual,
        setAtPath({ path: ["profile", "active"], value: true })
      );
      actual = dictReducer(
        actual,
        setAtPath({ path: ["profile", "avatar"], value: null })
      );
      expect(actual.data).toEqual({
        profile: { name: "Alice", age: 30, active: true, avatar: null },
      });
    });

    it("should handle array with mixed types", () => {
      const state = { data: { items: [] } };
      let actual = dictReducer(
        state,
        pushAtPath({ path: ["items"], value: "text" })
      );
      actual = dictReducer(actual, pushAtPath({ path: ["items"], value: 42 }));
      actual = dictReducer(
        actual,
        pushAtPath({ path: ["items"], value: true })
      );
      actual = dictReducer(
        actual,
        pushAtPath({ path: ["items"], value: null })
      );
      expect(actual.data.items).toEqual(["text", 42, true, null]);
    });
  });

  describe("pushAtPath array materialization", () => {
    it("should create and materialize array when path does not exist", () => {
      const state = { data: {} };
      const actual = dictReducer(
        state,
        pushAtPath({ path: ["items"], value: "first" })
      );
      expect(actual.data).toEqual({ items: ["first"] });
    });

    it("should create nested path and array when deeply nested path does not exist", () => {
      const state = { data: {} };
      const actual = dictReducer(
        state,
        pushAtPath({ path: ["user", "tags"], value: "tag1" })
      );
      expect(actual.data).toEqual({ user: { tags: ["tag1"] } });
    });

    it("should push multiple items to non-existent array path", () => {
      const state = { data: {} };
      let actual = dictReducer(
        state,
        pushAtPath({ path: ["items"], value: "first" })
      );
      actual = dictReducer(
        actual,
        pushAtPath({ path: ["items"], value: "second" })
      );
      expect(actual.data).toEqual({ items: ["first", "second"] });
    });

    it("should work with mixed existing and new paths", () => {
      const state = { data: { user: { name: "John" } } };
      const actual = dictReducer(
        state,
        pushAtPath({ path: ["user", "roles"], value: "admin" })
      );
      expect(actual.data).toEqual({
        user: {
          name: "John",
          roles: ["admin"],
        },
      });
    });

    it("should convert non-root data to array and push when root is not an array", () => {
      // This tests the empty path case with non-array root
      const state = { data: { obj: "value" } };
      const actual = dictReducer(
        state,
        pushAtPath({ path: [], value: "item" })
      );
      // When path is empty and root is not array, it should convert to array
      expect(Array.isArray(actual.data)).toBe(true);
      expect(actual.data).toEqual(["item"]);
    });
  });
});
