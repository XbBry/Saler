# تكامل Shopify

## نظرة عامة

يُوفر تكامل Shopify مع نظام سالير جسرًا قويًا بين متجر Shopify الخاص بك ونظام إدارة المبيعات المتقدم. هذا التكامل يتيح لك مزامنة المنتجات والطلبات والعملاء تلقائيًا، مع الاستفادة من جميع ميزات سالير لإدارة المبيعات والتحليلات.

## الميزات الرئيسية

### المزامنة التلقائية
- **المزامنة الفورية**: مزامنة فورية للطلبات الجديدة من Shopify إلى سالير
- **المزامنة الدورية**: مزامنة شاملة يوميًا لضمان التناسق
- **مزامنة البيانات التاريخية**: استيراد البيانات التاريخية من متجر Shopify

### إدارة المنتجات
- **مزامنة مخزون المنتجات**: مزامنة الكميات المتاحة تلقائيًا
- **تحديث الأسعار**: مزامنة أسعار المنتجات في الوقت الفعلي
- **إدارة الفئات**: مزامنة فئات المنتجات وخصائصها

### إدارة العملاء
- **مزامنة بيانات العملاء**: استيراد معلومات العملاء من Shopify
- **سجل الطلبات**: مزامنة تاريخ طلبات العملاء
- **تقييمات العملاء**: مزامنة تقييمات ومراجعات المنتجات

### التحليلات والتقارير
- **تحليلات الأداء**: تقارير شاملة عن أداء المنتجات والطلبات
- **تحليل العملاء**: إحصائيات متقدمة عن سلوك العملاء
- **تحليل المخزون**: تقارير المخزون وتحليل دوران البضائع

## الإعداد والتكوين

### الخطوة 1: إنشاء تطبيق Shopify

```typescript
// إنشاء تطبيق Shopify عبر Admin API
interface ShopifyAppConfig {
  name: string;
  redirectURLs: string[];
  requestedScopes: ShopifyScope[];
  applicationURL: string;
  organizationID?: string;
}

class ShopifyAppCreator {
  async createPrivateApp(config: ShopifyAppConfig): Promise<ShopifyPrivateApp> {
    // التحقق من الصلاحيات المطلوبة
    this.validateRequiredScopes(config.requestedScopes);
    
    // إنشاء التطبيق الخاص
    const app = await this.shopifyAPI.createPrivateApp({
      title: config.name,
      organization_id: config.organizationID,
      application_url: config.applicationURL,
      redirect_url: config.redirectURLs[0],
      // طلب الصلاحيات المطلوبة
      required_access: {
        // صلاحيات قراءة المنتجات
        read_products: true,
        write_products: true,
        
        // صلاحيات الطلبات
        read_orders: true,
        write_orders: true,
        
        // صلاحيات العملاء
        read_customers: true,
        write_customers: true,
        
        // صلاحيات المخزون
        read_inventory: true,
        write_inventory: true,
        
        // صلاحيات الميتاالفيلدز
        read_metafields: true,
        write_metafields: true,
        
        // صلاحيات الحزلقات
        read_fulfillments: true,
        write_fulfillments: true,
        
        // صلاحيات التحليلات
        read_analytics: true,
        read_reports: true
      }
    });

    return {
      appId: app.id,
      name: app.title,
      apiKey: app.api_key,
      apiSecretKey: app.shared_secret,
      accessToken: app.access_token,
      scopes: this.getGrantedScopes(app),
      installedAt: new Date(),
      organizationId: app.organization_id
    };
  }
}
```

### الخطوة 2: تكوين API Keys في سالير

```typescript
// إعدادات تكامل Shopify في سالير
interface SalerShopifyIntegration {
  shopify: {
    shopDomain: string;        // yourstore.myshopify.com
    apiKey: string;           // مفتاح API
    apiSecretKey: string;     // سر API
    accessToken: string;      // رمز الوصول
    apiVersion: string;       // إصدار API (افتراضي: 2023-10)
  };
  sync: {
    realTimeSync: boolean;    // مزامنة فورية
    syncInterval: number;     // فترة المزامنة (بالدقائق)
    batchSize: number;        // حجم الدفعة الواحدة
    retryAttempts: number;    // عدد محاولات إعادة المحاولة
    retryDelay: number;       // فترة الانتظار بين المحاولات (بالثواني)
  };
  mapping: {
    productCategories: boolean;   // مزامنة فئات المنتجات
    customerGroups: boolean;      // مزامنة مجموعات العملاء
    orderTags: boolean;           // مزامنة وسوم الطلبات
    productVariants: boolean;     // مزامنة متغيرات المنتجات
    inventoryTracking: boolean;   // تتبع المخزون
  };
  notifications: {
    orderCreated: boolean;        // إشعار عند إنشاء طلب
    orderUpdated: boolean;        // إشعار عند تحديث طلب
    lowStock: boolean;           // إشعار نفاد المخزون
    syncErrors: boolean;         // إشعار أخطاء المزامنة
  };
}

class ShopifyIntegrationManager {
  private config: SalerShopifyIntegration;
  private apiClient: ShopifyAPIClient;
  private syncEngine: SyncEngine;
  private webhookHandler: WebhookHandler;

  constructor(config: SalerShopifyIntegration) {
    this.config = config;
    this.apiClient = new ShopifyAPIClient(config.shopify);
    this.syncEngine = new SyncEngine(this.apiClient);
    this.webhookHandler = new WebhookHandler(config);
  }

  async initializeIntegration(): Promise<IntegrationStatus> {
    try {
      // التحقق من صحة بيانات API
      await this.validateAPIConnection();
      
      // تكوين الـ webhooks
      await this.setupWebhooks();
      
      // بدء المزامنة الأولية
      await this.performInitialSync();
      
      // بدء المراقبة المستمرة
      this.startContinuousMonitoring();

      return {
        status: 'active',
        lastSync: new Date(),
        activeWebhooks: await this.getActiveWebhooksCount(),
        syncHealth: 'healthy'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        lastSync: null,
        activeWebhooks: 0,
        syncHealth: 'critical'
      };
    }
  }

  private async validateAPIConnection(): Promise<void> {
    try {
      // اختبار الاتصال بـ Shopify API
      const shopInfo = await this.apiClient.getShopInfo();
      
      if (!shopInfo) {
        throw new Error('فشل في الاتصال بـ Shopify API');
      }

      // التحقق من الصلاحيات
      const permissions = await this.apiClient.getRequiredPermissions();
      const requiredPermissions = [
        'read_products', 'write_products',
        'read_orders', 'write_orders',
        'read_customers', 'write_customers',
        'read_inventory', 'write_inventory'
      ];

      const hasRequiredPermissions = requiredPermissions.every(permission =>
        permissions.includes(permission)
      );

      if (!hasRequiredPermissions) {
        throw new Error('الصلاحيات المطلوبة غير متوفرة');
      }

    } catch (error) {
      throw new Error(`فشل في التحقق من الاتصال: ${error.message}`);
    }
  }

  private async setupWebhooks(): Promise<void> {
    const webhookEvents = [
      // أحداث المنتجات
      { topic: 'products/create', endpoint: '/webhooks/shopify/products/create' },
      { topic: 'products/update', endpoint: '/webhooks/shopify/products/update' },
      { topic: 'products/delete', endpoint: '/webhooks/shopify/products/delete' },
      
      // أحداث الطلبات
      { topic: 'orders/create', endpoint: '/webhooks/shopify/orders/create' },
      { topic: 'orders/updated', endpoint: '/webhooks/shopify/orders/update' },
      { topic: 'orders/paid', endpoint: '/webhooks/shopify/orders/paid' },
      { topic: 'orders/cancelled', endpoint: '/webhooks/shopify/orders/cancelled' },
      { topic: 'orders/fulfilled', endpoint: '/webhooks/shopify/orders/fulfilled' },
      
      // أحداث العملاء
      { topic: 'customers/create', endpoint: '/webhooks/shopify/customers/create' },
      { topic: 'customers/update', endpoint: '/webhooks/shopify/customers/update' },
      
      // أحداث المخزون
      { topic: 'inventory_levels/update', endpoint: '/webhooks/shopify/inventory/update' }
    ];

    for (const webhook of webhookEvents) {
      try {
        await this.apiClient.createWebhook({
          topic: webhook.topic,
          address: `${this.config.webhookBaseURL}${webhook.endpoint}`,
          format: 'json'
        });
      } catch (error) {
        console.warn(`فشل في إنشاء webhook ${webhook.topic}:`, error);
      }
    }
  }
}
```

## مزامنة المنتجات

### مزامنة بيانات المنتجات

```typescript
class ProductSyncService {
  async syncProducts(options: ProductSyncOptions): Promise<SyncResult> {
    const syncId = generateUniqueId();
    const startTime = new Date();

    try {
      // جلب المنتجات من Shopify
      const shopifyProducts = await this.fetchProductsFromShopify(options);
      
      // تحويل المنتجات لتنسيق سالير
      const salerProducts = await this.transformProductsForSaler(shopifyProducts);
      
      // حفظ المنتجات في سالير
      const savedProducts = await this.saveProductsToSaler(salerProducts);
      
      // مزامنة المخزون
      await this.syncInventoryLevels(savedProducts);
      
      // مزامنة الصور
      await this.syncProductImages(savedProducts);
      
      // مزامنة المتغيرات
      if (this.config.mapping.productVariants) {
        await this.syncProductVariants(savedProducts);
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        syncId,
        status: 'completed',
        startTime,
        endTime,
        duration,
        syncedItems: {
          products: savedProducts.length,
          images: await this.getImageCount(savedProducts),
          variants: await this.getVariantCount(savedProducts)
        },
        errors: []
      };
    } catch (error) {
      return {
        syncId,
        status: 'failed',
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        syncedItems: { products: 0, images: 0, variants: 0 },
        errors: [error.message]
      };
    }
  }

  private async fetchProductsFromShopify(options: ProductSyncOptions): Promise<ShopifyProduct[]> {
    const products: ShopifyProduct[] = [];
    let pageInfo = null;
    let hasMore = true;

    while (hasMore) {
      const response = await this.shopifyAPI.products.list({
        limit: options.batchSize || 250,
        page_info: pageInfo,
        // تحديد الحقول المطلوبة فقط لتحسين الأداء
        fields: 'id,title,body_html,handle,vendor,product_type,tags,status,created_at,updated_at,published_at,template_suffix,variants,images,options,metafields'
      });

      products.push(...response.products);
      
      // التحقق من وجود المزيد من الصفحات
      hasMore = response.hasNextPage;
      pageInfo = response.nextPageInfo;
    }

    return products;
  }

  private async transformProductsForSaler(shopifyProducts: ShopifyProduct[]): Promise<SalerProduct[]> {
    return shopifyProducts.map(shopifyProduct => ({
      // معلومات أساسية
      externalId: `shopify_${shopifyProduct.id}`,
      name: shopifyProduct.title,
      description: this.cleanHTML(shopifyProduct.body_html || ''),
      handle: shopifyProduct.handle,
      status: this.mapShopifyStatus(shopifyProduct.status),
      
      // معلومات البائع والتصنيف
      vendor: shopifyProduct.vendor,
      category: shopifyProduct.product_type,
      tags: this.parseTags(shopifyProduct.tags),
      
      // معلومات التسعير
      basePrice: this.calculateBasePrice(shopifyProduct.variants),
      compareAtPrice: this.findCompareAtPrice(shopifyProduct.variants),
      costPrice: this.findCostPrice(shopifyProduct.variants),
      
      // معلومات المخزون
      inventoryQuantity: this.calculateTotalInventory(shopifyProduct.variants),
      trackInventory: shopifyProduct.variants.some(v => v.inventory_management === 'shopify'),
      inventoryPolicy: this.mapInventoryPolicy(shopifyProduct.variants),
      
      // معلومات SEO
      seoTitle: shopifyProduct.metafields?.find(m => m.key === 'seo_title')?.value || shopifyProduct.title,
      seoDescription: shopifyProduct.metafields?.find(m => m.key === 'seo_description')?.value || '',
      
      // معلومات إضافية
      template: shopifyProduct.template_suffix,
      createdAt: new Date(shopifyProduct.created_at),
      updatedAt: new Date(shopifyProduct.updated_at),
      publishedAt: shopifyProduct.published_at ? new Date(shopifyProduct.published_at) : null,
      
      // البيانات الوسيطة
      metadata: {
        shopifyId: shopifyProduct.id,
        shopifyProduct: shopifyProduct,
        source: 'shopify',
        lastSync: new Date()
      }
    }));
  }

  private async syncInventoryLevels(products: SalerProduct[]): Promise<void> {
    // جلب مستويات المخزون من Shopify
    const inventoryLevels = await this.shopifyAPI.inventoryLevels.list();
    
    // ربط مستويات المخزون بالمنتجات
    const inventoryMap = new Map();
    for (const level of inventoryLevels.inventory_levels) {
      inventoryMap.set(level.inventory_item_id, level.available);
    }

    // تحديث المخزون في سالير
    for (const product of products) {
      const inventoryItem = product.metadata.shopifyProduct.variants[0]?.inventory_item_id;
      if (inventoryItem && inventoryMap.has(inventoryItem)) {
        product.inventoryQuantity = inventoryMap.get(inventoryItem);
      }
    }
  }

  private async syncProductImages(products: SalerProduct[]): Promise<void> {
    for (const product of products) {
      const shopifyImages = product.metadata.shopifyProduct.images;
      
      product.images = shopifyImages.map((image, index) => ({
        url: image.src,
        alt: image.alt || product.name,
        position: index,
        isPrimary: index === 0,
        metadata: {
          shopifyImageId: image.id,
          width: image.width,
          height: image.height
        }
      }));
    }
  }
}
```

### مزامنة فئات المنتجات

```typescript
class CategorySyncService {
  async syncCategories(): Promise<SyncResult> {
    try {
      // جلب المجموعات من Shopify
      const shopifyCollections = await this.shopifyAPI.customCollections.list();
      
      // تحويل المجموعات إلى فئات سالير
      const salerCategories = await this.transformCollections(shopifyCollections);
      
      // حفظ الفئات في سالير
      await this.saveCategoriesToSaler(salerCategories);
      
      // ربط المنتجات بالفئات
      await this.linkProductsToCategories(salerCategories);

      return {
        status: 'completed',
        syncedItems: {
          categories: salerCategories.length,
          productLinks: await this.getProductCategoryLinksCount()
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        errors: [error.message]
      };
    }
  }

  private async transformCollections(collections: ShopifyCollection[]): Promise<SalerCategory[]> {
    return collections.map(collection => ({
      externalId: `shopify_collection_${collection.id}`,
      name: collection.title,
      description: collection.body_html ? this.cleanHTML(collection.body_html) : '',
      handle: collection.handle,
      parentId: null, // Shopify لا يدعم التسلسل الهرمي في الإصدار الحالي
      sortOrder: collection.sort_order || 'manual',
      isActive: collection.published_at !== null,
      image: collection.image?.src || null,
      metadata: {
        shopifyCollectionId: collection.id,
        source: 'shopify',
        publishedAt: collection.published_at
      }
    }));
  }
}
```

## مزامنة الطلبات

### مزامنة الطلبات الجديدة

```typescript
class OrderSyncService {
  async syncOrders(options: OrderSyncOptions): Promise<SyncResult> {
    const syncId = generateUniqueId();
    const startTime = new Date();

    try {
      // جلب الطلبات من Shopify
      const shopifyOrders = await this.fetchOrdersFromShopify(options);
      
      // تحويل الطلبات إلى تنسيق سالير
      const salerOrders = await this.transformOrdersForSaler(shopifyOrders);
      
      // حفظ الطلبات في سالير
      const savedOrders = await this.saveOrdersToSaler(salerOrders);
      
      // مزامنة العملاء المرتبطة
      await this.syncOrderCustomers(savedOrders);
      
      // مزامنة الشحنات
      await this.syncFulfillments(savedOrders);
      
      // تحديث إحصائيات الأداء
      await this.updatePerformanceMetrics(savedOrders);

      const endTime = new Date();
      return {
        syncId,
        status: 'completed',
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        syncedItems: {
          orders: savedOrders.length,
          customers: await this.getCustomerCount(savedOrders),
          fulfillments: await this.getFulfillmentCount(savedOrders)
        }
      };
    } catch (error) {
      return {
        syncId,
        status: 'failed',
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        syncedItems: { orders: 0, customers: 0, fulfillments: 0 },
        errors: [error.message]
      };
    }
  }

  private async fetchOrdersFromShopify(options: OrderSyncOptions): Promise<ShopifyOrder[]> {
    const params: any = {
      limit: options.batchSize || 250,
      status: 'any', // يشمل جميع حالات الطلبات
      order: 'created_at asc',
      // تحديد الحقول المطلوبة
      fields: 'id,order_number,name,email,customer,line_items,shipping_address,billing_address,shipping_lines,total_price,subtotal_price,total_tax,total_discounts,currency,financial_status,fulfillment_status,fulfillments,created_at,updated_at,closed_at,cancelled_at,note,tags,source_name'
    };

    // تصفية حسب التاريخ
    if (options.sinceDate) {
      params.created_at_min = options.sinceDate.toISOString();
    }
    if (options.untilDate) {
      params.created_at_max = options.untilDate.toISOString();
    }

    const orders: ShopifyOrder[] = [];
    let pageInfo = null;
    let hasMore = true;

    while (hasMore) {
      if (pageInfo) {
        params.page_info = pageInfo;
      }

      const response = await this.shopifyAPI.orders.list(params);
      orders.push(...response.orders);
      
      hasMore = response.hasNextPage;
      pageInfo = response.nextPageInfo;
    }

    return orders;
  }

  private async transformOrdersForSaler(shopifyOrders: ShopifyOrder[]): Promise<SalerOrder[]> {
    return shopifyOrders.map(order => ({
      // معلومات أساسية
      externalId: `shopify_${order.id}`,
      orderNumber: order.order_number,
      orderName: order.name,
      
      // معلومات العميل
      customerId: order.customer ? `shopify_${order.customer.id}` : null,
      customerEmail: order.email,
      customerName: order.customer ? `${order.customer.first_name} ${order.customer.last_name}`.trim() : '',
      
      // معلومات المنتجات
      items: await this.transformOrderItems(order.line_items),
      
      // معلومات التسعير
      subtotal: parseFloat(order.subtotal_price),
      tax: parseFloat(order.total_tax),
      shipping: this.calculateShippingTotal(order.shipping_lines),
      discount: parseFloat(order.total_discounts),
      total: parseFloat(order.total_price),
      currency: order.currency,
      
      // الحالة والوضع المالي
      status: this.mapOrderStatus(order.fulfillment_status),
      financialStatus: this.mapFinancialStatus(order.financial_status),
      
      // عناوين الشحن والفواتير
      shippingAddress: this.transformAddress(order.shipping_address),
      billingAddress: this.transformAddress(order.billing_address),
      shippingMethod: this.getShippingMethod(order.shipping_lines),
      
      // معلومات إضافية
      note: order.note,
      tags: this.parseTags(order.tags),
      source: order.source_name,
      
      // التواريخ
      orderDate: new Date(order.created_at),
      updatedAt: new Date(order.updated_at),
      closedAt: order.closed_at ? new Date(order.closed_at) : null,
      cancelledAt: order.cancelled_at ? new Date(order.cancelled_at) : null,
      
      // البيانات الوسيطة
      metadata: {
        shopifyOrderId: order.id,
        shopifyOrder: order,
        source: 'shopify',
        lastSync: new Date()
      }
    }));
  }

  private async transformOrderItems(lineItems: ShopifyLineItem[]): Promise<OrderItem[]> {
    return lineItems.map(item => ({
      productId: `shopify_${item.product_id}`,
      variantId: item.variant_id ? `shopify_${item.variant_id}` : null,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      price: parseFloat(item.price),
      totalPrice: parseFloat(item.price) * item.quantity,
      taxAmount: parseFloat(item.tax_lines?.reduce((sum, tax) => sum + parseFloat(tax.price), 0).toFixed(2)),
      discountAmount: parseFloat(item.total_discount),
      weight: item.weight,
      grams: item.grams,
      requiresShipping: item.requires_shipping,
      taxable: item.taxable,
      fulfillmentStatus: item.fulfillment_status,
      metadata: {
        shopifyLineItemId: item.id,
        variant: item.variant,
        product: item.product
      }
    }));
  }

  private transformAddress(address: ShopifyAddress): Address | null {
    if (!address) return null;

    return {
      firstName: address.first_name,
      lastName: address.last_name,
      company: address.company,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      province: address.province,
      provinceCode: address.province_code,
      country: address.country,
      countryCode: address.country_code,
      zip: address.zip,
      phone: address.phone
    };
  }
}
```

