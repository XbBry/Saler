import { useState, useCallback, useEffect } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { z, ZodSchema, ZodError } from 'zod';
import { validationEngine, ValidationResult } from '../schemas';
import { handleZodValidationError, ValidationErrorProcessor } from '../lib/error-handler';

/**
 * Hook للتكامل مع React Hook Form و Zod
 */
export const useZodForm = <T extends Record<string, any>>(
  schema: ZodSchema<T>,
  options?: {
    mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
    criteriaMode?: 'firstError' | 'all';
    shouldFocusError?: boolean;
    shouldUnregister?: boolean;
    shouldUseNativeValidation?: boolean;
  }
) => {
  const form = useForm<T>({
    resolver: (data) => {
      try {
        const result = schema.safeParse(data);
        if (result.success) {
          return { values: result.data, errors: {} };
        } else {
          const errors: any = {};
          result.error.errors.forEach(err => {
            const path = err.path.join('.');
            errors[path] = {
              type: err.code,
              message: err.message,
              value: err.received
            };
          });
          return { values: {}, errors };
        }
      } catch (error) {
        console.error('Zod validation error:', error);
        return { values: {}, errors: {} };
      }
    },
    mode: options?.mode || 'onChange',
    criteriaMode: options?.criteriaMode,
    shouldFocusError: options?.shouldFocusError,
    shouldUnregister: options?.shouldUnregister,
    shouldUseNativeValidation: options?.shouldUseNativeValidation,
  });

  return form;
};

/**
 * Hook للتحقق من صحة البيانات في الوقت الفعلي
 */
export const useRealtimeValidation = <T>(
  schemaName: string,
  initialData?: Partial<T>
) => {
  const [validationResult, setValidationResult] = useState<ValidationResult<T> | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = useCallback(async (data: unknown): Promise<ValidationResult<T>> => {
    setIsValidating(true);
    try {
      const result = await validationEngine.validate<T>(schemaName, data, {
        includeWarnings: true,
        stripUnknown: false,
        abortEarly: false
      });
      
      setValidationResult(result);
      
      // Update field errors for UI
      const errors: Record<string, string> = {};
      if (!result.success && result.errors) {
        result.errors.forEach(err => {
          if (err.field !== 'system') {
            errors[err.field] = err.message;
          }
        });
      }
      setFieldErrors(errors);
      
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [schemaName]);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
    setFieldErrors({});
  }, []);

  return {
    validationResult,
    isValidating,
    fieldErrors,
    validate,
    clearValidation
  };
};

/**
 * Hook للتحقق من صحة نموذج متقدم
 */
