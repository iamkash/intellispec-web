/**
 * Authentication Context Provider
 * 
 * Provides authentication state management and integration with the Shell framework.
 * Handles user authentication, token management, and role-based access control.
 */

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { getApiFullUrl } from '../config/api.config';
import { authLoggingService } from '../services/loggingClient';

// ==================== TYPES ====================

export interface User {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  roles: Role[];
  tenantSlug: string;
  isExternalCustomer: boolean;
  permissions: string[];
  token?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  isExternalCustomer: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string, tenantSlug?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (roleName: string) => boolean;
  clearError: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

// ==================== CONTEXT ====================

const AuthContext = createContext<AuthContextValue | null>(null);

// ==================== PROVIDER ====================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  /**
   * Initialize authentication state from stored token
   */
  const initializeAuth = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser);
        
        // Verify token is still valid
        const response = await fetch(getApiFullUrl('/api/auth/me'), {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setState({
            user: userData.user,
            token: storedToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to initialize authentication'
      });
    }
  }, []);

  /**
   * Login function
   */
  const login = useCallback(async (email: string, password: string, tenantSlug?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(getApiFullUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, tenantSlug }),
      });

      // Safely parse response (handles non-JSON like 431 HTML/text)
      const raw = await response.text();
      let data: any;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch (_) {
        data = {};
      }

      if (!response.ok) {
        const serverMsg = data?.error || data?.message || raw || '';
        const hint = response.status === 431 ? 'Request headers too large. Clear cookies for localhost:4000 and retry.' : '';
        throw new Error(serverMsg || hint || 'Login failed');
      }

      // Store token and user data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setState({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      // Log successful login
      await authLoggingService.logAuthEvent({
        tenantSlug: data.user.tenantSlug,
        userId: data.user.userId,
        email: data.user.email,
        action: 'login_success',
        ipAddress: 'unknown', // Would be set by middleware in real request
        userAgent: navigator.userAgent
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      // Log failed login
      await authLoggingService.logAuthEvent({
        tenantSlug: tenantSlug || 'unknown',
        userId: email,
        email,
        action: 'login_failure',
        ipAddress: 'unknown',
        userAgent: navigator.userAgent,
        metadata: {
          reason: errorMessage
        }
      });

      throw error;
    }
  }, []);

  /**
   * Logout function
   */
  const logout = useCallback(async () => {
    try {
      const currentUser = state.user;
      
      // Call logout endpoint
      if (state.token) {
        await fetch(getApiFullUrl('/api/auth/logout'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${state.token}`
          }
        });
      }

      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      // Update state
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });

      // Log logout
      if (currentUser) {
        await authLoggingService.logAuthEvent({
          tenantSlug: currentUser.tenantSlug,
          userId: currentUser.userId,
          email: currentUser.email,
          action: 'logout',
          ipAddress: 'unknown',
          userAgent: navigator.userAgent
        });
      }

    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  }, [state.user, state.token]);

  /**
   * Refresh token function
   */
  const refreshToken = useCallback(async () => {
    try {
      if (!state.token) {
        throw new Error('No token to refresh');
      }

      const response = await fetch(getApiFullUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token refresh failed');
      }

      // Update stored token
      localStorage.setItem('authToken', data.token);

      setState(prev => ({
        ...prev,
        token: data.token
      }));

    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      await logout();
    }
  }, [state.token, logout]);

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!state.user) return false;
    
    return state.user.permissions.includes('*') || 
           state.user.permissions.includes(permission) ||
           state.user.permissions.some(p => {
             // Support wildcard permissions like "user.*"
             if (p.includes('*')) {
               const pattern = p.replace('*', '.*');
               return new RegExp(`^${pattern}$`).test(permission);
             }
             return false;
           });
  }, [state.user]);

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((roleName: string): boolean => {
    if (!state.user) return false;
    return state.user.roles.some(role => role.name === roleName);
  }, [state.user]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      if (!state.token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(getApiFullUrl('/api/auth/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Profile update failed');
      }

      // Update local state and storage
      const updatedUser = { ...state.user, ...data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setState(prev => ({
        ...prev,
        user: updatedUser
      }));

    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }, [state.token, state.user]);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Set up token refresh interval
  useEffect(() => {
    if (state.isAuthenticated && state.token) {
      // Refresh token every 23 hours (before 24h expiry)
      const refreshInterval = setInterval(() => {
        refreshToken();
      }, 23 * 60 * 60 * 1000);

      return () => clearInterval(refreshInterval);
    }
  }, [state.isAuthenticated, state.token, refreshToken]);

  const contextValue: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshToken,
    hasPermission,
    hasAnyPermission,
    hasRole,
    clearError,
    updateProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ==================== HOOK ====================

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ==================== HOC FOR ROUTE PROTECTION ====================

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallback?: ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback = <div>Access Denied</div>
}: ProtectedRouteProps): ReactNode => {
  const { isAuthenticated, isLoading, hasPermission, hasRole, user } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to access this content</div>;
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every(permission => 
      hasPermission(permission)
    );
    if (!hasRequiredPermissions) {
      return fallback;
    }
  }

  // Check roles
  if (requiredRoles.length > 0) {
    const hasRequiredRoles = requiredRoles.some(role => hasRole(role));
    if (!hasRequiredRoles) {
      return fallback;
    }
  }

  // Check external customer restrictions
  if (user?.isExternalCustomer) {
    // Additional checks for external customers can be added here
    // For now, they have access to whatever they have permissions for
  }

  return <>{children}</>;
};

export default AuthContext;
