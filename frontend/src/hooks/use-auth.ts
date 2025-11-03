import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { hasPermission, canAccessWorkspace } from '../lib/auth-helpers';
import toast from 'react-hot-toast';

// ===============================================
// Main Auth Hook
// ===============================================

export const useAuth = () => {
  const store = useAuthStore();
  
  // Combine store methods with additional functionality
  const auth = {
    // State
    ...store,
    
    // Computed properties
    isAuthenticated: store.isAuthenticated && !!store.user,
    userName: store.user?.name || 'مستخدم',
    userRole: store.user?.role || 'user',
    currentWorkspaceName: store.currentWorkspace?.name || '',
    
    // Permission checks
    hasPermission: (permission: string) => hasPermission(store.user, permission),
    canAccessWorkspace: (workspaceId: string) => canAccessWorkspace(store.user, workspaceId),
    
    // Convenience methods
    login: store.login,
    logout: store.logout,
    register: store.register,
    refreshToken: store.refreshToken,
    checkAuthStatus: store.checkAuthStatus,
    switchWorkspace: store.switchWorkspace,
    fetchWorkspaces: store.fetchWorkspaces,
    createWorkspace: store.createWorkspace,
    updateUser: store.updateUser,
  };
  
  return auth;
};

// ===============================================
// Permission Hook
// ===============================================

export const usePermissions = () => {
  const { user } = useAuthStore();
  
  const hasPermission = useCallback((permission: string): boolean => {
    return hasPermission(user, permission);
  }, [user]);
  
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(user, permission));
  }, [user]);
  
  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(user, permission));
  }, [user]);
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    userRole: user?.role || 'user',
  };
};

// ===============================================
// Auth Guard Hook
// ===============================================

export const useAuthGuard = () => {
  const { isAuthenticated, user, checkAuthStatus, isLoading } = useAuthStore();
  
  useEffect(() => {
    // Check auth status on mount if not authenticated
    if (!isAuthenticated) {
      checkAuthStatus();
    }
  }, [checkAuthStatus, isAuthenticated]);
  
  const requireAuth = useCallback(() => {
    if (!isAuthenticated || !user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return false;
    }
    return true;
  }, [isAuthenticated, user]);
  
  const requirePermission = useCallback((permission: string) => {
    if (!requireAuth()) return false;
    
    if (!hasPermission(user, permission)) {
      toast.error('ليس لديك صلاحية للوصول إلى هذا المورد');
      return false;
    }
    
    return true;
  }, [user, requireAuth]);
  
  const requireRole = useCallback((allowedRoles: string[]) => {
    if (!requireAuth()) return false;
    
    if (!allowedRoles.includes(user?.role || '')) {
      toast.error('ليس لديك صلاحية للوصول إلى هذه الصفحة');
      return false;
    }
    
    return true;
  }, [user, requireAuth]);
  
  return {
    isAuthenticated,
    isLoading,
    user,
    requireAuth,
    requirePermission,
    requireRole,
  };
};

// ===============================================
// Workspace Hook
// ===============================================

export const useWorkspace = () => {
  const { 
    currentWorkspace, 
    workspaces, 
    switchWorkspace, 
    fetchWorkspaces, 
    createWorkspace 
  } = useAuthStore();
  
  const switchToWorkspace = useCallback(async (workspaceId: string) => {
    try {
      await switchWorkspace(workspaceId);
      toast.success('تم التبديل لمساحة العمل بنجاح');
    } catch (error) {
      console.error('Failed to switch workspace:', error);
    }
  }, [switchWorkspace]);
  
  const createNewWorkspace = useCallback(async (data: {
    name: string;
    slug: string;
    description?: string;
  }) => {
    try {
      await createWorkspace(data);
      toast.success('تم إنشاء مساحة العمل بنجاح');
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  }, [createWorkspace]);
  
  return {
    currentWorkspace,
    workspaces,
    switchToWorkspace,
    fetchWorkspaces,
    createNewWorkspace,
  };
};

// ===============================================
// Token Hook
// ===============================================

export const useToken = () => {
  const { tokens, refreshToken } = useAuthStore();
  
  const isTokenValid = useCallback(() => {
    if (!tokens) return false;
    
    const now = Date.now();
    const expiresAt = tokens.expires_in * 1000;
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    
    return now < (expiresAt - bufferTime);
  }, [tokens]);
  
  const shouldRefreshToken = useCallback(() => {
    if (!tokens) return false;
    
    const now = Date.now();
    const expiresAt = tokens.expires_in * 1000;
    const refreshThreshold = 10 * 60 * 1000; // 10 minutes before expiry
    
    return now > (expiresAt - refreshThreshold);
  }, [tokens]);
  
  const getAccessToken = useCallback(() => {
    return tokens?.access_token || null;
  }, [tokens]);
  
  const forceRefreshToken = useCallback(async () => {
    try {
      await refreshToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  }, [refreshToken]);
  
  return {
    tokens,
    isTokenValid,
    shouldRefreshToken,
    getAccessToken,
    forceRefreshToken,
  };
};

// ===============================================
// Form State Hook
// ===============================================

export const useAuthForm = (type: 'login' | 'register') => {
  const { login, register, isLoading, error, clearError } = useAuthStore();
  
  const handleSubmit = useCallback(async (formData: any) => {
    clearError();
    
    try {
      if (type === 'login') {
        await login(formData);
      } else {
        await register(formData);
      }
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'حدث خطأ غير متوقع' 
      };
    }
  }, [login, register, type, clearError]);
  
  return {
    isLoading,
    error,
    handleSubmit,
    clearError,
  };
};

// ===============================================
// Auto-refresh Hook
// ===============================================

export const useAutoRefreshToken = () => {
  const { tokens, refreshToken } = useAuthStore();
  
  useEffect(() => {
    if (!tokens) return;
    
    const refreshInterval = setInterval(async () => {
      const now = Date.now();
      const expiresAt = tokens.expires_in * 1000;
      const refreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry
      
      if (now > (expiresAt - refreshThreshold)) {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Auto token refresh failed:', error);
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(refreshInterval);
  }, [tokens, refreshToken]);
};

// ===============================================
// Development Hook
// ===============================================

export const useAuthDebug = () => {
  const store = useAuthStore();
  
  const logState = useCallback(() => {
    console.log('Auth Store State:', {
      user: store.user,
      tokens: store.tokens,
      isAuthenticated: store.isAuthenticated,
      isLoading: store.isLoading,
      currentWorkspace: store.currentWorkspace,
      workspaces: store.workspaces,
    });
  }, [store]);
  
  const simulateError = useCallback(() => {
    store.setLoading(false);
    store.error = 'خطأ تجريبي';
  }, [store]);
  
  const clearAll = useCallback(() => {
    store.logout();
  }, [store]);
  
  return {
    state: store,
    logState,
    simulateError,
    clearAll,
  };
};