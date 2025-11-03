import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { handleApiError } from '../lib/api';
import { messageUtils } from '../lib/message-utils';
import {
  MessageTemplate,
  MessageTemplateVariable,
  CreateMessageTemplateRequest,
  UpdateMessageTemplateRequest,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  MessageValidationResult,
} from '../types';

// ==================== HOOK INTERFACES ====================

interface UseMessageTemplatesProps {
  category?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableSearch?: boolean;
  onTemplateUpdate?: (template: MessageTemplate) => void;
  onTemplateCreate?: (template: MessageTemplate) => void;
  onTemplateDelete?: (templateId: string) => void;
}

interface UseMessageTemplatesReturn {
  // Data
  templates: MessageTemplate[];
  loading: boolean;
  error: string | null;
  
  // Pagination
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  
  // Search & Filter
  searchQuery: string;
  filteredTemplates: MessageTemplate[];
  categories: string[];
  searchTemplates: (query: string) => void;
  clearSearch: () => void;
  filterByCategory: (category: string) => void;
  clearFilters: () => void;
  
  // Template operations
  getTemplate: (templateId: string) => Promise<MessageTemplate>;
  createTemplate: (data: CreateMessageTemplateRequest) => Promise<MessageTemplate>;
  updateTemplate: (templateId: string, data: UpdateMessageTemplateRequest) => Promise<MessageTemplate>;
  deleteTemplate: (templateId: string) => Promise<void>;
  duplicateTemplate: (templateId: string) => Promise<MessageTemplate>;
  activateTemplate: (templateId: string) => Promise<void>;
  deactivateTemplate: (templateId: string) => Promise<void>;
  
  // Template utilities
  renderTemplate: (templateId: string, variables: Record<string, any>) => string;
  validateTemplateVariables: (templateId: string, variables: Record<string, any>) => MessageValidationResult;
  getTemplatePreview: (templateId: string, sampleVariables?: Record<string, any>) => string;
  extractTemplateVariables: (content: string) => string[];
  
  // Actions
  refreshTemplates: () => void;
  loadMoreTemplates: () => void;
  resetTemplates: () => void;
  
  // Utility
  getTemplateById: (id: string) => MessageTemplate | undefined;
  getTemplatesByCategory: (category: string) => MessageTemplate[];
  getActiveTemplates: () => MessageTemplate[];
  validateTemplateContent: (content: string, variables: Omit<MessageTemplateVariable, 'name'>[]) => MessageValidationResult;
}

// ==================== MOCK API SERVICE ====================

class TemplateApiService {
  private baseUrl = 'http://localhost:8000/api/v1';
  
  async getTemplates(params?: PaginationParams & { category?: string; search?: string }): Promise<ApiResponse<PaginatedResponse<MessageTemplate>>> {
    // Mock implementation - replace with actual API call
    const mockTemplates: MessageTemplate[] = [
      {
        id: '1',
        name: 'ترحيب بالعملاء',
        content: 'مرحباً {{client_name}}، أهلاً بك في {{company_name}}! نحن متحمسون لخدمتك.',
        variables: [
          { name: 'client_name', label: 'اسم العميل', type: 'text', required: true },
          { name: 'company_name', label: 'اسم الشركة', type: 'text', required: true },
        ],
        category: 'ترحيب',
        is_active: true,
        created_by: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'متابعة عرض السعر',
        content: 'عزيزي {{client_name}}، هل راجعت عرضنا المقدم في {{date}}؟ نحن جاهزون لخدمة استفساراتك.',
        variables: [
          { name: 'client_name', label: 'اسم العميل', type: 'text', required: true },
          { name: 'date', label: 'تاريخ العرض', type: 'date', required: false },
        ],
        category: 'متابعة',
        is_active: true,
        created_by: 'user-1',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];
    
    // Filter by category and search
    let filteredTemplates = mockTemplates;
    
    if (params?.category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === params.category);
    }
    
    if (params?.search) {
      const query = params.search.toLowerCase();
      filteredTemplates = filteredTemplates.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.content.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }
    
    const total = filteredTemplates.length;
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const items = filteredTemplates.slice(startIndex, endIndex);
    
    return {
      data: {
        items,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
        has_next: endIndex < total,
        has_previous: page > 1,
      },
      success: true,
    };
  }
  
