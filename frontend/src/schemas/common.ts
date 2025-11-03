import { z } from 'zod';

// ==================== COMMON SCHEMAS ====================

// API Response Schema
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    message: z.string().optional(),
    success: z.boolean(),
    timestamp: z.string().optional(),
  });

// API Error Schema
export const apiErrorSchema = z.object({
  message: z.string(),
  detail: z.string().optional(),
  status_code: z.number(),
  error: z.string().optional(),
});

// Pagination Schema
export const paginationSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1).max(100),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// Paginated Response Schema
export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().min(0),
    page: z.number().min(1),
    limit: z.number().min(1),
    total_pages: z.number().min(0),
    has_next: z.boolean(),
    has_previous: z.boolean(),
  });

// ID Schema
export const idSchema = z.string().uuid('يجب أن يكون المعرف في صيغة UUID صحيح');

// Date Schema
export const dateSchema = z.string().datetime('يجب أن يكون التاريخ في صيغة ISO 8601');

// Email Schema
export const emailSchema = z
  .string()
  .min(1, 'البريد الإلكتروني مطلوب')
  .email('يرجى إدخال بريد إلكتروني صحيح');

// Password Schema
export const passwordSchema = z
  .string()
  .min(1, 'كلمة المرور مطلوبة')
  .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم');

// Phone Schema
export const phoneSchema = z
  .string()
  .regex(/^[+]?[1-9]\d{1,14}$/, 'رقم الهاتف غير صحيح');

// URL Schema
export const urlSchema = z
  .string()
  .url('رابط غير صحيح');

// Search Query Schema
export const searchSchema = z
  .string()
  .max(100, 'البحث يجب أن يكون أقل من 100 حرف')
  .optional();

// Status Enum Schema
export const createStatusEnum = <T extends readonly string[]>(statuses: T) =>
  z.enum(statuses as [T[number], ...T[number][]]);

// File Upload Schema
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  type: z.enum(['image', 'video', 'document', 'audio']),
  maxSize: z.number().optional(),
});

// ==================== UTILITY SCHEMAS ====================

// Generic ID Type
export type SchemaType<T> = z.infer<T>;

// Generic API Response Type
export type ApiResponseType<T extends z.ZodType> = z.infer<ReturnType<typeof apiResponseSchema<T>>>;

// Generic Paginated Response Type
export type PaginatedResponseType<T extends z.ZodType> = z.infer<ReturnType<typeof paginatedResponseSchema<T>>>;

// ==================== VALIDATION HELPERS ====================

export const createRequiredMessage = (field: string) => `${field} مطلوب`;

export const createMinLengthMessage = (field: string, min: number) => 
  `${field} يجب أن يكون على الأقل ${min} أحرف`;

export const createMaxLengthMessage = (field: string, max: number) => 
  `${field} يجب أن يكون أقل من ${max} أحرف`;

export const createPatternMessage = (field: string, pattern: string) => 
  `${field} يجب أن يتبع الصيغة المطلوبة: ${pattern}`;

// ==================== PREPROCESSORS ====================

// Trim string values
export const trimString = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim() : val),
  z.string()
);

// Convert string to number
export const stringToNumber = z.preprocess(
  (val) => (typeof val === 'string' ? Number(val) : val),
  z.number()
);

// Convert string to boolean
export const stringToBoolean = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      return val.toLowerCase() === 'true';
    }
    return val;
  },
  z.boolean()
);

// ==================== CUSTOM VALIDATORS ====================

// Arabic text validator
export const arabicTextSchema = z
  .string()
  .regex(/^[\u0621-\u064A\s]+$/u, 'النص يجب أن يحتوي على أحرف عربية فقط');

// Strong password validator
export const strongPasswordSchema = z
  .string()
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'كلمة المرور يجب أن تحتوي على: حرف كبير، حرف صغير، رقم، ورمز خاص'
  )
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');

// ==================== SCHEMA VALIDATION UTILS ====================

export const validateSchema = <T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return {
      success: false,
      errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
    };
  }
};

// Real-time validation wrapper
export const createRealtimeValidator = <T>(schema: z.ZodType<T>) => {
  return (data: unknown): { isValid: boolean; errors: string[] } => {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { isValid: true, errors: [] };
    } else {
      return {
        isValid: false,
        errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
  };
};