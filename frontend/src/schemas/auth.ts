import { z } from 'zod';
import { emailSchema, passwordSchema, dateSchema, idSchema } from './common';

// ==================== AUTH SCHEMAS ====================

// Login Schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

// Login Form Schema (extended for UI)
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
  rememberMe: z.boolean().optional(),
});

// Register Schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  passwordConfirm: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
  firstName: z.string().min(1, 'الاسم الأول مطلوب').max(50, 'الاسم الأول يجب أن يكون أقل من 50 حرف'),
  lastName: z.string().min(1, 'الاسم الأخير مطلوب').max(50, 'الاسم الأخير يجب أن يكون أقل من 50 حرف'),
  phone: z.string().optional().refine((val) => !val || val.length >= 10, 'رقم الهاتف يجب أن يكون صحيح'),
  agreeToTerms: z.boolean().refine((val) => val === true, 'يجب الموافقة على الشروط والأحكام'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'كلمة المرور وتأكيدها غير متطابقتين',
  path: ['passwordConfirm'],
});

// Register Form Schema (extended for UI)
export const registerFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  passwordConfirm: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
  firstName: z.string().min(1, 'الاسم الأول مطلوب').max(50, 'الاسم الأول يجب أن يكون أقل من 50 حرف'),
  lastName: z.string().min(1, 'الاسم الأخير مطلوب').max(50, 'الاسم الأخير يجب أن يكون أقل من 50 حرف'),
  phone: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, 'يجب الموافقة على الشروط والأحكام'),
  marketingEmails: z.boolean().optional(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'كلمة المرور وتأكيدها غير متطابقتين',
  path: ['passwordConfirm'],
});

// Password Reset Schema
export const passwordResetSchema = z.object({
  email: emailSchema,
});

// Password Reset Confirm Schema
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'رمز إعادة التعيين مطلوب'),
  password: passwordSchema,
  passwordConfirm: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'كلمة المرور وتأكيدها غير متطابقتين',
  path: ['passwordConfirm'],
});

// Change Password Schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: passwordSchema,
  newPasswordConfirm: z.string().min(1, 'تأكيد كلمة المرور الجديدة مطلوب'),
}).refine((data) => data.newPassword === data.newPasswordConfirm, {
  message: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين',
  path: ['newPasswordConfirm'],
});

// Refresh Token Schema
export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'رمز التحديث مطلوب'),
});

// User Profile Schema
export const userProfileSchema = z.object({
  id: idSchema,
  email: emailSchema,
  firstName: z.string().min(1, 'الاسم الأول مطلوب').max(50, 'الاسم الأول يجب أن يكون أقل من 50 حرف'),
  lastName: z.string().min(1, 'الاسم الأخير مطلوب').max(50, 'الاسم الأخير يجب أن يكون أقل من 50 حرف'),
  phone: z.string().optional(),
  isActive: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema.optional(),
  avatar: z.string().url('رابط الصورة الشخصية غير صحيح').optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  notifications: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
    marketing: z.boolean(),
  }),
});

// Update Profile Schema
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'الاسم الأول مطلوب').max(50, 'الاسم الأول يجب أن يكون أقل من 50 حرف'),
  lastName: z.string().min(1, 'الاسم الأخير مطلوب').max(50, 'الاسم الأخير يجب أن يكون أقل من 50 حرف'),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

// Two-Factor Authentication Schema
export const twoFactorAuthSchema = z.object({
  code: z
    .string()
    .min(6, 'رمز التحقق يجب أن يكون 6 أرقام')
    .max(6, 'رمز التحقق يجب أن يكون 6 أرقام')
    .regex(/^\d+$/, 'رمز التحقق يجب أن يحتوي على أرقام فقط'),
});

// OAuth Provider Schema
export const oauthProviderSchema = z.enum(['google', 'microsoft', 'github']);

// OAuth Callback Schema
export const oauthCallbackSchema = z.object({
  provider: oauthProviderSchema,
  code: z.string().min(1, 'رمز OAuth مطلوب'),
  state: z.string().optional(),
});

// Session Schema
export const sessionSchema = z.object({
  id: z.string(),
  userId: idSchema,
  createdAt: dateSchema,
  expiresAt: dateSchema,
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  isActive: z.boolean(),
});

// Auth Token Response Schema
export const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in: z.number().positive(),
  user: userProfileSchema,
});

// ==================== FORM DATA TYPES ====================

export type LoginFormData = z.infer<typeof loginFormSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
export type PasswordResetConfirmFormData = z.infer<typeof passwordResetConfirmSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type TwoFactorAuthFormData = z.infer<typeof twoFactorAuthSchema>;
export type OauthCallbackFormData = z.infer<typeof oauthCallbackSchema>;

// API Request Types
export type LoginRequestData = z.infer<typeof loginSchema>;
export type RegisterRequestData = z.infer<typeof registerSchema>;
export type RefreshTokenRequestData = z.infer<typeof refreshTokenSchema>;

// API Response Types
export type TokenResponseData = z.infer<typeof tokenResponseSchema>;
export type UserProfileData = z.infer<typeof userProfileSchema>;
export type SessionData = z.infer<typeof sessionSchema>;

// ==================== AUTHENTICATION VALIDATION HELPERS ====================

// Check if email is valid and commonly used
export const validateEmailProvider = (email: string): boolean => {
  const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? commonProviders.includes(domain) || domain.includes('.edu') || domain.includes('.org') : false;
};

// Password strength calculator
export const calculatePasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('استخدم 8 أحرف على الأقل');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('أضف حرف صغير على الأقل');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('أضف حرف كبير على الأقل');

  if (/\d/.test(password)) score += 1;
  else feedback.push('أضف رقم على الأقل');

  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push('أضف رمز خاص على الأقل');

  const isStrong = score >= 4;

  if (score <= 2) feedback.unshift('كلمة مرور ضعيفة');
  else if (score === 3) feedback.unshift('كلمة مرور متوسطة');
  else if (score === 4) feedback.unshift('كلمة مرور قوية');
  else feedback.unshift('كلمة مرور ممتازة');

  return { score, feedback, isStrong };
};

// Validate phone number format
export const validatePhoneNumber = (phone: string): { isValid: boolean; normalized?: string } => {
  const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
  
  if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
    return { isValid: false };
  }

  const normalized = phone.replace(/\s+/g, '').replace(/^(\+966|\+971|\+965|\+968|\+973|\+974|\+962|\+963|\+964|\+965)/, (match) => {
    return match;
  });

  return { isValid: true, normalized };
};