  async getTemplate(templateId: string): Promise<ApiResponse<MessageTemplate>> {
    // Mock implementation
    return {
      data: {
        id: templateId,
        name: 'Template Example',
        content: 'Hello {{name}}, welcome to {{company}}!',
        variables: [
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'company', label: 'Company', type: 'text', required: true },
        ],
        category: 'General',
        is_active: true,
        created_by: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      success: true,
    };
  }
  
  async createTemplate(data: CreateMessageTemplateRequest): Promise<ApiResponse<MessageTemplate>> {
    // Mock implementation
    const newTemplate: MessageTemplate = {
      id: Date.now().toString(),
      ...data,
      is_active: data.is_active ?? true,
      created_by: 'current-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    return {
      data: newTemplate,
      success: true,
      message: 'تم إنشاء القالب بنجاح',
    };
  }
  
  async updateTemplate(templateId: string, data: UpdateMessageTemplateRequest): Promise<ApiResponse<MessageTemplate>> {
    // Mock implementation
    return {
      data: {
        id: templateId,
        name: data.name || 'Updated Template',
        content: data.content || 'Updated content',
        variables: data.variables || [],
        category: data.category || 'General',
        is_active: data.is_active ?? true,
        created_by: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      },
      success: true,
      message: 'تم تحديث القالب بنجاح',
    };
  }
  
  async deleteTemplate(templateId: string): Promise<ApiResponse<void>> {
    // Mock implementation
    return {
      data: undefined,
      success: true,
      message: 'تم حذف القالب بنجاح',
    };
  }
  
