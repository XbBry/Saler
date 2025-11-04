'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Plus,
  Download,
  MoreVertical,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Target,
  Users,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  FileText,
} from 'lucide-react';

// استيراد الـ Hook الجديد
import { useLeadsComplete, LeadsFilters } from '../../hooks/useLeads';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

// ==================== TYPES ====================

type ViewMode = 'grid' | 'list';
type FilterState = {
  search: string;
  status: string;
  stage: string;
  source: string;
  sortBy: 'created_at' | 'updated_at' | 'score' | 'value';
  sortOrder: 'asc' | 'desc';
};

interface LeadsStats {
  total: number;
  qualified: number;
  converted: number;
  pipelineValue: number;
  conversionRate: number;
}

// ==================== UTILITY FUNCTIONS ====================

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'contacted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'qualified': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'proposal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    case 'converted': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'new': return 'جديد';
    case 'contacted': return 'تم الاتصال';
    case 'qualified': return 'مؤهل';
    case 'proposal': return 'عرض سعر';
    case 'converted': return 'محول';
    default: return status;
  }
}

// ==================== COMPONENTS ====================

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-20" />
    ))}
  </div>
);

const ErrorMessage: React.FC<{ error: Error; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <span className="text-red-700 dark:text-red-400">{error.message}</span>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="text-red-600 border-red-300">
          إعادة المحاولة
        </Button>
      )}
    </div>
  </div>
);

const LeadCard: React.FC<{ lead: any; onEdit: () => void; onDelete: () => void }> = ({
  lead,
  onEdit,
  onDelete,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-lg">
            {lead.firstName?.charAt(0)}{lead.lastName?.charAt(0)}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {lead.firstName} {lead.lastName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{lead.company}</p>
          <p className="text-sm text-gray-500">{lead.position}</p>
        </div>
      </div>
      <div className="relative">
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <MoreVertical size={16} />
        </button>
        {/* Dropdown menu would go here */}
      </div>
    </div>

    <div className="flex items-center justify-between mb-4">
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
        {getStatusLabel(lead.status)}
      </span>
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <span>النقاط: {lead.score || 'غير محدد'}</span>
        <span>•</span>
        <span>{formatCurrency(lead.value || 0)}</span>
      </div>
    </div>

    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Calendar size={14} />
        <span>{formatDate(lead.createdAt)}</span>
      </div>
      <div className="flex items-center space-x-2">
        <Button size="sm" variant="outline">
          <Eye size={14} className="mr-1" />
          عرض
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Edit size={14} className="mr-1" />
          تعديل
        </Button>
      </div>
    </div>
  </motion.div>
);

// ==================== MAIN COMPONENT ====================

export default function LeadsPageUpdated() {
  // State management
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    stage: '',
    source: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // استخدام الـ Hook الجديد
  const {
    leads,
    pipelineStages,
    stats,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isExporting,
    error,
    createError,
    updateError,
    deleteError,
    createLead,
    updateLead,
    deleteLead,
    exportLeads,
    pagination,
    refetch,
  } = useLeadsComplete({
    search: filters.search || undefined,
    status: filters.status || undefined,
    stage: filters.stage || undefined,
    source: filters.source || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    page: 1,
    limit: 50,
  });

  // معالجة تغيير الفلتر
  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // معالجة إنشاء عميل محتمل جديد
  const handleCreateLead = useCallback(() => {
    // هنا يمكن إضافة modal لإنشاء عميل محتمل جديد
    const newLeadData = {
      firstName: 'عميل',
      lastName: 'جديد',
      email: 'new@example.com',
      company: 'شركة جديدة',
      status: 'new',
    };
    
    createLead(newLeadData);
  }, [createLead]);

  // معالجة تصدير البيانات
  const handleExport = useCallback(() => {
    exportLeads();
  }, [exportLeads]);

  // الميترس للـ KPI cards
  const kpiMetrics = useMemo(() => [
    {
      title: 'إجمالي العملاء المحتملين',
      value: stats?.total || 0,
      icon: Users,
      color: 'primary' as const,
    },
    {
      title: 'مؤهلين',
      value: stats?.qualified || 0,
      icon: Target,
      color: 'success' as const,
    },
    {
      title: 'محولين',
      value: stats?.converted || 0,
      icon: TrendingUp,
      color: 'success' as const,
    },
    {
      title: 'قيمة Pipeline',
      value: stats?.pipelineValue || 0,
      icon: DollarSign,
      color: 'primary' as const,
      format: 'currency' as const,
    },
  ], [stats]);

  // معالجة الخطأ
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorMessage error={error instanceof Error ? error : new Error('حدث خطأ غير متوقع')} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                العملاء المحتملين
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                إدارة ومتابعة العملاء المحتملين في pipeline
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button onClick={handleExport} variant="outline" size="sm" disabled={isExporting}>
                <Download size={16} className="mr-2" />
                {isExporting ? 'جاري التصدير...' : 'تصدير'}
              </Button>
              <Button onClick={handleCreateLead} disabled={isCreating}>
                <Plus size={16} className="mr-2" />
                {isCreating ? 'جاري الإنشاء...' : 'عميل جديد'}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="بحث في العملاء المحتملين..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange({ status: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">جميع الحالات</option>
              <option value="new">جديد</option>
              <option value="contacted">تم الاتصال</option>
              <option value="qualified">مؤهل</option>
              <option value="proposal">عرض سعر</option>
              <option value="converted">محول</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="created_at">تاريخ الإنشاء</option>
              <option value="updated_at">تاريخ التحديث</option>
              <option value="score">النقاط</option>
              <option value="value">القيمة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* KPI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpiMetrics.map((metric, index) => (
                <motion.div
                  key={metric.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.title}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {metric.format === 'currency' 
                            ? formatCurrency(metric.value)
                            : new Intl.NumberFormat('ar-SA').format(metric.value)
                          }
                        </p>
                      </div>
                      <metric.icon size={32} className="text-gray-400" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Leads Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leads.length > 0 ? (
                leads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onEdit={() => {/* handle edit */}}
                    onDelete={() => {/* handle delete */}}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    لا توجد عملاء محتملين
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    ابدأ بإضافة عميل محتمل جديد أو قم بتحديث المرشحات
                  </p>
                  <Button onClick={handleCreateLead}>
                    <Plus size={16} className="mr-2" />
                    إضافة عميل محتمل
                  </Button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => {
                    // Handle page change
                  }}
                >
                  السابق
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  صفحة {pagination.page} من {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={!pagination.hasNextPage}
                  onClick={() => {
                    // Handle page change
                  }}
                >
                  التالي
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
