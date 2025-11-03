// ==================== ZOD VALIDATION SYSTEM ====================
// Centralized Schema Exports and Validation Utilities

// Common schemas
export * from './common';

// Authentication schemas
export * from './auth';

// Lead management schemas
export * from './leads';

// Message and communication schemas
export * from './messages';

// Integration schemas
export * from './integrations';

// ==================== SCHEMA VALIDATION ENGINE ====================

import { z, ZodSchema, ZodError } from 'zod';
import { SchemaType } from './common';

// Universal validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  warnings?: string[];
  metadata?: {
    validatedAt: string;
    schema: string;
    version: string;
  };
}

// Detailed validation error
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  path: string[];
  received?: any;
  expected?: any;
}

// ==================== VALIDATION ENGINE ====================

export class ZodValidationEngine {
  private schemas: Map<string, ZodSchema> = new Map();
  private validators: Map<string, (data: any) => ValidationResult<any>> = new Map();

  constructor() {
    this.initializeCommonValidators();
  }

  // Register a schema
  registerSchema<T>(name: string, schema: ZodSchema<T>): void {
    this.schemas.set(name, schema);
  }

  // Register a custom validator
  registerValidator<T>(
    name: string,
    validator: (data: any) => ValidationResult<T>
  ): void {
    this.validators.set(name, validator);
  }

  // Validate data against a registered schema
  async validate<T>(
    schemaName: string,
    data: unknown,
    options?: {
      stripUnknown?: boolean;
      abortEarly?: boolean;
      includeWarnings?: boolean;
    }
  ): Promise<ValidationResult<T>> {
    const schema = this.schemas.get(schemaName);
    
    if (!schema) {
      throw new Error(`Schema '${schemaName}' not found`);
    }

    try {
      const result = schema.safeParse(data, {
        errorMap: (error) => {
          if (error.code === 'invalid_type') {
            if (error.expected === 'string') {
              return { message: 'هذا الحقل مطلوب' };
            }
            return { message: `نوع البيانات غير صحيح، المتوقع: ${error.expected}` };
          }
          if (error.code === 'too_small') {
            return { message: `يجب أن يكون ${error.inclusive ? 'على الأقل' : 'أكثر من'} ${error.minimum} حرف` };
          }
          if (error.code === 'too_big') {
            return { message: `يجب أن يكون أقل من ${error.maximum} حرف` };
          }
          if (error.code === 'custom') {
            return { message: error.message || 'قيمة غير صحيحة' };
          }
          return { message: error.message || 'خطأ في التحقق من البيانات' };
        }
      });

      if (result.success) {
        const warnings = options?.includeWarnings ? this.generateWarnings(schemaName, result.data) : undefined;
        
        return {
          success: true,
          data: result.data as T,
          warnings,
          metadata: {
            validatedAt: new Date().toISOString(),
            schema: schemaName,
            version: '1.0.0'
          }
        };
      } else {
        const errors = this.formatZodErrors(result.error);
        
        return {
          success: false,
          errors,
          metadata: {
            validatedAt: new Date().toISOString(),
            schema: schemaName,
            version: '1.0.0'
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'system',
          message: error instanceof Error ? error.message : 'خطأ غير متوقع',
          code: 'SYSTEM_ERROR',
          path: []
        }],
        metadata: {
          validatedAt: new Date().toISOString(),
          schema: schemaName,
          version: '1.0.0'
        }
      };
    }
  }

  // Validate data using custom validator
  async validateWithCustom<T>(
    validatorName: string,
    data: unknown
  ): Promise<ValidationResult<T>> {
    const validator = this.validators.get(validatorName);
    
    if (!validator) {
      throw new Error(`Custom validator '${validatorName}' not found`);
    }

    return await validator(data);
  }

  // Batch validation
  async validateBatch(
    validations: Array<{
      schemaName?: string;
      validatorName?: string;
      data: unknown;
    }>
  ): Promise<Array<ValidationResult<any>>> {
    return await Promise.all(
      validations.map(async (validation) => {
        if (validation.schemaName) {
          return await this.validate(validation.schemaName, validation.data);
        } else if (validation.validatorName) {
          return await this.validateWithCustom(validation.validatorName, validation.data);
        } else {
          throw new Error('Either schemaName or validatorName must be provided');
        }
      })
    );
  }

  // Real-time validation
  createRealtimeValidator<T>(schemaName: string) {
    return (data: unknown): ValidationResult<T> => {
      const schema = this.schemas.get(schemaName);
      
      if (!schema) {
        return {
          success: false,
          errors: [{
            field: 'system',
            message: `Schema '${schemaName}' not found`,
            code: 'SCHEMA_NOT_FOUND',
            path: []
          }]
        };
      }

      const result = schema.safeParse(data);
      
      if (result.success) {
        return {
          success: true,
          data: result.data as T,
          metadata: {
            validatedAt: new Date().toISOString(),
            schema: schemaName,
            version: '1.0.0'
          }
        };
      } else {
        return {
          success: false,
          errors: this.formatZodErrors(result.error)
        };
      }
    };
  }

