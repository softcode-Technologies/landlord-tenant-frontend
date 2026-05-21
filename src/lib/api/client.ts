import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios"
import { useAuthStore } from "@/lib/store/auth"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

// Send a dead session to the login page so the user isn't stranded on a
// broken protected page (the old behaviour required clearing cookies by hand).
// Guarded against loops and runs client-side only.
function redirectToLogin() {
  if (typeof window === "undefined") return
  const { pathname, search } = window.location
  if (pathname.startsWith("/login")) return
  const redirect = encodeURIComponent(pathname + search)
  window.location.href = `/login?redirect=${redirect}`
}

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(token!)
    }
  })
  failedQueue = []
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor — inject token
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — unwrap backend envelope + handle 401
// Backend always returns { success, message, data, pagination? }
// This unwraps it so callers get the payload directly.
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body === "object" && body.success === true) {
      if ("pagination" in body) {
        response.data = { data: body.data, pagination: body.pagination }
      } else {
        response.data = body.data
      }
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const { refreshToken, setAccessToken, logout } = useAuthStore.getState()

      if (!refreshToken) {
        logout()
        redirectToLogin()
        isRefreshing = false
        return Promise.reject(error)
      }

      try {
        // Raw axios call bypasses the apiClient interceptors intentionally.
        // Backend wraps refresh response in { success, message, data }, so unwrap manually.
        const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        const payload = response.data?.data ?? response.data
        const newToken: string = payload.accessToken
        setAccessToken(newToken)
        processQueue(null, newToken)
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        logout()
        redirectToLogin()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
