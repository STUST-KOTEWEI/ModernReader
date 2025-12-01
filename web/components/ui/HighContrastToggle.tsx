"use client";

import { useAccessibility } from "@/components/AccessibilityProvider";
import { Eye, EyeOff } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";

export function HighContrastToggle() {
    const { highContrast, toggleHighContrast } = useAccessibility();

    return (
        <button
            onClick={toggleHighContrast}
            className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                highContrast
                    ? "bg-mr-ink text-mr-paper border-2 border-mr-paper"
                    : "text-mr-ink/70 hover:bg-mr-ink/5"
            )}
            aria-label={highContrast ? "Disable High Contrast" : "Enable High Contrast"}
            aria-pressed={highContrast}
        >
            {highContrast ? <Eye size={18} /> : <EyeOff size={18} />}
            <span className="hidden lg:inline">
                {highContrast ? "High Contrast: ON" : "High Contrast"}
            </span>
        </button>
    );
}
