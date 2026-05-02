'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'system';
        return (localStorage.getItem('theme') as Theme | null) || 'system';
    });
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    // Detect system theme preference
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            if (theme === 'system') {
                setResolvedTheme(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleSystemThemeChange);
        
        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }, [theme]);

    // Load theme from localStorage on mount
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as Theme | null;
        if (storedTheme) {
            setTheme(storedTheme);
        }
    }, []);

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        let themeToApply: 'light' | 'dark' = 'light';

        if (theme === 'system') {
            const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
            themeToApply = systemPreference ? 'dark' : 'light';
        } else {
            themeToApply = theme;
        }

        setResolvedTheme(themeToApply);

        // Remove both classes first
        root.classList.remove('light', 'dark');
        // Add the appropriate class
        root.classList.add(themeToApply);
        root.style.colorScheme = themeToApply;

        // Save to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
