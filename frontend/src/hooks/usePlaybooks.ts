/**
 * Playbooks Hook - جلب بيانات الـ Playbooks
 * بديل للـ Mock Data في صفحة Playbooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

interface PlaybookStep {
  id: string;
  type: 'email' | 'sms' | 'call' | 'wait' | 'condition' | 'assign' | 'update_field';
  name: string;
  description: string;
  order: number;
  delay?: number; // in minutes
  conditions?: any[];
  template?: string;
  assignee?: string;
  field?: string;
  value?: any;
  isActive: boolean;
}

interface Playbook {
  id: string;
  name: string;
  description: string;
  category: 'lead_qualification' | 'nurturing' | 'conversion' | 'retention' | 'follow_up';
  status: 'active' | 'paused' | 'draft' | 'archived';
  trigger: {
    type: 'lead_created' | 'status_changed' | 'temperature_change' | 'manual' | 'score_threshold';
    conditions?: any[];
  };
  steps: PlaybookStep[];
  target_audience?: {
    tags?: string[];
    source?: string;
    status?: string[];
    temperature?: string[];
    priority?: string[];
  };
  metrics: {
    totalRuns: number;
    successRate: number;
    avgCompletionTime: number;
    currentActive: number;
    lastRun: string;
  };
  createdAt: string;
  updatedAt: string;
  owner: string;
  tags: string[];
  isPublic: boolean;
}

export interface PlaybooksFilters {
  search?: string;
  category?: string;
  status?: string;
  owner?: string;
  tags?: string[];
  isPublic?: boolean;
  sortBy?: 'created_at' | 'updated_at' | 'name' | 'metrics.totalRuns' | 'metrics.successRate';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PlaybooksResponse {
  playbooks: Playbook[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PlaybooksStats {
  totalPlaybooks: number;
  activePlaybooks: number;
  totalRuns: number;
  avgSuccessRate: number;
  totalActive: number;
  avgCompletionTime: number;
  categoryBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  monthlyGrowth: number;
}

// جلب قائمة الـ Playbooks
export function usePlaybooks(filters?: PlaybooksFilters) {
  return useQuery<PlaybooksResponse>({
    queryKey: ['playbooks', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.search) params.append('search', filters.search);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.owner) params.append('owner', filters.owner);
      if (filters?.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      if (filters?.tags && filters.tags.length > 0) {
        params.append('tags', filters.tags.join(','));
      }

      const response = await fetch(`/api/playbooks?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`فشل في جلب الـ Playbooks: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 دقائق
    cacheTime: 10 * 60 * 1000, // 10 دقائق
  });
}

// جلب playbook محدد
export function usePlaybook(playbookId: string) {
  return useQuery<Playbook>({
    queryKey: ['playbook', playbookId],
    queryFn: async () => {
      const response = await fetch(`/api/playbooks/${playbookId}`);
      
      if (!response.ok) {
        throw new Error(`فشل في جلب الـ Playbook: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!playbookId,
    staleTime: 5 * 60 * 1000, // 5 دقائق
  });
}

// جلب إحصائيات الـ Playbooks
export function usePlaybooksStats() {
  return useQuery<PlaybooksStats>({
    queryKey: ['playbooks-stats'],
    queryFn: async () => {
      const response = await fetch('/api/playbooks/stats');
      
      if (!response.ok) {
        throw new Error(`فشل في جلب إحصائيات الـ Playbooks: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 دقائق
  });
}

// إنشاء playbook جديد
export function useCreatePlaybook() {
  const queryClient = useQueryClient();
  
  return useMutation<Playbook, Error, Partial<Playbook>>({
    mutationFn: async (playbookData: Partial<Playbook>) => {
      const response = await fetch('/api/playbooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playbookData),
      });

      if (!response.ok) {
        throw new Error(`فشل في إنشاء الـ Playbook: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // إعادة تحميل قائمة الـ Playbooks
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      // إعادة تحميل الإحصائيات
      queryClient.invalidateQueries({ queryKey: ['playbooks-stats'] });
    },
  });
}

// تحديث playbook
export function useUpdatePlaybook() {
  const queryClient = useQueryClient();
  
  return useMutation<Playbook, Error, { playbookId: string; updates: Partial<Playbook> }>({
    mutationFn: async ({ playbookId, updates }) => {
      const response = await fetch(`/api/playbooks/${playbookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`فشل في تحديث الـ Playbook: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // تحديث الـ playbook في cache
      queryClient.setQueryData(['playbook', variables.playbookId], data);
      
      // إعادة تحميل قائمة الـ Playbooks
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      
      // إعادة تحميل الإحصائيات
      queryClient.invalidateQueries({ queryKey: ['playbooks-stats'] });
    },
  });
}

// حذف playbook
export function useDeletePlaybook() {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: async (playbookId: string) => {
      const response = await fetch(`/api/playbooks/${playbookId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`فشل في حذف الـ Playbook: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, playbookId) => {
      // إزالة الـ playbook من cache
      queryClient.removeQueries({ queryKey: ['playbook', playbookId] });
      
      // إعادة تحميل قائمة الـ Playbooks
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      
      // إعادة تحميل الإحصائيات
      queryClient.invalidateQueries({ queryKey: ['playbooks-stats'] });
    },
  });
}

// تفعيل/إيقاف playbook
export function useTogglePlaybookStatus() {
  const queryClient = useQueryClient();
  
  return useMutation<Playbook, Error, { playbookId: string; status: 'active' | 'paused' | 'draft' | 'archived' }>({
    mutationFn: async ({ playbookId, status }) => {
      const response = await fetch(`/api/playbooks/${playbookId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`فشل في تغيير حالة الـ Playbook: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // تحديث الـ playbook في cache
      queryClient.setQueryData(['playbook', variables.playbookId], data);
      
      // إعادة تحميل قائمة الـ Playbooks
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      
      // إعادة تحميل الإحصائيات
      queryClient.invalidateQueries({ queryKey: ['playbooks-stats'] });
    },
  });
}

// تشغيل playbook
export function useRunPlaybook() {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { playbookId: string; data?: any }>({
    mutationFn: async ({ playbookId, data }) => {
      const response = await fetch(`/api/playbooks/${playbookId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data || {}),
      });

      if (!response.ok) {
        throw new Error(`فشل في تشغيل الـ Playbook: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // إعادة تحميل قائمة الـ Playbooks
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      
      // إعادة تحميل الإحصائيات
      queryClient.invalidateQueries({ queryKey: ['playbooks-stats'] });
    },
  });
}

// نسخ playbook
export function useDuplicatePlaybook() {
  const queryClient = useQueryClient();
  
  return useMutation<Playbook, Error, { playbookId: string; newName?: string }>({
    mutationFn: async ({ playbookId, newName }) => {
      const response = await fetch(`/api/playbooks/${playbookId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName }),
      });

      if (!response.ok) {
        throw new Error(`فشل في نسخ الـ Playbook: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // إعادة تحميل قائمة الـ Playbooks
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      
      // إعادة تحميل الإحصائيات
      queryClient.invalidateQueries({ queryKey: ['playbooks-stats'] });
    },
  });
}

// استيراد Playbooks (JSON/CSV)
export function useImportPlaybooks() {
  const queryClient = useQueryClient();
  
  return useMutation<{ imported: number; errors: string[] }, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/playbooks/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`فشل في استيراد الـ Playbooks: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // إعادة تحميل قائمة الـ Playbooks
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      
      // إعادة تحميل الإحصائيات
      queryClient.invalidateQueries({ queryKey: ['playbooks-stats'] });
    },
  });
}

// تصدير Playbooks
export function useExportPlaybooks() {
  return useMutation<{ success: boolean }, Error, { format: 'json' | 'csv'; filters?: PlaybooksFilters }>({
    mutationFn: async ({ format, filters }) => {
      const params = new URLSearchParams();
      params.append('format', format);
      
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.owner) params.append('owner', filters.owner);

      const response = await fetch(`/api/playbooks/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`فشل في تصدير الـ Playbooks: ${response.statusText}`);
      }

      // تحويل إلى blob و download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `playbooks-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    },
  });
}

// Hook مخصص للـ Playbooks كاملاً
export function usePlaybooksComplete(filters?: PlaybooksFilters) {
  const playbooksQuery = usePlaybooks(filters);
  const statsQuery = usePlaybooksStats();
  
  const createPlaybookMutation = useCreatePlaybook();
  const updatePlaybookMutation = useUpdatePlaybook();
  const deletePlaybookMutation = useDeletePlaybook();
  const toggleStatusMutation = useTogglePlaybookStatus();
  const runPlaybookMutation = useRunPlaybook();
  const duplicatePlaybookMutation = useDuplicatePlaybook();
  const importPlaybooksMutation = useImportPlaybooks();
  const exportPlaybooksMutation = useExportPlaybooks();

  return {
    // Data
    playbooks: playbooksQuery.data?.playbooks || [],
    stats: statsQuery.data,
    
    // Loading states
    isLoading: playbooksQuery.isLoading || statsQuery.isLoading,
    isCreating: createPlaybookMutation.isPending,
    isUpdating: updatePlaybookMutation.isPending,
    isDeleting: deletePlaybookMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    isRunning: runPlaybookMutation.isPending,
    isDuplicating: duplicatePlaybookMutation.isPending,
    isImporting: importPlaybooksMutation.isPending,
    isExporting: exportPlaybooksMutation.isPending,
    
    // Error states
    error: playbooksQuery.error || statsQuery.error,
    createError: createPlaybookMutation.error,
    updateError: updatePlaybookMutation.error,
    deleteError: deletePlaybookMutation.error,
    toggleError: toggleStatusMutation.error,
    runError: runPlaybookMutation.error,
    duplicateError: duplicatePlaybookMutation.error,
    importError: importPlaybooksMutation.error,
    exportError: exportPlaybooksMutation.error,
    
    // Functions
    createPlaybook: createPlaybookMutation.mutate,
    updatePlaybook: updatePlaybookMutation.mutate,
    deletePlaybook: deletePlaybookMutation.mutate,
    togglePlaybookStatus: toggleStatusMutation.mutate,
    runPlaybook: runPlaybookMutation.mutate,
    duplicatePlaybook: duplicatePlaybookMutation.mutate,
    importPlaybooks: importPlaybooksMutation.mutate,
    exportPlaybooks: exportPlaybooksMutation.mutate,
    
    // Pagination
    pagination: {
      total: playbooksQuery.data?.total || 0,
      page: playbooksQuery.data?.page || 1,
      totalPages: playbooksQuery.data?.totalPages || 0,
      hasNextPage: playbooksQuery.data?.hasNextPage || false,
      hasPreviousPage: playbooksQuery.data?.hasPreviousPage || false,
    },
    
    // Refetch functions
    refetch: () => {
      playbooksQuery.refetch();
      statsQuery.refetch();
    },
    
    // Individual playbook operations
    refetchPlaybook: (playbookId: string) => {
      queryClient.invalidateQueries({ queryKey: ['playbook', playbookId] });
    },
  };
}