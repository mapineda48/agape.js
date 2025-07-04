import { useCallback, useEffect, useState } from "react";

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type BreakpointValueMap<T> = Partial<Record<Breakpoint, T>>;

const mediaQueries: Record<Breakpoint, string> = {
    xs: '(max-width: 639px)',                             // 📱 Teléfonos pequeños (iPhone SE, Android compactos)
    sm: '(min-width: 640px) and (max-width: 767px)',      // 📱 Teléfonos medianos (iPhone 13, Galaxy S)
    md: '(min-width: 768px) and (max-width: 1023px)',     // 📱 Tablets verticales / 📱 Phablets (iPad Mini, Galaxy Tab)
    lg: '(min-width: 1024px) and (max-width: 1279px)',    // 💻 Tablets horizontales / Laptops pequeñas (iPad Pro, MacBook Air)
    xl: '(min-width: 1280px) and (max-width: 1535px)',    // 💻 Laptops grandes / Pantallas HD (MacBook Pro 13-15", monitores 1080p)
    '2xl': '(min-width: 1536px)',                         // 🖥️ Monitores grandes / UltraWide / 2K-4K
};

const mqls = Object.entries(mediaQueries).map(([breakpoint, query]) => ({
    breakpoint: breakpoint as Breakpoint,
    mql: window.matchMedia(query),
}));

export function useBreakpointValue<T>(defaultValue: T, valuesQuery: BreakpointValueMap<T>) {
    const findMatchValue = useCallback(() => {

        const [value = defaultValue] = mqls.filter(({ mql }) => mql.matches).map(({ breakpoint }) => valuesQuery[breakpoint]);

        return value;
    }, [valuesQuery]);

    const [activeValue, setActiveValue] = useState(findMatchValue);

    useEffect(() => {
        const updateValue = () => setActiveValue(findMatchValue);

        mqls.forEach(({ mql }) => mql.addEventListener('change', updateValue));

        return () => {
            mqls.forEach(({ mql }) => mql.removeEventListener('change', updateValue));
        };
    }, [valuesQuery, findMatchValue]);

    return [activeValue, setActiveValue] as const;
}


export function factoryBreakpointValue<T>(values: BreakpointValueMap<T>) {
    return (defaultValue: T) => useBreakpointValue(defaultValue, values);
}