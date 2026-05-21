"use client"

import { useQuery } from "@tanstack/react-query"
import { configApi } from "@/lib/api/config"

// Runtime constants from the backend (commission %, fees, etc.). Cached for the
// session so rent-entry forms can show the platform fee without refetching.
export function useAppConfig() {
  return useQuery({
    queryKey: ["app-config"],
    queryFn: () => configApi.getConfig(),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })
}

// The platform commission percentage charged on rent. Falls back to 10 while
// loading or if the config call fails, so the UI never shows a blank fee.
export function usePlatformCommissionPercent(): number {
  const { data } = useAppConfig()
  return data?.data?.pricing?.platformCommissionPercent ?? 10
}
