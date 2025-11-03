import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';

// ===============================================
// TypeScript Interfaces
// ===============================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'user';
  workspace_id?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: 'ar' | 'en';
    notifications?: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  settings: {
    allow_user_registration?: boolean;
    require_email_verification?: boolean;
    max_users?: number;
  };
  members_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  workspace_slug?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  workspace_name?: string;
  workspace_slug?: string;
}

export interface AuthState {
  // State
  user: User | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  
  // Workspace actions
  switchWorkspace: (workspaceId: string) => Promise<void>;
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (data: { name: string; slug: string; description?: string }) => Promise<Workspace>;
  
  // Utility actions
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// ===============================================
// API Client
// ===============================================

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('auth-storage');
    let accessToken: string | null = null;
    
    if (token) {
      try {
        const parsed = JSON.parse(token);
        accessToken = parsed?.state?.tokens?.access_token || null;
      } catch (error) {
        console.error('Error parsing stored token:', error);
      }
    }

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (response.status === 401) {
        // Token expired - will be handled by refresh logic
        throw new Error('Token expired');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

const apiClient = new ApiClient();

// ===============================================
// Authentication Store
// ===============================================

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        user: null,
        currentWorkspace: null,
        workspaces: [],
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        isRefreshing: false,
        error: null,

        // ===============================================
        // Authentication Actions
        // ===============================================

        login: async (credentials: LoginCredentials) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiClient.post<{
              user: User;
              tokens: AuthTokens;
              workspace?: Workspace;
            }>('/auth/login', credentials);

            const { user, tokens, workspace } = response;

            // Set auth headers for subsequent requests
            if (tokens.access_token) {
              apiClient.request; // Trigger token update in local storage
            }

            set({
              user,
              tokens,
              isAuthenticated: true,
              currentWorkspace: workspace || null,
              isLoading: false,
              error: null,
            });

            toast.success(`مرحباً ${user.name}!`);
          } catch (error: any) {
            const errorMessage = error.message || 'فشل في تسجيل الدخول';
            set({
              isLoading: false,
              error: errorMessage,
              isAuthenticated: false,
              user: null,
              tokens: null,
            });
            toast.error(errorMessage);
            throw error;
          }
        },

        register: async (data: RegisterData) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiClient.post<{
              user: User;
              tokens: AuthTokens;
              workspace: Workspace;
            }>('/auth/register', data);

            const { user, tokens, workspace } = response;

            set({
              user,
              tokens,
              isAuthenticated: true,
              currentWorkspace: workspace,
              isLoading: false,
              error: null,
            });

            toast.success(`مرحباً ${user.name}! تم إنشاء حسابك بنجاح`);
          } catch (error: any) {
            const errorMessage = error.message || 'فشل في إنشاء الحساب';
            set({
              isLoading: false,
              error: errorMessage,
            });
            toast.error(errorMessage);
            throw error;
          }
        },

        logout: async () => {
          set({ isLoading: true });

          try {
            // Try to logout on server (optional)
            await apiClient.post('/auth/logout').catch(() => {
              // Ignore server logout errors - we'll clear local state anyway
            });
          } catch (error) {
            console.warn('Server logout failed:', error);
          }

          // Clear all state
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            currentWorkspace: null,
            workspaces: [],
            isLoading: false,
            error: null,
          });

          toast.success('تم تسجيل الخروج بنجاح');
        },

        refreshToken: async () => {
          const { tokens } = get();
          
          if (!tokens?.refresh_token) {
            set({ isAuthenticated: false, user: null, tokens: null });
            return;
          }

          set({ isRefreshing: true });

          try {
            const response = await apiClient.post<AuthTokens>('/auth/refresh', {
              refresh_token: tokens.refresh_token,
            });

            set({
              tokens: response,
              isRefreshing: false,
            });
          } catch (error) {
            console.error('Token refresh failed:', error);
            set({
              tokens: null,
              isAuthenticated: false,
              user: null,
              isRefreshing: false,
            });
            toast.error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
          }
        },

        checkAuthStatus: async () => {
          const { tokens, isAuthenticated } = get();
          
          if (!tokens) {
            return;
          }

          try {
            const response = await apiClient.get<{ user: User }>('/auth/me');
            
            set({
              user: response.user,
              isAuthenticated: true,
            });
          } catch (error) {
            console.error('Auth check failed:', error);
            // Try to refresh token
            await get().refreshToken();
          }
        },

        // ===============================================
        // Workspace Actions
        // ===============================================

        switchWorkspace: async (workspaceId: string) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiClient.post<{
              user: User;
              workspace: Workspace;
            }>(`/workspaces/${workspaceId}/switch`);

            set({
              user: response.user,
              currentWorkspace: response.workspace,
              isLoading: false,
            });

            toast.success(`تم التبديل إلى مساحة العمل: ${response.workspace.name}`);
          } catch (error: any) {
            const errorMessage = error.message || 'فشل في التبديل لمساحة العمل';
            set({
              isLoading: false,
              error: errorMessage,
            });
            toast.error(errorMessage);
            throw error;
          }
        },

        fetchWorkspaces: async () => {
          try {
            const response = await apiClient.get<{ workspaces: Workspace[] }>('/workspaces');
            
            set({ workspaces: response.workspaces });
          } catch (error: any) {
            console.error('Failed to fetch workspaces:', error);
            toast.error('فشل في جلب مساحات العمل');
          }
        },

        createWorkspace: async (data: { name: string; slug: string; description?: string }) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiClient.post<Workspace>('/workspaces', data);
            
            const workspaces = [...get().workspaces, response];
            set({
              workspaces,
              currentWorkspace: response,
              isLoading: false,
            });

            toast.success(`تم إنشاء مساحة العمل: ${response.name}`);
            return response;
          } catch (error: any) {
            const errorMessage = error.message || 'فشل في إنشاء مساحة العمل';
            set({
              isLoading: false,
              error: errorMessage,
            });
            toast.error(errorMessage);
            throw error;
          }
        },

        // ===============================================
        // Utility Actions
        // ===============================================

        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        clearError: () => {
          set({ error: null });
        },

        updateUser: (userData: Partial<User>) => {
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: { ...currentUser, ...userData },
            });
          }
        },
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          tokens: state.tokens,
          isAuthenticated: state.isAuthenticated,
          currentWorkspace: state.currentWorkspace,
          workspaces: state.workspaces,
        }),
        // Custom serialization to handle circular references
        onRehydrateStorage: () => (state) => {
          if (state?.tokens) {
            // Token will be validated on app startup
            const now = Date.now();
            const expiresIn = state.tokens.expires_in * 1000;
            
            // Check if token is expired
            if (now > expiresIn) {
              state.tokens = null;
              state.isAuthenticated = false;
              state.user = null;
            }
          }
        },
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// ===============================================
// Auto-refresh Token Logic
// ===============================================

// Auto-refresh token before expiration
let refreshTimeout: NodeJS.Timeout | null = null;

export const setupTokenRefresh = () => {
  const { tokens, refreshToken } = useAuthStore.getState();
  
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }

  if (tokens) {
    const now = Date.now();
    const expiresIn = tokens.expires_in * 1000;
    const timeUntilExpiry = expiresIn - now;
    
    // Refresh token 5 minutes before expiry
    const refreshTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 0);
    
    if (refreshTime > 0) {
      refreshTimeout = setTimeout(() => {
        refreshToken();
      }, refreshTime);
    }
  }
};

// ===============================================
// Auth Guards & Middleware
// ===============================================

// Check if user has permission
export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  
  const rolePermissions: Record<string, string[]> = {
    admin: ['*'], // Admin has all permissions
    manager: [
      'manage_users',
      'manage_workspaces', 
      'view_analytics',
      'manage_leads',
    ],
    user: [
      'view_leads',
      'update_own_profile',
    ],
  };

  const userPermissions = rolePermissions[user.role] || [];
  
  return userPermissions.includes('*') || userPermissions.includes(permission);
};

// Check if user can access workspace
export const canAccessWorkspace = (user: User | null, workspaceId: string): boolean => {
  if (!user) return false;
  
  // Admin can access all workspaces
  if (user.role === 'admin') return true;
  
  // Check if user belongs to workspace
  return user.workspace_id === workspaceId;
};

// ===============================================
// Initialize Store
// ===============================================

// Setup token refresh on store initialization
if (typeof window !== 'undefined') {
  useAuthStore.subscribe((state) => {
    if (state.tokens) {
      setupTokenRefresh();
    }
  });
}

// Export store hook for use in components
export const useAuth = () => useAuthStore();

// Default export for convenience
export default useAuthStore;