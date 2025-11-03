import { z } from 'zod';
import { 
  idSchema, 
  dateSchema, 
  createStatusEnum, 
  searchSchema, 
  paginationSchema,
  emailSchema,
  phoneSchema,
  arabicTextSchema
} from './common';

// ==================== LEADS SCHEMAS ====================

// Lead Status Enum
export const leadStatusEnum = createStatusEnum([
  'new',
  'contacted', 
  'qualified',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost'
] as const);

// Lead Priority Enum  
export const leadPriorityEnum = createStatusEnum([
  'low',
  'medium', 
  'high',
  'urgent'
] as const);

// Lead Source Enum
export const leadSourceEnum = createStatusEnum([
  'website',
  'social_media',
  'email_campaign',
  'referral',
  'phone_call',
  'direct_contact',
  'partnership',
  'trade_show',
  'advertisement',
  'other'
] as const);

// Create Lead Schema
export const createLeadSchema = z.object({
  name: z.string().min(1, 'اسم العميل مطلوب').max(100, 'اسم العميل يجب أن يكون أقل من 100 حرف'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  company: z.string().max(100, 'اسم الشركة يجب أن يكون أقل من 100 حرف').optional(),
  source: leadSourceEnum.optional(),
  priority: leadPriorityEnum.default('medium'),
  tags: z.array(z.string().max(30)).max(10, 'يمكن إضافة 10 وسوم كحد أقصى').optional(),
  notes: z.string().max(1000, 'الملاحظات يجب أن تكون أقل من 1000 حرف').optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  assignedTo: idSchema.optional(),
  expectedValue: z.number().positive('القيمة المتوقعة يجب أن تكون رقم موجب').optional(),
  budget: z.number().positive('الميزانية يجب أن تكون رقم موجب').optional(),
});

// Update Lead Schema
export const updateLeadSchema = z.object({
  name: z.string().min(1, 'اسم العميل مطلوب').max(100, 'اسم العميل يجب أن يكون أقل من 100 حرف').optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  company: z.string().max(100, 'اسم الشركة يجب أن يكون أقل من 100 حرف').optional(),
  source: leadSourceEnum.optional(),
  status: leadStatusEnum.optional(),
  priority: leadPriorityEnum.optional(),
  tags: z.array(z.string().max(30)).max(10, 'يمكن إضافة 10 وسوم كحد أقصى').optional(),
  notes: z.string().max(1000, 'الملاحظات يجب أن تكون أقل من 1000 حرف').optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  assignedTo: idSchema.optional(),
  expectedValue: z.number().positive('القيمة المتوقعة يجب أن تكون رقم موجب').optional(),
  budget: z.number().positive('الميزانية يجب أن تكون رقم موجب').optional(),
});

// Lead Schema (Complete)
export const leadSchema = z.object({
  id: idSchema,
  name: z.string(),
  email: emailSchema,
  phone: phoneSchema.optional(),
  company: z.string().optional(),
  source: leadSourceEnum.optional(),
  status: leadStatusEnum,
  priority: leadPriorityEnum,
  score: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  assignedTo: idSchema.optional(),
  assignedToUser: z.object({
    id: idSchema,
    firstName: z.string(),
    lastName: z.string(),
    email: emailSchema,
  }).optional(),
  expectedValue: z.number().optional(),
  budget: z.number().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema.optional(),
  createdBy: idSchema,
  createdByUser: z.object({
    id: idSchema,
    firstName: z.string(),
    lastName: z.string(),
    email: emailSchema,
  }),
  conversationCount: z.number().min(0),
  lastContactAt: dateSchema.optional(),
});

// Lead Filters Schema
export const leadFiltersSchema = z.object({
  status: z.array(leadStatusEnum).optional(),
  priority: z.array(leadPriorityEnum).optional(),
  source: z.array(leadSourceEnum).optional(),
  assignedTo: idSchema.optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  minScore: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional(),
  minExpectedValue: z.number().optional(),
  maxExpectedValue: z.number().optional(),
  tags: z.array(z.string()).optional(),
  search: searchSchema,
});

// Lead Search Schema
export const leadSearchSchema = z.object({
  query: searchSchema,
  filters: leadFiltersSchema.optional(),
});

// Lead Import Schema
export const leadImportSchema = z.object({
  csvFile: z.instanceof(File),
  mapping: z.record(z.string(), z.string()), // field -> column name
  skipFirstRow: z.boolean().default(false),
});

// Lead Export Schema
export const leadExportSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'pdf']),
  fields: z.array(z.string()),
  filters: leadFiltersSchema.optional(),
});

