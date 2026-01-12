"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

let globalQueryClient: QueryClient | null = null

export function getQueryClient(): QueryClient {
    if (!globalQueryClient) {
        globalQueryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    staleTime: 60 * 1000,
                    refetchOnWindowFocus: false,
                },
            },
        })
    }
    return globalQueryClient
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => getQueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}
