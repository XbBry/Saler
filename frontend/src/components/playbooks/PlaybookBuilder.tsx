'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Play,
  Save,
  Settings,
  Copy,
  Trash2,
  Move,
  ArrowRight,
  ArrowDown,
  GitBranch,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  User,
  Target,
  Zap,
  Globe,
  Filter,
  Code,
  Eye,
  EyeOff,
  RefreshCw,
  Check,
  X,
  Info,
  AlertTriangle,
  Activity,
  Layers,
  GitMerge,
  Timer,
  MapPin,
  BarChart3,
  PieChart,
  TrendingUp,
  Database,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Progress } from '../ui/Progress';
import { useToast } from '../../hooks/useToast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Node Types
export interface PlaybookNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'end';
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config: any;
    icon?: React.ComponentType;
    color?: string;
    status?: 'active' | 'inactive' | 'error';
  };
  connections?: PlaybookConnection[];
}

export interface PlaybookConnection {
  id: string;
  source: string; // source node id
  target: string; // target node id
  sourceHandle?: string;
  targetHandle?: string;
  condition?: string;
  isDefault?: boolean;
}

export interface PlaybookFlow {
  id: string;
  name: string;
  description: string;
  nodes: PlaybookNode[];
  connections: PlaybookConnection[];
  variables: Record<string, any>;
  settings: {
    timeout: number;
    retryCount: number;
    failureStrategy: 'stop' | 'continue' | 'retry';
    notificationEnabled: boolean;
  };
}

// Node Templates
const NODE_TEMPLATES = {
  triggers: [
    {
      type: 'trigger',
      label: 'عميل جديد',
      description: 'تفعيل عند إنشاء عميل جديد',
      icon: Plus,
      color: 'bg-green-100 text-green-800 border-green-200',
      config: {
        condition: '',
        filters: []
      }
    },
    {
      type: 'trigger',
      label: 'تغيير درجة الحرارة',
      description: 'تفعيل عند تغيير درجة حرارة العميل',
      icon: TrendingUp,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      config: {
        temperature: 'hot',
        previousTemperature: ''
      }
    },
    {
      type: 'trigger',
      label: 'عدم الرد',
      description: 'تفعيل بعد فترة عدم الرد',
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      config: {
        days: 3,
        message: 'العميل لم يرد منذ 3 أيام'
      }
    },
    {
      type: 'trigger',
      label: 'تحديث الحالة',
      description: 'تفعيل عند تغيير حالة العميل',
      icon: Activity,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      config: {
        status: 'interested',
        previousStatus: ''
      }
    },
    {
      type: 'trigger',
      label: 'مرجع خارجي',
      description: 'تفعيل بواسطة webhook أو API',
      icon: Globe,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      config: {
        webhook: '',
        apiKey: '',
        eventType: ''
      }
    }
  ],
  actions: [
    {
      type: 'action',
      label: 'إرسال رسالة',
      description: 'إرسال رسالة عبر قناة محددة',
      icon: Mail,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      config: {
        channel: 'whatsapp',
        template: '',
        personalization: {},
        sendAt: 'now'
      }
    },
    {
      type: 'action',
      label: 'مكالمة',
      description: 'إنشاء مهمة مكالمة',
      icon: Phone,
      color: 'bg-green-100 text-green-800 border-green-200',
      config: {
        assignee: '',
        priority: 'medium',
        dueDate: '',
        notes: ''
      }
    },
    {
      type: 'action',
      label: 'إشعار داخلي',
      description: 'إرسال إشعار للفريق',
      icon: Bell,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      config: {
        recipients: [],
        message: '',
        priority: 'normal'
      }
    },
    {
      type: 'action',
      label: 'تحديث البيانات',
      description: 'تحديث بيانات العميل',
      icon: Database,
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      config: {
        fields: {},
        source: 'manual'
      }
    },
    {
      type: 'action',
      label: 'API Call',
      description: 'استدعاء API خارجي',
      icon: ExternalLink,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      config: {
        url: '',
        method: 'POST',
        headers: {},
        body: {},
        timeout: 30
      }
    },
    {
      type: 'action',
      label: 'Webhook',
      description: 'إرسال webhook',
      icon: Globe,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      config: {
        url: '',
        payload: {},
        headers: {},
        retry: true
      }
    }
  ],
  conditions: [
    {
      type: 'condition',
      label: 'شرط بسيط',
      description: 'تقييم شرط واحد',
      icon: Target,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      config: {
        field: '',
        operator: 'equals',
        value: ''
      }
    },
    {
      type: 'condition',
      label: 'شرط متعدد',
      description: 'تقييم عدة شروط',
      icon: GitMerge,
      color: 'bg-red-100 text-red-800 border-red-200',
      config: {
        conditions: [],
        logic: 'AND'
      }
    },
    {
      type: 'condition',
      label: 'تحليل ذكي',
      description: 'تقييم ذكي باستخدام AI',
      icon: Brain,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      config: {
        aiModel: 'sentiment_analysis',
        threshold: 0.7,
        parameters: {}
      }
    }
  ],
  delays: [
    {
      type: 'delay',
      label: 'انتظار ثابت',
      description: 'انتظار لمدة محددة',
      icon: Timer,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      config: {
        amount: 1,
        unit: 'hours'
      }
    },
    {
      type: 'delay',
      label: 'انتظار ذكي',
      description: 'انتظار بناءً على أوقات ذكية',
      icon: Brain,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      config: {
        strategy: 'business_hours',
        timezone: 'UTC',
        workingHours: {}
      }
    }
  ],
  ends: [
    {
      type: 'end',
      label: 'إنهاء ناجح',
      description: 'إنهاء الـ playbook كنجاح',
      icon: Check,
      color: 'bg-green-100 text-green-800 border-green-200',
      config: {
        finalStatus: 'success',
        notifyTeam: false
      }
    },
    {
      type: 'end',
      label: 'إنهاء فاشل',
      description: 'إنهاء الـ playbook كفشل',
      icon: X,
      color: 'bg-red-100 text-red-800 border-red-200',
      config: {
        finalStatus: 'failed',
        notifyTeam: true
      }
    }
  ]
};

