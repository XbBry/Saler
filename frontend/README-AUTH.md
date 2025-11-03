# نظام المصادقة - Zustand Auth Store

نظام مصادقة شامل مبني بـ Zustand مع دعم متعدد المساحات العمل (Multi-workspace) والمصادقة المتقدمة.

## 🚀 الميزات الرئيسية

- ✅ مصادقة متكاملة (Login, Register, Logout)
- ✅ تحديث تلقائي للرموز المميزة (Auto Token Refresh)
- ✅ دعم متعدد المساحات العمل
- ✅ إدارة الصلاحيات والحدود
- ✅ حفظ حالة المصادقة (Persistent State)
- ✅ TypeScript كامل
- ✅ معالجة أخطاء شاملة
- ✅ UI notifications مدمجة

## 📁 بنية الملفات

```
src/
├── store/
│   ├── authStore.ts       # المتجر الرئيسي للمصادقة
│   └── index.ts          # تصدير جميع الوظائف
├── hooks/
│   └── use-auth.ts       # Hooks مخصصة للمصادقة
├── types/
│   └── api.ts           # أنواع البيانات للـ API
└── lib/
    └── auth-helpers.ts  # وظائف مساعدة
```

## 🎯 كيفية الاستخدام

### الاستخدام الأساسي

```typescript
import { useAuth } from '@/store';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    login, 
    logout,
    currentWorkspace 
  } = useAuth();

  const handleLogin = async () => {
    await login({
      email: 'user@example.com',
      password: 'password123'
    });
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>مرحباً {user?.name}</p>
          <button onClick={logout}>تسجيل الخروج</button>
        </div>
      ) : (
        <button onClick={handleLogin}>تسجيل الدخول</button>
      )}
    </div>
  );
}
```

### استخدام Hooks المتخصصة

```typescript
import { useAuthGuard, usePermissions, useWorkspace } from '@/store';

function ProtectedComponent() {
  // حماية المصادقة
  const { requireAuth, requirePermission } = useAuthGuard();
  
  // فحص الصلاحيات
  const { hasPermission } = usePermissions();
  
  // إدارة المساحات العمل
  const { currentWorkspace, switchToWorkspace } = useWorkspace();
  
  useEffect(() => {
    // حماية الصفحة
    if (!requireAuth()) return;
    
    // فحص الصلاحية
    if (!requirePermission('manage_leads')) {
      return;
    }
  }, []);
  
  return (
    <div>محتوى محمي</div>
  );
}
```

### إدارة النماذج (Forms)

```typescript
import { useAuthForm } from '@/store';

function LoginPage() {
  const { isLoading, error, handleSubmit } = useAuthForm('login');
  
  const onSubmit = async (formData: LoginForm) => {
    const result = await handleSubmit(formData);
    
    if (result.success) {
      // تم تسجيل الدخول بنجاح
      router.push('/dashboard');
    }
  };
  
  return (
    <form onSubmit={onSubmit}>
      {/* عناصر النموذج */}
    </form>
  );
}
```

## 🔐 نظام الصلاحيات

### مستويات الأدوار

```typescript
const rolePermissions = {
  admin: ['*'], // جميع الصلاحيات
  manager: [
    'manage_users',
    'manage_workspaces', 
    'view_analytics',
    'manage_leads'
  ],
  user: [
    'view_leads',
    'update_own_profile'
  ]
};
```

### فحص الصلاحيات

```typescript
const { hasPermission } = usePermissions();

// فحص صلاحية واحدة
if (hasPermission('manage_leads')) {
  // عرض زر إضافة عميل محتمل
}

// فحص عدة صلاحيات
if (hasAnyPermission(['manage_users', 'manage_workspaces'])) {
  // عرض إعدادات الإدارة
}
```

## 🏢 إدارة المساحات العمل

```typescript
const { 
  currentWorkspace, 
  workspaces, 
  switchToWorkspace, 
  createNewWorkspace 
} = useWorkspace();

// التبديل لمساحة عمل أخرى
await switchToWorkspace('workspace-id');

// إنشاء مساحة عمل جديدة
await createNewWorkspace({
  name: 'مساحة العمل الجديدة',
  slug: 'new-workspace',
  description: 'وصف المساحة'
});
```

## 🔄 إدارة الرموز المميزة

```typescript
const { 
  isTokenValid, 
  shouldRefreshToken, 
  forceRefreshToken 
} = useToken();

// فحص صلاحية الرمز
if (isTokenValid()) {
  // الرمز صالح، يمكن المتابعة
}

// فحص الحاجة لتحديث الرمز
if (shouldRefreshToken()) {
  await forceRefreshToken();
}
```

## 🎨 إعدادات UI والتخصيص

### إعدادات متقدمة

```typescript
import { useAuthStore } from '@/store';

function SettingsPage() {
  const { updateUser, user } = useAuthStore();
  
  const updatePreferences = async (preferences: any) => {
    await updateUser({
      preferences: {
        ...user?.preferences,
        ...preferences
      }
    });
  };
  
  return (
    <div>
      <button onClick={() => updatePreferences({ theme: 'dark' })}>
        تفعيل الوضع الليلي
      </button>
    </div>
  );
}
```

## 🛠️ إعداد المشروع

### متطلبات التثبيت

```bash
npm install zustand react-hot-toast
```

### متغيرات البيئة

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### إعداد التطبيق

```typescript
// app/layout.tsx
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
```

## 🚨 إدارة الأخطاء

### معالجة الأخطاء المدمجة

```typescript
try {
  await login(credentials);
} catch (error) {
  // يتم عرض رسالة خطأ تلقائياً
  // يمكن أيضاً الوصول للخطأ من المتجر
}
```

### فحص الأخطاء

```typescript
const { error, clearError } = useAuth();

useEffect(() => {
  if (error) {
    console.error('Auth Error:', error);
    // معالجة إضافية للخطأ
  }
}, [error]);
```

## 🔧 الاستخدام المتقدم

### Middleware للمصادقة

```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // فحص مسار الحماية
  if (pathname.startsWith('/dashboard')) {
    const token = getTokenFromStorage();
    
    if (!token || isTokenExpired(token)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}
```

### اختبار المصادقة

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/store';

describe('Auth Store', () => {
  test('should handle login', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      });
    });
    
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

## 📚 API Reference

### Store Methods

- `login(credentials)` - تسجيل الدخول
- `register(data)` - إنشاء حساب جديد  
- `logout()` - تسجيل الخروج
- `refreshToken()` - تحديث الرمز المميز
- `checkAuthStatus()` - فحص حالة المصادقة
- `switchWorkspace(workspaceId)` - التبديل لمساحة عمل
- `fetchWorkspaces()` - جلب مساحات العمل
- `createWorkspace(data)` - إنشاء مساحة عمل جديدة
- `updateUser(userData)` - تحديث بيانات المستخدم

### Hooks

- `useAuth()` - Hook الرئيسي للمصادقة
- `useAuthGuard()` - حماية المسارات
- `usePermissions()` - إدارة الصلاحيات
- `useWorkspace()` - إدارة المساحات العمل
- `useToken()` - إدارة الرموز المميزة
- `useAuthForm()` - إدارة النماذج
- `useAutoRefreshToken()` - تحديث تلقائي للرموز

## 🤝 المساهمة

1. Fork المشروع
2. إنشاء branch للميزة الجديدة
3. Commit التغييرات
4. Push للـ branch
5. فتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT.