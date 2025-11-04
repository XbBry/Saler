/**
 * Leads Hook - جلب بيانات العملاء المحتملين
 * بديل للـ Mock Data في صفحة Leads
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lead, PipelineStage, LeadActivity } from '@/types/lead';

export interface LeadsFilters {
  search?: string;
  status?: string;
  stage?: string;
  assignedTo?: string;
  source?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  sortBy?: 'created_at' | 'updated_at' | 'score' | 'value';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface LeadsResponse {
  leads: Lead[];
  pipelineStages: PipelineStage[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// جلب قائمة العملاء المحتملين
export function useLeads(filters?: LeadsFilters) {
  return useQuery<LeadsResponse>({
    queryKey: ['leads', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.stage) params.append('stage', filters.stage);
      if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
      if (filters?.source) params.append('source', filters.source);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      if (filters?.dateRange) {
        params.append('from', filters.dateRange.from.toISOString());
        params.append('to', filters.dateRange.to.toISOString());
      }

      const response = await fetch(`/api/leads?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`فشل في جلب العملاء المحتملين: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 دقائق
    cacheTime: 10 * 60 * 1000, // 10 دقائق
  });
}

// جلب عميل محتمل محدد
export function useLead(leadId: string) {
  return useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const response = await fetch(`/api/leads/${leadId}`);
      
      if (!response.ok) {
        throw new Error(`فشل في جلب العميل المحتمل: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!leadId,
    staleTime: 5 * 60 * 1000, // 5 دقائق
  });
}

// جلب أنشطة العميل المحتمل
export function useLeadActivities(leadId: string) {
  return useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: async () => {
      const response = await fetch(`/api/leads/${leadId}/activities`);
      
      if (!response.ok) {
        throw new Error(`فشل في جلب أنشطة العميل المحتمل: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!leadId,
    staleTime: 3 * 60 * 1000, // 3 دقائق
  });
}

// جلب stages في pipeline
export function usePipelineStages() {
  return useQuery<PipelineStage[]>({
    queryKey: ['pipeline-stages'],
    queryFn: async () => {
      const response = await fetch('/api/leads/pipeline');
      
      if (!response.ok) {
        throw new Error(`فشل في جلب pipeline stages: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 دقائق
  });
}

// إنشاء عميل محتمل جديد
export function useCreateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadData: Partial<Lead>) => {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        throw new Error(`فشل في إنشاء العميل المحتمل: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // إعادة تحميل قائمة العملاء المحتملين
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

// تحديث عميل محتمل
export function useUpdateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ leadId, updates }: { leadId: string; updates: Partial<Lead> }) => {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`فشل في تحديث العميل المحتمل: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // تحديث العميل المحتمل في cache
      queryClient.setQueryData(['lead', variables.leadId], data);
      
      // إعادة تحميل قائمة العملاء المحتملين
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

// حذف عميل محتمل
export function useDeleteLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadId: string) => {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`فشل في حذف العميل المحتمل: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // إعادة تحميل قائمة العملاء المحتملين
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

// نقل عميل محتمل إلى stage آخر
export function useMoveLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ leadId, stageId }: { leadId: string; stageId: string }) => {
      const response = await fetch(`/api/leads/${leadId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stageId }),
      });

      if (!response.ok) {
        throw new Error(`فشل في نقل العميل المحتمل: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // تحديث العميل المحتمل في cache
      queryClient.setQueryData(['lead', variables.leadId], data);
      
      // إعادة تحميل قائمة العملاء المحتملين
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      
      // إعادة تحميل pipeline stages
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
    },
  });
}

// إضافة نشاط للعميل المحتمل
export function useAddActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ leadId, activity }: { leadId: string; activity: Partial<LeadActivity> }) => {
      const response = await fetch(`/api/leads/${leadId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activity),
      });

      if (!response.ok) {
        throw new Error(`فشل في إضافة النشاط: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // تحديث أنشطة العميل المحتمل
      queryClient.setQueryData(['lead-activities', variables.leadId], (old: any) => 
        old ? [...old, data] : [data]
      );
      
      // إعادة تحميل العميل المحتمل
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      
      // إعادة تحميل قائمة العملاء المحتملين
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

// تصدير العملاء المحتملين (CSV)
export function useExportLeads() {
  return useMutation({
    mutationFn: async (filters?: LeadsFilters) => {
      const params = new URLSearchParams();
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.stage) params.append('stage', filters.stage);
      if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);

      const response = await fetch(`/api/leads/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`فشل في تصدير العملاء المحتملين: ${response.statusText}`);
      }

      // تحويل إلى blob و download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    },
  });
}

// إحصائيات العملاء المحتملين
export function useLeadsStats() {
  return useQuery({
    queryKey: ['leads-stats'],
    queryFn: async () => {
      const response = await fetch('/api/leads/stats');
      
      if (!response.ok) {
        throw new Error(`فشل في جلب إحصائيات العملاء المحتملين: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 دقائق
  });
}

// Hook مخصص للعملاء المحتملين كاملاً
export function useLeadsComplete(filters?: LeadsFilters) {
  const leadsQuery = useLeads(filters);
  const stagesQuery = usePipelineStages();
  const statsQuery = useLeadsStats();
  
  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();
  const deleteLeadMutation = useDeleteLead();
  const moveLeadMutation = useMoveLead();
  const addActivityMutation = useAddActivity();
  const exportLeadsMutation = useExportLeads();

  return {
    // Data
    leads: leadsQuery.data?.leads || [],
    pipelineStages: leadsQuery.data?.pipelineStages || stagesQuery.data || [],
    stats: statsQuery.data,
    
    // Loading states
    isLoading: leadsQuery.isLoading || stagesQuery.isLoading || statsQuery.isLoading,
    isCreating: createLeadMutation.isPending,
    isUpdating: updateLeadMutation.isPending,
    isDeleting: deleteLeadMutation.isPending,
    isMoving: moveLeadMutation.isPending,
    isAddingActivity: addActivityMutation.isPending,
    isExporting: exportLeadsMutation.isPending,
    
    // Error states
    error: leadsQuery.error || stagesQuery.error || statsQuery.error,
    createError: createLeadMutation.error,
    updateError: updateLeadMutation.error,
    deleteError: deleteLeadMutation.error,
    moveError: moveLeadMutation.error,
    addActivityError: addActivityMutation.error,
    exportError: exportLeadsMutation.error,
    
    // Functions
    createLead: createLeadMutation.mutate,
    updateLead: updateLeadMutation.mutate,
    deleteLead: deleteLeadMutation.mutate,
    moveLead: moveLeadMutation.mutate,
    addActivity: addActivityMutation.mutate,
    exportLeads: exportLeadsMutation.mutate,
    
    // Pagination
    pagination: {
      total: leadsQuery.data?.total || 0,
      page: leadsQuery.data?.page || 1,
      totalPages: leadsQuery.data?.totalPages || 0,
      hasNextPage: leadsQuery.data?.hasNextPage || false,
      hasPreviousPage: leadsQuery.data?.hasPreviousPage || false,
    },
    
    // Refetch functions
    refetch: () => {
      leadsQuery.refetch();
      stagesQuery.refetch();
      statsQuery.refetch();
    },
  };
}