  async duplicateTemplate(templateId: string): Promise<ApiResponse<MessageTemplate>> {
    // Mock implementation
    const original = await this.getTemplate(templateId);
    const duplicated: MessageTemplate = {
      ...original.data,
      id: Date.now().toString(),
      name: `${original.data.name} - نسخة`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    return {
      data: duplicated,
      success: true,
      message: 'تم نسخ القالب بنجاح',
    };
  }
}

// Singleton instance
const templateApiService = new TemplateApiService();

// ==================== MAIN HOOK ====================

export const useMessageTemplates = ({
  category,
  autoRefresh = true,
  refreshInterval = 60000, // 1 minute
  enableSearch = true,
  onTemplateUpdate,
  onTemplateCreate,
  onTemplateDelete,
}: UseMessageTemplatesProps = {}): UseMessageTemplatesReturn => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category || '');
  
  // Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Query Client
  const queryClient = useQueryClient();
  
  // Pagination params
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 20,
    sort_by: 'name',
    sort_order: 'asc',
  });
  
  // Query params
  const queryParams = useMemo(() => ({
    ...pagination,
    category: selectedCategory || undefined,
    search: searchQuery || undefined,
  }), [pagination, selectedCategory, searchQuery]);
  
  // ==================== QUERIES ====================
  
  // Templates query
  const {
    data: templatesResponse,
    isLoading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates,
  } = useQuery<ApiResponse<PaginatedResponse<MessageTemplate>>>({
    queryKey: ['message-templates', queryParams],
    queryFn: () => templateApiService.getTemplates(queryParams),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 1000 * 60 * 5,
  });
  
  // ==================== MUTATIONS ====================
  
  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: CreateMessageTemplateRequest) => templateApiService.createTemplate(data),
    onSuccess: (response) => {
      // Add to cache
      queryClient.setQueryData<ApiResponse<PaginatedResponse<MessageTemplate>>>(
        ['message-templates', queryParams],
        (oldData) => {
          if (!oldData?.data?.items) return oldData;
          
          return {
            ...oldData,
            data: {
              ...oldData.data,
              items: [response.data, ...oldData.data.items],
              total: oldData.data.total + 1,
            },
          };
        }
      );
      
      onTemplateCreate?.(response.data);
    },
  });
  
  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: UpdateMessageTemplateRequest }) =>
      templateApiService.updateTemplate(templateId, data),
    onSuccess: (response, { templateId }) => {
      // Update in cache
      queryClient.setQueryData<ApiResponse<PaginatedResponse<MessageTemplate>>>(
        ['message-templates', queryParams],
        (oldData) => {
          if (!oldData?.data?.items) return oldData;
          
          return {
            ...oldData,
            data: {
              ...oldData.data,
              items: oldData.data.items.map(template =>
                template.id === templateId ? response.data : template
              ),
            },
          };
        }
      );
      
      // Invalidate individual template query
      queryClient.invalidateQueries({ queryKey: ['message-template', templateId] });
      
      onTemplateUpdate?.(response.data);
    },
  });
  
  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => templateApiService.deleteTemplate(templateId),
    onSuccess: (_, templateId) => {
      // Remove from cache
      queryClient.setQueryData<ApiResponse<PaginatedResponse<MessageTemplate>>>(
        ['message-templates', queryParams],
        (oldData) => {
          if (!oldData?.data?.items) return oldData;
          
          return {
            ...oldData,
            data: {
              ...oldData.data,
              items: oldData.data.items.filter(template => template.id !== templateId),
              total: oldData.data.total - 1,
            },
          };
        }
      );
      
      onTemplateDelete?.(templateId);
    },
  });
  
  // Duplicate template mutation
  const duplicateTemplateMutation = useMutation({
    mutationFn: (templateId: string) => templateApiService.duplicateTemplate(templateId),
    onSuccess: (response) => {
      // Add duplicated template to cache
      queryClient.setQueryData<ApiResponse<PaginatedResponse<MessageTemplate>>>(
        ['message-templates', queryParams],
        (oldData) => {
          if (!oldData?.data?.items) return oldData;
          
          return {
            ...oldData,
            data: {
              ...oldData.data,
              items: [response.data, ...oldData.data.items],
              total: oldData.data.total + 1,
            },
          };
        }
      );
    },
  });
  
  // ==================== SEARCH AND FILTER ====================
  
  const filteredTemplates = useMemo(() => {
    if (!templatesResponse?.data?.items) return [];
    
    let templates = [...templatesResponse.data.items];
    
    // Apply category filter
    if (selectedCategory) {
      templates = templates.filter(template => template.category === selectedCategory);
    }
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.content.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query)
      );
    }
    
    return templates;
  }, [templatesResponse?.data?.items, selectedCategory, searchQuery]);
  
  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    templatesResponse?.data?.items?.forEach(template => {
      if (template.category) {
        cats.add(template.category);
      }
    });
    return Array.from(cats).sort();
  }, [templatesResponse?.data?.items]);
  
  const searchTemplates = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
      refetchTemplates();
    }, 300);
  }, [refetchTemplates]);
  
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('');
    setPagination({
      page: 1,
      limit: 20,
      sort_by: 'name',
      sort_order: 'asc',
    });
    refetchTemplates();
  }, [refetchTemplates]);
  
  const filterByCategory = useCallback((cat: string) => {
    setSelectedCategory(cat);
    setPagination(prev => ({ ...prev, page: 1 }));
    refetchTemplates();
  }, [refetchTemplates]);
  
  const clearFilters = useCallback(() => {
    setSelectedCategory('');
    setSearchQuery('');
    setPagination({
      page: 1,
      limit: 20,
      sort_by: 'name',
      sort_order: 'asc',
    });
    refetchTemplates();
  }, [refetchTemplates]);
  
  // ==================== TEMPLATE OPERATIONS ====================
  
  const getTemplate = useCallback(async (templateId: string) => {
    const response = await templateApiService.getTemplate(templateId);
    return response.data;
  }, []);
  
  const createTemplate = useCallback(async (data: CreateMessageTemplateRequest) => {
    const response = await createTemplateMutation.mutateAsync(data);
    return response.data;
  }, [createTemplateMutation]);
  
  const updateTemplate = useCallback(async (templateId: string, data: UpdateMessageTemplateRequest) => {
    const response = await updateTemplateMutation.mutateAsync({ templateId, data });
    return response.data;
  }, [updateTemplateMutation]);
  
  const deleteTemplate = useCallback(async (templateId: string) => {
    await deleteTemplateMutation.mutateAsync(templateId);
  }, [deleteTemplateMutation]);
  
  const duplicateTemplate = useCallback(async (templateId: string) => {
    const response = await duplicateTemplateMutation.mutateAsync(templateId);
    return response.data;
  }, [duplicateTemplateMutation]);
  
  const activateTemplate = useCallback(async (templateId: string) => {
    await updateTemplate(templateId, { is_active: true });
  }, [updateTemplate]);
  
  const deactivateTemplate = useCallback(async (templateId: string) => {
    await updateTemplate(templateId, { is_active: false });
  }, [updateTemplate]);
  
  // ==================== TEMPLATE UTILITIES ====================
  
  const renderTemplate = useCallback((templateId: string, variables: Record<string, any>) => {
    const template = filteredTemplates.find(t => t.id === templateId);
    if (!template) return '';
    
    return messageUtils.renderTemplate(template, variables);
  }, [filteredTemplates]);
  
  const validateTemplateVariables = useCallback((templateId: string, variables: Record<string, any>) => {
    const template = filteredTemplates.find(t => t.id === templateId);
    if (!template) {
      return { is_valid: false, errors: ['Template not found'] };
    }
    
    return messageUtils.validateTemplateVariables(template, variables);
  }, [filteredTemplates]);
  
  const getTemplatePreview = useCallback((templateId: string, sampleVariables?: Record<string, any>) => {
    const template = filteredTemplates.find(t => t.id === templateId);
    if (!template) return '';
    
    const variables = sampleVariables || messageUtils.getTemplateVariables(template);
    return messageUtils.renderTemplate(template, variables);
  }, [filteredTemplates]);
  
  const extractTemplateVariables = useCallback((content: string) => {
    return messageUtils.extractMessageVariables(content);
  }, []);
  
  const validateTemplateContent = useCallback((content: string, variables: Omit<MessageTemplateVariable, 'name'>[]) => {
    const validation = messageUtils.validateMessage({ content, type: 'text' });
    
    // Additional validation for variables
    const variableNames = messageUtils.extractMessageVariables(content);
    const errors: string[] = [...validation.errors];
    
    variableNames.forEach(varName => {
      const variable = variables.find(v => v.label === varName || v.name === varName);
      if (!variable) {
        errors.push(`متغير غير معرف: ${varName}`);
      }
    });
    
    return {
      is_valid: errors.length === 0,
      errors,
      warnings: validation.warnings,
    };
  }, []);
  
  // ==================== PAGINATION & ACTIONS ====================
  
  const loadMoreTemplates = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      page: prev.page + 1,
    }));
  }, []);
  
  const refreshTemplates = useCallback(() => {
    refetchTemplates();
  }, [refetchTemplates]);
  
  const resetTemplates = useCallback(() => {
    setPagination({
      page: 1,
      limit: 20,
      sort_by: 'name',
      sort_order: 'asc',
    });
    setSearchQuery('');
    setSelectedCategory('');
    queryClient.invalidateQueries({ queryKey: ['message-templates'] });
  }, [queryClient]);
  
  // ==================== UTILITY METHODS ====================
  
  const getTemplateById = useCallback((id: string) => {
    return filteredTemplates.find(template => template.id === id);
  }, [filteredTemplates]);
  
  const getTemplatesByCategory = useCallback((cat: string) => {
    return filteredTemplates.filter(template => template.category === cat);
  }, [filteredTemplates]);
  
  const getActiveTemplates = useCallback(() => {
    return filteredTemplates.filter(template => template.is_active);
  }, [filteredTemplates]);
  
  // ==================== COMPUTED VALUES ====================
  
  const hasNextPage = templatesResponse?.data?.has_next || false;
  const hasPreviousPage = templatesResponse?.data?.has_previous || false;
  const currentPage = templatesResponse?.data?.page || 1;
  const totalPages = templatesResponse?.data?.total_pages || 1;
  const totalCount = templatesResponse?.data?.total || 0;
  
  const loading = templatesLoading || 
    createTemplateMutation.isPending || 
    updateTemplateMutation.isPending || 
    deleteTemplateMutation.isPending;
  const error = templatesError ? handleApiError(templatesError).message : null;
  
  // ==================== CLEANUP ====================
  
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  // ==================== RETURN ====================
  
  return {
    // Data
    templates: filteredTemplates,
    loading,
    error,
    
    // Pagination
    hasNextPage,
    hasPreviousPage,
    currentPage,
    totalPages,
    totalCount,
    
    // Search & Filter
    searchQuery,
    filteredTemplates,
    categories,
    searchTemplates,
    clearSearch,
    filterByCategory,
    clearFilters,
    
    // Template operations
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    activateTemplate,
    deactivateTemplate,
    
    // Template utilities
    renderTemplate,
    validateTemplateVariables,
    getTemplatePreview,
    extractTemplateVariables,
    
    // Actions
    refreshTemplates,
    loadMoreTemplates,
    resetTemplates,
    
    // Utility
    getTemplateById,
    getTemplatesByCategory,
    getActiveTemplates,
    validateTemplateContent,
  };
};

// ==================== DEFAULT EXPORT ====================

export default useMessageTemplates;