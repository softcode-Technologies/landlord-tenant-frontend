"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { useState } from "react"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  )

  // Forced light: dark mode isn't fully implemented (cards/components are
  // hardcoded light), so following the OS theme produced unreadable
  // light-on-light text and stray dark surfaces.
  return (
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: "var(--font-inter)",
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
