import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for responsive media queries
 * @param query - CSS media query string
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState<boolean>(() => {
        // SSR safety: check if window is defined
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches;
        }
        return false;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(query);
        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        // Set initial value
        setMatches(mediaQuery.matches);

        // Add listener
        mediaQuery.addEventListener('change', handler);

        // Cleanup
        return () => {
            mediaQuery.removeEventListener('change', handler);
        };
    }, [query]);

    return matches;
}

/**
 * Hook for common responsive breakpoints
 * Industry-standard Tailwind CSS breakpoints with enhanced mobile detection
 */
export function useResponsiveView() {
    // Core breakpoints (Tailwind defaults)
    const isSmallMobile = useMediaQuery('(max-width: 374px)'); // iPhone SE, small Android
    const isMobile = useMediaQuery('(max-width: 639px)');       // sm breakpoint
    const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)'); // md-lg
    const isDesktop = useMediaQuery('(min-width: 1024px)');     // lg+
    const isLargeDesktop = useMediaQuery('(min-width: 1280px)'); // xl+
    const isXLDesktop = useMediaQuery('(min-width: 1536px)');   // 2xl+

    // Orientation detection
    const isPortrait = useMediaQuery('(orientation: portrait)');
    const isLandscape = useMediaQuery('(orientation: landscape)');

    // Accessibility - respects user preferences
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

    // Touch device detection (hover: none indicates touch-primary)
    const isTouchDevice = useMediaQuery('(hover: none) and (pointer: coarse)');

    // High resolution display detection
    const isRetina = useMediaQuery('(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)');

    return {
        // Primary breakpoints
        isSmallMobile,
        isMobile,
        isTablet,
        isDesktop,
        isLargeDesktop,
        isXLDesktop,

        // Orientation
        isPortrait,
        isLandscape,

        // Accessibility preferences
        prefersReducedMotion,
        prefersDarkMode,

        // Device capabilities
        isTouchDevice,
        isRetina,

        // Convenience computed properties
        isMobileOrTablet: isMobile || isTablet,
        isTabletOrDesktop: isTablet || isDesktop,
        isNotDesktop: isMobile || isTablet,

        // Semantic helpers for component decisions
        shouldShowMobileNav: isMobile,
        shouldShowCompactUI: isMobile || isSmallMobile,
        shouldUseCardLayout: isMobile,
        canHover: !isTouchDevice
    };
}

/**
 * Hook for viewport dimensions with debounced updates
 * Useful for dynamic calculations based on viewport size
 */
export function useViewportSize() {
    const [size, setSize] = useState(() => ({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
        // Safe area insets for notched devices
        safeAreaTop: 0,
        safeAreaBottom: 0
    }));

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let timeoutId: NodeJS.Timeout;

        const updateSize = () => {
            // Get CSS variable values for safe areas
            const styles = getComputedStyle(document.documentElement);
            const safeTop = parseInt(styles.getPropertyValue('--safe-area-top') || '0', 10);
            const safeBottom = parseInt(styles.getPropertyValue('--safe-area-bottom') || '0', 10);

            setSize({
                width: window.innerWidth,
                height: window.innerHeight,
                safeAreaTop: safeTop,
                safeAreaBottom: safeBottom
            });
        };

        const debouncedUpdate = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(updateSize, 100);
        };

        // Initial update
        updateSize();

        window.addEventListener('resize', debouncedUpdate);
        window.addEventListener('orientationchange', debouncedUpdate);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', debouncedUpdate);
            window.removeEventListener('orientationchange', debouncedUpdate);
        };
    }, []);

    return size;
}

export default useMediaQuery;
