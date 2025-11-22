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
});
