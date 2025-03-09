import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      login: async (email: string, password: string) => {
        try {
          // TODO: Implement actual login logic with your backend
          const token = 'dummy-token'; // Replace with actual token from backend
          set({ isAuthenticated: true, token, user: { id: '1', email, name: 'User' } });
        } catch (error) {
          console.error('Login failed:', error);
          throw error;
        }
      },
      register: async (email: string, password: string, name: string) => {
        try {
          // TODO: Implement actual registration logic with your backend
          const token = 'dummy-token'; // Replace with actual token from backend
          set({ isAuthenticated: true, token, user: { id: '1', email, name } });
        } catch (error) {
          console.error('Registration failed:', error);
          throw error;
        }
      },
      logout: () => {
        set({ isAuthenticated: false, token: null, user: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
); 