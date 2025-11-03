/**
 * DashboardBuilder Component - منشئ لوحات التحكم التفاعلي
 * يوفر drag-and-drop وwidget management وtemplate system
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Grid3X3,
  Layout,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Layers,
  Save,
  Share2,
  Download,
  Upload,
  Settings,
  Trash2,
  Copy,
  Eye,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  Filter,
  Star,
  Bookmark,
  X,
  Move,
  MoreVertical,
  Layers3,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

// ==================== TYPES ====================

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  subtitle?: string;
  config: WidgetConfig;
  position: WidgetPosition;
  data?: any;
  template?: string;
  isLocked?: boolean;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WidgetType = 
  | 'kpi-card'
  | 'line-chart'
  | 'bar-chart'
  | 'area-chart'
  | 'pie-chart'
  | 'doughnut-chart'
  | 'scatter-plot'
  | 'heatmap'
  | 'sankey-diagram'
  | 'treemap'
  | 'radar-chart'
  | 'funnel-chart'
  | 'cohort-analysis'
  | 'text-widget'
  | 'image-widget'
  | 'table-widget';

export interface WidgetConfig {
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  showAnimation?: boolean;
  xAxisKey?: string;
  yAxisKey?: string;
  animationDuration?: number;
  chartHeight?: number;
  responsive?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  customStyling?: Record<string, any>;
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  widgets: Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'>[];
  isPublic: boolean;
  author: string;
  tags: string[];
  usage: number;
  rating: number;
}

export interface DashboardLayout {
  cols: number;
  rowHeight: number;
  margin: [number, number];
  compactType: 'vertical' | 'horizontal' | null;
  autoSize: boolean;
}

// ==================== WIDGET CATALOG ====================

const widgetCatalog = {
  'kpi-card': {
    name: 'بطاقة KPI',
    icon: BarChart3,
    description: 'عرض مؤشرات الأداء الرئيسية',
    category: 'metrics',
    defaultConfig: {
      showLegend: false,
      showTooltip: false,
      showGrid: false,
      showAnimation: true,
    },
    defaultSize: { w: 3, h: 2 },
  },
  'line-chart': {
    name: 'رسم بياني خطي',
    icon: LineChartIcon,
    description: 'عرض البيانات عبر الزمن',
    category: 'charts',
    defaultConfig: {
      showLegend: true,
      showTooltip: true,
      showGrid: true,
      showAnimation: true,
    },
    defaultSize: { w: 8, h: 4 },
  },
  'bar-chart': {
    name: 'رسم بياني بالأعمدة',
    icon: BarChart3,
    description: 'مقارنة البيانات بين الفئات',
    category: 'charts',
    defaultConfig: {
      showLegend: true,
      showTooltip: true,
      showGrid: true,
      showAnimation: true,
    },
    defaultSize: { w: 6, h: 4 },
  },
  'area-chart': {
    name: 'رسم بياني بالمساحة',
    icon: Layers,
    description: 'عرض التراكم عبر الزمن',
    category: 'charts',
    defaultConfig: {
      showLegend: true,
      showTooltip: true,
      showGrid: true,
      showAnimation: true,
    },
    defaultSize: { w: 8, h: 4 },
  },
  'pie-chart': {
    name: 'رسم بياني دائري',
    icon: PieChartIcon,
    description: 'عرض التوزيع كنسب مئوية',
    category: 'charts',
    defaultConfig: {
      showLegend: true,
      showTooltip: true,
      showGrid: false,
      showAnimation: true,
    },
    defaultSize: { w: 4, h: 4 },
  },
  'doughnut-chart': {
    name: 'رسم بياني دائري مجوف',
    icon: PieChartIcon,
    description: 'رسم دائري مع مركز فارغ',
    category: 'charts',
    defaultConfig: {
      showLegend: true,
      showTooltip: true,
      showGrid: false,
      showAnimation: true,
    },
    defaultSize: { w: 4, h: 4 },
  },
  'heatmap': {
    name: 'خريطة حرارية',
    icon: Grid3X3,
    description: 'عرض الارتباطات والتوزيع',
    category: 'advanced',
    defaultConfig: {
      showLegend: true,
      showTooltip: true,
      showGrid: true,
      showAnimation: false,
    },
    defaultSize: { w: 6, h: 4 },
  },
  'sankey-diagram': {
    name: 'مخطط سانكي',
    icon: Layout,
    description: 'عرض التدفقات والتحولات',
    category: 'advanced',
    defaultConfig: {
      showLegend: true,
      showTooltip: true,
      showGrid: false,
      showAnimation: true,
    },
    defaultSize: { w: 8, h: 4 },
  },
  'scatter-plot': {
    name: 'مخطط نقاط',
    icon: Layout,
    description: 'عرض العلاقات بين متغيرين',
    category: 'advanced',
    defaultConfig: {
      showLegend: true,
      showTooltip: true,
      showGrid: true,
      showAnimation: true,
    },
    defaultSize: { w: 6, h: 4 },
  },
  'treemap': {
    name: 'خريطة شجرية',
    icon: Layers3,
    description: 'عرض البيانات الهرمية',
    category: 'advanced',
    defaultConfig: {
      showLegend: true,
      showTooltip: true,
      showGrid: false,
      showAnimation: true,
    },
    defaultSize: { w: 6, h: 4 },
  },
  'text-widget': {
    name: 'عنصر نص',
    icon: BarChart3,
    description: 'عرض نص أو إحصائية',
    category: 'content',
    defaultConfig: {
      showLegend: false,
      showTooltip: false,
      showGrid: false,
      showAnimation: false,
    },
    defaultSize: { w: 4, h: 2 },
  },
  'table-widget': {
    name: 'جدول',
    icon: Grid3X3,
    description: 'عرض البيانات في جدول',
    category: 'content',
    defaultConfig: {
      showLegend: false,
      showTooltip: false,
      showGrid: true,
      showAnimation: false,
    },
    defaultSize: { w: 8, h: 4 },
  },
} as const;

// ==================== DASHBOARD BUILDER COMPONENT ====================

export const DashboardBuilder: React.FC<{
  initialWidgets?: DashboardWidget[];
  onSave?: (widgets: DashboardWidget[]) => void;
  onWidgetAdd?: (widget: Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onWidgetUpdate?: (id: string, updates: Partial<DashboardWidget>) => void;
  onWidgetDelete?: (id: string) => void;
  onWidgetMove?: (id: string, position: WidgetPosition) => void;
  layout?: Partial<DashboardLayout>;
  editable?: boolean;
  preview?: boolean;
}> = ({
  initialWidgets = [],
  onSave,
  onWidgetAdd,
  onWidgetUpdate,
  onWidgetDelete,
  onWidgetMove,
  layout = {},
  editable = true,
  preview = false,
}) => {
  // State
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initialWidgets);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editMode, setEditMode] = useState(!preview);

  // Layout configuration
  const dashboardLayout: DashboardLayout = {
    cols: 12,
    rowHeight: 100,
    margin: [16, 16],
    compactType: 'vertical',
    autoSize: true,
    ...layout,
  };

  // Filtered widget catalog
  const filteredCatalog = useMemo(() => {
    const categories = Object.entries(widgetCatalog);
    
    return categories.filter(([type, info]) => {
      const matchesSearch = searchQuery === '' || 
        info.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        info.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || info.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, filterCategory]);

  // Categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(Object.values(widgetCatalog).map(info => info.category));
    return Array.from(uniqueCategories);
  }, []);

  // Generate unique ID
  const generateId = () => `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add widget
  const addWidget = useCallback((type: WidgetType) => {
    const widgetInfo = widgetCatalog[type];
    if (!widgetInfo) return;

    const newWidget: DashboardWidget = {
      id: generateId(),
      type,
      title: widgetInfo.name,
      config: { ...widgetInfo.defaultConfig },
      position: {
        x: 0,
        y: Math.max(...widgets.map(w => w.position.y + w.position.h), 0),
        w: widgetInfo.defaultSize.w,
        h: widgetInfo.defaultSize.h,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setWidgets(prev => [...prev, newWidget]);
    onWidgetAdd?.(newWidget);
    setIsAddingWidget(false);
  }, [widgets, onWidgetAdd]);

  // Update widget
  const updateWidget = useCallback((id: string, updates: Partial<DashboardWidget>) => {
    setWidgets(prev => prev.map(w => 
      w.id === id 
        ? { ...w, ...updates, updatedAt: new Date().toISOString() }
        : w
    ));
    onWidgetUpdate?.(id, updates);
  }, [onWidgetUpdate]);

  // Delete widget
  const deleteWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    setSelectedWidget(null);
    onWidgetDelete?.(id);
  }, [onWidgetDelete]);

  // Duplicate widget
  const duplicateWidget = useCallback((id: string) => {
    const widget = widgets.find(w => w.id === id);
    if (!widget) return;

    const newWidget: DashboardWidget = {
      ...widget,
      id: generateId(),
      title: `${widget.title} (نسخة)`,
      position: {
        ...widget.position,
        x: widget.position.x + widget.position.w,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setWidgets(prev => [...prev, newWidget]);
    onWidgetAdd?.(newWidget);
  }, [widgets, onWidgetAdd]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, widgetId: string) => {
    if (!editMode) return;
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  }, [editMode]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetWidgetId) return;

    const sourceWidget = widgets.find(w => w.id === draggedWidget);
    const targetWidget = widgets.find(w => w.id === targetWidgetId);
    
    if (sourceWidget && targetWidget) {
      const newPosition = targetWidget.position;
      updateWidget(sourceWidget.id, { position: newPosition });
      onWidgetMove?.(sourceWidget.id, newPosition);
    }

    setDraggedWidget(null);
  }, [draggedWidget, widgets, updateWidget, onWidgetMove]);

  // Save dashboard
  const saveDashboard = useCallback(() => {
    onSave?.(widgets);
    // Show success notification
  }, [widgets, onSave]);

  // Template management
  const [savedTemplates, setSavedTemplates] = useState<DashboardTemplate[]>([
    {
      id: 'template_1',
      name: 'لوحة المبيعات',
      description: 'لوحة شاملة لمراقبة المبيعات والأداء',
      category: 'sales',
      widgets: [],
      isPublic: true,
      author: 'النظام',
      tags: ['مبيعات', 'أداء'],
      usage: 150,
      rating: 4.8,
    },
    {
      id: 'template_2',
      name: 'تحليلات التسويق',
      description: 'لوحة متخصصة في تحليل حملات التسويق',
      category: 'marketing',
      widgets: [],
      isPublic: true,
      author: 'النظام',
      tags: ['تسويق', 'حملات'],
      usage: 89,
      rating: 4.6,
    },
  ]);

  const saveAsTemplate = useCallback(() => {
    const templateName = prompt('اسم القالب:');
    if (!templateName) return;

    const newTemplate: DashboardTemplate = {
      id: generateId(),
      name: templateName,
      description: 'قالب مخصص',
      category: 'custom',
      widgets: widgets.map(w => ({
        type: w.type,
        title: w.title,
        subtitle: w.subtitle,
        config: w.config,
        position: w.position,
        data: w.data,
        template: w.template,
        isLocked: w.isLocked,
        isFavorite: w.isFavorite,
      })),
      isPublic: false,
      author: 'المستخدم',
      tags: [],
      usage: 0,
      rating: 0,
    };

    setSavedTemplates(prev => [...prev, newTemplate]);
  }, [widgets]);

  const loadTemplate = useCallback((template: DashboardTemplate) => {
    const templateWidgets: DashboardWidget[] = template.widgets.map(w => ({
      ...w,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setWidgets(templateWidgets);
    setShowTemplates(false);
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              منشئ لوحة التحكم
            </h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                variant={editMode ? "default" : "outline"}
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? <Eye className="h-4 w-4 ml-2" /> : <Settings className="h-4 w-4 ml-2" />}
                {editMode ? 'معاينة' : 'تعديل'}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(true)}
            >
              <Bookmark className="h-4 w-4 ml-2" />
              القوالب
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingWidget(!isAddingWidget)}
              disabled={!editMode}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة عنصر
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={saveAsTemplate}
              disabled={widgets.length === 0}
            >
              <Save className="h-4 w-4 ml-2" />
              حفظ كقالب
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={saveDashboard}
              disabled={widgets.length === 0}
            >
              <Save className="h-4 w-4 ml-2" />
              حفظ
            </Button>
          </div>
        </div>
      </div>

      {/* Widget Selector */}
      <AnimatePresence>
        {isAddingWidget && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">اختر نوع العنصر</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingWidget(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center space-x-4 space-x-reverse mb-4">
              <div className="flex-1">
                <Input
                  placeholder="البحث في العناصر..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="all">جميع الفئات</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'metrics' && 'المقاييس'}
                    {category === 'charts' && 'المخططات'}
                    {category === 'advanced' && 'المتقدم'}
                    {category === 'content' && 'المحتوى'}
                  </option>
                ))}
              </select>
            </div>

            {/* Widget Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-64 overflow-y-auto">
              {filteredCatalog.map(([type, info]) => {
                const Icon = info.icon;
                return (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addWidget(type as WidgetType)}
                    className="flex flex-col items-center p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                  >
                    <Icon className="h-8 w-8 mb-2 text-blue-600" />
                    <span className="text-sm font-medium text-center">{info.name}</span>
                    <span className="text-xs text-gray-500 text-center mt-1">
                      {info.description}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard Canvas */}
      <div className="flex-1 p-6 overflow-auto">
        <div 
          className="relative"
          style={{
            minHeight: '600px',
            backgroundImage: `url("data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='grid' width='${dashboardLayout.rowHeight}' height='${dashboardLayout.rowHeight}' patternUnits='userSpaceOnUse'%3e%3cpath d='M ${dashboardLayout.rowHeight} 0 L 0 0 0 ${dashboardLayout.rowHeight}' fill='none' stroke='%23e5e7eb' stroke-width='1'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23grid)' /%3e%3c/svg%3e")`,
          }}
        >
          <AnimatePresence>
            {widgets.map((widget, index) => (
              <motion.div
                key={widget.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                draggable={editMode}
                onDragStart={(e) => handleDragStart(e, widget.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, widget.id)}
                className={`absolute bg-white dark:bg-gray-800 border-2 rounded-lg shadow-lg transition-all ${
                  selectedWidget === widget.id 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                } ${editMode ? 'cursor-move' : 'cursor-default'}`}
                style={{
                  left: `${widget.position.x * (100 / dashboardLayout.cols)}%`,
                  top: `${widget.position.y * (dashboardLayout.rowHeight + dashboardLayout.margin[1])}px`,
                  width: `${widget.position.w * (100 / dashboardLayout.cols) - (dashboardLayout.margin[0] * (widget.position.w - 1) / dashboardLayout.cols)}%`,
                  height: `${widget.position.h * dashboardLayout.rowHeight + (widget.position.h - 1) * dashboardLayout.margin[1]}px`,
                }}
                onClick={() => setSelectedWidget(widget.id)}
              >
                {/* Widget Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {widget.title}
                    </h3>
                    {widget.isFavorite && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  
                  {editMode && (
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateWidget(widget.id, { isFavorite: !widget.isFavorite });
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Star className={`h-3 w-3 ${widget.isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateWidget(widget.id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWidget(widget.id);
                        }}
                        className="h-6 w-6 p-0 hover:bg-red-100"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Widget Content */}
                <div className="p-4 h-full flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="mb-2">
                      {React.createElement(
                        widgetCatalog[widget.type]?.icon || BarChart3,
                        { className: "h-8 w-8 mx-auto text-gray-400" }
                      )}
                    </div>
                    <p className="text-sm">{widget.title}</p>
                    <p className="text-xs mt-1">
                      {widgetCatalog[widget.type]?.description || 'عنصر مخصص'}
                    </p>
                  </div>
                </div>

                {/* Resize Handle (for future implementation) */}
                {editMode && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100">
                    <div className="w-full h-full bg-gray-400 rounded-tl"></div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty State */}
          {widgets.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Layout className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">ابدأ بإنشاء لوحة التحكم</h3>
                <p className="text-sm mb-4">أضف العناصر لبدء تخصيص لوحة التحكم الخاصة بك</p>
                <Button
                  onClick={() => setIsAddingWidget(true)}
                  disabled={!editMode}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة عنصر
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Templates Modal */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setShowTemplates(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    القوالب المتاحة
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTemplates(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {savedTemplates.map((template) => (
                    <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {template.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {template.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-600">
                            {template.rating}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>استخدم {template.usage} مرة</span>
                        <span>بواسطة {template.author}</span>
                      </div>

                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          size="sm"
                          onClick={() => loadTemplate(template)}
                          className="flex-1"
                        >
                          استخدام القالب
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardBuilder;