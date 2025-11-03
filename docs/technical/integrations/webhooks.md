# نظام Webhooks

## نظرة عامة

يُوفر نظام Webhooks في سالير آلية قوية وموثوقة للتواصل الفوري مع الأنظمة الخارجية والاستجابة للأحداث في الوقت الفعلي. يمكن من خلال هذا النظام إرسال وإ接收 البيانات بين سالير والخدمات المختلفة مثل Shopify و Meta Ads وأنظمة الدفع والمنصات الأخرى.

## الميزات الرئيسية

### إدارة Webhooks الشاملة
- **إنشاء وإدارة Webhooks**: إنشاء وتكوين webhooks مخصصة
- **تنفيذ الأحداث**: تنفيذ آمن وموثوق للأحداث
- **إعادة المحاولة الذكية**: آليات متقدمة لإعادة المحاولة عند الفشل
- **التوقيع والتحقق**: توقيع آمن للتحقق من صحة البيانات

### مراقبة وإدارة الأداء
- **مراقبة الإحصائيات**: إحصائيات مفصلة عن أداء كل webhook
- **التنبيهات**: تنبيهات فورية عند فشل أو تأخر الأحداث
- **التقارير**: تقارير شاملة عن أداء النظام
- **التشخيص**: أدوات تشخيص وحل المشاكل

### الأمان والحماية
- **تشفير البيانات**: تشفير كامل للبيانات المرسلة والمستقبلة
- **التحقق من المصدر**: التحقق من صحة المصدر والمحتوى
- **معدل القيود**: حماية من الإفراط في الإرسال
- **سجلات التدقيق**: سجلات مفصلة لجميع الأنشطة

## بنية النظام

### مكون Webhook Engine

