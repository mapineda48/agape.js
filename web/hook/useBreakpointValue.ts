import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Breakpoint name type following Tailwind CSS convention
 */
export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

/**
 * Partial mapping from breakpoint to value of type T
 */
export type BreakpointValueMap<T> = Partial<Record<Breakpoint, T>>;

/**
 * Breakpoint order for cascading fallback (smallest to largest)
 */
const breakpointOrder: Breakpoint[] = ["xs", "sm", "md", "lg", "xl", "2xl"];

/**
 * Media queries for each breakpoint (Tailwind CSS compatible)
 */
const mediaQueries: Record<Breakpoint, string> = {
  xs: "(max-width: 639px)", // 📱 Teléfonos pequeños (iPhone SE, Android compactos)
  sm: "(min-width: 640px) and (max-width: 767px)", // 📱 Teléfonos medianos (iPhone 13, Galaxy S)
  md: "(min-width: 768px) and (max-width: 1023px)", // 📱 Tablets verticales / 📱 Phablets (iPad Mini, Galaxy Tab)
  lg: "(min-width: 1024px) and (max-width: 1279px)", // 💻 Tablets horizontales / Laptops pequeñas (iPad Pro, MacBook Air)
  xl: "(min-width: 1280px) and (max-width: 1535px)", // 💻 Laptops grandes / Pantallas HD (MacBook Pro 13-15", monitores 1080p)
  "2xl": "(min-width: 1536px)", // 🖥️ Monitores grandes / UltraWide / 2K-4K
};

/**
 * MediaQueryList instances for each breakpoint (lazy initialized)
 */
let mqls: Array<{ breakpoint: Breakpoint; mql: MediaQueryList }> | null = null;

/**
 * Get or initialize the MediaQueryList instances
 */
function getMqls() {
  if (!mqls) {
    mqls = Object.entries(mediaQueries).map(([breakpoint, query]) => ({
      breakpoint: breakpoint as Breakpoint,
      mql: window.matchMedia(query),
    }));
  }
  return mqls;
}

/**
 * Reset the MediaQueryList instances (for testing)
 * @internal
 */
export function resetMqls() {
  mqls = null;
}

/**
 * Hook to get the current active breakpoint.
 * Returns the current breakpoint name and a boolean indicating if it's mobile (xs or sm).
 *
 * @returns Object with current breakpoint, isMobile flag, and helper functions
 *
 * @example
 * ```tsx
 * const { breakpoint, isMobile, isTablet, isDesktop, is } = useBreakpoint();
 *
 * if (isMobile) {
 *   return <MobileView />;
 * }
 *
 * if (is('lg', 'xl')) {
 *   return <DesktopView />;
 * }
 * ```
 */
export function useBreakpoint() {
  const findCurrentBreakpoint = useCallback((): Breakpoint => {
    const matched = getMqls().find(({ mql }) => mql.matches);
    return matched?.breakpoint ?? "xl"; // fallback to xl
  }, []);

  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
    findCurrentBreakpoint()
  );

  useEffect(() => {
    const updateBreakpoint = () => setBreakpoint(findCurrentBreakpoint());
    const mqls = getMqls();

    mqls.forEach(({ mql }) => mql.addEventListener("change", updateBreakpoint));

    return () => {
      mqls.forEach(({ mql }) =>
        mql.removeEventListener("change", updateBreakpoint)
      );
    };
  }, [findCurrentBreakpoint]);

  // Helper functions
  const helpers = useMemo(
    () => ({
      breakpoint,
      isMobile: breakpoint === "xs" || breakpoint === "sm",
      isTablet: breakpoint === "md",
      isDesktop:
        breakpoint === "lg" || breakpoint === "xl" || breakpoint === "2xl",
      /**
       * Check if current breakpoint matches any of the provided breakpoints
       */
      is: (...breakpoints: Breakpoint[]) => breakpoints.includes(breakpoint),
      /**
       * Check if current breakpoint is smaller than or equal to the provided breakpoint
       */
      isAtMost: (bp: Breakpoint) => {
        const currentIndex = breakpointOrder.indexOf(breakpoint);
        const targetIndex = breakpointOrder.indexOf(bp);
        return currentIndex <= targetIndex;
      },
      /**
       * Check if current breakpoint is larger than or equal to the provided breakpoint
       */
      isAtLeast: (bp: Breakpoint) => {
        const currentIndex = breakpointOrder.indexOf(breakpoint);
        const targetIndex = breakpointOrder.indexOf(bp);
        return currentIndex >= targetIndex;
      },
    }),
    [breakpoint]
  );

  return helpers;
}

