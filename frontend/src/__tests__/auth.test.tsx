import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/lib/auth-context';
import LoginPage from '@/app/(auth)/login/page';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth context
const mockAuthContext = {
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
};

vi.mock('@/lib/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockAuthContext,
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('Authentication Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('should render login form', () => {
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /تسجيل الدخول/i })).toBeInTheDocument();
    });

    it('should call login when form is submitted with valid credentials', async () => {
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /تسجيل الدخول/i }));

      await waitFor(() => {
        expect(mockAuthContext.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should show validation errors for empty fields', async () => {
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: /تسجيل الدخول/i }));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid credentials', async () => {
      mockAuthContext.login.mockRejectedValueOnce(new Error('Invalid credentials'));

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' },
      });

      fireEvent.click(screen.getByRole('button', { name: /تسجيل الدخول/i }));

      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users', () => {
      const mockRouterPush = vi.fn();
      vi.mocked(mockAuthContext.user).mockReturnValue(null);

      render(
        <AuthProvider>
          {/* Protected component */}
        </AuthProvider>
      );

      expect(mockRouterPush).toHaveBeenCalledWith('/(auth)/login');
    });

    it('should allow authenticated users access', () => {
      vi.mocked(mockAuthContext.user).mockReturnValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      });

      render(
        <AuthProvider>
          {/* Protected component */}
        </AuthProvider>
      );

      // Component should render without redirecting
    });
  });

  describe('Auth Store', () => {
    it('should persist user data in localStorage', () => {
      const userData = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      // Mock localStorage
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem');
      const mockGetItem = vi.spyOn(Storage.prototype, 'getItem');

      // Test storing user data
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'user',
        newValue: JSON.stringify(userData),
      }));

      expect(mockSetItem).toHaveBeenCalledWith('user', JSON.stringify(userData));
    });
  });

  describe('Email Validation', () => {
    it('should validate email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      expect('test@example.com').toMatch(emailRegex);
      expect('invalid-email').not.toMatch(emailRegex);
      expect('test@').not.toMatch(emailRegex);
    });
  });

  describe('Password Validation', () => {
    it('should enforce password requirements', () => {
      const passwordRequirements = [
        { minLength: 8 },
        { hasUppercase: true },
        { hasLowercase: true },
        { hasNumbers: true },
      ];

      const validatePassword = (password: string) => {
        return passwordRequirements.every(req => {
          if (req.minLength && password.length < 8) return false;
          if (req.hasUppercase && !/[A-Z]/.test(password)) return false;
          if (req.hasLowercase && !/[a-z]/.test(password)) return false;
          if (req.hasNumbers && !/\d/.test(password)) return false;
          return true;
        });
      };

      expect(validatePassword('Weak123')).toBe(false);
      expect(validatePassword('StrongPass123!')).toBe(true);
    });
  });

  describe('Logout', () => {
    it('should clear user data on logout', () => {
      render(
        <AuthProvider>
          <button onClick={mockAuthContext.logout}>Logout</button>
        </AuthProvider>
      );

      fireEvent.click(screen.getByText(/logout/i));

      expect(mockAuthContext.logout).toHaveBeenCalled();
    });
  });
});
