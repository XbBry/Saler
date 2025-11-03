# Webhooks - نظام الإشعارات

## نظرة عامة

نظام Webhooks في مشروع Saler يوفر طريقة فعالة لتلقي إشعارات فورية حول الأحداث التي تحدث في المتجر الإلكتروني. يمكن استخدام Webhooks لتكامل النظام مع تطبيقات خارجية أو خدمات طرف ثالث.

## مفهوم Webhooks

Webhooks هي طريقة لدفع البيانات إلى تطبيقات أخرى فور حدوث حدث محدد. بدلاً من طلب البيانات بشكل دوري (Polling)، يتم إرسال البيانات فوراً عند حدوث الحدث.

### مثال على التدفق

```
حدث في Saler → إرسال Webhook → استقبال البيانات → معالجة البيانات
```

## إنشاء Webhook

### إنشاء Webhook جديد

```http
POST /v1/webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "store_id": "store-uuid",
  "name": "إشعار طلبات جديدة",
  "url": "https://yoursite.com/webhooks/orders",
  "events": ["order.created", "order.updated", "order.cancelled"],
  "secret": "your-webhook-secret-key",
  "active": true,
  "headers": {
    "Authorization": "Bearer your-integration-token",
    "X-Custom-Header": "custom-value"
  }
}
```

### معاملات Webhook

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `store_id` | string | معرف المتجر |
| `name` | string | اسم Webhook |
| `url` | string | عنوان URL لاستقبال البيانات |
| `events` | array | قائمة الأحداث المطلوب الإشعار عنها |
| `secret` | string | مفتاح سري للتحقق من التوقيع |
| `active` | boolean | حالة التفعيل |
| `headers` | object | رؤوس HTTP إضافية |

## الأحداث المتاحة

### أحداث الطلبات (Order Events)

#### `order.created`
يُرسل عند إنشاء طلب جديد

**البيانات المرسلة**:
```json
{
  "event": "order.created",
  "timestamp": "2025-11-02T02:03:24Z",
  "store_id": "store-uuid",
  "data": {
    "id": "order-uuid",
    "order_number": "ORD-001",
    "customer": {
      "id": "customer-uuid",
      "email": "customer@example.com",
      "first_name": "أحمد",
      "last_name": "محمد"
    },
    "status": "pending",
    "total_amount": 299.99,
    "currency": "SAR",
    "line_items": [
      {
        "id": "item-uuid",
        "product_id": "product-uuid",
        "title": "منتج تجريبي",
        "quantity": 2,
        "price": 149.99
      }
    ],
    "shipping_address": {
      "first_name": "أحمد",
      "last_name": "محمد",
      "address_line_1": "شارع الملك فهد",
      "city": "الرياض",
      "postal_code": "12345",
      "country": "SA"
    },
    "billing_address": {
      "first_name": "أحمد",
      "last_name": "محمد",
      "address_line_1": "شارع الملك فهد",
      "city": "الرياض",
      "postal_code": "12345",
      "country": "SA"
    }
  }
}
```

#### `order.updated`
يُرسل عند تحديث الطلب

```json
{
  "event": "order.updated",
  "timestamp": "2025-11-02T02:03:24Z",
  "store_id": "store-uuid",
  "data": {
    "id": "order-uuid",
    "order_number": "ORD-001",
    "status": "processing",
    "updated_fields": ["status", "tracking_number"],
    "tracking_number": "TR123456789",
    "notes": "تم تحديث حالة الطلب"
  }
}
```

#### `order.status_changed`
يُرسل عند تغيير حالة الطلب

```json
{
  "event": "order.status_changed",
  "timestamp": "2025-11-02T02:03:24Z",
  "store_id": "store-uuid",
  "data": {
    "id": "order-uuid",
    "order_number": "ORD-001",
    "old_status": "pending",
    "new_status": "confirmed",
    "changed_by": "system",
    "changed_at": "2025-11-02T02:03:24Z"
  }
}
```

#### `order.cancelled`
يُرسل عند إلغاء الطلب

```json
{
  "event": "order.cancelled",
  "timestamp": "2025-11-02T02:03:24Z",
  "store_id": "store-uuid",
  "data": {
    "id": "order-uuid",
    "order_number": "ORD-001",
    "cancellation_reason": "طلب العميل",
    "refund_amount": 299.99,
    "refund_status": "pending"
  }
}
```

### أحداث المنتجات (Product Events)

#### `product.created`
يُرسل عند إنشاء منتج جديد

```json
{
  "event": "product.created",
  "timestamp": "2025-11-02T02:03:24Z",
  "store_id": "store-uuid",
  "data": {
    "id": "product-uuid",
    "title": "منتج جديد",
    "handle": "new-product",
    "status": "draft",
    "price": 99.99,
    "compare_at_price": 129.99,
    "sku": "PROD-001"
  }
}
```

#### `product.updated`
يُرسل عند تحديث المنتج

```json
{
  "event": "product.updated",
  "timestamp": "2025-11-02T02:03:24Z",
  "store_id": "store-uuid",
  "data": {
    "id": "product-uuid",
    "updated_fields": ["title", "price", "status"],
    "changes": {
      "title": {
        "old": "عنوان قديم",
        "new": "عنوان جديد"
      },
      "price": {
        "old": 89.99,
        "new": 99.99
      }
    }
  }
}
```

#### `product.published`
يُرسل عند نشر المنتج

```json
{
  "event": "product.published",
  "timestamp": "2025-11-02T02:03:24Z",
  "store_id": "store-uuid",
  "data": {
    "id": "product-uuid",
    "title": "منتج منشور",
    "published_at": "2025-11-02T02:03:24Z",
    "published_by": "admin-user"
  }
}
```

### أحداث العملاء (Customer Events)

#### `customer.created`
يُرسل عند إنشاء عميل جديد

```json
{
  "event": "customer.created",
  "timestamp": "2025-11-02T02:03:24Z",
  "store_id": "store-uuid",
  "data": {
    "id": "customer-uuid",
    "email": "newcustomer@example.com",
    "first_name": "سارة",
    "last_name": "علي",
    "phone": "+966501234567",
    "marketing_consent": true,
    "registration_source": "website"
  }
}
```

#### `customer.updated`
يُرسل عند تحديث بيانات العميل

```json
{
  "event": "customer.updated",
  "timestamp": "2025-11-02T02:03:24Z",
  "store_id": "store-uuid",
  "data": {
    "id": "customer-uuid",
    "updated_fields": ["first_name", "phone"],
    "changes": {
      "first_name": {
        "old": "اسم قديم",
        "new": "اسم جديد"
      }
    }
  }
}
```

### أحداث المخزون (Inventory Events)

#### `inventory.updated`
يُرسل عند تحديث المخزون

```json
{
  "event": "inventory.updated",
  "timestamp": "2025-11-02T02:03:24Z",
  "store_id": "store-uuid",
  "data": {
    "product_id": "product-uuid",
    "variant_id": "variant-uuid",
    "location_id": "warehouse-uuid",
    "old_quantity": 50,
    "new_quantity": 45,
    "quantity_change": -5,
    "reason": "order_fulfillment"
  }
}
```

#### `inventory.low_stock`
يُرسل عند انخفاض المخزون

```json
{
  "event": "inventory.low_stock",
  "timestamp": "2025-11-02T02:03:24Z",
  "store_id": "store-uuid",
  "data": {
    "product_id": "product-uuid",
    "title": "منتج محدود المخزون",
    "current_quantity": 5,
    "threshold": 10,
    "recommended_action": "restock_needed"
  }
}
```

## التحقق من صحة Webhook

### التحقق من التوقيع

يتم إرسال كل Webhook مع توقيع HMAC-SHA256 في رأس `X-Webhook-Signature`:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// في Express.js
app.post('/webhooks/orders', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // معالجة Webhook
  handleOrderWebhook(req.body);
  
  res.status(200).json({ received: true });
});
```

### التحقق من المصدر

```javascript
// التحقق من IP المسموح
const allowedIPs = ['203.0.113.1', '198.51.100.1'];

app.post('/webhooks/orders', (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (!allowedIPs.includes(clientIP)) {
    return res.status(403).json({ error: 'Unauthorized IP' });
  }
  
  // معالجة Webhook
  handleOrderWebhook(req.body);
  
  res.status(200).json({ received: true });
});
```

## استقبال ومعالجة Webhooks

### مثال على خادم لاستقبال Webhooks

```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

// استقبال البيانات بتنسيق JSON
app.use(express.json());

// التحقق من التوقيع
function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// معالج Webhook للطلبات
app.post('/webhooks/orders', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const secret = process.env.WEBHOOK_SECRET;
  
  // التحقق من التوقيع
  if (!verifySignature(payload, signature, secret)) {
    console.log('Invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const { event, data } = req.body;
  
  try {
    switch (event) {
      case 'order.created':
        handleOrderCreated(data);
        break;
      case 'order.updated':
        handleOrderUpdated(data);
        break;
      case 'order.cancelled':
        handleOrderCancelled(data);
        break;
      default:
        console.log(`Unknown event: ${event}`);
    }
    
    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// وظائف معالجة الأحداث
function handleOrderCreated(orderData) {
  console.log('New order created:', orderData.order_number);
  
  // إرسال إشعار البريد الإلكتروني
  sendOrderConfirmationEmail(orderData);
  
  // تحديث قاعدة البيانات المحلية
  updateLocalDatabase(orderData);
  
  // إرسال إشعار Discord
  sendDiscordNotification(orderData);
}

function handleOrderUpdated(orderData) {
  console.log('Order updated:', orderData.order_number);
  
  // إرسال تحديث الحالة
  sendStatusUpdateEmail(orderData);
  
  // تحديث المخزون إذا لزم الأمر
  if (orderData.status === 'fulfilled') {
    updateInventory(orderData);
  }
}

// تشغيل الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});
```

### معالجة إعادة المحاولة

```javascript
// معالجة إعادة المحاولة في حالة فشل Webhook
const axios = require('axios');

async function retryWebhook(url, data, secret, maxRetries = 3) {
  const payload = JSON.stringify(data);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature
        },
        timeout: 10000 // 10 ثواني
      });
      
      console.log(`Webhook sent successfully on attempt ${attempt}`);
      return true;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('All retry attempts failed');
        return false;
      }
      
      // انتظار متزايد بين المحاولات
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## مراقبة وإدارة Webhooks

### قائمة Webhooks

```http
GET /v1/webhooks?store_id=store-uuid&active=true
Authorization: Bearer {token}
```

### تحديث Webhook

```http
PUT /v1/webhooks/{webhook_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "اسم محدث",
  "events": ["order.created", "product.updated"],
  "active": false
}
```

### حذف Webhook

```http
DELETE /v1/webhooks/{webhook_id}
Authorization: Bearer {token}
```

### اختبار Webhook

```http
POST /v1/webhooks/{webhook_id}/test
Authorization: Bearer {token}
Content-Type: application/json

{
  "event": "order.created"
}
```

## نصائح وأفضل الممارسات

### 1. معالجة سريعة
```javascript
// استجابة سريعة دون انتظار معالجة كاملة
app.post('/webhooks/orders', async (req, res) => {
  // التحقق من التوقيع أولاً
  if (!verifySignature(req.body)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // إرسال استجابة فورية
  res.status(200).json({ received: true });
  
  // معالجة البيانات في الخلفية
  processOrderAsync(req.body);
});
```

### 2. تسجيل العمليات
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'webhooks.log' })
  ]
});

app.post('/webhooks/orders', (req, res) => {
  logger.info('Webhook received', {
    event: req.body.event,
    storeId: req.body.store_id,
    timestamp: req.body.timestamp,
    signature: req.headers['x-webhook-signature']
  });
  
  // معالجة Webhook...
});
```

### 3. مراقبة الأداء
```javascript
const prometheus = require('prom-client');

// عدادات Prometheus
const webhookCounter = new prometheus.Counter({
  name: 'webhooks_received_total',
  help: 'Total number of webhooks received'
});

const webhookDuration = new prometheus.Histogram({
  name: 'webhook_processing_duration_seconds',
  help: 'Time spent processing webhooks'
});

app.post('/webhooks/orders', async (req, res) => {
  const startTime = Date.now();
  
  try {
    await processOrderWebhook(req.body);
    webhookCounter.inc({ status: 'success' });
  } catch (error) {
    webhookCounter.inc({ status: 'error' });
    throw error;
  } finally {
    webhookDuration.observe((Date.now() - startTime) / 1000);
  }
  
  res.status(200).json({ received: true });
});
```

---

**آخر تحديث**: 2 نوفمبر 2025