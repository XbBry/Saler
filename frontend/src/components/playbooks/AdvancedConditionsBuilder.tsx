'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Minus,
  Trash2,
  Copy,
  Move,
  ArrowRight,
  Code,
  Calculator,
  Brain,
  Database,
  Globe,
  Clock,
  MapPin,
  User,
  Tag,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Settings,
  Eye,
  Zap,
  Target,
  Layers,
  GitBranch,
  Timer,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Progress } from '../ui/Progress';
import { useToast } from '../../hooks/useToast';

// Types
export interface ConditionGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: Condition[];
  groups?: ConditionGroup[];
}

export interface Condition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'in' | 'not_in' | 'empty' | 'not_empty';
  value: any;
  type: 'field' | 'script' | 'api' | 'ai';
  config: {
    fieldType?: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
    options?: { label: string; value: any }[];
    script?: string;
    apiEndpoint?: string;
    aiModel?: string;
    source?: 'lead' | 'user' | 'workspace' | 'external';
  };
}

// Field definitions
const FIELD_DEFINITIONS = {
  lead: [
    { name: 'name', label: 'اسم العميل', type: 'text' },
    { name: 'email', label: 'الإيميل', type: 'text' },
    { name: 'phone', label: 'رقم الهاتف', type: 'text' },
    { name: 'status', label: 'الحالة', type: 'select', options: [
      { label: 'جديد', value: 'new' },
      { label: 'تم التواصل', value: 'contacted' },
      { label: 'مهتم', value: 'interested' },
      { label: 'مؤهل', value: 'qualified' },
      { label: 'عرض', value: 'proposal' },
      { label: 'متفاوض', value: 'negotiating' },
      { label: 'مكتمل', value: 'purchased' },
      { label: 'مفقود', value: 'lost' }
    ]},
    { name: 'temperature', label: 'درجة الحرارة', type: 'select', options: [
      { label: 'ساخن', value: 'hot' },
      { label: 'دافئ', value: 'warm' },
      { label: 'بارد', value: 'cold' }
    ]},
    { name: 'source', label: 'المصدر', type: 'text' },
    { name: 'tags', label: 'العلامات', type: 'multiselect' },
    { name: 'score', label: 'النقاط', type: 'number' },
    { name: 'created_at', label: 'تاريخ الإنشاء', type: 'date' },
    { name: 'last_activity', label: 'آخر نشاط', type: 'date' },
    { name: 'location', label: 'الموقع', type: 'text' }
  ],
  user: [
    { name: 'name', label: 'اسم المستخدم', type: 'text' },
    { name: 'role', label: 'الدور', type: 'select', options: [
      { label: 'مالك', value: 'owner' },
      { label: 'مدير', value: 'admin' },
      { label: 'عضو', value: 'member' },
      { label: 'مراقب', value: 'viewer' }
    ]},
    { name: 'timezone', label: 'المنطقة الزمنية', type: 'text' },
    { name: 'language', label: 'اللغة', type: 'select', options: [
      { label: 'العربية', value: 'ar' },
      { label: 'الإنجليزية', value: 'en' },
      { label: 'الفرنسية', value: 'fr' }
    ]}
  ],
  workspace: [
    { name: 'name', label: 'اسم المساحة', type: 'text' },
    { name: 'plan', label: 'الباقة', type: 'select', options: [
      { label: 'مجاني', value: 'free' },
      { label: 'أساسي', value: 'starter' },
      { label: 'احترافي', value: 'professional' },
      { label: 'مؤسسي', value: 'enterprise' }
    ]},
    { name: 'members_count', label: 'عدد الأعضاء', type: 'number' },
    { name: 'leads_count', label: 'عدد العملاء', type: 'number' }
  ],
  system: [
    { name: 'time_of_day', label: 'وقت اليوم', type: 'select', options: [
      { label: 'صباحاً', value: 'morning' },
      { label: 'ظهراً', value: 'afternoon' },
      { label: 'مساءً', value: 'evening' },
      { label: 'ليلاً', value: 'night' }
    ]},
    { name: 'day_of_week', label: 'يوم الأسبوع', type: 'select', options: [
      { label: 'السبت', value: 'saturday' },
      { label: 'الأحد', value: 'sunday' },
      { label: 'الاثنين', value: 'monday' },
      { label: 'الثلاثاء', value: 'tuesday' },
      { label: 'الأربعاء', value: 'wednesday' },
      { label: 'الخميس', value: 'thursday' },
      { label: 'الجمعة', value: 'friday' }
    ]},
    { name: 'is_business_hours', label: 'ساعات العمل', type: 'boolean' },
    { name: 'is_weekend', label: 'عطلة نهاية الأسبوع', type: 'boolean' }
  ],
  custom: [
    { name: 'custom_field_1', label: 'حقل مخصص 1', type: 'text' },
    { name: 'custom_field_2', label: 'حقل مخصص 2', type: 'number' },
    { name: 'custom_field_3', label: 'حقل مخصص 3', type: 'date' },
  ]
};

interface AdvancedConditionsBuilderProps {
  initialConditions?: ConditionGroup;
  onChange?: (conditions: ConditionGroup) => void;
  onTest?: (conditions: ConditionGroup, testData: any) => Promise<boolean>;
  readonly?: boolean;
}

export const AdvancedConditionsBuilder: React.FC<AdvancedConditionsBuilderProps> = ({
  initialConditions,
  onChange,
  onTest,
  readonly = false
}) => {
  const [conditions, setConditions] = useState<ConditionGroup>(
    initialConditions || {
      id: 'root',
      logic: 'AND',
      conditions: []
    }
  );
  
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testData, setTestData] = useState<any>({});
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const { toast } = useToast();

  // Update conditions
  const updateConditions = useCallback((newConditions: ConditionGroup) => {
    setConditions(newConditions);
    if (onChange) {
      onChange(newConditions);
    }
  }, [onChange]);

  // Add condition to group
  const addCondition = useCallback((groupId: string) => {
    const addToGroup = (group: ConditionGroup): ConditionGroup => {
      if (group.id === groupId) {
        const newCondition: Condition = {
          id: `cond-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          field: 'name',
          operator: 'equals',
          value: '',
          type: 'field',
          config: {
            fieldType: 'text',
            source: 'lead'
          }
        };
        
        return {
          ...group,
          conditions: [...group.conditions, newCondition]
        };
      }
      
      if (group.groups) {
        return {
          ...group,
          groups: group.groups.map(addToGroup)
        };
      }
      
      return group;
    };
    
    const updatedConditions = addToGroup(conditions);
    updateConditions(updatedConditions);
  }, [conditions, updateConditions]);

  // Add condition group
  const addConditionGroup = useCallback((groupId: string) => {
    const addGroupToParent = (group: ConditionGroup): ConditionGroup => {
      if (group.id === groupId) {
        const newGroup: ConditionGroup = {
          id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          logic: 'AND',
          conditions: []
        };
        
        return {
          ...group,
          groups: [...(group.groups || []), newGroup]
        };
      }
      
      if (group.groups) {
        return {
          ...group,
          groups: group.groups.map(addGroupToParent)
        };
      }
      
      return group;
    };
    
    const updatedConditions = addGroupToParent(conditions);
    updateConditions(updatedConditions);
  }, [conditions, updateConditions]);

  // Remove condition
  const removeCondition = useCallback((conditionId: string) => {
    const removeFromGroup = (group: ConditionGroup): ConditionGroup => {
      return {
        ...group,
        conditions: group.conditions.filter(c => c.id !== conditionId),
        groups: group.groups ? group.groups.map(removeFromGroup) : undefined
      };
    };
    
    const updatedConditions = removeFromGroup(conditions);
    updateConditions(updatedConditions);
  }, [conditions, updateConditions]);

  // Update condition
  const updateCondition = useCallback((conditionId: string, updates: Partial<Condition>) => {
    const updateInGroup = (group: ConditionGroup): ConditionGroup => {
      return {
        ...group,
        conditions: group.conditions.map(c => 
          c.id === conditionId ? { ...c, ...updates } : c
        ),
        groups: group.groups ? group.groups.map(updateInGroup) : undefined
      };
    };
    
    const updatedConditions = updateInGroup(conditions);
    updateConditions(updatedConditions);
  }, [conditions, updateConditions]);

  // Test conditions
  const testConditions = useCallback(async () => {
    if (!onTest) return;

    setIsTesting(true);
    try {
      const result = await onTest(conditions, testData);
      setTestResults({
        success: result,
        message: result ? 'الشروط تمت بنجاح' : 'الشروط فشلت',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setTestResults({
        success: false,
        message: 'حدث خطأ أثناء الاختبار',
        error: error.message
      });
    } finally {
      setIsTesting(false);
    }
  }, [conditions, testData, onTest]);

  // Render condition field input
  const renderFieldInput = (condition: Condition, updateCondition: (updates: Partial<Condition>) => void) => {
    const fieldDef = Object.values(FIELD_DEFINITIONS)
      .flat()
      .find(f => f.name === condition.field);

    if (!fieldDef) return null;

    switch (fieldDef.type) {
      case 'text':
        return (
          <Input
            value={condition.value}
            onChange={(e) => updateCondition({ value: e.target.value })}
            placeholder={`أدخل ${fieldDef.label}`}
            disabled={readonly}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={condition.value}
            onChange={(e) => updateCondition({ value: parseFloat(e.target.value) || 0 })}
            placeholder={`أدخل ${fieldDef.label}`}
            disabled={readonly}
          />
        );

      case 'date':
        return (
          <Input
            type="datetime-local"
            value={condition.value}
            onChange={(e) => updateCondition({ value: e.target.value })}
            disabled={readonly}
          />
        );

      case 'boolean':
        return (
          <Select
            value={condition.value.toString()}
            onValueChange={(value) => updateCondition({ value: value === 'true' })}
            disabled={readonly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">صحيح</SelectItem>
              <SelectItem value="false">خطأ</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'select':
        return (
          <Select
            value={condition.value}
            onValueChange={(value) => updateCondition({ value })}
            disabled={readonly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fieldDef.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <Input
            value={Array.isArray(condition.value) ? condition.value.join(', ') : condition.value}
            onChange={(e) => updateCondition({ 
              value: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
            })}
            placeholder="افصل بين القيم بفواصل"
            disabled={readonly}
          />
        );

      default:
        return (
          <Input
            value={condition.value}
            onChange={(e) => updateCondition({ value: e.target.value })}
            placeholder={`أدخل ${fieldDef.label}`}
            disabled={readonly}
          />
        );
    }
  };

  // Render condition
  const renderCondition = (condition: Condition, groupId: string) => {
    const fieldDef = Object.values(FIELD_DEFINITIONS)
      .flat()
      .find(f => f.name === condition.field);

    return (
      <motion.div
        key={condition.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
      >
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Field Selection */}
            <Select
              value={condition.field}
              onValueChange={(field) => {
                const newFieldDef = Object.values(FIELD_DEFINITIONS)
                  .flat()
                  .find(f => f.name === field);
                
                updateCondition(condition.id, {
                  field,
                  config: {
                    ...condition.config,
                    fieldType: newFieldDef?.type,
                    source: 'lead'
                  },
                  value: newFieldDef?.type === 'boolean' ? true : ''
                });
              }}
              disabled={readonly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FIELD_DEFINITIONS).map(([source, fields]) => (
                  <div key={source}>
                    <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase">
                      {source === 'lead' ? 'عميل' : 
                       source === 'user' ? 'مستخدم' :
                       source === 'workspace' ? 'مساحة' :
                       source === 'system' ? 'نظام' : 'مخصص'}
                    </div>
                    {fields.map((field) => (
                      <SelectItem key={field.name} value={field.name}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>

            {/* Operator Selection */}
            <Select
              value={condition.operator}
              onValueChange={(operator) => updateCondition(condition.id, { operator })}
              disabled={readonly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">يساوي</SelectItem>
                <SelectItem value="not_equals">لا يساوي</SelectItem>
                <SelectItem value="contains">يحتوي على</SelectItem>
                <SelectItem value="not_contains">لا يحتوي على</SelectItem>
                <SelectItem value="greater_than">أكبر من</SelectItem>
                <SelectItem value="less_than">أقل من</SelectItem>
                <SelectItem value="greater_equal">أكبر من أو يساوي</SelectItem>
                <SelectItem value="less_equal">أقل من أو يساوي</SelectItem>
                <SelectItem value="in">في</SelectItem>
                <SelectItem value="not_in">ليس في</SelectItem>
                <SelectItem value="empty">فارغ</SelectItem>
                <SelectItem value="not_empty">غير فارغ</SelectItem>
              </SelectContent>
            </Select>

            {/* Value Input */}
            <div className="md:col-span-1">
              {!['empty', 'not_empty'].includes(condition.operator) && (
                renderFieldInput(condition, (updates) => updateCondition(condition.id, updates))
              )}
              {['empty', 'not_empty'].includes(condition.operator) && (
                <div className="text-sm text-gray-500 py-2">
                  هذا المشغل لا يتطلب قيمة
                </div>
              )}
            </div>

            {/* Condition Type */}
            <Select
              value={condition.type}
              onValueChange={(type) => updateCondition(condition.id, { 
                type: type as Condition['type'],
                config: { ...condition.config }
              })}
              disabled={readonly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="field">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Database className="w-4 h-4" />
                    <span>حقل قاعدة البيانات</span>
                  </div>
                </SelectItem>
                <SelectItem value="script">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Code className="w-4 h-4" />
                    <span>سكريبت مخصص</span>
                  </div>
                </SelectItem>
                <SelectItem value="api">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Globe className="w-4 h-4" />
                    <span>API خارجي</span>
                  </div>
                </SelectItem>
                <SelectItem value="ai">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Brain className="w-4 h-4" />
                    <span>ذكاء اصطناعي</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          {!readonly && (
            <div className="flex space-x-1 space-x-reverse">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedCondition(condition)}
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeCondition(condition.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Advanced Configuration */}
        {selectedCondition?.id === condition.id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <Tabs defaultValue="basic">
              <TabsList>
                <TabsTrigger value="basic">أساسي</TabsTrigger>
                <TabsTrigger value="advanced">متقدم</TabsTrigger>
                {condition.type === 'script' && <TabsTrigger value="script">سكريبت</TabsTrigger>}
                {condition.type === 'api' && <TabsTrigger value="api">API</TabsTrigger>}
                {condition.type === 'ai' && <TabsTrigger value="ai">ذكاء اصطناعي</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="basic" className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">الوصف</label>
                  <Input
                    value={condition.description || ''}
                    onChange={(e) => updateCondition(condition.id, { 
                      ...condition, 
                      description: e.target.value 
                    })}
                    placeholder="وصف اختياري للشروط"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">أولوية التنفيذ</label>
                  <Select
                    value={condition.priority || 'normal'}
                    onValueChange={(priority) => updateCondition(condition.id, { 
                      ...condition, 
                      priority 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="normal">عادية</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="critical">حرجة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {condition.type === 'script' && (
                <TabsContent value="script" className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">كود JavaScript</label>
                    <textarea
                      className="w-full h-32 p-2 border border-gray-300 rounded text-sm font-mono"
                      value={condition.config.script || ''}
                      onChange={(e) => updateCondition(condition.id, {
                        ...condition,
                        config: { ...condition.config, script: e.target.value }
                      })}
                      placeholder="// كود JavaScript مخصص&#10;// المتغير 'data' يحتوي على بيانات العميل&#10;// يجب أن ترجع true أو false&#10;return data.score > 75;"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      يمكنك استخدام المتغيرات: data (بيانات العميل), user (بيانات المستخدم)
                    </p>
                  </div>
                </TabsContent>
              )}

              {condition.type === 'api' && (
                <TabsContent value="api" className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">رابط API</label>
                    <Input
                      value={condition.config.apiEndpoint || ''}
                      onChange={(e) => updateCondition(condition.id, {
                        ...condition,
                        config: { ...condition.config, apiEndpoint: e.target.value }
                      })}
                      placeholder="https://api.example.com/check"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">المدخلات</label>
                    <textarea
                      className="w-full h-20 p-2 border border-gray-300 rounded text-sm"
                      value={JSON.stringify(condition.config.payload || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const payload = JSON.parse(e.target.value);
                          updateCondition(condition.id, {
                            ...condition,
                            config: { ...condition.config, payload }
                          });
                        } catch (err) {
                          // Ignore JSON parsing errors while typing
                        }
                      }}
                      placeholder='{"customerId": "{{lead.id}}"}'
                    />
                  </div>
                </TabsContent>
              )}

              {condition.type === 'ai' && (
                <TabsContent value="ai" className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">نموذج الذكاء الاصطناعي</label>
                    <Select
                      value={condition.config.aiModel || 'sentiment_analysis'}
                      onValueChange={(aiModel) => updateCondition(condition.id, {
                        ...condition,
                        config: { ...condition.config, aiModel }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sentiment_analysis">تحليل المشاعر</SelectItem>
                        <SelectItem value="intent_classification">تصنيف النية</SelectItem>
                        <SelectItem value="priority_scoring">تسجيل الأولوية</SelectItem>
                        <SelectItem value="churn_prediction">توقع التخلي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">عتبة الثقة (0-1)</label>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={condition.config.threshold || 0.7}
                      onChange={(e) => updateCondition(condition.id, {
                        ...condition,
                        config: { ...condition.config, threshold: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </motion.div>
        )}
      </motion.div>
    );
  };

  // Render condition group
  const renderConditionGroup = (group: ConditionGroup, level: number = 0) => {
    return (
      <motion.div
        key={group.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          ${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}
          bg-white border border-gray-200 rounded-lg p-4
        `}
      >
        {/* Group Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Badge variant="outline" className="text-xs">
              مستوى {level + 1}
            </Badge>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-sm font-medium">المنطق:</span>
              <Select
                value={group.logic}
                onValueChange={(logic) => {
                  const updateGroup = (g: ConditionGroup): ConditionGroup => {
                    if (g.id === group.id) {
                      return { ...g, logic: logic as 'AND' | 'OR' };
                    }
                    if (g.groups) {
                      return { ...g, groups: g.groups.map(updateGroup) };
                    }
                    return g;
                  };
                  updateConditions(updateGroup(conditions));
                }}
                disabled={readonly || level === 0}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">و (AND)</SelectItem>
                  <SelectItem value="OR">أو (OR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!readonly && level < 3 && (
            <div className="flex space-x-2 space-x-reverse">
              <Button
                size="sm"
                variant="outline"
                onClick={() => addCondition(group.id)}
              >
                <Plus className="w-4 h-4 ml-1" />
                شرط
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => addConditionGroup(group.id)}
              >
                <GitBranch className="w-4 h-4 ml-1" />
                مجموعة
              </Button>
            </div>
          )}
        </div>

        {/* Conditions */}
        <div className="space-y-3 mb-4">
          {group.conditions.map((condition) => 
            renderCondition(condition, group.id)
          )}
        </div>

        {/* Nested Groups */}
        {group.groups && group.groups.length > 0 && (
          <div className="space-y-4">
            {group.groups.map((nestedGroup) => 
              renderConditionGroup(nestedGroup, level + 1)
            )}
          </div>
        )}

        {/* Empty State */}
        {group.conditions.length === 0 && (!group.groups || group.groups.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <Filter className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">لا توجد شروط في هذه المجموعة</p>
            {!readonly && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => addCondition(group.id)}
                className="mt-2"
              >
                <Plus className="w-4 h-4 ml-1" />
                إضافة شرط
              </Button>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">بناء الشروط المتقدمة</h3>
          <p className="text-sm text-gray-600">
            إنشاء شروط معقدة مع منطق متعدد المستويات
          </p>
        </div>
        
        <div className="flex space-x-2 space-x-reverse">
          {onTest && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTestDialog(true)}
            >
              <Zap className="w-4 h-4 ml-2" />
              اختبار
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(conditions, null, 2));
              toast({
                title: 'تم النسخ',
                description: 'تم نسخ الشروط إلى الحافظة'
              });
            }}
          >
            <Copy className="w-4 h-4 ml-2" />
            نسخ
          </Button>
        </div>
      </div>

      {/* Conditions Tree */}
      <div className="bg-gray-50 rounded-lg p-4">
        {renderConditionGroup(conditions)}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {conditions.conditions.length}
            </div>
            <div className="text-sm text-gray-600">شروط</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {conditions.groups?.length || 0}
            </div>
            <div className="text-sm text-gray-600">مجموعات</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Object.values(conditions).filter((_, key) => 
                typeof conditions[key] === 'object' && conditions[key]?.type === 'script'
              ).length}
            </div>
            <div className="text-sm text-gray-600">سكريبتات</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Object.values(conditions).filter((_, key) => 
                typeof conditions[key] === 'object' && conditions[key]?.type === 'ai'
              ).length}
            </div>
            <div className="text-sm text-gray-600">ذكاء اصطناعي</div>
          </CardContent>
        </Card>
      </div>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>اختبار الشروط</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">بيانات الاختبار</label>
              <textarea
                className="w-full h-32 p-3 border border-gray-300 rounded text-sm font-mono"
                value={JSON.stringify(testData, null, 2)}
                onChange={(e) => {
                  try {
                    setTestData(JSON.parse(e.target.value));
                  } catch (err) {
                    // Ignore JSON parsing errors while typing
                  }
                }}
                placeholder='{"name": "أحمد محمد", "email": "ahmed@example.com", "score": 85}'
              />
            </div>
            
            {testResults && (
              <div className={`
                p-4 rounded-lg border
                ${testResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
              `}>
                <div className="flex items-center space-x-2 space-x-reverse">
                  {testResults.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    testResults.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResults.message}
                  </span>
                </div>
                {testResults.error && (
                  <p className="text-sm text-red-700 mt-1">{testResults.error}</p>
                )}
              </div>
            )}
            
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button
                variant="outline"
                onClick={() => setShowTestDialog(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={testConditions}
                disabled={isTesting}
              >
                {isTesting ? (
                  <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 ml-2" />
                )}
                تشغيل الاختبار
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedConditionsBuilder;