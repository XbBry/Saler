# نقاط النهاية (Endpoints) - API

## نظرة عامة

يوفر API الخاص بمشروع Saler مجموعة شاملة من نقاط النهاية لإدارة جميع جوانب المتجر الإلكتروني. تم تنظيم النقاط في مجموعات منطقية لسهولة الاستخدام.

## فهرس النقاط

### 🔐 المصادقة
- `POST /v1/auth/login` - تسجيل الدخول
- `POST /v1/auth/register` - إنشاء حساب جديد
- `POST /v1/auth/refresh` - تجديد التوكن
- `POST /v1/auth/logout` - تسجيل الخروج
- `GET /v1/auth/me` - معلومات المستخدم الحالي

### 🏪 إدارة المتاجر
- `GET /v1/stores` - قائمة المتاجر
- `POST /v1/stores` - إنشاء متجر جديد
- `GET /v1/stores/{id}` - تفاصيل متجر
- `PUT /v1/stores/{id}` - تحديث المتجر
- `DELETE /v1/stores/{id}` - حذف المتجر
- `GET /v1/stores/{id}/settings` - إعدادات المتجر
- `PUT /v1/stores/{id}/settings` - تحديث الإعدادات

### 📦 إدارة المنتجات
- `GET /v1/products` - قائمة المنتجات
- `POST /v1/products` - إنشاء منتج جديد
- `GET /v1/products/{id}` - تفاصيل منتج
- `PUT /v1/products/{id}` - تحديث المنتج
- `DELETE /v1/products/{id}` - حذف المنتج
- `POST /v1/products/{id}/publish` - نشر المنتج
- `POST /v1/products/{id}/unpublish` - إلغاء النشر
- `GET /v1/products/{id}/variants` - متغيرات المنتج
- `POST /v1/products/{id}/variants` - إضافة متغير

### 📂 إدارة الفئات
- `GET /v1/categories` - قائمة الفئات
- `POST /v1/categories` - إنشاء فئة جديدة
- `GET /v1/categories/{id}` - تفاصيل فئة
- `PUT /v1/categories/{id}` - تحديث الفئة
- `DELETE /v1/categories/{id}` - حذف الفئة
- `GET /v1/categories/{id}/products` - منتجات الفئة

### 🛒 إدارة الطلبات
- `GET /v1/orders` - قائمة الطلبات
- `POST /v1/orders` - إنشاء طلب جديد
- `GET /v1/orders/{id}` - تفاصيل طلب
- `PUT /v1/orders/{id}` - تحديث الطلب
- `PUT /v1/orders/{id}/status` - تحديث حالة الطلب
- `POST /v1/orders/{id}/fulfill` - تنفيذ الطلب
- `POST /v1/orders/{id}/cancel` - إلغاء الطلب

### 👥 إدارة العملاء
- `GET /v1/customers` - قائمة العملاء
- `POST /v1/customers` - إضافة عميل جديد
- `GET /v1/customers/{id}` - تفاصيل العميل
- `PUT /v1/customers/{id}` - تحديث العميل
- `DELETE /v1/customers/{id}` - حذف العميل
- `GET /v1/customers/{id}/orders` - طلبات العميل

### 💳 إدارة المدفوعات
- `GET /v1/payments` - قائمة المدفوعات
- `POST /v1/payments` - إنشاء دفعة
- `GET /v1/payments/{id}` - تفاصيل الدفعة
- `PUT /v1/payments/{id}` - تحديث الدفعة
- `POST /v1/payments/{id}/refund` - استرداد المبلغ

### 📊 التقارير والتحليلات
- `GET /v1/analytics/sales` - تقارير المبيعات
- `GET /v1/analytics/products` - تقارير المنتجات
- `GET /v1/analytics/customers` - تقارير العملاء
- `GET /v1/analytics/revenue` - تقارير الإيرادات
- `GET /v1/analytics/conversions` - معدلات التحويل

### 🔔 Webhooks
- `GET /v1/webhooks` - قائمة Webhooks
- `POST /v1/webhooks` - إنشاء Webhook
- `GET /v1/webhooks/{id}` - تفاصيل Webhook
- `PUT /v1/webhooks/{id}` - تحديث Webhook
- `DELETE /v1/webhooks/{id}` - حذف Webhook
- `POST /v1/webhooks/{id}/test` - اختبار Webhook

### 📁 إدارة الملفات
- `POST /v1/files/upload` - رفع ملف
- `GET /v1/files/{id}` - تفاصيل الملف
- `DELETE /v1/files/{id}` - حذف الملف
- `GET /v1/files` - قائمة الملفات

