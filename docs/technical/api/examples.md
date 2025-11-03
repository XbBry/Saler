# أمثلة الاستخدام - API

## مقدمة

يحتوي هذا الملف على أمثلة عملية ومفصلة لاستخدام API الخاص بمشروع Saler في سيناريوهات مختلفة. تشمل الأمثلة JavaScript، Python، cURL، وPHP.

## الأمثلة الأساسية

### 1. تسجيل الدخول والحصول على التوكن

#### JavaScript/Node.js
```javascript
const axios = require('axios');

class SalerAPI {
  constructor(baseURL, apiKey = null) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.accessToken = null;
  }

  async login(email, password) {
    try {
      const response = await axios.post(`${this.baseURL}/v1/auth/login`, {
        email: email,
        password: password
      });
      
      if (response.data.success) {
        this.accessToken = response.data.data.access_token;
        return response.data.data;
      } else {
        throw new Error(response.data.error.message);
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  }

  // إضافة التوكن لجميع الطلبات
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }
}

// الاستخدام
const api = new SalerAPI('https://api.saler.com');

(async () => {
  try {
    const userData = await api.login('user@example.com', 'password123');
    console.log('تم تسجيل الدخول بنجاح:', userData.user);
  } catch (error) {
    console.error('فشل في تسجيل الدخول:', error.message);
  }
})();
```

#### Python
```python
import requests
import json

class SalerAPI:
    def __init__(self, base_url, api_key=None):
        self.base_url = base_url
        self.api_key = api_key
        self.access_token = None
        
    def login(self, email, password):
        """تسجيل الدخول والحصول على access token"""
        try:
            response = requests.post(
                f"{self.base_url}/v1/auth/login",
                json={
                    "email": email,
                    "password": password
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data["success"]:
                    self.access_token = data["data"]["access_token"]
                    return data["data"]
                else:
                    raise Exception(data["error"]["message"])
            else:
                response.raise_for_status()
                
        except requests.exceptions.RequestException as error:
            print(f"Login error: {error}")
            raise
    
    def get_auth_headers(self):
        """إضافة headers للمصادقة"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

# الاستخدام
if __name__ == "__main__":
    api = SalerAPI("https://api.saler.com")
    
    try:
        user_data = api.login("user@example.com", "password123")
        print(f"تم تسجيل الدخول بنجاح: {user_data['user']}")
    except Exception as e:
        print(f"فشل في تسجيل الدخول: {e}")
```

#### PHP
```php
<?php

class SalerAPI {
    private $baseURL;
    private $accessToken;
    
    public function __construct($baseURL) {
        $this->baseURL = $baseURL;
    }
    
    public function login($email, $password) {
        $data = [
            'email' => $email,
            'password' => $password
        ];
        
        $options = [
            'http' => [
                'header' => "Content-Type: application/json\r\n",
                'method' => 'POST',
                'content' => json_encode($data)
            ]
        ];
        
        $context = stream_context_create($options);
        $response = file_get_contents($this->baseURL . '/v1/auth/login', false, $context);
        
        if ($response === FALSE) {
            throw new Exception('فشل في تسجيل الدخول');
        }
        
        $result = json_decode($response, true);
        
        if ($result['success']) {
            $this->accessToken = $result['data']['access_token'];
            return $result['data'];
        } else {
            throw new Exception($result['error']['message']);
        }
    }
    
    public function getAuthHeaders() {
        return [
            'Authorization: Bearer ' . $this->accessToken,
            'Content-Type: application/json'
        ];
    }
}

// الاستخدام
try {
    $api = new SalerAPI('https://api.saler.com');
    $userData = $api->login('user@example.com', 'password123');
    echo "تم تسجيل الدخول بنجاح: " . print_r($userData, true);
} catch (Exception $e) {
    echo "خطأ: " . $e->getMessage();
}
?>
```

### 2. إدارة المتاجر

#### إنشاء متجر جديد
```javascript
async createStore(storeData) {
  try {
    const response = await axios.post(
      `${this.baseURL}/v1/stores`,
      storeData,
      { headers: this.getAuthHeaders() }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Create store error:', error.response?.data || error.message);
    throw error;
  }
}

// الاستخدام
const storeData = {
  name: "متجري الجديد",
  domain: "newstore",
  description: "متجر إلكتروني للمنتجات",
  currency: "SAR",
  language: "ar",
  timezone: "Asia/Riyadh"
};

const newStore = await api.createStore(storeData);
console.log('تم إنشاء المتجر:', newStore);
```

#### جلب قائمة المتاجر
```javascript
async getStores(options = {}) {
  const params = new URLSearchParams({
    page: options.page || 1,
    limit: options.limit || 10,
    ...options
  });
  
  try {
    const response = await axios.get(
      `${this.baseURL}/v1/stores?${params}`,
      { headers: this.getAuthHeaders() }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Get stores error:', error.response?.data || error.message);
    throw error;
  }
}

// الاستخدام
const stores = await api.getStores({
  page: 1,
  limit: 20,
  search: 'متجر',
  status: 'active'
});

console.log('قائمة المتاجر:', stores.items);
console.log('إجمالي النتائج:', stores.total);
```

### 3. إدارة المنتجات

#### إنشاء منتج جديد
```javascript
async createProduct(productData) {
  try {
    const response = await axios.post(
      `${this.baseURL}/v1/products`,
      productData,
      { headers: this.getAuthHeaders() }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Create product error:', error.response?.data || error.message);
    throw error;
  }
}

// الاستخدام
const productData = {
  store_id: "store-uuid",
  title: "هاتف ذكي",
  description: "هاتف ذكي بتقنية متقدمة",
  short_description: "أحدث الهواتف",
  price: 999.99,
  compare_at_price: 1199.99,
  cost_per_item: 700.00,
  track_quantity: true,
  quantity: 100,
  weight: 0.5,
  sku: "PHONE-001",
  category_id: "category-uuid",
  tags: ["هاتف", "ذكي", "تكنلوجيا"],
  images: [
    {
      url: "https://example.com/phone.jpg",
      alt_text: "صورة الهاتف",
      is_primary: true
    }
  ],
  status: "draft"
};

const newProduct = await api.createProduct(productData);
console.log('تم إنشاء المنتج:', newProduct);
```

#### جلب المنتجات مع التصفية
```javascript
async getProducts(options = {}) {
  const params = new URLSearchParams({
    page: options.page || 1,
    limit: options.limit || 20,
    ...options
  });
  
  try {
    const response = await axios.get(
      `${this.baseURL}/v1/products?${params}`,
      { headers: this.getAuthHeaders() }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Get products error:', error.response?.data || error.message);
    throw error;
  }
}

// الاستخدام - تصفية المنتجات
const products = await api.getProducts({
  store_id: "store-uuid",
  category_id: "category-uuid",
  status: "active",
  sort: "created_at",
  order: "desc",
  min_price: 50,
  max_price: 500,
  search: "هاتف"
});
```

#### تحديث منتج
```javascript
async updateProduct(productId, updateData) {
  try {
    const response = await axios.put(
      `${this.baseURL}/v1/products/${productId}`,
      updateData,
      { headers: this.getAuthHeaders() }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Update product error:', error.response?.data || error.message);
    throw error;
  }
}

// الاستخدام
const updatedProduct = await api.updateProduct("product-uuid", {
  title: "عنوان محدث",
  price: 899.99,
  quantity: 150,
  status: "active"
});
```

### 4. إدارة الطلبات

#### إنشاء طلب جديد
```javascript
async createOrder(orderData) {
  try {
    const response = await axios.post(
      `${this.baseURL}/v1/orders`,
      orderData,
      { headers: this.getAuthHeaders() }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Create order error:', error.response?.data || error.message);
    throw error;
  }
}

// الاستخدام
const orderData = {
  store_id: "store-uuid",
  customer_id: "customer-uuid",
  email: "customer@example.com",
  shipping_address: {
    first_name: "أحمد",
    last_name: "محمد",
    address_line_1: "شارع الملك فهد",
    city: "الرياض",
    postal_code: "12345",
    country: "SA"
  },
  line_items: [
    {
      product_id: "product-uuid",
      quantity: 2,
      price: 999.99
    }
  ],
  shipping_method: "standard",
  shipping_cost: 25.00,
  total_amount: 2024.98
};

const newOrder = await api.createOrder(orderData);
console.log('تم إنشاء الطلب:', newOrder);
```

#### تحديث حالة الطلب
```javascript
async updateOrderStatus(orderId, status, options = {}) {
  try {
    const response = await axios.put(
      `${this.baseURL}/v1/orders/${orderId}/status`,
      {
        status: status,
        tracking_number: options.trackingNumber,
        notes: options.notes
      },
      { headers: this.getAuthHeaders() }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Update order status error:', error.response?.data || error.message);
    throw error;
  }
}

// الاستخدام
const updatedOrder = await api.updateOrderStatus("order-uuid", "shipped", {
  trackingNumber: "TR123456789",
  notes: "تم الشحن بنجاح"
});
```

### 5. التقارير والتحليلات

#### جلب تقرير المبيعات
```javascript
async getSalesReport(options = {}) {
  const params = new URLSearchParams({
    start_date: options.startDate,
    end_date: options.endDate,
    store_id: options.storeId,
    group_by: options.groupBy || 'day'
  });
  
  try {
    const response = await axios.get(
      `${this.baseURL}/v1/analytics/sales?${params}`,
      { headers: this.getAuthHeaders() }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Get sales report error:', error.response?.data || error.message);
    throw error;
  }
}

// الاستخدام - تقرير شهري
const salesReport = await api.getSalesReport({
  startDate: '2025-01-01',
  endDate: '2025-11-02',
  storeId: 'store-uuid',
  groupBy: 'month'
});

console.log('ملخص المبيعات:', salesReport.summary);
console.log('البيانات حسب الشهر:', salesReport.time_series);
```

### 6. Webhooks

#### إنشاء Webhook
```javascript
async createWebhook(webhookData) {
  try {
    const response = await axios.post(
      `${this.baseURL}/v1/webhooks`,
      webhookData,
      { headers: this.getAuthHeaders() }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Create webhook error:', error.response?.data || error.message);
    throw error;
  }
}

// الاستخدام
const webhookData = {
  store_id: "store-uuid",
  name: "إشعارات الطلبات",
  url: "https://yoursite.com/webhooks/orders",
  events: ["order.created", "order.updated"],
  secret: "your-webhook-secret",
  active: true
};

const newWebhook = await api.createWebhook(webhookData);
console.log('تم إنشاء Webhook:', newWebhook);
```

## أمثلة متقدمة

### 1. نظام التخزين المؤقت

```javascript
class SalerAPIWithCache extends SalerAPI {
  constructor(baseURL, cacheOptions = {}) {
    super(baseURL);
    this.cache = new Map();
    this.defaultTTL = cacheOptions.defaultTTL || 300000; // 5 دقائق
  }
  
  async getProducts(options = {}, useCache = true) {
    const cacheKey = `products_${JSON.stringify(options)}`;
    
    // استخدام البيانات المحفوظة مؤقتاً
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.defaultTTL) {
        console.log('استخدام البيانات المحفوظة مؤقتاً');
        return cached.data;
      }
    }
    
    // جلب بيانات جديدة
    const data = await super.getProducts(options);
    
    // حفظ في التخزين المؤقت
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    return data;
  }
  
  clearCache() {
    this.cache.clear();
  }
}
```

### 2. نظام إعادة المحاولة

```javascript
async function withRetry(apiCall, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // انتظار متزايد بين المحاولات
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.log(`المحاولة ${attempt} فشلت، الانتظار ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

// الاستخدام
try {
  const products = await withRetry(() => 
    api.getProducts({ store_id: 'store-uuid' })
  );
  console.log('تم جلب المنتجات:', products);
} catch (error) {
  console.error('فشل في جلب المنتجات بعد عدة محاولات:', error);
}
```

### 3. نظام المراقبة

```javascript
class SalerAPIMonitor extends SalerAPI {
  constructor(baseURL) {
    super(baseURL);
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: []
    };
  }
  
  async makeRequest(method, endpoint, data = null) {
    const startTime = Date.now();
    
    try {
      this.metrics.requests++;
      
      const response = await axios({
        method: method,
        url: `${this.baseURL}${endpoint}`,
        data: data,
        headers: this.getAuthHeaders()
      });
      
      const responseTime = Date.now() - startTime;
      this.metrics.responseTime.push(responseTime);
      
      return response.data;
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }
  
  getMetrics() {
    const avgResponseTime = this.metrics.responseTime.length > 0 
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
      : 0;
    
    const errorRate = this.metrics.requests > 0 
      ? (this.metrics.errors / this.metrics.requests) * 100 
      : 0;
    
    return {
      totalRequests: this.metrics.requests,
      totalErrors: this.metrics.errors,
      errorRate: errorRate.toFixed(2) + '%',
      averageResponseTime: avgResponseTime.toFixed(2) + 'ms'
    };
  }
}
```

### 4. نظام إدارة المحتوى

```javascript
class ContentManager {
  constructor(api) {
    this.api = api;
  }
  
  // نشر منتج مع الصور
  async publishProduct(productData, images) {
    try {
      // رفع الصور أولاً
      const uploadedImages = await this.uploadImages(images);
      
      // إنشاء المنتج مع الصور المرفوعة
      const productWithImages = {
        ...productData,
        images: uploadedImages
      };
      
      const product = await this.api.createProduct(productWithImages);
      
      // نشر المنتج
      await this.api.updateProduct(product.id, { status: 'active' });
      
      return product;
    } catch (error) {
      console.error('خطأ في نشر المنتج:', error);
      throw error;
    }
  }
  
