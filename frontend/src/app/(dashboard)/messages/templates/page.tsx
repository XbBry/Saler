'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ShareIcon,
  ClipboardDocumentIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  CheckIcon,
  Bars3Icon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

// Types
interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  type: 'text' | 'template' | 'quick_reply';
  channel: 'whatsapp' | 'sms' | 'email';
  category: string;
  tags: string[];
  variables: string[];
  preview?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'email' | 'phone';
  required: boolean;
  description?: string;
}

const DEFAULT_VARIABLES: TemplateVariable[] = [
  { name: 'customer_name', label: 'اسم العميل', type: 'text', required: true },
  { name: 'company_name', label: 'اسم الشركة', type: 'text', required: true },
  { name: 'customer_email', label: 'بريد العميل', type: 'email', required: false },
  { name: 'customer_phone', label: 'هاتف العميل', type: 'phone', required: false },
  { name: 'current_date', label: 'التاريخ الحالي', type: 'date', required: false },
  { name: 'current_time', label: 'الوقت الحالي', type: 'text', required: false },
  { name: 'appointment_date', label: 'موعد الموعد', type: 'date', required: false },
  { name: 'appointment_time', label: 'وقت الموعد', type: 'text', required: false },
  { name: 'product_name', label: 'اسم المنتج', type: 'text', required: false },
  { name: 'order_number', label: 'رقم الطلب', type: 'text', required: false },
  { name: 'discount_code', label: 'كود الخصم', type: 'text', required: false },
  { name: 'expiration_date', label: 'تاريخ انتهاء الصلاحية', type: 'date', required: false }
];

const CATEGORIES = [
  'ترحيب', 'متابعة', 'عرض', 'تذكير', 'شكر', 'شكوى', 'دعم فني', 'إعلان', 'تأكيد', 'إلغاء'
];

const CHANNELS = [
  { value: 'whatsapp', label: 'واتساب', color: 'bg-green-500' },
  { value: 'sms', label: 'رسالة نصية', color: 'bg-blue-500' },
  { value: 'email', label: 'إيميل', color: 'bg-purple-500' }
];

const TEMPLATE_TYPES = [
  { value: 'text', label: 'نص عادي' },
  { value: 'template', label: 'قالب محدد' },
  { value: 'quick_reply', label: 'رد سريع' }
];

const MOCK_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'ترحيب بالعملاء الجدد',
    description: 'رسالة ترحيب للعملاء الجدد مع تقديم الخدمات',
    content: 'مرحباً {{customer_name}}، أهلاً وسهلاً بك في {{company_name}}. نحن متحمسون لتقديم أفضل خدماتنا لك.',
    type: 'text',
    channel: 'whatsapp',
    category: 'ترحيب',
    tags: ['ترحيب', 'جديد'],
    variables: ['customer_name', 'company_name'],
    preview: 'مرحباً أحمد، أهلاً وسهلاً بك في شركة النور للتجارة. نحن متحمسون لتقديم أفضل خدماتنا لك.',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-20T15:30:00Z',
    isActive: true
  },
  {
    id: '2',
    name: 'تذكير بالموعد',
    description: 'تذكير العميل بالموعد خلال 24 ساعة',
    content: 'عزيزي {{customer_name}}، نذكركم بالموعد المحدد يوم {{appointment_date}} في {{appointment_time}}. للحجز: {{customer_phone}}',
    type: 'template',
    channel: 'whatsapp',
    category: 'تذكير',
    tags: ['تذكير', 'موعد'],
    variables: ['customer_name', 'appointment_date', 'appointment_time', 'customer_phone'],
    preview: 'عزيزي أحمد، نذكركم بالموعد المحدد يوم 2025-03-15 في 10:00 صباحاً. للحجز: 01234567890',
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-01-18T12:00:00Z',
    isActive: true
  },
  {
    id: '3',
    name: 'عرض خاص',
    description: 'إرسال عرض خاص للعملاء المميزين',
    content: 'عرض خاص لك فقط {{customer_name}}! خصم 20% على جميع المنتجات. كود الخصم: {{discount_code}} - ينتهي في {{expiration_date}}',
    type: 'text',
    channel: 'sms',
    category: 'عرض',
    tags: ['عرض', 'خصم'],
    variables: ['customer_name', 'discount_code', 'expiration_date'],
    preview: 'عرض خاص لك فقط أحمد! خصم 20% على جميع المنتجات. كود الخصم: SPECIAL20 - ينتهي في 2025-03-31',
    createdAt: '2025-01-12T14:00:00Z',
    updatedAt: '2025-01-22T16:45:00Z',
    isActive: true
  }
];

