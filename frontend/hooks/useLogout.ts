import { useRouter } from "expo-router"
import { useAuthStore } from "@/stores/authStore"
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/apiClient"
import * as SecureStore from "expo-secure-store"

export function useLogout() {
  const router = useRouter()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const queryClient = useQueryClient()
  const token = useAuthStore((state) => state.accessToken)

  const logout = async () => {
    try {
      await apiClient.post("/api/auth/logout", {}, { token: token ?? undefined })
    } catch {
      // continue even if server call fails
    } finally {
      clearAuth()
      await SecureStore.deleteItemAsync("auth")
      queryClient.clear()
      router.replace("/login")
    }
  }

  return { logout }
}