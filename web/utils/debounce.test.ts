import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { debounce } from "./debounce";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should execute the function after the specified wait time", () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(51);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it("should only execute once for multiple calls within the wait time", () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();
    vi.advanceTimersByTime(50);
    debouncedFunc();
    vi.advanceTimersByTime(50);
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(51);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it("should pass arguments correctly", () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc("arg1", "arg2");
    vi.advanceTimersByTime(101);

    expect(func).toHaveBeenCalledWith("arg1", "arg2");
  });
});