## مزامنة العملاء

### مزامنة بيانات العملاء

```typescript
class CustomerSyncService {
  async syncCustomers(options: CustomerSyncOptions): Promise<SyncResult> {
    try {
      // جلب العملاء من Shopify
      const shopifyCustomers = await this.fetchCustomersFromShopify(options);
      
      // تحويل العملاء إلى تنسيق سالير
      const salerCustomers = await this.transformCustomersForSaler(shopifyCustomers);
      
      // حفظ العملاء في سالير
      const savedCustomers = await this.saveCustomersToSaler(salerCustomers);
      
      // مزامنة عناوين العملاء
      await this.syncCustomerAddresses(savedCustomers);
      
      // مزامنة المجموعات
      await this.syncCustomerGroups(savedCustomers);
      
      // تحديث إحصائيات العملاء
      await this.updateCustomerStatistics(savedCustomers);

      return {
        status: 'completed',
        syncedItems: {
          customers: savedCustomers.length,
          addresses: await this.getAddressCount(savedCustomers)
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        errors: [error.message]
      };
    }
  }

  private async transformCustomersForSaler(shopifyCustomers: ShopifyCustomer[]): Promise<SalerCustomer[]> {
    return shopifyCustomers.map(customer => ({
      // معلومات أساسية
      externalId: `shopify_${customer.id}`,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      isActive: customer.state === 'enabled',
      
      // معلومات إضافية
      company: customer.default_address?.company || '',
      tags: this.parseTags(customer.tags),
      note: customer.note,
      
      // إعدادات الاتصال
      acceptsMarketing: customer.accepts_marketing,
      emailMarketingConsent: customer.email_marketing_consent,
      smsMarketingConsent: customer.sms_marketing_consent,
      
      // معلومات المحفظة
      totalSpent: parseFloat(customer.total_spent),
      ordersCount: customer.orders_count,
      averageOrderValue: customer.orders_count > 0 
        ? parseFloat(customer.total_spent) / customer.orders_count 
        : 0,
      
      // التواريخ المهمة
      createdAt: new Date(customer.created_at),
      updatedAt: new Date(customer.updated_at),
      lastOrderDate: customer.last_order_date ? new Date(customer.last_order_date) : null,
      
      // العنوان الافتراضي
      defaultAddress: customer.default_address ? 
        this.transformCustomerAddress(customer.default_address) : null,
      
      // البيانات الوسيطة
      metadata: {
        shopifyCustomerId: customer.id,
        shopifyCustomer: customer,
        source: 'shopify',
        lastSync: new Date()
      }
    }));
  }

  private transformCustomerAddress(address: ShopifyAddress): CustomerAddress {
    return {
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      province: address.province,
      country: address.country,
      zip: address.zip,
      phone: address.phone,
      isDefault: true // هذا هو العنوان الافتراضي
    };
  }
}
```

## Webhooks وإدارة الأحداث

### معالج الأحداث الفوري

```typescript
class ShopifyWebhookHandler {
  private orderHandler: OrderWebhookHandler;
  private productHandler: ProductWebhookHandler;
  private customerHandler: CustomerWebhookHandler;
  private inventoryHandler: InventoryWebhookHandler;

  async handleOrderCreate(payload: ShopifyOrder): Promise<void> {
    try {
      // تحويل طلب Shopify إلى تنسيق سالير
      const salerOrder = await this.transformOrder(payload);
      
      // حفظ الطلب في سالير
      await this.orderService.createOrder(salerOrder);
      
      // إرسال إشعار للعميل
      await this.notificationService.sendOrderConfirmation(salerOrder);
      
      // تحديث إحصائيات المبيعات
      await this.analyticsService.updateSalesMetrics(salerOrder);
      
      // تشغيل العمليات الآلية
      await this.automationService.triggerOrderCreated(salerOrder);
      
    } catch (error) {
      await this.errorHandler.handleWebhookError('order_create', error, payload);
    }
  }

  async handleOrderUpdate(payload: ShopifyOrder): Promise<void> {
    try {
      // البحث عن الطلب في سالير
      const existingOrder = await this.orderService.findByExternalId(`shopify_${payload.id}`);
      
      if (!existingOrder) {
        // إذا لم يكن الطلب موجودًا، قم بإنشائه
        await this.handleOrderCreate(payload);
        return;
      }

      // تحديث بيانات الطلب
      const updatedOrder = await this.transformOrder(payload);
      await this.orderService.updateOrder(existingOrder.id, updatedOrder);
      
      // معالجة تغييرات الحالة
      if (existingOrder.status !== updatedOrder.status) {
        await this.handleOrderStatusChange(existingOrder, updatedOrder);
      }
      
    } catch (error) {
      await this.errorHandler.handleWebhookError('order_update', error, payload);
    }
  }

  async handleProductUpdate(payload: ShopifyProduct): Promise<void> {
    try {
      const salerProduct = await this.transformProduct(payload);
      await this.productService.updateProductByExternalId(`shopify_${payload.id}`, salerProduct);
      
      // تحديث أسعار المنتجات في المتاجر الأخرى
      await this.multiStoreSyncService.syncProductToOtherStores(salerProduct);
      
    } catch (error) {
      await this.errorHandler.handleWebhookError('product_update', error, payload);
    }
  }

  async handleInventoryUpdate(payload: ShopifyInventoryLevel): Promise<void> {
    try {
      // العثور على المنتج المرتبط
      const product = await this.findProductByInventoryItemId(payload.inventory_item_id);
      
      if (product) {
        // تحديث مستوى المخزون
        await this.inventoryService.updateInventoryLevel(product.id, payload.available);
        
        // فحص مستويات المخزون المنخفضة
        if (payload.available <= product.reorderPoint) {
          await this.notificationService.sendLowStockAlert(product, payload.available);
        }
      }
      
    } catch (error) {
      await this.errorHandler.handleWebhookError('inventory_update', error, payload);
    }
  }

  private async handleOrderStatusChange(oldOrder: SalerOrder, newOrder: SalerOrder): Promise<void> {
    const statusTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'returned'],
      'delivered': ['returned'],
      'cancelled': [],
      'returned': []
    };

    const allowedTransitions = statusTransitions[oldOrder.status] || [];
    
    if (allowedTransitions.includes(newOrder.status)) {
      // تنفيذ إجراءات انتقالية
      await this.executeStatusTransition(oldOrder, newOrder);
    }
  }

  private async executeStatusTransition(oldOrder: SalerOrder, newOrder: SalerOrder): Promise<void> {
    const transitionActions = {
      'confirmed': async () => {
        // حجز المخزون
        await this.inventoryService.reserveInventory(oldOrder.items);
        
        // إرسال تأكيد الطلب
        await this.notificationService.sendOrderConfirmation(oldOrder);
      },
      
      'processing': async () => {
        // بدء معالجة الطلب
        await this.fulfillmentService.startProcessing(oldOrder);
      },
      
      'shipped': async () => {
        // إنشاء شحنة
        const shipment = await this.fulfillmentService.createShipment(oldOrder);
        
        // إرسال إشعار الشحن
        await this.notificationService.sendShipmentNotification(oldOrder, shipment);
      },
      
      'delivered': async () => {
        // تأكيد التسليم
        await this.orderService.markAsDelivered(oldOrder.id);
        
        // إرسال استطلاع رضا العملاء
        await this.notificationService.sendSatisfactionSurvey(oldOrder);
        
        // تحديث إحصائيات التسليم
        await this.analyticsService.updateDeliveryMetrics(oldOrder);
      }
    };

    const action = transitionActions[newOrder.status];
    if (action) {
      await action();
    }
  }
}
```

## إدارة المخزون

### مزامنة مستويات المخزون

```typescript
class InventorySyncService {
  async syncInventory(): Promise<InventorySyncResult> {
    try {
      // جلب جميع مستويات المخزون من Shopify
      const inventoryLevels = await this.shopifyAPI.inventoryLevels.list();
      
      // إنشاء خريطة للأصناف المتاحة
      const inventoryMap = new Map();
      for (const level of inventoryLevels.inventory_levels) {
        inventoryMap.set(level.inventory_item_id, level.available);
      }

      // جلب جميع المنتجات ومتغيراتها
      const products = await this.productService.getAllProducts();
      
      const updates: InventoryUpdate[] = [];
      const errors: string[] = [];

      // تحديث مستويات المخزون
      for (const product of products) {
        for (const variant of product.variants || []) {
          const shopifyVariant = variant.metadata?.shopifyVariant;
          
          if (shopifyVariant?.inventory_item_id) {
            const available = inventoryMap.get(shopifyVariant.inventory_item_id);
            
            if (available !== undefined && variant.stock !== available) {
              try {
                await this.updateVariantStock(variant.id, available);
                updates.push({
                  productId: product.id,
                  variantId: variant.id,
                  oldStock: variant.stock,
                  newStock: available,
                  updatedAt: new Date()
                });
              } catch (error) {
                errors.push(`فشل في تحديث مخزون المنتج ${product.name}: ${error.message}`);
              }
            }
          }
        }
      }

      return {
        success: true,
        updatedItems: updates.length,
        errors: errors,
        syncTimestamp: new Date()
      };
      
    } catch (error) {
      return {
        success: false,
        updatedItems: 0,
        errors: [error.message],
        syncTimestamp: new Date()
      };
    }
  }

  async adjustInventory(variantId: string, adjustment: number, reason: string): Promise<void> {
    try {
      const variant = await this.productService.findVariantById(variantId);
      
      if (!variant?.metadata?.shopifyVariant?.inventory_item_id) {
        throw new Error('المتغير غير مرتبط بـ Shopify');
      }

      // تطبيق التعديل في Shopify
      const newQuantity = await this.shopifyAPI.inventoryLevels.adjust({
        inventory_item_id: variant.metadata.shopifyVariant.inventory_item_id,
        location_id: this.config.shopify.locationId,
        available_adjustment: adjustment
      });

      // تحديث الكمية في سالير
      await this.productService.updateVariantStock(variantId, newQuantity);

      // تسجيل حركة المخزون
      await this.inventoryService.recordAdjustment({
        variantId: variantId,
        type: adjustment > 0 ? 'increase' : 'decrease',
        quantity: Math.abs(adjustment),
        reason: reason,
        oldQuantity: variant.stock,
        newQuantity: newQuantity,
        timestamp: new Date(),
        source: 'manual_adjustment'
      });

    } catch (error) {
      throw new Error(`فشل في تعديل المخزون: ${error.message}`);
    }
  }
}
```

## التحليلات والتقارير

### لوحة تحكم الأداء

```typescript
class ShopifyAnalyticsDashboard {
  async generatePerformanceReport(dateRange: DateRange): Promise<ShopifyPerformanceReport> {
    const [
      salesMetrics,
      productMetrics,
      customerMetrics,
      inventoryMetrics
    ] = await Promise.all([
      this.getSalesMetrics(dateRange),
      this.getProductMetrics(dateRange),
      this.getCustomerMetrics(dateRange),
      this.getInventoryMetrics(dateRange)
    ]);

    return {
      period: dateRange,
      generatedAt: new Date(),
      sales: salesMetrics,
      products: productMetrics,
      customers: customerMetrics,
      inventory: inventoryMetrics,
      syncHealth: await this.getSyncHealthMetrics(),
      recommendations: await this.generateRecommendations({
        sales: salesMetrics,
        products: productMetrics,
        customers: customerMetrics,
        inventory: inventoryMetrics
      })
    };
  }

  private async getSalesMetrics(dateRange: DateRange): Promise<SalesMetrics> {
    const orders = await this.orderService.getOrdersByDateRange(dateRange);
    
    return {
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      totalOrders: orders.length,
      averageOrderValue: orders.length > 0 
        ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length 
        : 0,
      conversionRate: await this.calculateConversionRate(dateRange),
      topSellingProducts: await this.getTopSellingProducts(dateRange, 10),
      salesByChannel: await this.getSalesByChannel(dateRange),
      salesTrend: await this.calculateSalesTrend(dateRange),
      seasonalTrends: await this.getSeasonalTrends(dateRange)
    };
  }

  private async getProductMetrics(dateRange: DateRange): Promise<ProductMetrics> {
    const products = await this.productService.getAllProducts();
    const orders = await this.orderService.getOrdersByDateRange(dateRange);
    
    return {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.isActive).length,
      outOfStockProducts: products.filter(p => p.stock === 0).length,
      lowStockProducts: products.filter(p => p.stock <= p.reorderPoint).length,
      topPerformingProducts: await this.getTopPerformingProducts(dateRange, 10),
      slowMovingProducts: await this.getSlowMovingProducts(dateRange, 10),
      productTurnover: await this.calculateProductTurnover(dateRange),
      averagePrice: products.reduce((sum, p) => sum + p.price, 0) / products.length
    };
  }

  private async getCustomerMetrics(dateRange: DateRange): Promise<CustomerMetrics> {
    const customers = await this.customerService.getAllCustomers();
    const orders = await this.orderService.getOrdersByDateRange(dateRange);
    
    return {
      totalCustomers: customers.length,
      newCustomers: await this.getNewCustomersCount(dateRange),
      returningCustomers: await this.getReturningCustomersCount(dateRange),
      customerLifetimeValue: await this.calculateAverageCustomerLifetimeValue(),
      customerAcquisitionCost: await this.calculateCustomerAcquisitionCost(dateRange),
      customerRetentionRate: await this.calculateCustomerRetentionRate(dateRange),
      topCustomers: await this.getTopCustomers(dateRange, 10),
      customerSegmentation: await this.getCustomerSegmentation()
    };
  }
}
```

