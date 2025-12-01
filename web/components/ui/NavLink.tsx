"use client";

import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface NavLinkProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    className?: string;
}

/**
 * NavLink Component
 * 
 * A navigation link component with active state styling and accessibility features.
 * 
 * @param href - The URL to navigate to
 * @param icon - The icon to display
 * @param label - The text label for the link
 * @param active - Whether the link is currently active
 * @param className - Additional CSS classes
 */
export function NavLink({ href, icon, label, active = false, className }: NavLinkProps) {
    return (
        <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group border",
                active
                    ? "bg-white/10 text-white border-white/15 shadow-lg shadow-[#e64458]/10 translate-x-1"
                    : "text-white/70 hover:text-white hover:bg-white/5 border-transparent hover:border-white/10",
                className
            )}
        >
            {icon}
            <span className="hidden lg:block font-medium text-sm">{label}</span>
        </Link>
    );
}