export default function MessageTemplatesPage() {
  // State management
  const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>(MOCK_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    type: 'text' as Template['type'],
    channel: 'whatsapp' as Template['channel'],
    category: '',
    tags: [] as string[],
    variables: [] as string[]
  });

  const [newTag, setNewTag] = useState('');

  // Filter and search
  useEffect(() => {
    let filtered = templates;

    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    if (selectedChannel !== 'all') {
      filtered = filtered.filter(template => template.channel === selectedChannel);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(template => template.type === selectedType);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, selectedChannel, selectedType]);

  // Template operations
  const handleCreateTemplate = async () => {
    setIsLoading(true);
    try {
      const newTemplate: Template = {
        id: Date.now().toString(),
        ...formData,
        tags: formData.tags,
        variables: extractVariables(formData.content),
        preview: generatePreview(formData.content),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };

      setTemplates(prev => [...prev, newTemplate]);
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;
    
    setIsLoading(true);
    try {
      const updatedTemplate: Template = {
        ...editingTemplate,
        ...formData,
        variables: extractVariables(formData.content),
        preview: generatePreview(formData.content),
        updatedAt: new Date().toISOString()
      };

      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t));
      setIsEditModalOpen(false);
      setEditingTemplate(null);
      resetForm();
    } catch (error) {
      console.error('Error updating template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القالب؟')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleDuplicateTemplate = (template: Template) => {
    const duplicatedTemplate: Template = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (نسخة)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTemplates(prev => [...prev, duplicatedTemplate]);
  };

  const handleBulkDelete = async () => {
    if (selectedTemplates.length === 0) return;
    
    if (confirm(`هل أنت متأكد من حذف ${selectedTemplates.length} قالب؟`)) {
      setTemplates(prev => prev.filter(t => !selectedTemplates.includes(t.id)));
      setSelectedTemplates([]);
    }
  };

  const handleBulkActivate = async () => {
    setTemplates(prev => prev.map(t => 
      selectedTemplates.includes(t.id) ? { ...t, isActive: true } : t
    ));
    setSelectedTemplates([]);
  };

  const handleBulkDeactivate = async () => {
    setTemplates(prev => prev.map(t => 
      selectedTemplates.includes(t.id) ? { ...t, isActive: false } : t
    ));
    setSelectedTemplates([]);
  };

  // Helper functions
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      content: '',
      type: 'text',
      channel: 'whatsapp',
      category: '',
      tags: [],
      variables: []
    });
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map(match => match.replace(/[{}]/g, ''));
  };

  const generatePreview = (content: string): string => {
    return content
      .replace(/\{\{customer_name\}\}/g, 'أحمد')
      .replace(/\{\{company_name\}\}/g, 'شركة النور للتجارة')
      .replace(/\{\{customer_email\}\}/g, 'ahmed@example.com')
      .replace(/\{\{customer_phone\}\}/g, '01234567890')
      .replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString('ar-SA'))
      .replace(/\{\{current_time\}\}/g, new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }))
      .replace(/\{\{appointment_date\}\}/g, '2025-03-15')
      .replace(/\{\{appointment_time\}\}/g, '10:00 صباحاً')
      .replace(/\{\{product_name\}\}/g, 'جهاز كمبيوتر محمول')
      .replace(/\{\{order_number\}\}/g, 'ORD-12345')
      .replace(/\{\{discount_code\}\}/g, 'SPECIAL20')
      .replace(/\{\{expiration_date\}\}/g, '2025-03-31');
  };

  const insertVariable = (variableName: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.content;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newContent = before + `{{${variableName}}}` + after;
      
      setFormData(prev => ({ ...prev, content: newContent }));
      
      // Focus back to textarea
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variableName.length + 4, start + variableName.length + 4);
      }, 0);
    }
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      content: template.content,
      type: template.type,
      channel: template.channel,
      category: template.category,
      tags: template.tags,
      variables: template.variables
    });
    setIsEditModalOpen(true);
  };

  const openPreviewModal = (template: Template) => {
    setPreviewTemplate(template);
    setIsPreviewModalOpen(true);
  };

  const handleExport = () => {
    const exportData = {
      templates: filteredTemplates,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `templates-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        if (importData.templates && Array.isArray(importData.templates)) {
          const importedTemplates = importData.templates.map((template: Template) => ({
            ...template,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
          setTemplates(prev => [...prev, ...importedTemplates]);
          setIsImportModalOpen(false);
        }
      } catch (error) {
        alert('خطأ في قراءة الملف. تأكد من صحة تنسيق JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">قوالب الرسائل</h1>
              <p className="text-gray-600 mt-1">إدارة قوالب الرسائل لحملاتك التسويقية</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <DocumentArrowUpIcon className="h-5 w-5" />
                استيراد
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                تصدير
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                قالب جديد
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mt-6">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في القوالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الفئات</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع القنوات</option>
                {CHANNELS.map(channel => (
                  <option key={channel.value} value={channel.value}>{channel.label}</option>
                ))}
              </select>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الأنواع</option>
                {TEMPLATE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Bars3Icon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedTemplates.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                تم تحديد {selectedTemplates.length} قالب
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkActivate}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  تفعيل
                </button>
                <button
                  onClick={handleBulkDeactivate}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                >
                  إلغاء تفعيل
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  حذف
                </button>
                <button
                  onClick={() => setSelectedTemplates([])}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Templates Grid/List */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <ClipboardDocumentIcon className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد قوالب</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedCategory !== 'all' || selectedChannel !== 'all' || selectedType !== 'all'
                ? 'لم يتم العثور على قوالب تطابق البحث'
                : 'ابدأ بإنشاء قالب جديد'}
            </p>
            {!searchQuery && selectedCategory === 'all' && selectedChannel === 'all' && selectedType === 'all' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5" />
                إنشاء قالب جديد
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${
                  viewMode === 'list' ? 'p-4' : 'p-6'
                }`}
              >
                {viewMode === 'list' && (
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedTemplates.includes(template.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTemplates(prev => [...prev, template.id]);
                        } else {
                          setSelectedTemplates(prev => prev.filter(id => id !== template.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={selectedTemplates.includes(template.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTemplates(prev => [...prev, template.id]);
                          } else {
                            setSelectedTemplates(prev => prev.filter(id => id !== template.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openPreviewModal(template)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="معاينة"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(template)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="تعديل"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateTemplate(template)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                        title="نسخ"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="حذف"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 text-xs rounded-full text-white ${CHANNELS.find(c => c.value === template.channel)?.color}`}>
                    {CHANNELS.find(c => c.value === template.channel)?.label}
                  </span>
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                    {TEMPLATE_TYPES.find(t => t.value === template.type)?.label}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {template.category}
                  </span>
                  {!template.isActive && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                      معطل
                    </span>
                  )}
                </div>

                {template.preview && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-700 line-clamp-3">{template.preview}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex gap-1">
                    {template.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span>{new Date(template.updatedAt).toLocaleDateString('ar-SA')}</span>
                </div>

                {template.variables.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">المتغيرات المستخدمة:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map(variable => (
                        <span key={variable} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-mono">
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Template Modal */}
        {(isCreateModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {isCreateModalOpen ? 'إنشاء قالب جديد' : 'تعديل القالب'}
                </h2>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                    setEditingTemplate(null);
                    resetForm();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="flex h-[calc(90vh-200px)]">
                {/* Form */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          اسم القالب *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="أدخل اسم القالب"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          الفئة *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">اختر الفئة</option>
                          {CATEGORIES.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الوصف
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="وصف مختصر للقالب"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          نوع القالب *
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Template['type'] }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {TEMPLATE_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          القناة *
                        </label>
                        <select
                          value={formData.channel}
                          onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value as Template['channel'] }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {CHANNELS.map(channel => (
                            <option key={channel.value} value={channel.value}>{channel.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        محتوى الرسالة *
                      </label>
                      <textarea
                        id="template-content"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        placeholder="أدخل محتوى الرسالة هنا. يمكنك استخدام المتغيرات مثل {{customer_name}}"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        استخدم <code className="bg-gray-100 px-1 rounded">{'{{variable_name}}'}</code> للمتغيرات
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        العلامات
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="إضافة علامة"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newTag.trim()) {
                              setFormData(prev => ({
                                ...prev,
                                tags: [...prev.tags, newTag.trim()]
                              }));
                              setNewTag('');
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newTag.trim()) {
                              setFormData(prev => ({
                                ...prev,
                                tags: [...prev.tags, newTag.trim()]
                              }));
                              setNewTag('');
                            }
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          إضافة
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                tags: prev.tags.filter((_, i) => i !== index)
                              }))}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variables Panel */}
                <div className="w-80 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
                  <h3 className="font-medium text-gray-900 mb-4">المتغيرات المتاحة</h3>
                  
                  <div className="space-y-3">
                    {DEFAULT_VARIABLES.map(variable => (
                      <div
                        key={variable.name}
                        className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                        onClick={() => insertVariable(variable.name)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm text-blue-600">
                            {`{{${variable.name}}}`}
                          </span>
                          {variable.required && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{variable.label}</p>
                        {variable.description && (
                          <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {extractVariables(formData.content).length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">المتغيرات المستخدمة في هذا القالب</h4>
                      <div className="space-y-2">
                        {extractVariables(formData.content).map(variable => (
                          <div
                            key={variable}
                            className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded text-sm"
                          >
                            <span className="font-mono text-yellow-700">
                              {`{{${variable}}}`}
                            </span>
                            <button
                              onClick={() => {
                                const newContent = formData.content.replace(
                                  new RegExp(`\\{\\{${variable}\\}\\}`, 'g'),
                                  ''
                                );
                                setFormData(prev => ({ ...prev, content: newContent }));
                              }}
                              className="text-yellow-600 hover:text-yellow-800"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                    setEditingTemplate(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={isCreateModalOpen ? handleCreateTemplate : handleUpdateTemplate}
                  disabled={!formData.name || !formData.content || !formData.category || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {isCreateModalOpen ? 'إنشاء القالب' : 'حفظ التغييرات'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {isPreviewModalOpen && previewTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">معاينة القالب</h2>
                <button
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    setPreviewTemplate(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{previewTemplate.name}</h3>
                  <p className="text-gray-600">{previewTemplate.description}</p>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`px-2 py-1 text-xs rounded-full text-white ${CHANNELS.find(c => c.value === previewTemplate.channel)?.color}`}>
                      {CHANNELS.find(c => c.value === previewTemplate.channel)?.label}
                    </span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                      {TEMPLATE_TYPES.find(t => t.value === previewTemplate.type)?.label}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {previewTemplate.category}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">المحتوى:</h4>
                  <div className="bg-white p-3 rounded border font-mono text-sm whitespace-pre-wrap">
                    {previewTemplate.content}
                  </div>
                </div>

                {previewTemplate.preview && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">المعاينة مع البيانات:</h4>
                    <div className="bg-white p-3 rounded border text-sm whitespace-pre-wrap">
                      {previewTemplate.preview}
                    </div>
                  </div>
                )}

                {previewTemplate.variables.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">المتغيرات المستخدمة:</h4>
                    <div className="flex flex-wrap gap-2">
                      {previewTemplate.variables.map(variable => {
                        const variableInfo = DEFAULT_VARIABLES.find(v => v.name === variable);
                        return (
                          <div
                            key={variable}
                            className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm"
                          >
                            <div className="font-mono text-yellow-700 mb-1">
                              {`{{${variable}}}`}
                            </div>
                            {variableInfo && (
                              <div className="text-xs text-gray-600">{variableInfo.label}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    setPreviewTemplate(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  إغلاق
                </button>
                <button
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    openEditModal(previewTemplate);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  تعديل القالب
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {isImportModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">استيراد القوالب</h2>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="text-center">
                  <DocumentArrowUpIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    اختر ملف JSON للتصدير مسبقاً
                  </p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                    id="import-file"
                  />
                  <label
                    htmlFor="import-file"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    <DocumentArrowUpIcon className="h-5 w-5" />
                    اختيار ملف
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}