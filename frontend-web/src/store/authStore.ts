import { create } from 'zustand';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const res = await axios.post(`${API_BASE}/login`, { email, password });
      if (res.data.success) {
        const { user, token } = res.data.data;
        localStorage.setItem('ngalagu_token', token);
        localStorage.setItem('ngalagu_user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
        return true;
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Login failed');
    }
    return false;
  },

  register: async (name: string, email: string, password: string) => {
    try {
      const res = await axios.post(`${API_BASE}/register`, { name, email, password });
      if (res.data.success) {
        const { user, token } = res.data.data;
        localStorage.setItem('ngalagu_token', token);
        localStorage.setItem('ngalagu_user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
        return true;
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Registration failed');
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem('ngalagu_token');
    localStorage.removeItem('ngalagu_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('ngalagu_token');
    const userStr = localStorage.getItem('ngalagu_user');
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr), isAuthenticated: true });
    }
  },
}));
