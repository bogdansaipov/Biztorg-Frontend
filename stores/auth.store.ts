import { AuthState } from '@/types/authState/authState'
import {create} from 'zustand'

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  setAuth: ({ user }) => {;
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null });
  },
}));