## تفاصيل نقاط النهاية

### المصادقة

#### تسجيل الدخول
```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "remember_me": false
}
```

**المعاملات**:
- `email` (string, مطلوب): البريد الإلكتروني
- `password` (string, مطلوب): كلمة المرور
- `remember_me` (boolean, اختياري): تذكر تسجيل الدخول

#### تسجيل مستخدم جديد
```http
POST /v1/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "first_name": "أحمد",
  "last_name": "محمد",
  "phone": "+966501234567"
}
```

### إدارة المتاجر

#### إنشاء متجر جديد
```http
POST /v1/stores
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "متجري الجديد",
  "domain": "mystore",
  "description": "متجر إلكتروني لبيع المنتجات",
  "currency": "SAR",
  "language": "ar",
  "timezone": "Asia/Riyadh"
}
```

**المعاملات**:
- `name` (string, مطلوب): اسم المتجر
- `domain` (string, مطلوب): نطاق المتجر
- `description` (string, اختياري): وصف المتجر
- `currency` (string, مطلوب): العملة
- `language` (string, مطلوب): اللغة
- `timezone` (string, مطلوب): المنطقة الزمنية

**الاستجابة**:
```json
{
  "success": true,
  "data": {
    "id": "store-uuid",
    "name": "متجري الجديد",
    "domain": "mystore",
    "status": "active",
    "created_at": "2025-11-02T02:03:24Z"
  }
}
```

#### قائمة المتاجر
```http
GET /v1/stores?page=1&limit=10&search=mystore&status=active
Authorization: Bearer {token}
```

**المعاملات**:
- `page` (integer, اختياري): رقم الصفحة (افتراضي: 1)
- `limit` (integer, اختياري): عدد النتائج في الصفحة (افتراضي: 10, الأقصى: 100)
- `search` (string, اختياري): البحث في الأسماء
- `status` (string, اختياري): تصفية حسب الحالة
- `sort` (string, اختياري): ترتيب النتائج (name, created_at, updated_at)
- `order` (string, اختياري): اتجاه الترتيب (asc, desc)

### إدارة المنتجات

#### إنشاء منتج جديد
```http
POST /v1/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "store_id": "store-uuid",
  "title": "هاتف ذكي",
  "description": "هاتف ذكي عالي الجودة",
  "short_description": "أحدث الهواتف الذكية",
  "price": 999.99,
  "compare_at_price": 1199.99,
  "cost_per_item": 700.00,
  "track_quantity": true,
  "quantity": 50,
  "allow_backorders": false,
  "weight": 0.5,
  "length": 15.0,
  "width": 8.0,
  "height": 2.0,
  "sku": "PHONE-001",
  "barcode": "123456789",
  "category_id": "category-uuid",
  "tags": ["هاتف", "ذكي", "تكنلوجيا"],
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "alt_text": "صورة الهاتف من الأمام",
      "is_primary": true
    }
  ],
  "status": "draft"
}
```

#### تحديث المنتج
```http
PUT /v1/products/{product_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "هاتف ذكي محدث",
  "price": 899.99,
  "quantity": 100,
  "status": "active"
}
```

#### قائمة المنتجات
```http
GET /v1/products?store_id=store-uuid&category_id=category-uuid&status=active&sort=created_at&order=desc&page=1&limit=20
Authorization: Bearer {token}
```

### إدارة الطلبات

#### إنشاء طلب جديد
```http
POST /v1/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "store_id": "store-uuid",
  "customer_id": "customer-uuid",
  "email": "customer@example.com",
  "phone": "+966501234567",
  "shipping_address": {
    "first_name": "أحمد",
    "last_name": "محمد",
    "address_line_1": "شارع الملك فهد",
    "address_line_2": "حي العليا",
    "city": "الرياض",
    "state": "الرياض",
    "postal_code": "12345",
    "country": "SA"
  },
  "billing_address": {
    "first_name": "أحمد",
    "last_name": "محمد",
    "address_line_1": "شارع الملك فهد",
    "address_line_2": "حي العليا",
    "city": "الرياض",
    "state": "الرياض",
    "postal_code": "12345",
    "country": "SA"
  },
  "line_items": [
    {
      "product_id": "product-uuid",
      "variant_id": "variant-uuid",
      "quantity": 2,
      "price": 999.99
    }
  ],
  "shipping_method": "standard",
  "shipping_cost": 25.00,
  "tax_amount": 150.00,
  "discount_amount": 50.00,
  "total_amount": 2248.98
}
```