```typescript
interface WebhookConfiguration {
  id: string;
  name: string;
  event: string;
  url: string;
  secret: string;
  isActive: boolean;
  headers: Record<string, string>;
  retryPolicy: RetryPolicy;
  rateLimits: RateLimitConfig;
  filters: WebhookFilter[];
  transformations: DataTransformation[];
  createdAt: Date;
  updatedAt: Date;
}

class WebhookEngine {
  private eventBus: EventBus;
  private deliveryService: WebhookDeliveryService;
  private signatureService: WebhookSignatureService;
  private retryQueue: RetryQueue;
  private monitoringService: WebhookMonitoringService;
  private securityService: WebhookSecurityService;

  constructor() {
    this.eventBus = new EventBus();
    this.deliveryService = new WebhookDeliveryService();
    this.signatureService = new WebhookSignatureService();
    this.retryQueue = new RetryQueue();
    this.monitoringService = new WebhookMonitoringService();
    this.securityService = new WebhookSecurityService();
    this.initializeEventHandlers();
  }

  async sendWebhook(eventType: string, data: any, configId?: string): Promise<WebhookResult> {
    // العثور على webhooks المناسبة
    const webhooks = await this.findActiveWebhooks(eventType, configId);
    
    if (webhooks.length === 0) {
      return {
        success: false,
        error: 'لا توجد webhooks نشطة لهذا الحدث',
        sentWebhooks: 0,
        failedWebhooks: 0
      };
    }

    const results: WebhookDeliveryResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // إرسال لكل webhook
    for (const webhook of webhooks) {
      try {
        // التحقق من السياسات
        if (await this.shouldProcessWebhook(webhook)) {
          const result = await this.processWebhook(webhook, data);
          results.push(result);
          
          if (result.success) {
            successCount++;
          } else {
            failureCount++;
            // إضافة إلى قائمة إعادة المحاولة إذا لزم الأمر
            if (webhook.retryPolicy.enabled) {
              await this.scheduleRetry(webhook, data, result.error);
            }
          }
        }
      } catch (error) {
        failureCount++;
        results.push({
          success: false,
          webhookId: webhook.id,
          error: error.message,
          timestamp: new Date()
        });
      }
    }

    // تسجيل النتائج
    await this.monitoringService.recordDeliveryAttempt(results);

    return {
      success: failureCount === 0,
      totalWebhooks: webhooks.length,
      sentWebhooks: successCount,
      failedWebhooks: failureCount,
      results: results
    };
  }

  private async processWebhook(webhook: WebhookConfiguration, eventData: any): Promise<WebhookDeliveryResult> {
    try {
      // تطبيق المرشحات
      const filteredData = await this.applyFilters(webhook.filters, eventData);
      
      // تطبيق التحولات
      const transformedData = await this.applyTransformations(webhook.transformations, filteredData);
      
      // تحضير الحمولة
      const payload = {
        event: webhook.event,
        data: transformedData,
        timestamp: new Date().toISOString(),
        webhook_id: webhook.id,
        signature: this.signatureService.generateSignature(transformedData, webhook.secret)
      };

      // إرسال الـ webhook
      const deliveryResult = await this.deliveryService.send({
        url: webhook.url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Saler-Webhook/1.0',
          'X-Webhook-Event': webhook.event,
          'X-Webhook-Id': webhook.id,
          'X-Webhook-Signature': payload.signature,
          ...webhook.headers
        },
        body: JSON.stringify(payload)
      });

      return {
        success: deliveryResult.status >= 200 && deliveryResult.status < 300,
        webhookId: webhook.id,
        statusCode: deliveryResult.status,
        responseTime: deliveryResult.responseTime,
        timestamp: new Date(),
        attempts: 1
      };

    } catch (error) {
      return {
        success: false,
        webhookId: webhook.id,
        error: error.message,
        timestamp: new Date(),
        attempts: 1
      };
    }
  }

  private async applyFilters(filters: WebhookFilter[], data: any): Promise<any> {
    let filteredData = data;

    for (const filter of filters) {
      switch (filter.type) {
        case 'field_filter':
          filteredData = await this.applyFieldFilter(filter, filteredData);
          break;
        case 'conditional_filter':
          filteredData = await this.applyConditionalFilter(filter, filteredData);
          break;
        case 'data_masking':
          filteredData = await this.applyDataMasking(filter, filteredData);
          break;
      }
    }

    return filteredData;
  }

  private async applyFieldFilter(filter: WebhookFilter, data: any): Promise<any> {
    const { includeFields, excludeFields } = filter.config;
    let result = { ...data };

    // تطبيق حقول الاستبعاد
    if (excludeFields && excludeFields.length > 0) {
      for (const field of excludeFields) {
        this.removeField(result, field);
      }
    }

    // تطبيق حقول الإدراج
    if (includeFields && includeFields.length > 0) {
      result = this.pickFields(result, includeFields);
    }

    return result;
  }

  private async applyConditionalFilter(filter: WebhookFilter, data: any): Promise<any> {
    const { conditions, action } = filter.config;

    // تقييم الشروط
    const conditionResults = await Promise.all(
      conditions.map(async (condition) => {
        return this.evaluateCondition(condition, data);
      })
    );

    // تطبيق الإجراء بناءً على النتائج
    const shouldInclude = this.evaluateConditionGroup(conditionResults, filter.logic);

    if (action === 'include' && !shouldInclude) {
      return null;
    } else if (action === 'exclude' && shouldInclude) {
      return null;
    }

    return data;
  }

  private async applyDataMasking(filter: WebhookFilter, data: any): Promise<any> {
    const { maskRules } = filter.config;
    let maskedData = { ...data };

    for (const rule of maskRules) {
      maskedData = this.applyMaskingRule(maskedData, rule);
    }

    return maskedData;
  }
}
```

### خدمة توصيل Webhooks

