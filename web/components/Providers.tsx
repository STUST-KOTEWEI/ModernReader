"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                <AccessibilityProvider>
                    {children}
                </AccessibilityProvider>
            </QueryClientProvider>
        </SessionProvider>
    );
}
