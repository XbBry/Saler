'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '../ui/Card';

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  className?: string;
  formatValue?: (value: number | string) => string;
  showTrend?: boolean;
  changeLabel?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  trend = 'neutral',
  loading = false,
  className = '',
  formatValue,
  showTrend = true,
  changeLabel = 'مقارنة بالفترة السابقة',
}) => {
  const formatNumber = (num: number | string) => {
    if (formatValue) return formatValue(num);
    
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    
    if (isNaN(numValue)) return num.toString();
    
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(1)}م`;
    }
    if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(1)}ك`;
    }
    
    // Format Arabic numbers
    return numValue.toLocaleString('ar-SA');
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') {
      return <ArrowUpRight className="h-4 w-4" />;
    } else if (trend === 'down') {
      return <ArrowDownRight className="h-4 w-4" />;
    }
    return null;
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-10 w-10 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 hover:shadow-lg transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1 text-right">
            {title}
          </p>
          <div className="flex items-center space-x-2 space-x-reverse">
            <h3 className="text-2xl font-bold text-gray-900 text-right">
              {formatNumber(value)}
            </h3>
            {showTrend && change !== undefined && (
              <div className={`flex items-center ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-sm font-medium">
                  {Math.abs(change)}%
                </span>
              </div>
            )}
          </div>
          {showTrend && change !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              {changeLabel}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-blue-600">
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};