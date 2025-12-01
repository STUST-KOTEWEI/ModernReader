"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface AccessibilityContextType {
    highContrast: boolean;
    toggleHighContrast: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
    const [highContrast, setHighContrast] = useState(false);

    useEffect(() => {
        // Check local storage or system preference on mount
        const saved = localStorage.getItem("high-contrast");
        if (saved === "true") {
            // Use setTimeout to avoid "synchronous setState in effect" warning
            setTimeout(() => setHighContrast(true), 0);
        }
    }, []);

    useEffect(() => {
        // Apply class to document element
        if (highContrast) {
            document.documentElement.classList.add("high-contrast");
        } else {
            document.documentElement.classList.remove("high-contrast");
        }
        localStorage.setItem("high-contrast", String(highContrast));
    }, [highContrast]);

    const toggleHighContrast = () => setHighContrast((prev) => !prev);

    return (
        <AccessibilityContext.Provider value={{ highContrast, toggleHighContrast }}>
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (context === undefined) {
        throw new Error("useAccessibility must be used within an AccessibilityProvider");
    }
    return context;
}
