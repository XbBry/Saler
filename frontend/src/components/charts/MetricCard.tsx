import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  
  // Trend analysis
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  trendLabel?: string;
  
  // Visual
  icon?: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  textColor?: string;
  
  // States
  loading?: boolean;
  error?: string | null;
  
  // Actions
  onClick?: () => void;
  onTrendClick?: () => void;
  
  // Formatting
  valueFormatter?: (value: string | number) => string;
  trendFormatter?: (value: number) => string;
  precision?: number;
  
  // Styling
  className?: string;
  variant?: 'default' | 'gradient' | 'outline' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
}

const iconColorMap = {
  blue: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20',
  green: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
  red: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
  amber: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20',
  purple: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20',
  pink: 'text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900/20',
  gray: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20',
  indigo: 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/20',
};

const bgColorMap = {
  blue: 'bg-blue-50 dark:bg-blue-950/20',
  green: 'bg-green-50 dark:bg-green-950/20',
  red: 'bg-red-50 dark:bg-red-950/20',
  amber: 'bg-amber-50 dark:bg-amber-950/20',
  purple: 'bg-purple-50 dark:bg-purple-950/20',
  pink: 'bg-pink-50 dark:bg-pink-950/20',
  gray: 'bg-gray-50 dark:bg-gray-950/20',
  indigo: 'bg-indigo-50 dark:bg-indigo-950/20',
};

const variantMap = {
  default: 'border border-gray-200 dark:border-gray-700',
  gradient: 'border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
  outline: 'border-2 border-dashed border-gray-300 dark:border-gray-600 bg-transparent',
  minimal: 'border-0 bg-transparent',
};

const sizeMap = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  
  trend,
  trendValue,
  trendLabel,
  
  icon: Icon,
  iconColor = 'blue',
  bgColor,
  textColor,
  
  loading = false,
  error = null,
  
  onClick,
  onTrendClick,
  
  valueFormatter,
  trendFormatter,
  precision = 1,
  
  className,
  variant = 'default',
  size = 'md'
}) => {
  const formatValue = (val: string | number): string => {
    if (valueFormatter) return valueFormatter(val);
    
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(precision)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(precision)}K`;
      }
      if (val >= 1) {
        return val.toLocaleString('ar-EG', { 
          maximumFractionDigits: precision 
        });
      }
    }
    
    return val.toString();
  };

  const formatTrend = (val: number): string => {
    if (trendFormatter) return trendFormatter(val);
    
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(precision)}%`;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendBgColor = () => {
    switch (trend) {
      case 'up':
        return 'bg-green-100 dark:bg-green-900/20';
      case 'down':
        return 'bg-red-100 dark:bg-red-900/20';
      default:
        return 'bg-gray-100 dark:bg-gray-800/20';
    }
  };

  const containerClasses = cn(
    // Base styles
    'rounded-lg transition-all duration-200',
    variantMap[variant],
    sizeMap[size],
    
    // Hover effects
    onClick && 'hover:shadow-md cursor-pointer',
    
    // Dark mode
    'bg-white dark:bg-gray-800',
    
    className
  );

  const iconBgClass = bgColor ? bgColor : iconColorMap[iconColor as keyof typeof iconColorMap] || iconColorMap.blue;
  const defaultTextColor = textColor || 'text-gray-900 dark:text-gray-100';

  if (loading) {
    return (
      <div className={containerClasses}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
            <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center justify-between">
          <div className="text-red-500 text-sm">{error}</div>
          <div className="h-8 w-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses} onClick={onClick}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h3>
        {Icon && (
          <div className={cn(
            'h-8 w-8 rounded-full flex items-center justify-center',
            iconBgClass
          )}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <p className={cn('text-2xl font-bold', defaultTextColor)}>
          {formatValue(value)}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      
      {(trend || trendValue) && (
        <div 
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            getTrendBgColor(),
            getTrendColor(),
            onTrendClick && 'cursor-pointer'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onTrendClick?.();
          }}
        >
          {getTrendIcon()}
          <span>
            {trendLabel ? trendLabel : formatTrend(trendValue || 0)}
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;