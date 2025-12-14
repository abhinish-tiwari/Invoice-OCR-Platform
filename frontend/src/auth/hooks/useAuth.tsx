import React, { useState, useEffect, useMemo, useCallback, useContext, ReactNode, createContext } from 'react';
import { AuthService } from '../services/auth.service';
import { Token } from '../../common/services/token.service';
import { User, RegisterData } from '../types/auth.types';

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Centralized user fetching logic
  const fetchAndSetUser = useCallback(async (): Promise<boolean> => {
    try {
      const response = await AuthService.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data as User);
        return true;
      }
      Token.remove();
      setUser(null);
      return false;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      Token.remove();
      setUser(null);
      return false;
    }
  }, []);

  // Check if user is authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = Token.get();
      if (token) {
        await fetchAndSetUser();
      }
      setIsLoading(false);
    };

    initAuth();
  }, [fetchAndSetUser]);

  const login = useCallback(async (email: string, password: string, rememberMe?: boolean): Promise<AuthResult> => {
    const result = await AuthService.login(email, password, rememberMe);

    if (result.success) {
      await fetchAndSetUser();
    }

    return result;
  }, [fetchAndSetUser]);

  const register = useCallback(async (data: RegisterData): Promise<AuthResult> => {
    const result = await AuthService.register(data);

    if (result.success) {
      await fetchAndSetUser();
    }

    return result;
  }, [fetchAndSetUser]);

  const logout = useCallback(async () => {
    await AuthService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const success = await fetchAndSetUser();
    if (!success) {
      setUser(null);
    }
  }, [fetchAndSetUser]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  }), [user, isLoading, login, register, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

