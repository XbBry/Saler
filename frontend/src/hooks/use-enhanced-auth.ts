import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { authQueryApi } from '../lib/query-api';
import { queryKeys } from '../lib/query-keys';
import { 
  createMutation,
  createCreateMutation,
  createUpdateMutation,
  createDeleteMutation 
} from '../lib/mutation-helpers';
import { 
  LoginRequest, 
  RegisterRequest, 
  ApiResponse,
  TokenResponse 
} from '../types';

// ===============================================
// Enhanced Auth Hooks with React Query
// ===============================================

/**
 * Enhanced Auth Hook with React Query integration
 */
export const useEnhancedAuth = () => {
  const queryClient = useQueryClient();

  // ==================== QUERIES ====================
  
  /**
   * Get current user with caching
   */
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: queryKeys.user.me(),
    queryFn: authQueryApi.getCurrentUser,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: (failureCount, error) => {
      // Don't retry on 401 if no refresh token
      if (error?.response?.status === 401) {
        return !!(error.response.data?.refreshable);
      }
      return failureCount < 3;
    },
  });

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = !!user?.id;

  // ==================== MUTATIONS ====================

  /**
   * Login mutation with optimistic updates
   */
  const loginMutation = useMutation({
    mutationFn: authQueryApi.login,
    onMutate: async (credentials) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.user.me() });
      
      // Snapshot previous value
      const previousUser = queryClient.getQueryData(queryKeys.user.me());
      
      // Optimistically set user as null (loading state)
      queryClient.setQueryData(queryKeys.user.me(), null);
      
      return { previousUser };
    },
    onSuccess: (data) => {
      // Set user data
      queryClient.setQueryData(queryKeys.user.me(), data.user);
      
      // Clear all other queries to refresh with new auth
      queryClient.clear();
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.user.me(), context.previousUser);
      }
    },
    onSettled: () => {
      // Always refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
    },
    retry: 1,
  });

  /**
   * Register mutation
   */
  const registerMutation = useMutation({
    mutationFn: authQueryApi.register,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user.me(), data.user);
      queryClient.clear();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
    },
    retry: 1,
  });

  /**
   * Logout mutation
   */
  const logoutMutation = useMutation({
    mutationFn: authQueryApi.logout,
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    },
  });

  /**
   * Refresh token mutation (automatic)
   */
  const refreshTokenMutation = useMutation({
    mutationFn: ({ refresh_token }: { refresh_token: string }) => 
      authQueryApi.refreshToken({ refresh_token }),
    onSuccess: (data) => {
      // Update stored tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
      }
    },
    retry: 1,
  });

  // ==================== ACTION FUNCTIONS ====================

  const login = useCallback(async (credentials: LoginRequest) => {
    return await loginMutation.mutateAsync(credentials);
  }, [loginMutation]);

  const register = useCallback(async (data: RegisterRequest) => {
    return await registerMutation.mutateAsync(data);
  }, [registerMutation]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      // Even if logout fails on server, clear local state
      queryClient.clear();
      throw error;
    }
  }, [logoutMutation, queryClient]);

  const refreshToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      return await refreshTokenMutation.mutateAsync({ refresh_token: refreshToken });
    }
    throw new Error('No refresh token available');
  }, [refreshTokenMutation]);

  const updateProfile = useCallback(async (userData: Partial<TokenResponse['user']>) => {
    const response = await authQueryApi.updateProfile(userData);
    
    // Update cache
    queryClient.setQueryData(queryKeys.user.me(), (old: any) => 
      old ? { ...old, ...response } : response
    );
    
    return response;
  }, [queryClient]);

  // ==================== COMPUTED VALUES ====================

  const userRole = user?.role || 'user';
  const userName = user?.name || 'مستخدم';
  const currentWorkspace = user?.current_workspace;
  const workspaces = user?.workspaces || [];

  // ==================== PERMISSION HELPERS ====================

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    const rolePermissions: Record<string, string[]> = {
      admin: ['*'], // Admin has all permissions
      manager: [
        'manage_users',
        'manage_workspaces',
        'view_analytics',
        'manage_leads',
        'manage_messages',
      ],
      user: [
        'view_leads',
        'update_own_profile',
        'view_own_messages',
      ],
    };

    const userPermissions = rolePermissions[userRole] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }, [user, userRole]);

  const canAccessWorkspace = useCallback((workspaceId: string): boolean => {
    if (!user) return false;
    
    // Admin can access all workspaces
    if (userRole === 'admin') return true;
    
    // Check if user belongs to workspace
    return user.workspace_id === workspaceId;
  }, [user, userRole]);

  // ==================== HOOK RETURNS ====================

  return {
    // State
    user,
    isAuthenticated,
    isLoadingUser,
    userError,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isRefreshingToken: refreshTokenMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    logoutError: logoutMutation.error,

    // Actions
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    refetchUser,

    // Computed values
    userRole,
    userName,
    currentWorkspace,
    workspaces,

    // Permissions
    hasPermission,
    canAccessWorkspace,
  };
};

