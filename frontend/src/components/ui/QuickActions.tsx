import React from 'react';
import { useT } from '../../hooks/useI18n';
import {
  Plus,
  MessageSquare,
  Phone,
  Mail,
  Download,
  Upload,
  Settings,
  Filter,
  Search,
  Users,
  BarChart3,
  Clock,
  Star,
  Archive,
  Trash2
} from 'lucide-react';

interface QuickActionsProps {
  onCreateConversation?: () => void;
  onSendMessage?: () => void;
  onBulkActions?: (action: string) => void;
  onExport?: () => void;
  onImport?: () => void;
  onViewAnalytics?: () => void;
  onManageTemplates?: () => void;
  onSettings?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onCreateConversation,
  onSendMessage,
  onBulkActions,
  onExport,
  onImport,
  onViewAnalytics,
  onManageTemplates,
  onSettings,
  loading = false,
  disabled = false,
}) => {
  const t = useT();

  const ActionButton: React.FC<{
    icon: React.ReactNode;
    title: string;
    description?: string;
    onClick: () => void;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    variant?: 'primary' | 'secondary' | 'ghost';
    disabled?: boolean;
  }> = ({ 
    icon, 
    title, 
    description, 
    onClick, 
    color = 'blue',
    variant = 'secondary',
    disabled = false 
  }) => {
    const colorClasses = {
      blue: 'text-blue-600 hover:bg-blue-50',
      green: 'text-green-600 hover:bg-green-50',
      purple: 'text-purple-600 hover:bg-purple-50',
      orange: 'text-orange-600 hover:bg-orange-50',
      red: 'text-red-600 hover:bg-red-50',
    };

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`
          w-full flex items-center space-x-3 space-x-reverse p-3 rounded-lg transition-colors
          ${variant === 'primary' ? variantClasses[variant] : colorClasses[color]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 text-right">
          <div className="text-sm font-medium">{title}</div>
          {description && (
            <div className="text-xs opacity-75 mt-1">{description}</div>
          )}
        </div>
      </button>
    );
  };

  const ActionGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-900 px-3">{title}</h4>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h3>
      
      <div className="space-y-6">
        {/* Primary Actions */}
        <ActionGroup title="الإجراءات الأساسية">
          <ActionButton
            icon={<Plus className="w-5 h-5" />}
            title="محادثة جديدة"
            description="بدء محادثة مع عميل محتمل"
            onClick={onCreateConversation || (() => {})}
            color="blue"
            variant="primary"
            disabled={disabled}
          />
          
          <ActionButton
            icon={<MessageSquare className="w-5 h-5" />}
            title="إرسال رسالة"
            description="رسالة سريعة لعميل"
            onClick={onSendMessage || (() => {})}
            color="green"
            disabled={disabled}
          />
        </ActionGroup>

        {/* Search & Filter */}
        <ActionGroup title="البحث والتصفية">
          <ActionButton
            icon={<Search className="w-5 h-5" />}
            title="بحث متقدم"
            description="البحث في المحادثات والرسائل"
            onClick={() => onBulkActions?.('search')}
            color="purple"
            disabled={disabled}
          />
          
          <ActionButton
            icon={<Filter className="w-5 h-5" />}
            title="تصفية البيانات"
            description="تطبيق فلاتر مخصصة"
            onClick={() => onBulkActions?.('filter')}
            color="purple"
            disabled={disabled}
          />
        </ActionGroup>

        {/* Bulk Actions */}
        <ActionGroup title="إجراءات جماعية">
          <ActionButton
            icon={<Archive className="w-5 h-5" />}
            title="أرشفة المحادثات"
            description="أرشفة المحادثات المحددة"
            onClick={() => onBulkActions?.('archive')}
            color="orange"
            disabled={disabled}
          />
          
          <ActionButton
            icon={<Trash2 className="w-5 h-5" />}
            title="حذف المحادثات"
            description="حذف المحادثات المحددة"
            onClick={() => onBulkActions?.('delete')}
            color="red"
            disabled={disabled}
          />
        </ActionGroup>

        {/* Templates */}
        <ActionGroup title="القوالب والإعدادات">
          <ActionButton
            icon={<Star className="w-5 h-5" />}
            title="إدارة القوالب"
            description="إدارة قوالب الرسائل المحفوظة"
            onClick={onManageTemplates || (() => {})}
            color="blue"
            disabled={disabled}
          />
          
          <ActionButton
            icon={<Settings className="w-5 h-5" />}
            title="إعدادات الرسائل"
            description="تخصيص إعدادات المحادثات"
            onClick={onSettings || (() => {})}
            color="gray"
            disabled={disabled}
          />
        </ActionGroup>

        {/* Data Management */}
        <ActionGroup title="إدارة البيانات">
          <ActionButton
            icon={<Download className="w-5 h-5" />}
            title="تصدير البيانات"
            description="تصدير المحادثات كـ CSV/Excel"
            onClick={onExport || (() => {})}
            color="green"
            disabled={disabled}
          />
          
          <ActionButton
            icon={<Upload className="w-5 h-5" />}
            title="استيراد البيانات"
            description="استيراد محادثات من ملف"
            onClick={onImport || (() => {})}
            color="green"
            disabled={disabled}
          />
        </ActionGroup>

        {/* Analytics */}
        <ActionGroup title="التحليلات">
          <ActionButton
            icon={<BarChart3 className="w-5 h-5" />}
            title="عرض التحليلات"
            description="تحليلات مفصلة للمحادثات"
            onClick={onViewAnalytics || (() => {})}
            color="purple"
            disabled={disabled}
          />
          
          <ActionButton
            icon={<Clock className="w-5 h-5" />}
            title="تقارير الأداء"
            description="تقارير دورية عن الأداء"
            onClick={() => onBulkActions?.('reports')}
            color="purple"
            disabled={disabled}
          />
        </ActionGroup>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">إحصائيات سريعة</h4>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-blue-600">24</div>
            <div className="text-xs text-blue-700">محادثة اليوم</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-green-600">156</div>
            <div className="text-xs text-green-700">رسالة اليوم</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;