#### تحديث حالة الطلب
```http
PUT /v1/orders/{order_id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "fulfilled",
  "tracking_number": "TR123456789",
  "notes": "تم تسليم الطلب بنجاح"
}
```

**القيم المتاحة للحالة**:
- `pending` - في الانتظار
- `confirmed` - مؤكد
- `processing` - قيد المعالجة
- `shipped` - تم الشحن
- `delivered` - تم التسليم
- `cancelled` - ملغي
- `refunded` - مسترد

### التقارير والتحليلات

#### تقرير المبيعات
```http
GET /v1/analytics/sales?start_date=2025-01-01&end_date=2025-11-02&store_id=store-uuid&group_by=day
Authorization: Bearer {token}
```

**المعاملات**:
- `start_date` (string, مطلوب): تاريخ البداية (YYYY-MM-DD)
- `end_date` (string, مطلوب): تاريخ النهاية (YYYY-MM-DD)
- `store_id` (string, اختياري): معرف المتجر
- `group_by` (string, اختياري): تجميع النتائج (day, week, month, year)

**الاستجابة**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_sales": 150000.00,
      "total_orders": 1250,
      "average_order_value": 120.00,
      "total_customers": 890
    },
    "time_series": [
      {
        "date": "2025-11-01",
        "sales": 15000.00,
        "orders": 125,
        "customers": 89
      }
    ],
    "by_channel": {
      "online": 120000.00,
      "social": 30000.00
    }
  }
}
```

### Webhooks

#### إنشاء Webhook
```http
POST /v1/webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "store_id": "store-uuid",
  "name": "طلب جديد",
  "url": "https://yoursite.com/webhooks/order-created",
  "events": ["order.created", "order.updated"],
  "secret": "your-webhook-secret"
}
```

**الأحداث المتاحة**:
- `order.created` - إنشاء طلب
- `order.updated` - تحديث طلب
- `order.status_changed` - تغيير حالة الطلب
- `product.created` - إنشاء منتج
- `product.updated` - تحديث منتج
- `customer.created` - إنشاء عميل
- `customer.updated` - تحديث عميل

## رموز الاستجابة

### رموز النجاح
- `200 OK` - طلب ناجح
- `201 Created` - تم الإنشاء بنجاح
- `202 Accepted` - تم قبول الطلب
- `204 No Content` - لا يوجد محتوى

### رموز الخطأ
- `400 Bad Request` - طلب غير صحيح
- `401 Unauthorized` - غير مخول
- `403 Forbidden` - ممنوع
- `404 Not Found` - غير موجود
- `409 Conflict` - تعارض
- `422 Unprocessable Entity` - بيانات غير صالحة
- `429 Too Many Requests` - معدل الطلبات مرتفع
- `500 Internal Server Error` - خطأ خادم داخلي

## أفضل الممارسات

### 1. استخدام Pagination
```javascript
// تنفيذ pagination في التطبيق
const fetchProducts = async (page = 1, limit = 20) => {
  const response = await fetch(`/v1/products?page=${page}&limit=${limit}`);
  const data = await response.json();
  
  return {
    products: data.data.items,
    totalPages: data.data.total_pages,
    currentPage: data.data.current_page,
    hasMore: data.data.has_next
  };
};
```

### 2. معالجة الأخطاء
```javascript
const handleApiError = (error) => {
  const { code, message, details } = error;
  
  switch (code) {
    case 'VALIDATION_ERROR':
      showValidationErrors(details);
      break;
    case 'RATE_LIMIT_EXCEEDED':
      showRateLimitMessage();
      break;
    case 'AUTHENTICATION_REQUIRED':
      redirectToLogin();
      break;
    default:
      showGenericError(message);
  }
};
```

### 3. تخزين مؤقت للاستجابات
```javascript
// تخزين مؤقت لقائمة المنتجات
const getCachedProducts = async (storeId) => {
  const cacheKey = `products_${storeId}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    // استخدام البيانات المخزنة مؤقتاً لمدة 5 دقائق
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data;
    }
  }
  
  // جلب بيانات جديدة
  const response = await fetch(`/v1/products?store_id=${storeId}`);
  const data = await response.json();
  
  // حفظ في التخزين المؤقت
  localStorage.setItem(cacheKey, JSON.stringify({
    data: data.data,
    timestamp: Date.now()
  }));
  
  return data.data;
};
```

---

**آخر تحديث**: 2 نوفمبر 2025