// ===============================================
// Auth Guard Hook
// ===============================================

/**
 * Hook for protecting routes and managing auth guards
 */
export const useAuthGuard = (options?: {
  requireAuth?: boolean;
  requiredPermissions?: string[];
  allowedRoles?: string[];
  redirectTo?: string;
}) => {
  const { requireAuth = true, requiredPermissions = [], allowedRoles = [], redirectTo = '/login' } = options || {};
  
  const {
    user,
    isAuthenticated,
    isLoadingUser,
    hasPermission,
    canAccessWorkspace,
  } = useEnhancedAuth();

  const requireAuthCheck = useCallback(() => {
    if (!isAuthenticated && requireAuth) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
      return false;
    }
    return true;
  }, [isAuthenticated, requireAuth, redirectTo]);

  const requirePermissionCheck = useCallback((permission: string) => {
    if (!requireAuthCheck()) return false;
    
    if (!hasPermission(permission)) {
      return false;
    }
    return true;
  }, [requireAuthCheck, hasPermission]);

  const requireRoleCheck = useCallback((roles: string[]) => {
    if (!requireAuthCheck()) return false;
    
    if (!roles.includes(user?.role || '')) {
      return false;
    }
    return true;
  }, [requireAuthCheck, user?.role]);

  // Check permissions
  const hasAllRequiredPermissions = useCallback(() => {
    return requiredPermissions.every(permission => hasPermission(permission));
  }, [requiredPermissions, hasPermission]);

  const hasAnyRequiredPermission = useCallback(() => {
    return requiredPermissions.some(permission => hasPermission(permission));
  }, [requiredPermissions, hasPermission]);

  const isLoading = isLoadingUser;

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    
    // Checks
    requireAuthCheck,
    requirePermissionCheck,
    requireRoleCheck,
    hasAllRequiredPermissions,
    hasAnyRequiredPermission,
    canAccessWorkspace,
    
    // Utils
    canAccess: (workspaceId: string) => canAccessWorkspace(workspaceId),
    hasRole: (role: string) => user?.role === role,
    hasAnyRole: (roles: string[]) => roles.includes(user?.role || ''),
  };
};

// ===============================================
// Token Management Hook
// ===============================================

/**
 * Hook for managing tokens and auto-refresh
 */
export const useTokenManager = () => {
  const { refreshToken } = useEnhancedAuth();
  const queryClient = useQueryClient();

  const isTokenValid = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now();
      return now < payload.exp * 1000;
    } catch {
      return false;
    }
  }, []);

  const shouldRefreshToken = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now();
      const expiresAt = payload.exp * 1000;
      const refreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry
      
      return now > (expiresAt - refreshThreshold);
    } catch {
      return true;
    }
  }, []);

  const forceRefreshToken = useCallback(async () => {
    try {
      await refreshToken();
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, [refreshToken]);

  const autoRefreshToken = useCallback(() => {
    if (typeof window === 'undefined') return;

    const interval = setInterval(() => {
      if (shouldRefreshToken()) {
        forceRefreshToken();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [shouldRefreshToken, forceRefreshToken]);

  return {
    isTokenValid,
    shouldRefreshToken,
    forceRefreshToken,
    autoRefreshToken,
  };
};

// ===============================================
// Workspace Management Hook
// ===============================================

/**
 * Hook for managing workspaces
 */
export const useWorkspace = () => {
  const { user, workspaces, currentWorkspace } = useEnhancedAuth();
  const queryClient = useQueryClient();

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    try {
      const response = await authQueryApi.switchWorkspace(workspaceId);
      
      // Update user data in cache
      queryClient.setQueryData(queryKeys.user.me(), (old: any) => 
        old ? { ...old, current_workspace: response.workspace } : response
      );
      
      // Refetch all queries with new workspace context
      queryClient.invalidateQueries();
      
      return response;
    } catch (error) {
      console.error('Failed to switch workspace:', error);
      throw error;
    }
  }, [queryClient]);

  const createWorkspace = useCallback(async (data: {
    name: string;
    slug: string;
    description?: string;
  }) => {
    try {
      const response = await authQueryApi.createWorkspace(data);
      
      // Update workspaces list
      queryClient.setQueryData(queryKeys.user.workspaces(), (old: any[] = []) => 
        [...old, response]
      );
      
      return response;
    } catch (error) {
      console.error('Failed to create workspace:', error);
      throw error;
    }
  }, [queryClient]);

  return {
    currentWorkspace,
    workspaces,
    switchWorkspace,
    createWorkspace,
    hasMultipleWorkspaces: workspaces?.length > 1,
  };
};

// ===============================================
// Export all hooks
// ===============================================

export default useEnhancedAuth;
