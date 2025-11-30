import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useBreakpoint,
  useBreakpointValue,
  useBreakpointValidator,
  useBreakpointMatch,
  factoryBreakpointValue,
  resetMqls,
  type Breakpoint,
} from "./useBreakpointValue";

describe("useBreakpointValue hooks", () => {
  // Mock matchMedia
  const createMatchMedia = (matches: boolean, query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });

  const setupBreakpoint = (breakpoint: Breakpoint) => {
    const queries = {
      xs: "(max-width: 639px)",
      sm: "(min-width: 640px) and (max-width: 767px)",
      md: "(min-width: 768px) and (max-width: 1023px)",
      lg: "(min-width: 1024px) and (max-width: 1279px)",
      xl: "(min-width: 1280px) and (max-width: 1535px)",
      "2xl": "(min-width: 1536px)",
    };

    window.matchMedia = vi.fn((query: string) => {
      const matches = query === queries[breakpoint];
      return createMatchMedia(matches, query) as any;
    });

    // Reset cached mqls after setting up new matchMedia
    resetMqls();
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetMqls();
  });

  describe("useBreakpoint", () => {
    it("should return current breakpoint as xs", () => {
      setupBreakpoint("xs");
      const { result } = renderHook(() => useBreakpoint());

      expect(result.current.breakpoint).toBe("xs");
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    it("should return current breakpoint as sm", () => {
      setupBreakpoint("sm");
      const { result } = renderHook(() => useBreakpoint());

      expect(result.current.breakpoint).toBe("sm");
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    it("should return current breakpoint as md (tablet)", () => {
      setupBreakpoint("md");
      const { result } = renderHook(() => useBreakpoint());

      expect(result.current.breakpoint).toBe("md");
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });

    it("should return current breakpoint as lg (desktop)", () => {
      setupBreakpoint("lg");
      const { result } = renderHook(() => useBreakpoint());

      expect(result.current.breakpoint).toBe("lg");
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
    });

    it("should check if breakpoint is in list", () => {
      setupBreakpoint("lg");
      const { result } = renderHook(() => useBreakpoint());

      expect(result.current.is("lg", "xl")).toBe(true);
      expect(result.current.is("xs", "sm")).toBe(false);
    });

    it("should check isAtMost correctly", () => {
      setupBreakpoint("md");
      const { result } = renderHook(() => useBreakpoint());

      expect(result.current.isAtMost("lg")).toBe(true);
      expect(result.current.isAtMost("md")).toBe(true);
      expect(result.current.isAtMost("sm")).toBe(false);
    });

    it("should check isAtLeast correctly", () => {
      setupBreakpoint("md");
      const { result } = renderHook(() => useBreakpoint());

      expect(result.current.isAtLeast("sm")).toBe(true);
      expect(result.current.isAtLeast("md")).toBe(true);
      expect(result.current.isAtLeast("lg")).toBe(false);
    });
  });

  describe("useBreakpointValue", () => {
    it("should return exact match value", () => {
      setupBreakpoint("md");
      const { result } = renderHook(() =>
        useBreakpointValue(
          {
            xs: 1,
            sm: 2,
            md: 3,
            lg: 4,
          },
          1
        )
      );

      expect(result.current[0]).toBe(3);
    });

    it("should cascade down to nearest smaller breakpoint", () => {
      setupBreakpoint("xl");
      const { result } = renderHook(() =>
        useBreakpointValue(
          {
            xs: 1,
            sm: 2,
            md: 3,
            lg: 4,
            // xl not defined, should cascade to lg
          },
          1
        )
      );

      expect(result.current[0]).toBe(4);
    });

    it("should return default value if no matches", () => {
      setupBreakpoint("xs");
      const { result } = renderHook(() =>
        useBreakpointValue(
          {
            // xs not defined
            md: 2,
            // md, lg, xl not defined
          },
          10
        )
      );

      expect(result.current[0]).toBe(10);
    });

    it("should allow setting value manually", () => {
      setupBreakpoint("md");
      const values = { md: 3 };
      const { result } = renderHook(() => useBreakpointValue(values, 1));

      expect(result.current[0]).toBe(3);

      act(() => {
        result.current[1](99);
      });

      expect(result.current[0]).toBe(99);
    });
  });

  describe("factoryBreakpointValue", () => {
    it("should create a reusable hook with predefined values", () => {
      setupBreakpoint("lg");

      const useGridColumns = factoryBreakpointValue({
        xs: 1,
        sm: 2,
        md: 3,
        lg: 4,
      });

      const { result } = renderHook(() => useGridColumns(1));

      expect(result.current[0]).toBe(4);
    });
  });

  describe("useBreakpointValidator", () => {
    it("should return validator for current breakpoint", () => {
      setupBreakpoint("xs");

      const { result } = renderHook(() =>
        useBreakpointValidator(
          {
            xs: (value: string) => value.length >= 5,
            lg: (value: string) => value.length >= 10,
          },
          () => true
        )
      );

      expect(result.current("hello")).toBe(true);
      expect(result.current("hi")).toBe(false);
    });

    it("should cascade to nearest validator", () => {
      setupBreakpoint("xl");

      const { result } = renderHook(() =>
        useBreakpointValidator(
          {
            xs: (value: string) => value.length >= 5,
            lg: (value: string) => value.length >= 10,
            // xl not defined, should cascade to lg
          },
          () => true
        )
      );

      // Debugging
      if (result.current("hello world") === false) {
        console.log(
          "Cascade test failed. Current breakpoint:",
          useBreakpoint().breakpoint
        ); // This won't work inside test body directly but worth a try if we could hook it
      }

      expect(result.current("hello world")).toBe(true);
      expect(result.current("hello")).toBe(false);
    });

    it("should use default validator if no matches (and no smaller breakpoints)", () => {
      setupBreakpoint("xs"); // Use xs, so no smaller breakpoints exist

      const { result } = renderHook(() =>
        useBreakpointValidator(
          {
            md: (value: string) => value.length >= 5,
            lg: (value: string) => value.length >= 8,
          },
          (value: string) => value.length >= 3
        )
      );

      expect(result.current("hi")).toBe(false); // length 2, default validator >= 3 -> false
      expect(result.current("hey")).toBe(true); // length 3, default validator >= 3 -> true
    });
  });

  describe("useBreakpointMatch", () => {
    it("should return true when breakpoint matches", () => {
      setupBreakpoint("lg");

      const { result } = renderHook(() => useBreakpointMatch("lg", "xl"));

      expect(result.current).toBe(true);
    });

    it("should return false when breakpoint does not match", () => {
      setupBreakpoint("xs");

      const { result } = renderHook(() => useBreakpointMatch("lg", "xl"));

      expect(result.current).toBe(false);
    });

    it("should match single breakpoint", () => {
      setupBreakpoint("md");

      const { result } = renderHook(() => useBreakpointMatch("md"));

      expect(result.current).toBe(true);
    });
  });
});
