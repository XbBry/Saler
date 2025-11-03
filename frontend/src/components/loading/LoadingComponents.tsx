/**
 * Loading Components Library
 * مكتبة مكونات التحميل المتقدمة
 */

import React from 'react';

// Base loading component props
export interface BaseLoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  message?: string;
  className?: string;
}

// Loading spinner variants
export function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  className = '',
  ...props 
}: BaseLoadingProps & React.HTMLAttributes<HTMLDivElement>) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'border-t-blue-600',
    secondary: 'border-t-purple-600',
    white: 'border-t-white',
    gray: 'border-t-gray-400'
  };

  return (
    <div 
      className={`animate-spin rounded-full border-2 border-gray-200 ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      {...props}
    />
  );
}

// Pulsing dot loader
export function PulsingDots({ 
  size = 'md',
  color = 'primary',
  className = '',
  ...props 
}: BaseLoadingProps & React.HTMLAttributes<HTMLDivElement>) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5'
  };

  const colorClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-purple-600', 
    white: 'bg-white',
    gray: 'bg-gray-400'
  };

  return (
    <div className={`flex space-x-1 ${className}`} {...props}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
}

// Skeleton loader components
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-300 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-300 rounded w-1/2" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 bg-gray-300 rounded" />
          <div className="h-3 bg-gray-300 rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ 
  count = 3, 
  className = '' 
}: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center space-x-4 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="w-16 h-8 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ 
  rows = 5, 
  columns = 4,
  className = '' 
}: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-300 rounded w-3/4" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: columns }).map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeletonChart({ 
  height = 300,
  className = '' 
}: { height?: number; className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-gray-100 rounded-lg ${className}`}
      style={{ height }}
    >
      <div className="p-4">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6" />
        <div className="flex items-end justify-between h-40 space-x-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-300 rounded w-full"
              style={{
                height: `${Math.random() * 80 + 20}%`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Progress bar with animation
export function ProgressBar({ 
  progress = 0,
  color = 'primary',
  size = 'md',
  showText = true,
  animated = true,
  className = ''
}: {
  progress?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  animated?: boolean;
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-purple-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  };

  return (
    <div className={className}>
      {showText && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>التقدم</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div 
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

// Loading button
export function LoadingButton({
  isLoading = false,
  children,
  variant = 'primary',
  size = 'md',
  disabled,
  className = '',
  loadingText = 'جاري التحميل...',
  ...props
}: {
  isLoading?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  loadingText?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center font-medium rounded-md 
        transition-colors duration-200 focus:outline-none focus:ring-2 
        focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]} ${variantClasses[variant]} ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" color="white" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Page loading overlay
export function PageLoadingOverlay({ 
  message = 'جاري التحميل...',
  progress,
  className = ''
}: {
  message?: string;
  progress?: number;
  className?: string;
}) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        {progress !== undefined && (
          <ProgressBar 
            progress={progress} 
            size="lg" 
            className="mb-4 max-w-xs" 
          />
        )}
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

// Inline loading state
export function InlineLoading({ 
  size = 'md',
  message,
  className = ''
}: BaseLoadingProps & { className?: string }) {
  return (
    <div className={`flex items-center justify-center space-x-2 text-gray-500 ${className}`}>
      <LoadingSpinner size={size} />
      {message && <span className="text-sm">{message}</span>}
    </div>
  );
}

// Lazy loading placeholder
export function LazyLoadingPlaceholder({ 
  height = 200,
  className = '' 
}: { 
  height?: number; 
  className?: string;
}) {
  return (
    <div 
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 ${className}`}
      style={{ 
        height,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite'
      }}
    >
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

// Loading state for forms
export function FormLoadingOverlay({ 
  message = 'جاري الحفظ...',
  className = ''
}: { 
  message?: string; 
  className?: string;
}) {
  return (
    <div className={`absolute inset-0 z-10 flex items-center justify-center bg-white/75 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-4 flex items-center space-x-3">
        <LoadingSpinner size="md" />
        <span className="text-gray-700 font-medium">{message}</span>
      </div>
    </div>
  );
}

// Export all components
export default {
  LoadingSpinner,
  PulsingDots,
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  SkeletonChart,
  ProgressBar,
  LoadingButton,
  PageLoadingOverlay,
  InlineLoading,
  LazyLoadingPlaceholder,
  FormLoadingOverlay
};