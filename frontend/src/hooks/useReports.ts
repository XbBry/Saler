/**
 * useReports - Comprehensive Reports Management Hook
 * Hook شامل لإدارة التقارير مع التصدير والجدولة والتخصيص
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { z } from 'zod';
import {
  DateRange,
  ChartDataPoint,
  ExportOptions,
  analyticsCache,
  convertToCSV,
  downloadFile,
} from '@/lib/analytics-utils';

// ========================
// Types and Schemas
// ========================

export interface ReportConfig {
  autoRefresh: boolean;
  defaultFormat: 'csv' | 'excel' | 'pdf' | 'json';
  enableScheduling: boolean;
  enableTemplates: boolean;
  maxReportSize: number;
  retentionPeriod: number; // days
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: ReportCategory;
  config: ReportConfig;
  fields: ReportField[];
  filters: Record<string, any>;
  schedule?: ReportSchedule;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'percentage';
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  format?: string;
  isRequired: boolean;
  groupBy?: string;
}

export interface ReportData {
  id: string;
  templateId: string;
  name: string;
  status: 'generating' | 'completed' | 'failed' | 'expired';
  format: 'csv' | 'excel' | 'pdf' | 'json';
  data: any[];
  metadata: ReportMetadata;
  generatedAt: Date;
  expiresAt: Date;
  downloadUrl?: string;
  error?: string;
}

export interface ReportMetadata {
  totalRecords: number;
  dateRange: DateRange;
  filters: Record<string, any>;
  executionTime: number;
  fileSize?: number;
  recordCount: number;
  fields: string[];
}

export interface ReportSchedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  recipients: string[];
  format: 'csv' | 'excel' | 'pdf';
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
}

export interface CustomReportRequest {
  name: string;
  description: string;
  fields: ReportField[];
  filters: Record<string, any>;
  dateRange: DateRange;
  groupBy?: string;
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  format: 'csv' | 'excel' | 'pdf' | 'json';
}

export type ReportCategory = 
  | 'sales'
  | 'revenue'
  | 'customers'
  | 'marketing'
  | 'performance'
  | 'financial'
  | 'custom';

// ========================
// Default Configuration
// ========================

const DEFAULT_REPORT_CONFIG: ReportConfig = {
  autoRefresh: false,
  defaultFormat: 'csv',
  enableScheduling: true,
  enableTemplates: true,
  maxReportSize: 10000,
  retentionPeriod: 30, // 30 days
};

// ========================
// Validation Schemas
// ========================

const ReportTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  category: z.enum(['sales', 'revenue', 'customers', 'marketing', 'performance', 'financial', 'custom']),
  config: z.any(),
  fields: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(['string', 'number', 'date', 'currency', 'percentage']),
    aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).optional(),
    format: z.string().optional(),
    isRequired: z.boolean(),
    groupBy: z.string().optional(),
  })),
  filters: z.record(z.any()),
  schedule: z.object({
    id: z.string(),
    name: z.string(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
    time: z.string(),
    dayOfWeek: z.number().optional(),
    dayOfMonth: z.number().optional(),
    recipients: z.array(z.string().email()),
    format: z.enum(['csv', 'excel', 'pdf']),
    isActive: z.boolean(),
    lastRun: z.date().optional(),
    nextRun: z.date(),
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const CustomReportRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  fields: z.array(z.any()),
  filters: z.record(z.any()),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }),
  groupBy: z.string().optional(),
  orderBy: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
  }).optional(),
  limit: z.number().positive().optional(),
  format: z.enum(['csv', 'excel', 'pdf', 'json']),
});

// ========================
// Hook Implementation
// ========================

export function useReports(config: Partial<ReportConfig> = {}) {
  // Merge config with defaults
  const finalConfig = { ...DEFAULT_REPORT_CONFIG, ...config };
  
  // State Management
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const generationTimeoutRef = useRef<NodeJS.Timeout>();
  const scheduleCheckIntervalRef = useRef<NodeJS.Timeout>();
  
  // ========================
  // Template Management
  // ========================
  
  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/reports/templates');
      if (!response.ok) {
        throw new Error('فشل في جلب قوالب التقارير');
      }
      
      const data = await response.json();
      setTemplates(data.templates || []);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ في جلب القوالب';
      setError(errorMessage);
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const createTemplate = useCallback(async (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTemplate: ReportTemplate = {
        ...template,
        id: `template-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const response = await fetch('/api/reports/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });
      
      if (!response.ok) {
        throw new Error('فشل في إنشاء القالب');
      }
      
      const created = await response.json();
      setTemplates(prev => [...prev, created]);
      
      return created;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في إنشاء القالب';
      setError(errorMessage);
      throw error;
    }
  }, []);
  
  const updateTemplate = useCallback(async (id: string, updates: Partial<ReportTemplate>) => {
    try {
      const response = await fetch(`/api/reports/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, updatedAt: new Date() }),
      });
      
      if (!response.ok) {
        throw new Error('فشل في تحديث القالب');
      }
      
      setTemplates(prev => prev.map(template =>
        template.id === id 
          ? { ...template, ...updates, updatedAt: new Date() }
          : template
      ));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحديث القالب';
      setError(errorMessage);
      throw error;
    }
  }, []);
  
  const deleteTemplate = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/reports/templates/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('فشل في حذف القالب');
      }
      
      setTemplates(prev => prev.filter(template => template.id !== id));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في حذف القالب';
      setError(errorMessage);
      throw error;
    }
  }, []);
  
  // ========================
  // Report Generation
  // ========================
  
  const generateReport = useCallback(async (
    templateId: string,
    customConfig?: Partial<CustomReportRequest>
  ): Promise<ReportData> => {
    try {
      setIsGenerating(true);
      setProgress(0);
      setError(null);
      
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        throw new Error('لم يتم العثور على القالب');
      }
      
      // Validate template
      ReportTemplateSchema.parse(template);
      
      // Start generation process
      const generationId = `report-${Date.now()}`;
      
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          generationId,
          config: customConfig,
        }),
      });
      
      if (!response.ok) {
        throw new Error('فشل في بدء عملية إنشاء التقرير');
      }
      
      // Monitor generation progress
      return new Promise((resolve, reject) => {
        const checkProgress = async () => {
          try {
            const progressResponse = await fetch(`/api/reports/progress/${generationId}`);
            
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              setProgress(progressData.percentage || 0);
              
              if (progressData.status === 'completed') {
                const reportData = progressData.report;
                setReports(prev => [...prev, reportData]);
                setIsGenerating(false);
                setProgress(100);
                resolve(reportData);
              } else if (progressData.status === 'failed') {
                setError(progressData.error || 'فشل في إنشاء التقرير');
                setIsGenerating(false);
                reject(new Error(progressData.error || 'فشل في إنشاء التقرير'));
              } else {
                // Continue monitoring
                generationTimeoutRef.current = setTimeout(checkProgress, 2000);
              }
            } else {
              throw new Error('فشل في متابعة تقدم الإنشاء');
            }
          } catch (error) {
            setError(error instanceof Error ? error.message : 'خطأ في متابعة التقدم');
            setIsGenerating(false);
            reject(error);
          }
        };
        
        // Start monitoring after initial request
        setTimeout(checkProgress, 1000);
      });
      
    } catch (error) {
      setIsGenerating(false);
      const errorMessage = error instanceof Error ? error.message : 'فشل في إنشاء التقرير';
      setError(errorMessage);
      throw error;
    }
  }, [templates]);
  
  const generateCustomReport = useCallback(async (request: CustomReportRequest) => {
    try {
      // Validate request
      CustomReportRequestSchema.parse(request);
      
      // Convert to template-like format
      const template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
        name: request.name,
        description: request.description,
        category: 'custom',
        config: { format: request.format },
        fields: request.fields,
        filters: request.filters,
      };
      
      // Create temporary template
      const tempTemplate: ReportTemplate = {
        ...template,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      return await generateReport(tempTemplate.id, request);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في إنشاء التقرير المخصص';
      setError(errorMessage);
      throw error;
    }
  }, [generateReport]);
  
  // ========================
  // Report Management
  // ========================
  
  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/reports');
      if (!response.ok) {
        throw new Error('فشل في جلب التقارير');
      }
      
      const data = await response.json();
      setReports(data.reports || []);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ في جلب التقارير';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const downloadReport = useCallback(async (reportId: string) => {
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) {
        throw new Error('لم يتم العثور على التقرير');
      }
      
      if (!report.downloadUrl) {
        throw new Error('رابط التحميل غير متوفر');
      }
      
      // Create download link
      const link = document.createElement('a');
      link.href = report.downloadUrl;
      link.download = `${report.name}.${report.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحميل التقرير';
      setError(errorMessage);
    }
  }, [reports]);
  
  const deleteReport = useCallback(async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('فشل في حذف التقرير');
      }
      
      setReports(prev => prev.filter(report => report.id !== reportId));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في حذف التقرير';
      setError(errorMessage);
    }
  }, []);
  
  // ========================
  // Scheduling Management
  // ========================
  
  const fetchSchedules = useCallback(async () => {
    try {
      const response = await fetch('/api/reports/schedules');
      if (!response.ok) {
        throw new Error('فشل في جلب الجدولة');
      }
      
      const data = await response.json();
      setSchedules(data.schedules || []);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ في جلب الجدولة';
      setError(errorMessage);
    }
  }, []);
  
  const createSchedule = useCallback(async (schedule: Omit<ReportSchedule, 'id' | 'lastRun' | 'nextRun'>) => {
    try {
      const newSchedule: ReportSchedule = {
        ...schedule,
        id: `schedule-${Date.now()}`,
        lastRun: undefined,
        nextRun: calculateNextRun(schedule),
      };
      
      const response = await fetch('/api/reports/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule),
      });
      
      if (!response.ok) {
        throw new Error('فشل في إنشاء الجدولة');
      }
      
      const created = await response.json();
      setSchedules(prev => [...prev, created]);
      
      return created;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في إنشاء الجدولة';
      setError(errorMessage);
      throw error;
    }
  }, []);
  
  const updateSchedule = useCallback(async (id: string, updates: Partial<ReportSchedule>) => {
    try {
      const updatedSchedule = {
        ...updates,
        nextRun: updates.frequency ? calculateNextRun({ ...updates as ReportSchedule, id }) : updates.nextRun,
      };
      
      const response = await fetch(`/api/reports/schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSchedule),
      });
      
      if (!response.ok) {
        throw new Error('فشل في تحديث الجدولة');
      }
      
      setSchedules(prev => prev.map(schedule =>
        schedule.id === id ? { ...schedule, ...updatedSchedule } : schedule
      ));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحديث الجدولة';
      setError(errorMessage);
    }
  }, []);
  
  const deleteSchedule = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/reports/schedules/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('فشل في حذف الجدولة');
      }
      
      setSchedules(prev => prev.filter(schedule => schedule.id !== id));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في حذف الجدولة';
      setError(errorMessage);
    }
  }, []);
  
  // ========================
  // Helper Functions
  // ========================
  
  const calculateNextRun = (schedule: ReportSchedule): Date => {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    
    switch (schedule.frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
        
      case 'weekly':
        if (schedule.dayOfWeek !== undefined) {
          const daysUntilNext = (schedule.dayOfWeek - now.getDay() + 7) % 7;
          nextRun.setDate(now.getDate() + daysUntilNext);
          if (nextRun <= now || nextRun.getDay() !== schedule.dayOfWeek) {
            nextRun.setDate(nextRun.getDate() + 7);
          }
        }
        break;
        
      case 'monthly':
        if (schedule.dayOfMonth !== undefined) {
          nextRun.setDate(schedule.dayOfMonth);
          if (nextRun <= now) {
            nextRun.setMonth(nextRun.getMonth() + 1);
            nextRun.setDate(schedule.dayOfMonth);
          }
        }
        break;
        
      case 'quarterly':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        nextRun.setMonth(currentQuarter * 3 + 3, 1);
        nextRun.setDate(schedule.dayOfMonth || 1);
        break;
    }
    
    return nextRun;
  };
  
  // ========================
  // Memoized Values
  // ========================
  
  const templatesByCategory = useMemo(() => {
    return templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as Record<ReportCategory, ReportTemplate[]>);
  }, [templates]);
  
  const activeSchedules = useMemo(() => {
    return schedules.filter(schedule => schedule.isActive);
  }, [schedules]);
  
  const recentReports = useMemo(() => {
    return reports
      .filter(report => report.status === 'completed')
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .slice(0, 10);
  }, [reports]);
  
  // ========================
  // Effects
  // ========================
  
  // Initial data fetch
  useEffect(() => {
    fetchTemplates();
    fetchReports();
    if (finalConfig.enableScheduling) {
      fetchSchedules();
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
      if (scheduleCheckIntervalRef.current) {
        clearInterval(scheduleCheckIntervalRef.current);
      }
    };
  }, []);
  
  // ========================
  // Public API
  // ========================
  
  return {
    // State
    templates,
    reports,
    schedules,
    isGenerating,
    isLoading,
    error,
    progress,
    
    // Computed values
    templatesByCategory,
    activeSchedules,
    recentReports,
    
    // Template actions
    createTemplate,
    updateTemplate,
    deleteTemplate,
    
    // Report actions
    generateReport,
    generateCustomReport,
    downloadReport,
    deleteReport,
    
    // Schedule actions
    createSchedule,
    updateSchedule,
    deleteSchedule,
    
    // Data fetching
    refreshTemplates: fetchTemplates,
    refreshReports: fetchReports,
    refreshSchedules: fetchSchedules,
    
    // Utils
    clearError: () => setError(null),
    clearProgress: () => setProgress(0),
    
    // Configuration
    config: finalConfig,
  };
}

// ========================
// Custom Hooks for Specific Report Types
// ========================

export function useSalesReports() {
  const reports = useReports();
  
  const salesTemplates = reports.templates.filter(t => t.category === 'sales');
  
  return {
    ...reports,
    salesTemplates,
    generateSalesReport: (templateId: string, config?: any) =>
      reports.generateReport(templateId, config),
  };
}

export function useRevenueReports() {
  const reports = useReports();
  
  const revenueTemplates = reports.templates.filter(t => t.category === 'revenue');
  
  return {
    ...reports,
    revenueTemplates,
    generateRevenueReport: (templateId: string, config?: any) =>
      reports.generateReport(templateId, config),
  };
}