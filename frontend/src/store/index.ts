// ===============================================
// Store Exports
// ===============================================

export { useAuthStore } from './authStore';
export { useAuth } from '../hooks/use-auth';
export { default } from './authStore';

// ===============================================
// Type Exports
// ===============================================

export type {
  User,
  Workspace,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  AuthState,
} from './authStore';

export type {
  ApiResponse,
  ApiError,
  PaginationParams,
  PaginatedResponse,
  LoginForm,
  RegisterForm,
  ProfileUpdateForm,
  ValidationError,
  FormErrors,
} from '../types/api';

// ===============================================
// Hook Exports
// ===============================================

export {
  useAuth,
  usePermissions,
  useAuthGuard,
  useWorkspace,
  useToken,
  useAuthForm,
  useAutoRefreshToken,
  useAuthDebug,
} from '../hooks/use-auth';

// ===============================================
// Utility Exports
// ===============================================

export {
  // Token helpers
  getTokenFromStorage,
  isTokenExpired,
  clearAuthStorage,
  
  // Permission helpers
  hasPermission,
  canAccessWorkspace,
  getUserPermissions,
  
  // Workspace helpers
  getWorkspaceDisplayName,
  getWorkspaceUrl,
  sortWorkspaces,
  
  // User helpers
  getUserDisplayName,
  getUserInitials,
  getUserAvatarUrl,
  formatUserRole,
  
  // Form helpers
  validateEmail,
  validatePassword,
  validateWorkspaceSlug,
  
  // Storage helpers
  saveToStorage,
  getFromStorage,
  removeFromStorage,
  
  // Utility helpers
  debounce,
  formatFileSize,
  generateId,
} from '../lib/auth-helpers';