  async uploadImages(imageFiles) {
    const uploadedImages = [];
    
    for (const file of imageFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(
          `${this.api.baseURL}/v1/files/upload`,
          formData,
          {
            headers: {
              ...this.api.getAuthHeaders(),
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        if (response.data.success) {
          uploadedImages.push(response.data.data);
        }
      } catch (error) {
        console.error('خطأ في رفع الصورة:', error);
      }
    }
    
    return uploadedImages;
  }
  
  // إدارة فئات المنتجات
  async createCategoryTree(categories) {
    const createdCategories = [];
    
    for (const category of categories) {
      try {
        // إنشاء الفئة
        const newCategory = await this.api.createCategory(category);
        createdCategories.push(newCategory);
        
        // إضافة الفئات الفرعية إذا وجدت
        if (category.children && category.children.length > 0) {
          const childCategories = await this.createCategoryTree(
            category.children.map(child => ({
              ...child,
              parent_id: newCategory.id
            }))
          );
          createdCategories.push(...childCategories);
        }
      } catch (error) {
        console.error(`خطأ في إنشاء الفئة ${category.name}:`, error);
      }
    }
    
    return createdCategories;
  }
}
```

## أمثلة استخدام مع خدمات خارجية

### 1. تكامل مع Shopify

```javascript
const ShopifyAPI = require('shopify-api-node');

class ShopifyIntegration {
  constructor(salerAPI, shopifyStoreName, accessToken) {
    this.salerAPI = salerAPI;
    this.shopify = new ShopifyAPI({
      storeName: shopifyStoreName,
      accessToken: accessToken
    });
  }
  
  // مزامنة المنتجات مع Shopify
  async syncProductsToShopify() {
    try {
      const products = await this.salerAPI.getProducts({ status: 'active' });
      
      for (const product of products.items) {
        const shopifyProduct = {
          title: product.title,
          body_html: product.description,
          vendor: 'Saler Store',
          product_type: 'Default',
          variants: [{
            price: product.price,
            sku: product.sku,
            inventory_quantity: product.quantity,
            weight: product.weight
          }],
          images: product.images.map(img => ({
            src: img.url,
            alt: img.alt_text
          }))
        };
        
        try {
          await this.shopify.product.create(shopifyProduct);
          console.log(`تم مزامنة المنتج: ${product.title}`);
        } catch (error) {
          console.error(`خطأ في مزامنة المنتج ${product.title}:`, error);
        }
      }
    } catch (error) {
      console.error('خطأ في مزامنة المنتجات:', error);
    }
  }
  
  // استيراد المنتجات من Shopify
  async importProductsFromShopify() {
    try {
      const shopifyProducts = await this.shopify.product.list();
      
      for (const shopifyProduct of shopifyProducts) {
        const salerProductData = {
          store_id: 'default-store-id',
          title: shopifyProduct.title,
          description: shopifyProduct.body_html,
          price: shopifyProduct.variants[0].price,
          sku: shopifyProduct.variants[0].sku,
          quantity: shopifyProduct.variants[0].inventory_quantity,
          images: shopifyProduct.images.map(img => ({
            url: img.src,
            alt_text: img.alt
          })),
          status: 'active'
        };
        
        try {
          await this.salerAPI.createProduct(salerProductData);
          console.log(`تم استيراد المنتج: ${shopifyProduct.title}`);
        } catch (error) {
          console.error(`خطأ في استيراد المنتج ${shopifyProduct.title}:`, error);
        }
      }
    } catch (error) {
      console.error('خطأ في استيراد المنتجات:', error);
    }
  }
}
```

### 2. تكامل مع Google Analytics

```javascript
const { google } = require('googleapis');

class GoogleAnalyticsIntegration {
  constructor(salerAPI) {
    this.salerAPI = salerAPI;
    this.analytics = google.analytics('v3');
  }
  
  async syncOrdersToAnalytics() {
    try {
      // جلب الطلبات الحديثة
      const orders = await this.salerAPI.getOrders({
        start_date: this.getDateDaysAgo(1), // آخر 24 ساعة
        end_date: this.getDateDaysAgo(0),
        status: 'completed'
      });
      
      // إرسال البيانات إلى Google Analytics
      for (const order of orders.items) {
        await this.sendPurchaseEvent(order);
      }
    } catch (error) {
      console.error('خطأ في مزامنة الطلبات:', error);
    }
  }
  
  async sendPurchaseEvent(order) {
    // إعداد بيانات المعاملة
    const transaction = {
      hitType: 'event',
      eventCategory: 'Ecommerce',
      eventAction: 'Purchase',
      eventLabel: order.order_number,
      eventValue: order.total_amount,
      customMap: {
        'custom_dimension_1': order.customer.email,
        'custom_dimension_2': order.store_id
      }
    };
    
    // إرسال إلى Google Analytics
    // (يتطلب إعداد خدمة Google Analytics أولاً)
    console.log('إرسال بيانات الطلب:', transaction);
  }
  
  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
}
```

## أمثلة الأداء والتحسين

### 1. معالجة الدفعات (Batch Processing)

```javascript
class BatchProcessor {
  constructor(api, batchSize = 100) {
    this.api = api;
    this.batchSize = batchSize;
  }
  
  async processProducts(products, processor) {
    const results = [];
    
    for (let i = 0; i < products.length; i += this.batchSize) {
      const batch = products.slice(i, i + this.batchSize);
      
      try {
        console.log(`معالجة الدفعة ${Math.floor(i / this.batchSize) + 1}`);
        
        const batchPromises = batch.map(product => 
          processor(product).catch(error => ({ product, error }))
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // تأخير قصير بين الدفعات
        if (i + this.batchSize < products.length) {
          await this.delay(1000);
        }
      } catch (error) {
        console.error(`خطأ في معالجة الدفعة:`, error);
      }
    }
    
    return results;
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// الاستخدام
const processor = new BatchProcessor(api, 50);

// معالجة المنتجات
const products = await api.getProducts({ limit: 1000 });
const results = await processor.processProducts(products.items, async (product) => {
  // معالجة كل منتج
  const updatedProduct = await api.updateProduct(product.id, {
    updated_at: new Date().toISOString()
  });
  return { product: product.id, success: true };
});

console.log('نتائج المعالجة:', results);
```

هذه الأمثلة تغطي الاستخدامات الأساسية والمتقدمة لـ API مشروع Saler. يمكن استخدامها كنقطة انطلاق لتطوير تكاملات مخصصة ومناسبة لاحتياجاتك.

---

**آخر تحديث**: 2 نوفمبر 2025