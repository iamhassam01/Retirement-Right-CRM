import { useState, useEffect } from 'react';

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
 * Matches Tailwind CSS default breakpoints
 */
export function useResponsiveView() {
    const isMobile = useMediaQuery('(max-width: 767px)');
    const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
    const isDesktop = useMediaQuery('(min-width: 1024px)');
    const isLargeDesktop = useMediaQuery('(min-width: 1280px)');

    return {
        isMobile,
        isTablet,
        isDesktop,
        isLargeDesktop,
        // Convenience computed properties
        isMobileOrTablet: isMobile || isTablet,
        isTabletOrDesktop: isTablet || isDesktop
    };
}

export default useMediaQuery;
