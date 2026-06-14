import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { API_URL } from '../config/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  theme: 'light' | 'dark';
  login: (access_token: string, user: User) => void;
  logout: () => void;
  toggleTheme: () => void;
  updateCurrentUser: (user: User) => void;
}

const cleanAlternativeTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('jwt');
  localStorage.removeItem('authToken');
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const theme = 'light';

  // Track whether login() was called directly (we already have user+token from the API response).
  // When true, /api/auth/me failure must NOT clear auth state — the user is already authenticated.
  const loginCalledRef = useRef<boolean>(false);

  useEffect(() => {
    cleanAlternativeTokens();

    const handleUnauthorized = () => {
      console.warn("[AuthContext] Received auth-unauthorized event. Logging out.");
      logout();
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    // Force light theme
    const root = window.document.documentElement;
    root.classList.remove('dark');
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, [theme]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      // If login() was just called, we already have the user object.
      // Fire /api/auth/me in the background but NEVER clear auth state on failure.
      const wasDirectLogin = loginCalledRef.current;
      if (wasDirectLogin) {
        loginCalledRef.current = false; // Reset for future token changes
        console.log("[DEBUG] login() was called directly — skipping blocking /api/auth/me");
        setIsLoading(false);

        // Background refresh: update user data if /api/auth/me succeeds, warn if it fails
        try {
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const userData = await res.json();
            console.log("[DEBUG] Background auth/me refresh succeeded:", userData);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            console.warn("[WARN] Background /api/auth/me failed (status:", res.status, ") — keeping user on dashboard");
          }
        } catch (err: any) {
          console.warn("[WARN] Background /api/auth/me network error — keeping user on dashboard:", err.message);
        }
        return;
      }

      // Normal flow: page reload with a saved token — verify it's still valid
      try {
        console.log("[DEBUG] Fetching /api/auth/me with access_token:", token);
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log("[DEBUG] auth/me response status:", res.status);
        
        if (res.ok) {
          const userData = await res.json();
          console.log("[DEBUG] auth/me response body:", userData);
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          console.error("[DEBUG] /api/auth/me check failed. Clearing auth state.");
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      } catch (err: any) {
        console.error('[DEBUG] Failed to load user via auth/me:', err);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = (newAccessToken: string, newUser: User) => {
    console.log("[DEBUG] login() called. Token:", newAccessToken, "User:", newUser);
    console.log("[DEBUG] Storing token to localStorage...");
    cleanAlternativeTokens();
    localStorage.setItem('access_token', newAccessToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    console.log("[DEBUG] Token stored successfully. Setting auth state...");
    
    // Mark that login was called directly so the useEffect doesn't clear state
    loginCalledRef.current = true;
    
    setUser(newUser);
    setToken(newAccessToken);
    setIsLoading(false);
    console.log("[DEBUG] Auth state set. isAuthenticated will be true. Navigation can proceed.");
  };

  const logout = () => {
    console.log("[DEBUG] Logging out");
    cleanAlternativeTokens();
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  const toggleTheme = () => {
    // Lock to light mode
  };

  const updateCurrentUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        theme,
        login,
        logout,
        toggleTheme,
        updateCurrentUser
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