/**
 * Hook to get a responsive value based on the current breakpoint.
 * Uses cascading fallback: if a breakpoint doesn't have a value, it falls back to the nearest smaller breakpoint.
 *
 * @param values - Map of breakpoint to value
 * @param defaultValue - Fallback value if no breakpoint matches
 * @returns The current value and a setter function
 *
 * @example
 * ```tsx
 * const [columns, setColumns] = useBreakpointValue({
 *   xs: 1,
 *   sm: 2,
 *   md: 3,
 *   lg: 4,
 * }, 1);
 *
 * // On 'lg' screen: columns = 4
 * // On 'xl' screen: columns = 4 (cascades from 'lg')
 * // On 'xs' screen: columns = 1
 * ```
 */
export function useBreakpointValue<T>(
  values: BreakpointValueMap<T>,
  defaultValue: T
) {
  const helpers = useBreakpoint();

  const { breakpoint } = helpers;

  const findMatchValue = useCallback((): T => {
    // First try exact match
    if (values[breakpoint] !== undefined) {
      return values[breakpoint]!;
    }

    // Cascade down: find the nearest smaller breakpoint with a value
    const currentIndex = breakpointOrder.indexOf(breakpoint);
    for (let i = currentIndex - 1; i >= 0; i--) {
      const bp = breakpointOrder[i];
      if (values[bp] !== undefined) {
        return values[bp]!;
      }
    }

    // Fallback to default
    return defaultValue;
  }, [breakpoint, values, defaultValue]);

  const [state, setState] = useState(() => findMatchValue());

  useEffect(() => {
    setState(() => findMatchValue());
  }, [findMatchValue]);

  return [state, setState, helpers] as const;
}

/**
 * Factory function to create a useBreakpointValue hook with predefined values.
 * Siempre se recomiendo usar este dado que evitamos los prerender innecesarios. al usar el factoryHook
 * para evitar que se recrear la instacia de los estados por defecto
 *
 * @param values - Map of breakpoint to value
 * @returns A hook that accepts a default value
 *
 * @example
 * ```tsx
 * const useGridColumns = factoryHook({
 *   xs: 1,
 *   sm: 2,
 *   md: 3,
 *   lg: 4,
 * });
 *
 * function MyComponent() {
 *   const [columns] = useGridColumns(1);
 *   return <Grid columns={columns} />;
 * }
 * ```
 */
export function factoryHook<T>(values: BreakpointValueMap<T>) {
  return (defaultValue: T) => useBreakpointValue(values, defaultValue);
}

/**
 * Create a responsive validator based on breakpoint.
 * Returns a validation function that can be used conditionally based on screen size.
 *
 * @param validators - Map of breakpoint to validation function
 * @param defaultValidator - Fallback validator if no breakpoint matches
 * @returns A validation function for the current breakpoint
 *
 * @example
 * ```tsx
 * const validatePhoneNumber = useBreakpointValidator({
 *   xs: (value) => value.length >= 10, // More lenient on mobile
 *   lg: (value) => /^\+?[1-9]\d{1,14}$/.test(value), // Strict on desktop
 * }, () => true);
 *
 * const isValid = validatePhoneNumber(phoneNumber);
 * ```
 */
export function useBreakpointValidator<T>(
  validators: BreakpointValueMap<(value: T) => boolean>,
  defaultValidator: (value: T) => boolean = () => true
) {
  const [validator] = useBreakpointValue(validators, defaultValidator);
  return validator;
}

/**
 * Conditional rendering based on breakpoint.
 * Returns true if the current breakpoint matches any of the provided breakpoints.
 *
 * @param breakpoints - Breakpoints to match
 * @returns true if current breakpoint matches
 *
 * @example
 * ```tsx
 * const showSidebar = useBreakpointMatch('lg', 'xl', '2xl');
 *
 * return (
 *   <>
 *     {showSidebar && <Sidebar />}
 *     <MainContent />
 *   </>
 * );
 * ```
 */
export function useBreakpointMatch(...breakpoints: Breakpoint[]): boolean {
  const { is } = useBreakpoint();
  return is(...breakpoints);
}