```typescript
class WebhookDeliveryService {
  private httpClient: HTTPClient;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: RateLimiter;
  private timeoutManager: TimeoutManager;

  async send(request: WebhookRequest): Promise<WebhookResponse> {
    // التحقق من القيود
    await this.rateLimiter.checkLimit(request.url);
    
    // تطبيق circuit breaker
    if (this.circuitBreaker.isOpen(request.url)) {
      throw new Error('Circuit breaker is open for this endpoint');
    }

    const startTime = Date.now();
    
    try {
      // إرسال الطلب
      const response = await this.sendWithTimeout(request);
      
      const responseTime = Date.now() - startTime;

      // تحديث circuit breaker
      this.circuitBreaker.recordSuccess(request.url, response.status);
      
      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        body: response.body,
        responseTime: responseTime,
        success: response.status >= 200 && response.status < 300
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // تحديث circuit breaker
      this.circuitBreaker.recordFailure(request.url);
      
      throw new Error(`فشل في إرسال webhook: ${error.message}`);
    }
  }

  private async sendWithTimeout(request: WebhookRequest): Promise<HTTPResponse> {
    const timeout = request.timeout || 30000; // 30 ثانية افتراضياً
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('طلب webhook انتهت مهلته الزمنية'));
      }, timeout);
    });

    const requestPromise = this.httpClient.request({
      url: request.url,
      method: request.method,
      headers: request.headers,
      body: request.body,
      timeout: timeout
    });

    return Promise.race([requestPromise, timeoutPromise]);
  }

  async sendBatch(requests: WebhookRequest[]): Promise<WebhookBatchResponse> {
    const results: WebhookResponse[] = [];
    const errors: Error[] = [];

    // معالجة متوازية مع حد أقصى للطلبات المتزامنة
    const batchSize = 10;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (request) => {
        try {
          return await this.send(request);
        } catch (error) {
          errors.push(error);
          return {
            status: 0,
            statusText: 'Error',
            headers: {},
            body: '',
            responseTime: 0,
            success: false
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return {
      totalRequests: requests.length,
      successfulRequests: results.filter(r => r.success).length,
      failedRequests: results.filter(r => !r.success).length,
      totalErrors: errors.length,
      results: results,
      errors: errors
    };
  }
}
```

### نظام إعادة المحاولة

```typescript
class RetryQueue {
  private queue: PriorityQueue<RetryJob>;
  private retryPolicies: Map<string, RetryPolicy>;
  private scheduler: RetryScheduler;

  constructor() {
    this.queue = new PriorityQueue<RetryJob>();
    this.retryPolicies = new Map();
    this.scheduler = new RetryScheduler();
    this.startScheduler();
  }

  async scheduleRetry(
    webhookId: string, 
    data: any, 
    error: string, 
    retryPolicy?: RetryPolicy
  ): Promise<void> {
    const policy = retryPolicy || this.retryPolicies.get(webhookId);
    
    if (!policy || !policy.enabled) {
      return;
    }

    const attempt = await this.getCurrentAttemptCount(webhookId, data);
    
    if (attempt >= policy.maxAttempts) {
      await this.markAsFailedPermanently(webhookId, data, error);
      return;
    }

    const retryJob: RetryJob = {
      id: generateUniqueId(),
      webhookId: webhookId,
      data: data,
      error: error,
      attempt: attempt + 1,
      scheduledAt: this.calculateNextRetryTime(policy, attempt + 1),
      priority: this.calculateRetryPriority(policy, attempt + 1),
      createdAt: new Date()
    };

    this.queue.enqueue(retryJob);
  }

  private calculateNextRetryTime(policy: RetryPolicy, attempt: number): Date {
    let delay: number;

    switch (policy.strategy) {
      case 'fixed':
        delay = policy.baseDelay * attempt;
        break;
        
      case 'exponential':
        delay = policy.baseDelay * Math.pow(2, attempt - 1);
        break;
        
      case 'linear':
        delay = policy.baseDelay * attempt;
        break;
        
      case 'custom':
        delay = this.calculateCustomDelay(policy, attempt);
        break;
        
      default:
        delay = policy.baseDelay;
    }

    // تطبيق jitter لتقليل تداخل المحاولات
    const jitteredDelay = this.applyJitter(delay, policy.jitter);

    return new Date(Date.now() + jitteredDelay);
  }

  private applyJitter(delay: number, jitterPercentage: number = 10): number {
    const jitterRange = delay * (jitterPercentage / 100);
    const randomJitter = (Math.random() - 0.5) * 2 * jitterRange;
    return Math.max(0, Math.floor(delay + randomJitter));
  }

  private startScheduler(): void {
    setInterval(async () => {
      const now = Date.now();
      
      // جلب المهام المستحقة للتنفيذ
      const readyJobs = this.queue.dequeueReady(now);
      
      // تنفيذ المهام
      for (const job of readyJobs) {
        await this.processRetryJob(job);
      }
    }, 1000); // فحص كل ثانية
  }

  private async processRetryJob(job: RetryJob): Promise<void> {
    try {
      // العثور على webhook configuration
      const webhook = await this.getWebhookConfiguration(job.webhookId);
      
      if (!webhook || !webhook.isActive) {
        await this.removeJob(job.id);
        return;
      }

      // محاولة الإرسال مرة أخرى
      const result = await this.attemptRetry(job, webhook);
      
      if (result.success) {
        await this.markRetryAsSuccessful(job.id);
        await this.monitoringService.recordRetrySuccess(job.webhookId, job.attempt);
      } else {
        // إعادة جدولة إذا لم تنجح المحاولة
        await this.scheduleRetry(job.webhookId, job.data, result.error);
        await this.monitoringService.recordRetryFailure(job.webhookId, job.attempt);
      }

    } catch (error) {
      // إذا فشل في معالجة مهمة إعادة المحاولة، أزلها من القائمة
      await this.removeJob(job.id);
      await this.monitoringService.recordRetryProcessingError(job.webhookId, error);
    }
  }
}
```

### خدمة مراقبة Webhooks

```typescript
class WebhookMonitoringService {
  private metricsCollector: MetricsCollector;
  private alertManager: AlertManager;
  private performanceAnalyzer: PerformanceAnalyzer;
  private dashboard: WebhookDashboard;

  async recordDeliveryAttempt(results: WebhookDeliveryResult[]): Promise<void> {
    const metrics = this.calculateMetrics(results);
    
    // حفظ المقاييس
    await this.metricsCollector.recordWebhookMetrics(metrics);
    
    // فحص التنبيهات
    await this.checkAndSendAlerts(metrics);
    
    // تحديث لوحة التحكم
    await this.dashboard.updateMetrics(metrics);
  }

  private calculateMetrics(results: WebhookDeliveryResult[]): WebhookMetrics {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    return {
      timestamp: new Date(),
      totalAttempts: results.length,
      successfulAttempts: results.filter(r => r.success).length,
      failedAttempts: results.filter(r => !r.success).length,
      successRate: results.length > 0 
        ? (results.filter(r => r.success).length / results.length) * 100 
        : 0,
      averageResponseTime: this.calculateAverageResponseTime(results),
      medianResponseTime: this.calculateMedianResponseTime(results),
      p95ResponseTime: this.calculateP95ResponseTime(results),
      p99ResponseTime: this.calculateP99ResponseTime(results),
      totalWebhooksActive: await this.getActiveWebhooksCount(),
      queueSize: await this.getRetryQueueSize(),
      errorRate: this.calculateErrorRate(results),
      rateLimitHits: results.filter(r => r.statusCode === 429).length,
      timeoutRate: results.filter(r => r.error?.includes('timeout')).length,
      // مقاييس متقدمة
      trends: {
        hourOverHourChange: await this.getHourOverHourChange(),
        dayOverDayChange: await this.getDayOverDayChange(),
        weeklyTrend: await this.getWeeklyTrend()
      },
      healthStatus: this.calculateOverallHealth(results)
    };
  }

  async generateHealthReport(webhookId?: string): Promise<WebhookHealthReport> {
    const timeRange = {
      start: new Date(Date.now() - (24 * 60 * 60 * 1000)), // آخر 24 ساعة
      end: new Date()
    };

    const [metrics, incidents, performance] = await Promise.all([
      this.metricsCollector.getMetrics(webhookId, timeRange),
      this.getIncidents(webhookId, timeRange),
      this.getPerformanceAnalysis(webhookId, timeRange)
    ]);

    return {
      reportId: generateUniqueId(),
      generatedAt: new Date(),
      timeRange: timeRange,
      webhookId: webhookId,
      overallStatus: this.calculateOverallStatus(metrics),
      metrics: metrics,
      incidents: incidents,
      performance: performance,
      recommendations: await this.generateHealthRecommendations(metrics, incidents),
      alerts: await this.getActiveAlerts(webhookId)
    };
  }

  private async checkAndSendAlerts(metrics: WebhookMetrics): Promise<void> {
    const alerts: Alert[] = [];

    // تنبيه ارتفاع معدل الفشل
    if (metrics.errorRate > 10) {
      alerts.push({
        type: 'high_error_rate',
        severity: 'high',
        message: `معدل الفشل مرتفع: ${metrics.errorRate.toFixed(2)}%`,
        threshold: 10,
        currentValue: metrics.errorRate,
        webhookId: metrics.webhookId
      });
    }

    // تنبيه بطء الاستجابة
    if (metrics.averageResponseTime > 5000) { // 5 ثواني
      alerts.push({
        type: 'slow_response',
        severity: 'medium',
        message: `الاستجابة بطيئة: ${metrics.averageResponseTime}ms`,
        threshold: 5000,
        currentValue: metrics.averageResponseTime,
        webhookId: metrics.webhookId
      });
    }

    // تنبيه ارتفاع طوابير إعادة المحاولة
    if (metrics.queueSize > 100) {
      alerts.push({
        type: 'high_retry_queue',
        severity: 'high',
        message: `طابور إعادة المحاولة ممتلئ: ${metrics.queueSize}`,
        threshold: 100,
        currentValue: metrics.queueSize,
        webhookId: metrics.webhookId
      });
    }

    // إرسال التنبيهات
    for (const alert of alerts) {
      await this.alertManager.sendAlert(alert);
    }
  }
}
```

## أنواع Webhooks

### Webhooks الطلبات

```typescript
class OrderWebhookHandler {
  async handleOrderCreated(order: Order): Promise<void> {
    await this.webhookEngine.sendWebhook('order.created', {
      order: {
        id: order.id,
        number: order.orderNumber,
        customerId: order.customerId,
        customerEmail: order.customerEmail,
        total: order.total,
        currency: order.currency,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress
      },
      metadata: {
        source: 'saler',
        version: '1.0',
        processedAt: new Date()
      }
    });
  }

  async handleOrderStatusChanged(order: Order, oldStatus: OrderStatus, newStatus: OrderStatus): Promise<void> {
    await this.webhookEngine.sendWebhook('order.status_changed', {
      order: {
        id: order.id,
        number: order.orderNumber,
        customerId: order.customerId,
        status: {
          old: oldStatus,
          new: newStatus
        },
        updatedAt: order.updatedAt
      },
      change: {
        type: 'status_change',
        from: oldStatus,
        to: newStatus,
        reason: order.statusChangeReason,
        changedBy: order.changedBy
      },
      metadata: {
        source: 'saler',
        version: '1.0',
        processedAt: new Date()
      }
    });
  }

  async handlePaymentReceived(payment: Payment): Promise<void> {
    await this.webhookEngine.sendWebhook('payment.received', {
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        transactionId: payment.transactionId,
        processedAt: payment.processedAt
      },
      order: await this.orderService.getOrderById(payment.orderId),
      metadata: {
        source: 'saler',
        version: '1.0',
        processedAt: new Date()
      }
    });
  }
}
```

### Webhooks المنتجات

```typescript
class ProductWebhookHandler {
  async handleProductCreated(product: Product): Promise<void> {
    await this.webhookEngine.sendWebhook('product.created', {
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        costPrice: product.costPrice,
        sku: product.sku,
        status: product.status,
        categoryId: product.categoryId,
        images: product.images.map(img => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          isPrimary: img.isPrimary
        })),
        variants: product.variants.map(variant => ({
          id: variant.id,
          name: variant.name,
          price: variant.price,
          sku: variant.sku,
          stock: variant.stock,
          attributes: variant.attributes
        })),
        createdAt: product.createdAt
      },
      metadata: {
        source: 'saler',
        version: '1.0',
        processedAt: new Date()
      }
    });
  }

  async handleInventoryUpdated(productId: string, oldStock: number, newStock: number, reason: string): Promise<void> {
    const product = await this.productService.getProductById(productId);
    
    await this.webhookEngine.sendWebhook('product.inventory_updated', {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku
      },
      inventory: {
        productId: productId,
        oldStock: oldStock,
        newStock: newStock,
        change: newStock - oldStock,
        reason: reason,
        updatedAt: new Date()
      },
      metadata: {
        source: 'saler',
        version: '1.0',
        processedAt: new Date()
      }
    });
  }
}
```

### Webhooks العملاء

```typescript
class CustomerWebhookHandler {
  async handleCustomerCreated(customer: Customer): Promise<void> {
    await this.webhookEngine.sendWebhook('customer.created', {
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        dateOfBirth: customer.dateOfBirth,
        addresses: customer.addresses.map(addr => ({
          id: addr.id,
          type: addr.type,
          firstName: addr.firstName,
          lastName: addr.lastName,
          address1: addr.address1,
          address2: addr.address2,
          city: addr.city,
          state: addr.state,
          zipCode: addr.zipCode,
          country: addr.country,
          isDefault: addr.isDefault
        })),
        preferences: {
          language: customer.language,
          timezone: customer.timezone,
          emailMarketing: customer.emailMarketing,
          smsMarketing: customer.smsMarketing
        },
        createdAt: customer.createdAt
      },
      metadata: {
        source: 'saler',
        version: '1.0',
        processedAt: new Date()
      }
    });
  }

  async handleCustomerSegmentChanged(customerId: string, oldSegment: CustomerSegment, newSegment: CustomerSegment): Promise<void> {
    const customer = await this.customerService.getCustomerById(customerId);
    
    await this.webhookEngine.sendWebhook('customer.segment_changed', {
      customer: {
        id: customer.id,
        email: customer.email,
        name: `${customer.firstName} ${customer.lastName}`
      },
      segment: {
        old: oldSegment,
        new: newSegment,
        changedAt: new Date()
      },
      metadata: {
        source: 'saler',
        version: '1.0',
        processedAt: new Date()
      }
    });
  }
}
```

## إدارة Webhooks

### واجهة إدارة Webhooks

```typescript
class WebhookManagementService {
  async createWebhook(config: CreateWebhookRequest): Promise<WebhookConfiguration> {
    // التحقق من صحة البيانات
    await this.validateWebhookConfig(config);
    
    // التحقق من URL الوجهة
    await this.validateWebhookUrl(config.url);
    
    // إنشاء webhook
    const webhook: WebhookConfiguration = {
      id: generateUniqueId(),
      name: config.name,
      event: config.event,
      url: config.url,
      secret: this.generateSecret(),
      isActive: config.isActive ?? true,
      headers: config.headers || {},
      retryPolicy: config.retryPolicy || this.getDefaultRetryPolicy(),
      rateLimits: config.rateLimits || this.getDefaultRateLimits(),
      filters: config.filters || [],
      transformations: config.transformations || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // حفظ في قاعدة البيانات
    await this.saveWebhook(webhook);
    
    // اختبار webhook
    await this.testWebhook(webhook);
    
    return webhook;
  }

  async updateWebhook(webhookId: string, updates: UpdateWebhookRequest): Promise<WebhookConfiguration> {
    const existingWebhook = await this.getWebhookById(webhookId);
    
    if (!existingWebhook) {
      throw new Error('Webhook غير موجود');
    }

    // تطبيق التحديثات
    const updatedWebhook: WebhookConfiguration = {
      ...existingWebhook,
      ...updates,
      id: webhookId,
      updatedAt: new Date()
    };

    // التحقق من صحة التحديثات
    await this.validateWebhookConfig(updatedWebhook);

    // حفظ التحديثات
    await this.updateWebhookInDatabase(updatedWebhook);
    
    return updatedWebhook;
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    const webhook = await this.getWebhookById(webhookId);
    
    if (!webhook) {
      throw new Error('Webhook غير موجود');
    }

    // إزالة من قاعدة البيانات
    await this.removeWebhookFromDatabase(webhookId);
    
    // إلغاء جميع المهام المجدولة
    await this.cancelScheduledJobs(webhookId);
    
    // حذف السجلات
    await this.cleanupWebhookLogs(webhookId);
  }

  async listWebhooks(filters?: WebhookFilters): Promise<WebhookListResponse> {
    const webhooks = await this.getWebhooks(filters);
    
    return {
      webhooks: webhooks.map(webhook => ({
        id: webhook.id,
        name: webhook.name,
        event: webhook.event,
        url: webhook.url,
        isActive: webhook.isActive,
        createdAt: webhook.createdAt,
        updatedAt: webhook.updatedAt,
        lastTriggered: await this.getLastTriggeredTime(webhook.id),
        successRate: await this.getSuccessRate(webhook.id),
        statistics: await this.getWebhookStatistics(webhook.id)
      })),
      totalCount: webhooks.length,
      activeCount: webhooks.filter(w => w.isActive).length
    };
  }

  async testWebhook(webhookId: string, testData?: any): Promise<WebhookTestResult> {
    const webhook = await this.getWebhookById(webhookId);
    
    if (!webhook) {
      throw new Error('Webhook غير موجود');
    }

    // إعداد بيانات الاختبار
    const payload = testData || await this.generateTestPayload(webhook.event);
    
    try {
      // إرسال webhook اختبار
      const result = await this.webhookEngine.sendWebhook(webhook.event, payload, webhookId);
      
      // حفظ نتيجة الاختبار
      await this.saveTestResult(webhookId, {
        testId: generateUniqueId(),
        timestamp: new Date(),
        payload: payload,
        result: result,
        success: result.success
      });
      
      return {
        testId: result.sentWebhooks > 0 ? 'success' : 'failed',
        success: result.success,
        statusCode: result.results[0]?.statusCode,
        responseTime: result.results[0]?.responseTime,
        error: result.results[0]?.error,
        timestamp: new Date()
      };
      
    } catch (error) {
      return {
        testId: 'error',
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async getWebhookHistory(webhookId: string, options?: HistoryOptions): Promise<WebhookHistory> {
    const history = await this.fetchWebhookHistory(webhookId, options);
    
    return {
      webhookId: webhookId,
      totalAttempts: history.length,
      successfulAttempts: history.filter(h => h.success).length,
      failedAttempts: history.filter(h => !h.success).length,
      attempts: history.map(h => ({
        id: h.id,
        timestamp: h.timestamp,
        success: h.success,
        responseTime: h.responseTime,
        statusCode: h.statusCode,
        error: h.error,
        payloadSize: h.payloadSize,
        retries: h.retries
      }))
    };
  }
}
```

### إعدادات Webhooks المتقدمة

```typescript
// إعدادات مفصلة للـ webhook
interface AdvancedWebhookConfig {
  // إعدادات الأمان
  security: {
    requireSignature: boolean;
    signatureAlgorithm: string;
    allowedIPs: string[];
    sslRequired: boolean;
    apiKey?: string;
    basicAuth?: {
      username: string;
      password: string;
    };
  };

  // إعدادات التوقيت
  timing: {
    immediateDelivery: boolean;
    batchDelivery: boolean;
    batchSize: number;
    batchTimeout: number;
    delayDelivery: boolean;
    delayDuration: number;
  };

  // إعدادات مراقبة الأداء
  monitoring: {
    trackDeliveryTime: boolean;
    alertOnFailure: boolean;
    alertThreshold: number;
    healthCheckEnabled: boolean;
    healthCheckInterval: number;
  };

  // إعدادات التخصيص
  customization: {
    customHeaders: Record<string, string>;
    payloadFormat: 'json' | 'form-data' | 'xml';
    compressionEnabled: boolean;
    compressionType: 'gzip' | 'deflate';
    encoding: 'utf-8' | 'base64';
  };
}

class AdvancedWebhookService {
  async configureAdvancedWebhook(webhookId: string, config: AdvancedWebhookConfig): Promise<void> {
    const webhook = await this.getWebhookById(webhookId);
    
    // تطبيق إعدادات الأمان
    await this.applySecuritySettings(webhook, config.security);
    
    // تطبيق إعدادات التوقيت
    await this.applyTimingSettings(webhook, config.timing);
    
    // تطبيق إعدادات المراقبة
    await this.applyMonitoringSettings(webhook, config.monitoring);
    
    // تطبيق إعدادات التخصيص
    await this.applyCustomizationSettings(webhook, config.customization);
    
    // تحديث الإعدادات
    await this.updateWebhookConfiguration(webhookId, config);
  }

  private async applySecuritySettings(webhook: WebhookConfiguration, security: SecurityConfig): Promise<void> {
    // إعداد التحقق من التوقيع
    if (security.requireSignature) {
      webhook.requireSignature = true;
      webhook.signatureAlgorithm = security.signatureAlgorithm;
    }

    // إعداد قيود IP
    if (security.allowedIPs && security.allowedIPs.length > 0) {
      webhook.allowedIPs = security.allowedIPs;
    }

    // إعداد التشفير
    webhook.sslRequired = security.sslRequired;
    
    // إعداد مفاتيح API
    if (security.apiKey) {
      webhook.apiKey = await this.encryptApiKey(security.apiKey);
    }

    // إعداد المصادقة الأساسية
    if (security.basicAuth) {
      webhook.basicAuth = {
        username: security.basicAuth.username,
        password: await this.encryptPassword(security.basicAuth.password)
      };
    }
  }

  async monitorWebhookHealth(webhookId: string): Promise<WebhookHealthStatus> {
    const webhook = await this.getWebhookById(webhookId);
    const [performance, reliability, compliance] = await Promise.all([
      this.getPerformanceMetrics(webhookId),
      this.getReliabilityMetrics(webhookId),
      this.checkCompliance(webhook, webhookId)
    ]);

    return {
      webhookId: webhookId,
      status: this.calculateOverallHealth(performance, reliability, compliance),
      performance: performance,
      reliability: reliability,
      compliance: compliance,
      lastChecked: new Date(),
      recommendations: await this.generateHealthRecommendations(performance, reliability, compliance)
    };
  }
}
```