export const useFormValidation = <T extends Record<string, any>>(
  schema: ZodSchema<T>,
  initialValues?: Partial<T>
) => {
  const [values, setValues] = useState<Partial<T>>(initialValues || {});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string[]>>({});
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(async (fieldName: string, value: any): Promise<boolean> => {
    try {
      const fieldSchema = schema.pick({ [fieldName]: true } as any);
      const result = fieldSchema.safeParse({ [fieldName]: value });
      
      if (result.success) {
        setErrors(prev => ({ ...prev, [fieldName]: '' }));
        return true;
      } else {
        const errorMessage = result.error.errors[0]?.message || 'قيمة غير صحيحة';
        setErrors(prev => ({ ...prev, [fieldName]: errorMessage }));
        return false;
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, [fieldName]: 'خطأ في التحقق' }));
      return false;
    }
  }, [schema]);

  const validateForm = useCallback(async (formData: Partial<T>): Promise<boolean> => {
    try {
      const result = schema.safeParse(formData);
      
      if (result.success) {
        setErrors({});
        setIsValid(true);
        
        // Extract warnings if any
        const warnings: Record<string, string[]> = {};
        // Add warning extraction logic here if needed
        
        setWarnings(warnings);
        return true;
      } else {
        const newErrors: Record<string, string> = {};
        result.error.errors.forEach(err => {
          const fieldName = err.path.join('.');
          newErrors[fieldName] = err.message;
        });
        setErrors(newErrors);
        setIsValid(false);
        return false;
      }
    } catch (error) {
      setErrors({ _global: 'خطأ في التحقق من النموذج' });
      setIsValid(false);
      return false;
    }
  }, [schema]);

  const setValue = useCallback((name: string, value: any, validate = true) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (validate) {
      validateField(name, value);
    }
  }, [validateField]);

  const setFieldTouched = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const submitForm = useCallback(async (onSubmit: (data: T) => Promise<void> | void) => {
    setIsSubmitting(true);
    
    try {
      const isFormValid = await validateForm(values);
      if (isFormValid) {
        await onSubmit(values as T);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm]);

  const reset = useCallback((newValues?: Partial<T>) => {
    setValues(newValues || {});
    setTouched({});
    setErrors({});
    setWarnings({});
    setIsValid(false);
  }, []);

  return {
    values,
    touched,
    errors,
    warnings,
    isValid,
    isSubmitting,
    setValue,
    setFieldTouched,
    validateField,
    validateForm,
    submitForm,
    reset
  };
};

/**
 * Hook للـ batch validation
 */
export const useBatchValidation = () => {
  const [validations, setValidations] = useState<Array<{
    id: string;
    schemaName: string;
    data: any;
    result?: ValidationResult<any>;
    isValidating?: boolean;
    error?: string;
  }>>([]);

  const addValidation = useCallback((
    id: string,
    schemaName: string,
    data: any
  ) => {
    setValidations(prev => [
      ...prev,
      { id, schemaName, data, isValidating: false }
    ]);
  }, []);

  const runValidation = useCallback(async (id: string) => {
    setValidations(prev => prev.map(v => 
      v.id === id ? { ...v, isValidating: true, error: undefined } : v
    ));

    try {
      const validation = validations.find(v => v.id === id);
      if (!validation) return;

      const result = await validationEngine.validate(
        validation.schemaName, 
        validation.data, 
        { includeWarnings: true }
      );

      setValidations(prev => prev.map(v => 
        v.id === id 
          ? { ...v, result, isValidating: false } 
          : v
      ));
    } catch (error) {
      setValidations(prev => prev.map(v => 
        v.id === id 
          ? { ...v, isValidating: false, error: error instanceof Error ? error.message : 'Unknown error' } 
          : v
      ));
    }
  }, [validations]);

  const runAllValidations = useCallback(async () => {
    const promises = validations.map(v => runValidation(v.id));
    await Promise.allSettled(promises);
  }, [validations, runValidation]);

  const clearValidation = useCallback((id: string) => {
    setValidations(prev => prev.filter(v => v.id !== id));
  }, []);

  const clearAllValidations = useCallback(() => {
    setValidations([]);
  }, []);

  const getValidResults = useCallback(() => {
    return validations.filter(v => v.result?.success);
  }, [validations]);

  const getInvalidResults = useCallback(() => {
    return validations.filter(v => !v.result?.success || v.error);
  }, [validations]);

  return {
    validations,
    addValidation,
    runValidation,
    runAllValidations,
    clearValidation,
    clearAllValidations,
    getValidResults,
    getInvalidResults
  };
};

/**
 * Hook للـ conditional validation
 */
export const useConditionalValidation = <T extends Record<string, any>>(
  schema: ZodSchema<T>,
  conditions: Array<{
    field: string;
    when: (values: Partial<T>) => boolean;
    validate: (values: Partial<T>) => Promise<ValidationResult<any>>;
  }>
) => {
  const [values, setValues] = useState<Partial<T>>({});
  const [conditionalErrors, setConditionalErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateConditionals = useCallback(async (currentValues: Partial<T>) => {
    setIsValidating(true);
    const errors: Record<string, string> = {};

    try {
      const conditionalResults = await Promise.all(
        conditions.map(async (condition) => {
          if (condition.when(currentValues)) {
            const result = await condition.validate(currentValues);
            return { field: condition.field, result };
          }
          return null;
        })
      );

      conditionalResults.forEach((result) => {
        if (result && !result.result.success && result.result.errors) {
          errors[result.field] = result.result.errors[0]?.message || 'شرط غير مستوفى';
        }
      });

      setConditionalErrors(errors);
    } finally {
      setIsValidating(false);
    }
  }, [conditions]);

  const setValue = useCallback((name: string, value: any) => {
    const newValues = { ...values, [name]: value };
    setValues(newValues);
    
    // Trigger conditional validation
    validateConditionals(newValues);
  }, [values, validateConditionals]);

  return {
    values,
    conditionalErrors,
    isValidating,
    setValue,
    validateConditionals
  };
};

/**
 * Hook للأداء والـ validation metrics
 */
export const useValidationMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalValidations: 0,
    successfulValidations: 0,
    failedValidations: 0,
    averageTime: 0,
    lastValidationTime: 0
  });

  const recordValidation = useCallback((success: boolean, timeMs: number) => {
    setMetrics(prev => ({
      totalValidations: prev.totalValidations + 1,
      successfulValidations: prev.successfulValidations + (success ? 1 : 0),
      failedValidations: prev.failedValidations + (success ? 0 : 1),
      averageTime: ((prev.averageTime * prev.totalValidations) + timeMs) / (prev.totalValidations + 1),
      lastValidationTime: timeMs
    }));
  }, []);

  const getSuccessRate = useCallback(() => {
    if (metrics.totalValidations === 0) return 0;
    return (metrics.successfulValidations / metrics.totalValidations) * 100;
  }, [metrics]);

  const resetMetrics = useCallback(() => {
    setMetrics({
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      averageTime: 0,
      lastValidationTime: 0
    });
  }, []);

  return {
    metrics,
    getSuccessRate,
    recordValidation,
    resetMetrics
  };
};

export default {
  useZodForm,
  useRealtimeValidation,
  useFormValidation,
  useBatchValidation,
  useConditionalValidation,
  useValidationMetrics
};