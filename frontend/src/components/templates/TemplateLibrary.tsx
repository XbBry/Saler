'use client';

import React, { useState, useEffect } from 'react';
import {
  Template,
  Zap,
  Star,
  Search,
  Filter,
  Plus,
  Edit,
  Copy,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

import { useMessageTemplates } from '../../hooks/useMessageTemplates';
import { useToast } from '../../hooks/useToast';

import {
  Channel,
  TemplateCategory,
  MessageTemplate,
  AdvancedMessageTemplate
} from '../../types';

interface TemplateLibraryProps {
  workspaceId: string;
  onTemplateSelect?: (template: AdvancedMessageTemplate) => void;
  onTemplateEdit?: (template: AdvancedMessageTemplate) => void;
  onTemplateCreate?: () => void;
  className?: string;
  selectedChannel?: Channel;
  showCreateButton?: boolean;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  workspaceId,
  onTemplateSelect,
  onTemplateEdit,
  onTemplateCreate,
  className = '',
  selectedChannel,
  showCreateButton = true
}) => {
  const { templates, loading, error, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate } = useMessageTemplates();
  const { showToast } = useToast();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<Channel | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage_count' | 'created_at' | 'performance_score'>('usage_count');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<AdvancedMessageTemplate | null>(null);

  // Categories
  const categories = [
    { value: 'all' as const, label: 'جميع الفئات', count: templates.length },
    { value: TemplateCategory.GREETING, label: 'تحية', count: templates.filter(t => t.category === TemplateCategory.GREETING).length },
    { value: TemplateCategory.FOLLOW_UP, label: 'متابعة', count: templates.filter(t => t.category === TemplateCategory.FOLLOW_UP).length },
    { value: TemplateCategory.SALES, label: 'مبيعات', count: templates.filter(t => t.category === TemplateCategory.SALES).length },
    { value: TemplateCategory.CLOSING, label: 'إغلاق', count: templates.filter(t => t.category === TemplateCategory.CLOSING).length },
    { value: TemplateCategory.REMINDER, label: 'تذكير', count: templates.filter(t => t.category === TemplateCategory.REMINDER).length },
    { value: TemplateCategory.CUSTOMER_SERVICE, label: 'خدمة عملاء', count: templates.filter(t => t.category === TemplateCategory.CUSTOMER_SERVICE).length },
    { value: TemplateCategory.MARKETING, label: 'تسويق', count: templates.filter(t => t.category === TemplateCategory.MARKETING).length }
  ];

  // Channels
  const channels = [
    { value: 'all' as const, label: 'جميع القنوات' },
    { value: Channel.WHATSAPP, label: 'واتساب' },
    { value: Channel.SMS, label: 'رسالة نصية' },
    { value: Channel.EMAIL, label: 'بريد إلكتروني' },
    { value: Channel.WEB_CHAT, label: 'محادثة ويب' }
  ];

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = template.name?.toLowerCase().includes(query);
      const matchesContent = template.content?.toLowerCase().includes(query);
      const matchesDescription = template.description?.toLowerCase().includes(query);
      
      if (!matchesName && !matchesContent && !matchesDescription) {
        return false;
      }
    }

    // Apply category filter
    if (selectedCategory !== 'all' && template.category !== selectedCategory) {
      return false;
    }

    // Apply channel filter
    if (selectedChannelFilter !== 'all' && template.channel !== selectedChannelFilter) {
      return false;
    }

    return true;
  });

  // Sort templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'name':
        aValue = a.name || '';
        bValue = b.name || '';
        break;
      case 'usage_count':
        aValue = a.usage_count || 0;
        bValue = b.usage_count || 0;
        break;
      case 'created_at':
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      case 'performance_score':
        aValue = a.get_performance_score?.() || 0;
        bValue = b.get_performance_score?.() || 0;
        break;
      default:
        aValue = a.name || '';
        bValue = b.name || '';
    }

    if (typeof aValue === 'string') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue, 'ar') : bValue.localeCompare(aValue, 'ar');
    } else {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
  });

  // Handle template actions
  const handleTemplateSelect = (template: AdvancedMessageTemplate) => {
    onTemplateSelect?.(template);
    showToast({
      title: 'تم اختيار القالب',
      description: `تم اختيار قالب "${template.name}"`,
      type: 'success'
    });
  };

  const handleTemplatePreview = (template: AdvancedMessageTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleTemplateDuplicate = async (template: AdvancedMessageTemplate) => {
    try {
      const duplicated = await duplicateTemplate(template.id, {
        name: `${template.name} - نسخة`
      });
      
      showToast({
        title: 'تم النسخ',
        description: `تم نسخ قالب "${template.name}"`,
        type: 'success'
      });
    } catch (error) {
      showToast({
        title: 'خطأ في النسخ',
        description: 'فشل في نسخ القالب',
        type: 'error'
      });
    }
  };

  const handleTemplateDelete = async (template: AdvancedMessageTemplate) => {
    if (!confirm(`هل أنت متأكد من حذف قالب "${template.name}"؟`)) {
      return;
    }

    try {
      await deleteTemplate(template.id);
      showToast({
        title: 'تم الحذف',
        description: `تم حذف قالب "${template.name}"`,
        type: 'success'
      });
    } catch (error) {
      showToast({
        title: 'خطأ في الحذف',
        description: 'فشل في حذف القالب',
        type: 'error'
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTemplates.size === 0) return;

    if (!confirm(`هل أنت متأكد من حذف ${selectedTemplates.size} قالب؟`)) {
      return;
    }

    try {
      for (const templateId of selectedTemplates) {
        await deleteTemplate(templateId);
      }
      
      setSelectedTemplates(new Set());
      showToast({
        title: 'تم الحذف الجماعي',
        description: `تم حذف ${selectedTemplates.size} قالب`,
        type: 'success'
      });
    } catch (error) {
      showToast({
        title: 'خطأ في الحذف',
        description: 'فشل في حذف بعض القوالب',
        type: 'error'
      });
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId);
    } else {
      newSelected.add(templateId);
    }
    setSelectedTemplates(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTemplates.size === filteredTemplates.length) {
      setSelectedTemplates(new Set());
    } else {
      setSelectedTemplates(new Set(filteredTemplates.map(t => t.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-2 text-gray-600">جاري تحميل القوالب...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل القوالب</h3>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">مكتبة القوالب</h2>
            <p className="text-gray-600">إدارة قوالب الرسائل والأتمتة</p>
          </div>

          {showCreateButton && (
            <button
              onClick={onTemplateCreate}
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>قالب جديد</span>
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4 lg:space-x-reverse">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="البحث في القوالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label} ({category.count})
                </option>
              ))}
            </select>

            <select
              value={selectedChannelFilter}
              onChange={(e) => setSelectedChannelFilter(e.target.value as Channel | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {channels.map(channel => (
                <option key={channel.value} value={channel.value}>
                  {channel.label}
                </option>
              ))}
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy as any);
                setSortOrder(newSortOrder as any);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="usage_count-desc">الأكثر استخداماً</option>
              <option value="usage_count-asc">الأقل استخداماً</option>
              <option value="performance_score-desc">الأفضل أداءً</option>
              <option value="name-asc">الاسم (أ-ي)</option>
              <option value="name-desc">الاسم (ي-أ)</option>
              <option value="created_at-desc">الأحدث</option>
              <option value="created_at-asc">الأقدم</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className="w-4 h-4 flex flex-col gap-0.5">
                  <div className="bg-current h-0.5 rounded"></div>
                  <div className="bg-current h-0.5 rounded"></div>
                  <div className="bg-current h-0.5 rounded"></div>
                  <div className="bg-current h-0.5 rounded"></div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedTemplates.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-blue-700">
                تم تحديد {selectedTemplates.size} قالب
              </span>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center space-x-1 space-x-reverse px-3 py-1 text-red-600 hover:bg-red-100 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>حذف المحدد</span>
                </button>
                <button
                  onClick={() => setSelectedTemplates(new Set())}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Templates Grid/List */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredTemplates.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Template className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد قوالب
              </h3>
              <p className="text-gray-500">
                {searchQuery || selectedCategory !== 'all' || selectedChannelFilter !== 'all'
                  ? 'لا توجد قوالب تطابق معايير البحث'
                  : 'ابدأ بإنشاء قالب جديد'}
              </p>
            </div>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {/* Select All Checkbox */}
            {viewMode === 'list' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTemplates.size === filteredTemplates.length && filteredTemplates.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="mr-2 text-sm text-gray-600">تحديد الكل</span>
              </div>
            )}

            {sortedTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                viewMode={viewMode}
                isSelected={selectedTemplates.has(template.id)}
                onSelect={() => handleSelectTemplate(template.id)}
                onPreview={() => handleTemplatePreview(template)}
                onSelectTemplate={() => handleTemplateSelect(template)}
                onEdit={() => onTemplateEdit?.(template)}
                onDuplicate={() => handleTemplateDuplicate(template)}
                onDelete={() => handleTemplateDelete(template)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Template Preview Modal */}
      <AnimatePresence>
        {showPreview && previewTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <TemplatePreview template={previewTemplate} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: AdvancedMessageTemplate;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onSelectTemplate: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  viewMode,
  isSelected,
  onSelect,
  onPreview,
  onSelectTemplate,
  onEdit,
  onDuplicate,
  onDelete
}) => {
  const performanceScore = template.get_performance_score?.() || 0;
  
  if (viewMode === 'list') {
    return (
      <div className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
        />

        {/* Template Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="flex-shrink-0">
              <Template className="h-5 w-5 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {template.name}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {template.description || 'بدون وصف'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center space-x-4 space-x-reverse text-sm text-gray-500">
          <div className="text-center">
            <div className="font-medium text-gray-900">{template.usage_count}</div>
            <div>استخدام</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">{performanceScore}%</div>
            <div>الأداء</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={onPreview}
            className="p-2 text-gray-400 hover:text-gray-600 rounded"
            title="معاينة"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={onSelectTemplate}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            اختيار
          </button>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow relative"
    >
      {/* Selection checkbox */}
      <div className="absolute top-4 left-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>

      {/* Performance Badge */}
      <div className="absolute top-4 right-4">
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          performanceScore >= 80 ? 'bg-green-100 text-green-800' :
          performanceScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          <TrendingUp className="h-3 w-3 mr-1" />
          {performanceScore}%
        </div>
      </div>

      {/* Template Content */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {template.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {template.description || 'بدون وصف'}
        </p>
        
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-gray-700 line-clamp-3">
            {template.content}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {template.category}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
              {template.channel}
            </span>
          </div>
          <span>{template.usage_count} استخدام</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 space-x-reverse">
          <button
            onClick={onPreview}
            className="p-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title="معاينة"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title="تعديل"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title="نسخ"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-400 hover:text-red-600 rounded hover:bg-red-50"
            title="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={onSelectTemplate}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          اختيار
        </button>
      </div>
    </motion.div>
  );
};

// Template Preview Component
const TemplatePreview: React.FC<{ template: AdvancedMessageTemplate }> = ({ template }) => {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    // Extract variables and generate preview
    const extractedVars = template.extract_variables?.() || [];
    setVariables({});
    setPreviewContent(template.content);
  }, [template]);

  const handleVariableChange = (name: string, value: string) => {
    const newVariables = { ...variables, [name]: value };
    setVariables(newVariables);
    
    // Update preview
    let content = template.content;
    Object.entries(newVariables).forEach(([key, val]) => {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), val);
    });
    setPreviewContent(content);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{template.name}</h2>
          <p className="text-gray-600">{template.description}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center space-x-2 space-x-reverse px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Eye className="h-4 w-4" />
          <span>طباعة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Details */}
        <div>
          <h3 className="text-lg font-semibold mb-4">تفاصيل القالب</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {template.category}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">القناة</label>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                {template.channel}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">إحصائيات الاستخدام</label>
              <div className="flex space-x-4 space-x-reverse text-sm text-gray-600">
                <span>استخدم {template.usage_count} مرة</span>
                <span>•</span>
                <span>نسبة النجاح {template.success_rate?.toFixed(1)}%</span>
              </div>
            </div>

            {/* Variables */}
            {template.extract_variables?.() && template.extract_variables().length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">متغيرات القالب</label>
                <div className="space-y-2">
                  {template.extract_variables().map((variable: any) => (
                    <div key={variable.name}>
                      <label className="block text-xs text-gray-600 mb-1">
                        {variable.name}
                        {variable.required && <span className="text-red-500 mr-1">*</span>}
                      </label>
                      <input
                        type="text"
                        value={variables[variable.name] || ''}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={variable.description || `أدخل ${variable.name}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div>
          <h3 className="text-lg font-semibold mb-4">معاينة القالب</h3>
          
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">المعاينة</span>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-xs text-gray-500">القناة:</span>
                  <span className="text-xs font-medium">{template.channel}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-white">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{previewContent}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex space-x-3 space-x-reverse">
            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              استخدام القالب
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              تعديل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateLibrary;