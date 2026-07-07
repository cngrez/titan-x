import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { secureStorage } from "@/lib/secureStorage"

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isHydrated: boolean
  setAuth: (user: User, accessToken: string) => void
  clearAuth: () => void
  setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrated: false,
      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),
      clearAuth: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)