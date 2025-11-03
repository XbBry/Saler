// ===============================================
// API Client Types
// ===============================================

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  status: 'success' | 'error';
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  status_code: number;
}

// ===============================================
// Request/Response Types
// ===============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ===============================================
// Form Types
// ===============================================

export interface LoginForm {
  email: string;
  password: string;
  workspace_slug?: string;
  remember_me?: boolean;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  workspace_name?: string;
  workspace_slug?: string;
  terms_accepted?: boolean;
}

export interface ProfileUpdateForm {
  name?: string;
  email?: string;
  avatar?: File;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: 'ar' | 'en';
    notifications?: boolean;
  };
}

// ===============================================
// Validation Types
// ===============================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string | ValidationError[];
}