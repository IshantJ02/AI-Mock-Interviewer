import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface User {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    stats: {
        totalInterviews: number;
        averageScore: number;
        totalQuestionsAnswered: number;
        streak: number;
    };
    skillMap: Record<string, number>;
    weakTopics: string[];
}

interface AuthStore {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    fetchMe: () => Promise<void>;
    updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            isLoading: false,
            isAuthenticated: false,

            login: async (email, password) => {
                set({ isLoading: true });
                try {
                    const { data } = await api.post('/auth/login', { email, password });
                    const { user, accessToken } = data.data;
                    localStorage.setItem('accessToken', accessToken);
                    set({ user, accessToken, isAuthenticated: true, isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            register: async (name, email, password) => {
                set({ isLoading: true });
                try {
                    const { data } = await api.post('/auth/register', { name, email, password });
                    const { user, accessToken } = data.data;
                    localStorage.setItem('accessToken', accessToken);
                    set({ user, accessToken, isAuthenticated: true, isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: async () => {
                try {
                    await api.post('/auth/logout');
                } finally {
                    localStorage.removeItem('accessToken');
                    set({ user: null, accessToken: null, isAuthenticated: false });
                }
            },

            fetchMe: async () => {
                try {
                    const { data } = await api.get('/auth/me');
                    set({ user: data.data.user, isAuthenticated: true });
                } catch {
                    set({ user: null, accessToken: null, isAuthenticated: false });
                }
            },

            updateUser: (userData) => {
                const current = get().user;
                if (current) set({ user: { ...current, ...userData } });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ accessToken: state.accessToken, user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
