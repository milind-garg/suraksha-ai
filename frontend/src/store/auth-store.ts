import { create } from 'zustand'

interface User {
  userId: string
  email: string
  name: string
  phone?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User, token: string) => void
  clearUser: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user, token) => {
    if (typeof window !== 'undefined') {
      // Use sessionStorage instead of localStorage to reduce XSS token-theft
      // risk: tokens are cleared when the browser tab/session ends.
      sessionStorage.setItem('auth_token', token)
      sessionStorage.setItem('auth_user', JSON.stringify(user))
    }
    set({ user, token, isAuthenticated: true })
  },

  clearUser: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_user')
    }
    set({ user: null, token: null, isAuthenticated: false })
  },

  setLoading: (loading) => set({ isLoading: loading })
}))
