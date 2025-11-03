# المصادقة والتخويل - API

## نظرة عامة

نظام المصادقة في API الخاص بمشروع Saler يعتمد على JSON Web Tokens (JWT) لتوفير مصادقة آمنة وموثوقة. يدعم النظام عدة طرق للمصادقة ويتضمن آليات متقدمة لحماية البيانات.

## طرق المصادقة

### 1. مصادقة JWT (الطريقة الأساسية)

#### تسجيل الدخول

```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**الاستجابة الناجحة**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "token_type": "Bearer",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "role": "admin",
      "permissions": ["read", "write", "delete"]
    }
  }
}
```

#### تجديد الرمز المميز

```http
POST /v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your-refresh-token"
}
```

### 2. مصادقة API Key

```http
GET /v1/stores
X-API-Key: your-api-key-here
```

### 3. مصادقة OAuth2

#### Google OAuth

```http
GET /v1/auth/google
```

#### GitHub OAuth

```http
GET /v1/auth/github
```

## استخدام Access Token

بعد الحصول على Access Token، يجب إرفاقه في جميع الطلبات:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### مثال كامل

```bash
# تسجيل الدخول
curl -X POST "https://api.saler.com/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# حفظ access_token واستخدامه
curl -X GET "https://api.saler.com/v1/stores" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## أنواع المستخدمين والأذونات

### أدوار المستخدمين (Roles)

| الدور | الوصف | الصلاحيات |
|-------|-------|-----------|
| `super_admin` | المشرف العام | جميع الصلاحيات |
| `admin` | مشرف المتجر | إدارة المتجر والمنتجات |
| `manager` | مدير | إدارة المنتجات والطلبات |
| `employee` | موظف | عرض وإدارة محدودة |
| `customer` | عميل | عرض المنتجات فقط |

### صلاحيات النظام (Permissions)

```json
{
  "stores": ["read", "write", "delete"],
  "products": ["read", "write", "delete", "publish"],
  "orders": ["read", "write", "delete", "fulfill"],
  "customers": ["read", "write", "delete"],
  "analytics": ["read", "export"],
  "settings": ["read", "write"]
}
```

## التحقق من صحة التوكن

### فحص الصلاحيات

```javascript
// مثال للتحقق من الصلاحية
const hasPermission = (user, resource, action) => {
  const permission = `${resource}:${action}`;
  return user.permissions.includes(permission) || user.permissions.includes(`${resource}:*`);
};

// استخدام
if (hasPermission(user, 'products', 'write')) {
  // تنفيذ العملية
}
```

## الأمان والحماية

### 1. Rate Limiting

```json
{
  "rate_limits": {
    "anonymous": "100 requests/hour",
    "authenticated": "1000 requests/hour",
    "premium": "10000 requests/hour"
  }
}
```

### 2. CORS

```javascript
// إعدادات CORS المسموحة
const corsOptions = {
  origin: [
    'https://yourdomain.com',
    'https://admin.yourdomain.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

### 3. Headers الأمنية

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

## تسجيل الخروج

```http
POST /v1/auth/logout
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "refresh_token": "your-refresh-token"
}
```

## إدارة التوكن

### هيكل JWT

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid",
    "email": "user@example.com",
    "role": "admin",
    "permissions": ["read", "write"],
    "iat": 1635000000,
    "exp": 1635003600,
    "iss": "saler-api",
    "aud": "saler-client"
  }
}
```

### مدة صلاحية التوكن

- **Access Token**: ساعة واحدة (3600 ثانية)
- **Refresh Token**: 30 يوم

## الأخطاء الشائعة

### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "التوكن غير صالح أو منتهي الصلاحية",
    "details": "يرجى تسجيل الدخول مرة أخرى"
  }
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "ليس لديك صلاحية للوصول لهذا المورد",
    "details": "الصلاحية المطلوبة: products:write"
  }
}
```

### 429 Too Many Requests

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "تم تجاوز حد الطلبات المسموح",
    "details": {
      "limit": "1000 requests/hour",
      "remaining": 0,
      "reset_time": "2025-11-02T03:03:24Z"
    }
  }
}
```

## أفضل الممارسات

### 1. حفظ التوكن

```javascript
// حفظ آمن في localStorage (للأمام فقط)
localStorage.setItem('access_token', token);

// حفظ في cookies (أكثر أماناً)
document.cookie = `access_token=${token}; Secure; HttpOnly; SameSite=Strict`;
```

### 2. تجديد التوكن التلقائي

```javascript
// فحص صلاحية التوكن قبل كل طلب
const isTokenExpired = (token) => {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.exp * 1000 < Date.now();
};

// تجديد التوكن عند الحاجة
const refreshTokenIfNeeded = async () => {
  if (isTokenExpired(accessToken)) {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    
    const data = await response.json();
    if (data.success) {
      accessToken = data.data.access_token;
    }
  }
};
```

### 3. معالجة الأخطاء

```javascript
const handleApiError = (error) => {
  switch (error.code) {
    case 'UNAUTHORIZED':
      // إعادة توجيه لتسجيل الدخول
      window.location.href = '/login';
      break;
    case 'FORBIDDEN':
      // عرض رسالة عدم الصلاحية
      showErrorMessage('ليس لديك صلاحية للوصول');
      break;
    case 'RATE_LIMIT_EXCEEDED':
      // إظهار رسالة انتظار
      showWaitMessage('يرجى الانتظار قبل المحاولة مرة أخرى');
      break;
    default:
      // معالجة عامة
      showErrorMessage('حدث خطأ غير متوقع');
  }
};
```

## اختبارات المصادقة

### اختبار التوكن

```bash
# اختبار صحة التوكن
curl -X GET "https://api.saler.com/v1/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN"

# اختبار الصلاحيات
curl -X GET "https://api.saler.com/v1/admin/users" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### اختبارات الأمان

```bash
# اختبار بدون توكن (يجب أن يرجع 401)
curl -X GET "https://api.saler.com/v1/stores"

# اختبار بتوكن منتهي الصلاحية (يجب أن يرجع 401)
curl -X GET "https://api.saler.com/v1/stores" \
  -H "Authorization: Bearer EXPIRED_TOKEN"
```

---

**آخر تحديث**: 2 نوفمبر 2025