interface PlaybookBuilderProps {
  initialFlow?: PlaybookFlow;
  onSave?: (flow: PlaybookFlow) => void;
  onTest?: (flow: PlaybookFlow) => void;
  onPreview?: (flow: PlaybookFlow) => void;
}

export const PlaybookBuilder: React.FC<PlaybookBuilderProps> = ({
  initialFlow,
  onSave,
  onTest,
  onPreview
}) => {
  const [flow, setFlow] = useState<PlaybookFlow>(
    initialFlow || {
      id: 'new-flow',
      name: 'Playbook جديد',
      description: '',
      nodes: [],
      connections: [],
      variables: {},
      settings: {
        timeout: 300,
        retryCount: 3,
        failureStrategy: 'stop',
        notificationEnabled: true
      }
    }
  );

  const [selectedNode, setSelectedNode] = useState<PlaybookNode | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [draggedTemplate, setDraggedTemplate] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Canvas dimensions
  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 800;

  // Add node to canvas
  const addNode = useCallback((template: any, position?: { x: number; y: number }) => {
    const newNode: PlaybookNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      position: position || { x: 100, y: 100 },
      data: {
        label: template.label,
        description: template.description,
        config: { ...template.config },
        icon: template.icon,
        color: template.color,
        status: 'active'
      }
    };

    setFlow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));

    setSelectedNode(newNode);
    setShowTemplates(false);
  }, []);

  // Remove node
  const removeNode = useCallback((nodeId: string) => {
    setFlow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      connections: prev.connections.filter(
        conn => conn.source !== nodeId && conn.target !== nodeId
      )
    }));

    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  // Update node
  const updateNode = useCallback((nodeId: string, updates: Partial<PlaybookNode>) => {
    setFlow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));
  }, []);

  // Create connection between nodes
  const createConnection = useCallback((sourceId: string, targetId: string, condition?: string) => {
    const newConnection: PlaybookConnection = {
      id: `conn-${Date.now()}`,
      source: sourceId,
      target: targetId,
      condition
    };

    setFlow(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection]
    }));
  }, []);

  // Validate flow
  const validateFlow = useCallback(() => {
    const errors: string[] = [];

    // Check for start trigger
    const triggers = flow.nodes.filter(node => node.type === 'trigger');
    if (triggers.length === 0) {
      errors.push('يجب وجود نقطة تفعيل واحدة على الأقل');
    }

    // Check for end nodes
    const ends = flow.nodes.filter(node => node.type === 'end');
    if (ends.length === 0) {
      errors.push('يجب وجود نقطة نهاية واحدة على الأقل');
    }

    // Check for unreachable nodes
    const reachableNodes = new Set<string>();
    const queue = [...triggers.map(t => t.id)];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (reachableNodes.has(nodeId)) continue;
      
      reachableNodes.add(nodeId);
      const connections = flow.connections.filter(c => c.source === nodeId);
      
      for (const conn of connections) {
        if (!reachableNodes.has(conn.target)) {
          queue.push(conn.target);
        }
      }
    }

    const unreachableNodes = flow.nodes.filter(node => 
      !reachableNodes.has(node.id) && node.type !== 'trigger'
    );

    if (unreachableNodes.length > 0) {
      errors.push(`يوجد ${unreachableNodes.length} عقدة غير قابلة للوصول`);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [flow]);

  // Save flow
  const saveFlow = useCallback(async () => {
    if (!validateFlow()) {
      toast({
        title: 'أخطاء في التحقق',
        description: 'يرجى إصلاح الأخطاء قبل الحفظ',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(flow);
      }

      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ الـ Playbook بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ في الحفظ',
        description: 'فشل في حفظ الـ Playbook',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }, [flow, onSave, toast]);

  // Render node
  const renderNode = (node: PlaybookNode) => {
    const IconComponent = node.data.icon || Activity;
    const isSelected = selectedNode?.id === node.id;

    return (
      <motion.div
        key={node.id}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={`
          absolute cursor-pointer select-none
          ${isSelected ? 'ring-2 ring-blue-500' : ''}
          ${node.data.color || 'bg-gray-100 border-gray-200'}
          rounded-lg border-2 p-4 shadow-lg min-w-[200px]
        `}
        style={{
          left: node.position.x,
          top: node.position.y,
          transform: 'translate(-50%, -50%)'
        }}
        onClick={() => setSelectedNode(node)}
      >
        <div className="flex items-center space-x-2 space-x-reverse">
          <IconComponent className="w-5 h-5" />
          <div className="flex-1">
            <div className="font-medium text-sm">{node.data.label}</div>
            {node.data.description && (
              <div className="text-xs opacity-70 mt-1">
                {node.data.description}
              </div>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {node.type}
          </Badge>
        </div>
        
        {node.data.status === 'error' && (
          <AlertTriangle className="w-4 h-4 text-red-500 mt-1" />
        )}
      </motion.div>
    );
  };

  // Render connection
  const renderConnection = (connection: PlaybookConnection) => {
    const sourceNode = flow.nodes.find(n => n.id === connection.source);
    const targetNode = flow.nodes.find(n => n.id === connection.target);

    if (!sourceNode || !targetNode) return null;

    const startX = sourceNode.position.x;
    const startY = sourceNode.position.y;
    const endX = targetNode.position.x;
    const endY = targetNode.position.y;

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <defs>
          <marker
            id={`arrowhead-${connection.id}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#666"
            />
          </marker>
        </defs>
        
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="#666"
          strokeWidth="2"
          markerEnd={`url(#arrowhead-${connection.id})`}
          strokeDasharray={connection.isDefault ? "5,5" : undefined}
        />
        
        {connection.condition && (
          <text
            x={midX}
            y={midY - 10}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            {connection.condition}
          </text>
        )}
      </svg>
    );
  };

  return (
    <div className="h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar - Node Templates */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-2">منشئ الـ Playbooks</h2>
          <div className="flex space-x-2 space-x-reverse">
            <Button
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
              variant="outline"
            >
              <Layers className="w-4 h-4 ml-2" />
              القوالب
            </Button>
            <Button
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              variant="outline"
            >
              {previewMode ? <EyeOff className="w-4 h-4 ml-2" /> : <Eye className="w-4 h-4 ml-2" />}
              معاينة
            </Button>
          </div>
        </div>

        {/* Node Templates */}
        <AnimatePresence>
          {showTemplates && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="overflow-y-auto"
            >
              <div className="p-4 space-y-4">
                {Object.entries(NODE_TEMPLATES).map(([category, templates]) => (
                  <div key={category}>
                    <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {templates.map((template, index) => (
                        <Card
                          key={index}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => addNode(template)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <template.icon className="w-4 h-4" />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{template.label}</div>
                                <div className="text-xs text-gray-600">{template.description}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Properties Panel */}
        {selectedNode && !previewMode && (
          <div className="flex-1 border-t border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-medium mb-3">إعدادات العقدة</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">الاسم</label>
                <Input
                  value={selectedNode.data.label}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: { ...selectedNode.data, label: e.target.value }
                    };
                    updateNode(selectedNode.id, { data: updatedNode.data });
                    setSelectedNode(updatedNode);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">الوصف</label>
                <Input
                  value={selectedNode.data.description || ''}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: { ...selectedNode.data, description: e.target.value }
                    };
                    updateNode(selectedNode.id, { data: updatedNode.data });
                    setSelectedNode(updatedNode);
                  }}
                />
              </div>

              {/* Dynamic config fields based on node type */}
              {selectedNode.type === 'action' && selectedNode.data.config.channel && (
                <div>
                  <label className="block text-sm font-medium mb-1">القناة</label>
                  <Select
                    value={selectedNode.data.config.channel}
                    onValueChange={(value) => {
                      const config = { ...selectedNode.data.config, channel: value };
                      const updatedNode = {
                        ...selectedNode,
                        data: { ...selectedNode.data, config }
                      };
                      updateNode(selectedNode.id, { data: updatedNode.data });
                      setSelectedNode(updatedNode);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">واتساب</SelectItem>
                      <SelectItem value="email">إيميل</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex space-x-2 space-x-reverse">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeNode(selectedNode.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const duplicate = {
                      ...selectedNode,
                      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      position: {
                        x: selectedNode.position.x + 50,
                        y: selectedNode.position.y + 50
                      }
                    };
                    addNode(duplicate, duplicate.position);
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {/* Canvas Header */}
        <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{flow.name}</h1>
              <p className="text-sm text-gray-600">{flow.description}</p>
            </div>
            
            <div className="flex space-x-2 space-x-reverse">
              {onPreview && (
                <Button variant="outline" size="sm" onClick={() => onPreview(flow)}>
                  <Eye className="w-4 h-4 ml-2" />
                  معاينة
                </Button>
              )}
              
              {onTest && (
                <Button variant="outline" size="sm" onClick={() => onTest(flow)}>
                  <Play className="w-4 h-4 ml-2" />
                  اختبار
                </Button>
              )}
              
              <Button 
                size="sm" 
                onClick={saveFlow}
                disabled={isSaving}
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 ml-2" />
                )}
                حفظ
              </Button>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center space-x-2 space-x-reverse">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">أخطاء التحقق:</span>
              </div>
              <ul className="mt-1 text-sm text-red-700">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Flow Canvas */}
        <div
          ref={canvasRef}
          className="absolute inset-0 bg-white"
          style={{ 
            paddingTop: '80px',
            backgroundImage: `
              linear-gradient(to right, #f0f0f0 1px, transparent 1px),
              linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        >
          {/* Render Connections */}
          <div className="absolute inset-0 pointer-events-none">
            {flow.connections.map(renderConnection)}
          </div>

          {/* Render Nodes */}
          <div className="relative">
            <AnimatePresence>
              {flow.nodes.map(renderNode)}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {flow.nodes.length === 0 && !previewMode && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ابدأ ببناء الـ Playbook
                </h3>
                <p className="text-gray-600 mb-4">
                  اسحب القوالب من الشريط الجانبي أو انقر عليها لإضافتها
                </p>
                <Button onClick={() => setShowTemplates(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة عقدة
                </Button>
              </div>
            </div>
          )}

          {/* Preview Mode Indicator */}
          {previewMode && (
            <div className="absolute top-4 left-4 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              <Eye className="w-4 h-4 inline ml-1" />
              وضع المعاينة
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaybookBuilder;