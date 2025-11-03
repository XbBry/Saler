# توثيق API - مشروع Saler

## مقدمة عن API

واجهة برمجة التطبيقات (API) الخاصة بمشروع Saler توفر مجموعة شاملة من الخدمات للتكامل مع التطبيقات الخارجية وإدارة المتاجر الإلكترونية. تم تصميم API لتكون RESTful وسهلة الاستخدام مع دعم كامل للمصادقة والأمان.

### الخصائص الرئيسية

- **RESTful API**: تصميم يتبع معايير REST
- **JSON**: تبادل البيانات بتنسيق JSON
- **المصادقة**: نظام JWT للمصادقة والتخويل
- **التوثيق التفاعلي**: Swagger/OpenAPI 3.0
- **تحديد المعدل**: حماية من الاستخدام المفرط
- **معالجة الأخطاء**: رسائل خطأ واضحة ومفصلة
- **الإصدارات**: دعم عدة إصدارات من API

### القاعدة الأساسية

```
https://api.saler.com/v1
```

### التوثيق التفاعلي

يمكنك الوصول للتوثيق التفاعلي لـ API عبر:
- **Swagger UI**: https://api.saler.com/api-docs
- **ReDoc**: https://api.saler.com/redoc

### أمثلة الطلبات

#### طلب بسيط باستخدام curl

```bash
curl -X GET "https://api.saler.com/v1/stores" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

#### طلب POST مع البيانات

```bash
curl -X POST "https://api.saler.com/v1/products" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "منتج جديد",
    "description": "وصف المنتج",
    "price": 99.99,
    "category_id": "category-uuid"
  }'
```

### تنسيق الاستجابة

#### استجابة ناجحة

```json
{
  "success": true,
  "data": {
    "id": "product-uuid",
    "title": "منتج جديد",
    "price": 99.99,
    "created_at": "2025-11-02T02:03:24Z"
  },
  "message": "تم إنشاء المنتج بنجاح"
}
```

#### استجابة خطأ

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "البيانات المدخلة غير صحيحة",
    "details": {
      "price": ["السعر يجب أن يكون رقم موجب"],
      "title": ["العنوان مطلوب"]
    }
  }
}
```

### روابط مهمة

- [المصادقة](./authentication.md) - دليل المصادقة والتخويل
- [Endpoints](./endpoints.md) - جميع نقاط النهاية
- [Webhooks](./webhooks.md) - نظام الإشعارات
- [أمثلة الاستخدام](./examples.md) - أمثلة عملية

### دعم المطورين

- **البريد الإلكتروني**: api-support@saler.com
- **Discord**: https://discord.gg/saler-api
- **GitHub**: https://github.com/company/saler-api

---

**آخر تحديث**: 2 نوفمبر 2025  
**إصدار API**: 1.0.0