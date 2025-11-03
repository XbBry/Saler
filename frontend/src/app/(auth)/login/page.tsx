'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/lib/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Link } from '@/components/ui/Link';
import { Mail, Lock, Chrome, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('يرجى إدخال بريد إلكتروني صحيح'),
  password: z
    .string()
    .min(1, 'كلمة المرور مطلوبة')
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, loginWithMicrosoft, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // إذا كان المستخدم مسجل دخول بالفعل، وجهه للصفحة الرئيسية
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/leads');
    }
  }, [isAuthenticated, router]);

  // مسح الخطأ عند تغيير البيانات
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      router.push('/leads');
    } catch (err) {
      // الخطأ يتم التعامل معه في الـ store
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      router.push('/leads');
    } catch (err) {
      // الخطأ يتم التعامل معه في الـ store
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      await loginWithMicrosoft();
      router.push('/leads');
    } catch (err) {
      // الخطأ يتم التعامل معه في الـ store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* شعار التطبيق */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">منصة سيلر</h1>
          <p className="text-gray-600">مرحباً بك في نظام إدارة العملاء المحتملين</p>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">تسجيل الدخول</CardTitle>
            <CardDescription>
              أدخل بياناتك للوصول إلى حسابك
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* عرض الأخطاء */}
            {error && (
              <Alert variant="destructive">
                <div className="font-medium">خطأ في تسجيل الدخول</div>
                <div className="text-sm mt-1">{error}</div>
              </Alert>
            )}

            {/* نموذج تسجيل الدخول */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="البريد الإلكتروني"
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                error={errors.email?.message}
                icon={<Mail className="h-5 w-5" />}
                {...register('email')}
              />

              <Input
                label="كلمة المرور"
                type="password"
                placeholder="أدخل كلمة المرور"
                error={errors.password?.message}
                icon={<Lock className="h-5 w-5" />}
                {...register('password')}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={isLoading}
                disabled={isLoading}
              >
                تسجيل الدخول
              </Button>
            </form>

            {/* فاصل بين الطرق المختلفة */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">أو</span>
              </div>
            </div>

            {/* تسجيل الدخول باستخدام Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handleGoogleLogin}
              loading={isLoading}
              disabled={isLoading}
            >
              <Chrome className="mr-2 h-5 w-5" />
              تسجيل الدخول باستخدام Google
            </Button>

            {/* تسجيل الدخول باستخدام Microsoft */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handleMicrosoftLogin}
              loading={isLoading}
              disabled={isLoading}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"
                />
              </svg>
              تسجيل الدخول باستخدام Microsoft
            </Button>

            {/* رابط التسجيل */}
            <div className="text-center text-sm">
              <span className="text-gray-600">ليس لديك حساب؟ </span>
              <Link href="/register" variant="primary">
                إنشاء حساب جديد
              </Link>
            </div>

            {/* رابط نسيان كلمة المرور */}
            <div className="text-center text-sm">
              <Link href="/forgot-password" variant="default">
                نسيت كلمة المرور؟
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* معلومات إضافية */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>بالمتابعة، أنت توافق على شروط الخدمة وسياسة الخصوصية</p>
        </div>
      </div>
    </div>
  );
}