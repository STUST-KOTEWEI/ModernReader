import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Skeleton Component
 * 
 * A placeholder component used to indicate content is loading.
 * It renders a pulsing animated block that mimics the shape of the content.
 * 
 * @param className - Additional CSS classes for sizing and positioning
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-white/10", className)}
            {...props}
        />
    );
}