// Lead Batch Update Schema
export const leadBatchUpdateSchema = z.object({
  leadIds: z.array(idSchema).min(1).max(100, 'يمكن تحديث 100 عميل في نفس الوقت'),
  updates: z.object({
    status: leadStatusEnum.optional(),
    priority: leadPriorityEnum.optional(),
    assignedTo: idSchema.optional(),
    tags: z.array(z.string()).optional(),
  }),
});

// Lead Statistics Schema
export const leadStatisticsSchema = z.object({
  total: z.number().min(0),
  newThisWeek: z.number().min(0),
  newThisMonth: z.number().min(0),
  converted: z.number().min(0),
  conversionRate: z.number().min(0).max(100),
  averageScore: z.number().min(0).max(100),
  byStatus: z.record(leadStatusEnum, z.number()),
  bySource: z.record(leadSourceEnum, z.number()),
  byPriority: z.record(leadPriorityEnum, z.number()),
});

// Lead Conversion Schema
export const leadConversionSchema = z.object({
  leadId: idSchema,
  convertedAt: dateSchema,
  convertedValue: z.number().positive(),
  conversionType: z.enum(['sale', 'partnership', 'referral']),
  notes: z.string().max(500).optional(),
});

// ==================== FORM DATA TYPES ====================

export type CreateLeadFormData = z.infer<typeof createLeadSchema>;
export type UpdateLeadFormData = z.infer<typeof updateLeadSchema>;
export type LeadFormData = CreateLeadFormData | UpdateLeadFormData;
export type LeadFiltersFormData = z.infer<typeof leadFiltersSchema>;
export type LeadSearchFormData = z.infer<typeof leadSearchSchema>;
export type LeadImportFormData = z.infer<typeof leadImportSchema>;
export type LeadExportFormData = z.infer<typeof leadExportSchema>;
export type LeadBatchUpdateFormData = z.infer<typeof leadBatchUpdateSchema>;
export type LeadConversionFormData = z.infer<typeof leadConversionSchema>;

// API Response Types
export type LeadData = z.infer<typeof leadSchema>;
export type LeadStatisticsData = z.infer<typeof leadStatisticsSchema>;

// ==================== VALIDATION HELPERS ====================

// Lead scoring helper
export const calculateLeadScore = (lead: {
  source: string;
  company: string;
  email: string;
  phone: string;
}): number => {
  let score = 0;

  // Source scoring
  const sourceScores: Record<string, number> = {
    'referral': 40,
    'website': 30,
    'email_campaign': 25,
    'social_media': 20,
    'advertisement': 15,
    'other': 10,
  };
  score += sourceScores[lead.source] || 10;

  // Company size scoring
  if (lead.company) {
    if (lead.company.length > 10) score += 20;
    else score += 10;
  }

  // Email scoring
  if (lead.email) {
    if (lead.email.includes('.edu') || lead.email.includes('.org')) score += 15;
    else score += 10;
  }

  // Phone scoring
  if (lead.phone) score += 15;

  return Math.min(100, score);
};

// Lead priority determination
export const determineLeadPriority = (lead: {
  expectedValue: number;
  source: string;
  score: number;
}): 'low' | 'medium' | 'high' | 'urgent' => {
  if (lead.expectedValue > 10000 || lead.score > 80) return 'urgent';
  if (lead.expectedValue > 5000 || lead.score > 60) return 'high';
  if (lead.expectedValue > 1000 || lead.score > 40) return 'medium';
  return 'low';
};

// Validate lead data completeness
export const validateLeadCompleteness = (lead: Partial<LeadData>): {
  completeness: number;
  missingFields: string[];
  recommendations: string[];
} => {
  const requiredFields = ['name', 'email'];
  const optionalFields = ['phone', 'company', 'source', 'expectedValue'];
  
  let completeness = 0;
  const missingFields: string[] = [];
  const recommendations: string[] = [];

  // Check required fields
  requiredFields.forEach(field => {
    if (lead[field as keyof LeadData]) {
      completeness += (100 / requiredFields.length) * 0.6; // 60% for required fields
    } else {
      missingFields.push(field);
    }
  });

  // Check optional fields
  optionalFields.forEach(field => {
    if (lead[field as keyof LeadData]) {
      completeness += (100 / optionalFields.length) * 0.4; // 40% for optional fields
    } else {
      recommendations.push(`إضافة ${field} قد يحسن من فهم العميل`);
    }
  });

  return {
    completeness: Math.round(completeness),
    missingFields,
    recommendations
  };
};

// Lead data enrichment helper
export const enrichLeadData = (lead: CreateLeadFormData): CreateLeadFormData & {
  score: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
} => {
  const score = calculateLeadScore(lead);
  const priority = determineLeadPriority({
    expectedValue: lead.expectedValue || 0,
    source: lead.source || 'other',
    score
  });

  return {
    ...lead,
    score,
    priority
  };
};