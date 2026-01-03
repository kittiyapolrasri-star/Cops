import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { api } from '../api';

interface User {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    rank?: string;
    role: 'PATROL' | 'STATION' | 'PROVINCE' | 'BUREAU' | 'HQ';
    station?: {
        id: string;
        name: string;
        province?: {
            id: string;
            name: string;
            bureau?: {
                id: string;
                name: string;
            };
        };
    };
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    checkAuth: () => void;
    setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (username: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/login', { username, password });
                    const { user, accessToken } = response.data;

                    Cookies.set('token', accessToken, { expires: 7 });
                    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

                    set({
                        user,
                        token: accessToken,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                    return true;
                } catch (error: any) {
                    set({
                        error: error.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ',
                        isLoading: false,
                    });
                    return false;
                }
            },

            logout: () => {
                Cookies.remove('token');
                delete api.defaults.headers.common['Authorization'];
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                });
            },

            checkAuth: () => {
                const token = Cookies.get('token');
                if (token) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    set({ token, isAuthenticated: true });
                }
            },

            setUser: (user: User) => {
                set({ user });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
