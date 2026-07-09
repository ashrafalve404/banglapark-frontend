"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { LocaleProvider } from "@/lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30 * 1000,
                        retry: 1,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <QueryClientProvider client={queryClient}>
                <LocaleProvider>{children}</LocaleProvider>
            </QueryClientProvider>
        </GoogleOAuthProvider>
    );
}
