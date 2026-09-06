import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  userId: string;
  phone: string;
  role: string;
  name?: string;
  email?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;
  
  // Actions
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  updateUser: (userUpdates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoginModalOpen: false,

      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      openLoginModal: () => set({ isLoginModalOpen: true }),
      closeLoginModal: () => set({ isLoginModalOpen: false }),
      updateUser: (userUpdates) => set((state) => ({ user: state.user ? { ...state.user, ...userUpdates } : null })),
    }),
    {
      name: 'shibra-auth-storage',
      // We only want to persist token, user, and isAuthenticated
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