## أفضل الممارسات

### تصميم Webhooks فعالة

```typescript
class WebhookBestPractices {
  // تصميم الحمولات للاستفادة القصوى
  async designEfficientPayload(webhook: WebhookConfiguration, eventData: any): Promise<any> {
    return {
      // معلومات أساسية
      event: webhook.event,
      webhook_id: webhook.id,
      timestamp: new Date().toISOString(),
      
      // بيانات الحدث المنظفة
      data: await this.sanitizeEventData(eventData),
      
      // معلومات سياق
      context: {
        source: 'saler',
        version: '1.0',
        environment: this.getEnvironment(),
        request_id: generateUniqueId()
      },
      
      // معلومات اختيارية للتوافق
      metadata: {
        original_size: JSON.stringify(eventData).length,
        filtered: true,
        transformation_applied: webhook.transformations.length > 0
      }
    };
  }

  // تحسين الأداء والاستقرار
  async optimizeWebhookDelivery(webhook: WebhookConfiguration): Promise<OptimizationResult> {
    const optimizations: string[] = [];

    // تحسين حجم الحمولة
    if (webhook.maxPayloadSize > 1000) {
      optimizations.push('فكر في تقليل حجم الحمولة لتحسين الأداء');
    }

    // تحسين إعدادات إعادة المحاولة
    if (webhook.retryPolicy.maxAttempts > 5) {
      optimizations.push('قلل عدد محاولات إعادة المحاولة لتجنب الإفراط');
    }

    // تحسين التوقيت
    if (webhook.timeout < 5000) {
      optimizations.push('زد المهلة الزمنية للتأكد من نجاح التسليم');
    }

    return {
      webhookId: webhook.id,
      optimizations: optimizations,
      performanceScore: this.calculatePerformanceScore(webhook),
      recommendations: await this.generateOptimizationRecommendations(webhook)
    };
  }

  // تطبيق معالجة الأخطاء المتقدمة
  async implementAdvancedErrorHandling(webhook: WebhookConfiguration): Promise<void> {
    // إضافة معالجات أخطاء مخصصة
    await this.addCustomErrorHandlers(webhook.id, {
      timeout: async (error) => {
        await this.handleTimeoutError(webhook, error);
      },
      rateLimit: async (error) => {
        await this.handleRateLimitError(webhook, error);
      },
      authError: async (error) => {
        await this.handleAuthError(webhook, error);
      },
      serverError: async (error) => {
        await this.handleServerError(webhook, error);
      }
    });

    // تطبيق circuit breaker مخصص
    await this.setupCustomCircuitBreaker(webhook.id, {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 300000
    });
  }
}
```

هذا المستند يقدم دليلاً شاملاً لنظام Webhooks في سالير، يغطي جميع الجوانب من الإعداد والتكوين إلى إدارة الأداء والحلول المتقدمة.