  // Private helper methods
  private formatZodErrors(error: ZodError): ValidationError[] {
    return error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
      path: err.path as string[],
      received: err.received,
      expected: err.expected
    }));
  }

  private generateWarnings(schemaName: string, data: any): string[] {
    const warnings: string[] = [];
    
    // Add custom warning logic here
    if (schemaName === 'createLead' && data.email?.includes('example.com')) {
      warnings.push('يُنصح باستخدام بريد إلكتروني حقيقي');
    }
    
    if (schemaName === 'integrationConfig' && data.credentials?.apiKey?.length < 20) {
      warnings.push('مفتاح API قصير قد يكون غير آمن');
    }
    
    return warnings;
  }

  private initializeCommonValidators(): void {
    // Initialize common validators that don't require schemas
    this.registerValidator('email', (data: { email: string }) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!data.email) {
        return {
          success: false,
          errors: [{
            field: 'email',
            message: 'البريد الإلكتروني مطلوب',
            code: 'REQUIRED',
            path: ['email']
          }]
        };
      }
      
      if (!emailRegex.test(data.email)) {
        return {
          success: false,
          errors: [{
            field: 'email',
            message: 'البريد الإلكتروني غير صحيح',
            code: 'INVALID_EMAIL',
            path: ['email']
          }]
        };
      }
      
      return { success: true, data, metadata: { validatedAt: new Date().toISOString(), schema: 'email', version: '1.0.0' } };
    });
  }
}

// ==================== EXPORT SINGLETON INSTANCE ====================

export const validationEngine = new ZodValidationEngine();

// ==================== CONVENIENCE FUNCTIONS ====================

export const validateForm = async <T>(
  schemaName: string,
  data: unknown,
  options?: Parameters<typeof validationEngine.validate>[2]
): Promise<ValidationResult<T>> => {
  return await validationEngine.validate<T>(schemaName, data, options);
};

export const validateBatch = async (
  validations: Parameters<typeof validationEngine.validateBatch>[0]
): Promise<ReturnType<typeof validationEngine.validateBatch>> => {
  return await validationEngine.validateBatch(validations);
};

export const createFormValidator = <T>(
  schemaName: string
): ((data: unknown) => ValidationResult<T>) => {
  return validationEngine.createRealtimeValidator<T>(schemaName);
};

// ==================== REACT HOOK FORM INTEGRATION ====================

import { useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';

export const useZodForm = <T extends Record<string, any>>(
  form: UseFormReturn<T>,
  schemaName: string
) => {
  const validateField = useCallback(
    (fieldName: string, value: any) => {
      const schema = validationEngine['schemas'].get(schemaName);
      if (!schema) return true;

      try {
        // Get the specific field schema (simplified approach)
        const partialSchema = schema as any;
        const result = partialSchema.partial().safeParse({
          [fieldName]: value
        });
        return result.success;
      } catch {
        return true; // Default to valid if schema extraction fails
      }
    },
    [schemaName]
  );

  const validateForm = useCallback(
    async (data: T): Promise<ValidationResult<T>> => {
      return await validationEngine.validate<T>(schemaName, data);
    },
    [schemaName]
  );

  return {
    validateField,
    validateForm,
  };
};

// ==================== TYPESCRIPT TYPE HELPERS ====================

export type ValidatedData<T extends ValidationResult<any>> = 
  T extends { success: true; data: infer U } ? U : never;

export type ValidationErrors = 
  T extends { success: false; errors: infer U } ? U : never;

// ==================== DEV TOOLS ====================

// Development helper to validate all schemas at startup
export const validateAllSchemas = (): {
  schema: string;
  isValid: boolean;
  errors?: string[];
}[] => {
  const results: {
    schema: string;
    isValid: boolean;
    errors?: string[];
  }[] = [];

  // Test common schemas with sample data
  const testData: Record<string, any> = {
    loginForm: {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: true
    },
    createLead: {
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      phone: '+966501234567',
      company: 'شركة المستقبل',
      source: 'website'
    },
    sendMessage: {
      conversationId: '123e4567-e89b-12d3-a456-426614174000',
      content: 'مرحباً، كيف يمكنني مساعدتك؟',
      type: 'text'
    },
    integrationConfig: {
      name: 'تكامل WhatsApp',
      type: 'whatsapp',
      provider: 'whatsapp',
      credentials: {
        apiKey: 'test_api_key_123456789'
      }
    }
  };

  Object.entries(testData).forEach(([schemaName, data]) => {
    try {
      const result = validationEngine.validate(schemaName, data);
      results.push({
        schema: schemaName,
        isValid: result.success,
        errors: result.success ? undefined : result.errors?.map(e => e.message)
      });
    } catch (error) {
      results.push({
        schema: schemaName,
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  });

  return results;
};

// Development helper to generate TypeScript types from schemas
export const generateTypeScriptTypes = (): string => {
  const schemaInfo = validationEngine['schemas'];
  let types = '// Generated TypeScript types from Zod schemas\n\n';
  
  schemaInfo.forEach((schema, name) => {
    const typeName = name.charAt(0).toUpperCase() + name.slice(1);
    types += `export type ${typeName} = z.infer<typeof ${name}Schema>;\n`;
  });
  
  return types;
};

// ==================== DEFAULT EXPORT ====================

export default validationEngine;