## حل المشاكل الشائعة

### مشاكل المزامنة

```typescript
class SyncTroubleshootingService {
  async diagnoseSyncIssues(): Promise<DiagnosticReport> {
    const issues: SyncIssue[] = [];
    
    // التحقق من اتصال API
    const apiHealth = await this.checkAPIConnection();
    if (!apiHealth.isHealthy) {
      issues.push({
        type: 'connection_error',
        severity: 'critical',
        description: 'فشل في الاتصال بـ Shopify API',
        details: apiHealth.error,
        suggestedAction: 'التحقق من صحة مفاتيح API'
      });
    }

    // التحقق من حالة الـ webhooks
    const webhookStatus = await this.checkWebhookStatus();
    if (webhookStatus.failedWebhooks.length > 0) {
      issues.push({
        type: 'webhook_failure',
        severity: 'high',
        description: `${webhookStatus.failedWebhooks.length} webhook فاشلة`,
        details: webhookStatus.failedWebhooks,
        suggestedAction: 'إعادة تسجيل الـ webhooks الفاشلة'
      });
    }

    // التحقق من تناسق البيانات
    const dataConsistency = await this.checkDataConsistency();
    if (dataConsistency.discrepancies.length > 0) {
      issues.push({
        type: 'data_inconsistency',
        severity: 'medium',
        description: 'عدم تناسق في البيانات',
        details: dataConsistency.discrepancies,
        suggestedAction: 'تشغيل مزامنة شاملة'
      });
    }

    // التحقق من أداء المزامنة
    const performanceMetrics = await this.getSyncPerformanceMetrics();
    if (performanceMetrics.averageSyncTime > 300000) { // 5 دقائق
      issues.push({
        type: 'performance_degradation',
        severity: 'low',
        description: 'أداء المزامنة بطيء',
        details: performanceMetrics,
        suggestedAction: 'تحسين إعدادات المزامنة'
      });
    }

    return {
      scanDate: new Date(),
      overallHealth: this.calculateOverallHealth(issues),
      issues: issues,
      recommendations: await this.generateTroubleshootingRecommendations(issues)
    };
  }

  async fixCommonIssues(issueTypes: IssueType[]): Promise<FixResult[]> {
    const results: FixResult[] = [];

    for (const issueType of issueTypes) {
      try {
        switch (issueType) {
          case 'webhook_failure':
            await this.recreateFailedWebhooks();
            results.push({ type: issueType, status: 'fixed', message: 'تم إعادة إنشاء الـ webhooks' });
            break;
            
          case 'data_inconsistency':
            await this.performFullResync();
            results.push({ type: issueType, status: 'fixed', message: 'تم تشغيل المزامنة الشاملة' });
            break;
            
          case 'connection_error':
            await this.resetAPIConnection();
            results.push({ type: issueType, status: 'fixed', message: 'تم إعادة تعيين اتصال API' });
            break;
        }
      } catch (error) {
        results.push({ 
          type: issueType, 
          status: 'failed', 
          message: `فشل في إصلاح ${issueType}: ${error.message}` 
        });
      }
    }

    return results;
  }
}
```

هذا المستند يقدم دليلاً شاملاً لتكامل Shopify مع نظام سالير، يغطي جميع الجوانب من الإعداد الأولي إلى إدارة العمليات المتقدمة وحل المشاكل.