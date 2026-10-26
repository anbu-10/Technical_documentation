import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, UserDetail } from '../api/client';

interface AuthContextType {
  user: UserDetail | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (fullName: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { full_name?: string; avatar_url?: string; theme?: string; preferred_provider?: string; notification_preferences?: any }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('techdoc_token'));
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const savedToken = localStorage.getItem('techdoc_token');
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const me = await api.getMe();
      setUser(me);
      setToken(savedToken);
      if (me.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn("Session invalid or expired:", e);
      localStorage.removeItem('techdoc_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password, remember_me: rememberMe });
      localStorage.setItem('techdoc_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      if (res.user.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string, confirmPassword: string) => {
    setLoading(true);
    try {
      const res = await api.register({
        full_name: fullName,
        email,
        password,
        confirm_password: confirmPassword,
      });
      localStorage.setItem('techdoc_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      localStorage.removeItem('techdoc_token');
      setUser(null);
      setToken(null);
    }
  };

  const updateProfile = async (data: { full_name?: string; avatar_url?: string; theme?: string; preferred_provider?: string; notification_preferences?: any }) => {
    const updated = await api.updateProfile(data);
    setUser(updated);
    if (updated.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
