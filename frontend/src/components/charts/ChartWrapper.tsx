import React from 'react';
import { 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  CartesianGrid
} from 'recharts';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  height?: number;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  labelFormatter?: (label: string) => string;
  formatter?: (value: any, name: string) => [string, string];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  labelFormatter,
  formatter
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          {labelFormatter ? labelFormatter(label || '') : label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>{' '}
            {formatter ? formatter(entry.value, entry.name)[0] : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomLegend: React.FC<{ payload?: any[] }> = ({ payload }) => {
  if (!payload) return null;
  
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const CustomCartesianGrid: React.FC<{ 
  stroke?: string;
  strokeDasharray?: string;
  strokeWidth?: number;
}> = ({ stroke, strokeDasharray, strokeWidth }) => (
  <CartesianGrid 
    stroke={stroke || '#e5e7eb'}
    strokeDasharray={strokeDasharray || '3 3'}
    strokeWidth={strokeWidth || 1}
  />
);

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  children,
  title,
  description,
  loading = false,
  error = null,
  height = 300,
  className,
  showLegend = true,
  showGrid = true
}) => {
  const isDark = typeof window !== 'undefined' && 
    document.documentElement.classList.contains('dark');

  const tooltipSettings = {
    contentStyle: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      borderRadius: '8px',
      color: isDark ? '#f9fafb' : '#111827',
    }
  };

  const legendSettings = {
    verticalAlign: 'bottom' as const,
    align: 'center' as const,
    wrapperStyle: {
      paddingTop: '20px',
      fontSize: '14px',
      color: isDark ? '#d1d5db' : '#6b7280'
    },
    iconType: 'circle' as const
  };

  if (loading) {
    return (
      <div className={cn(
        "w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6",
        className
      )}>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {description}
          </p>
        )}
        <div 
          className="flex items-center justify-center"
          style={{ height: `${height}px` }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6",
        className
      )}>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {description}
          </p>
        )}
        <div 
          className="flex flex-col items-center justify-center text-red-600"
          style={{ height: `${height}px` }}
        >
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="text-sm">حدث خطأ في تحميل البيانات</p>
          <p className="text-xs mt-1 text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6",
      className
    )}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <div className="relative">
          {children}
        </div>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartWrapper;
export type { ChartWrapperProps, CustomTooltipProps };