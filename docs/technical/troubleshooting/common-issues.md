# المشاكل الشائعة وحلولها

## نظرة عامة

يحتوي هذا المستند على حلول للمشاكل الأكثر شيوعاً التي قد تواجهها عند استخدام نظام سالير. يتم تنظيم المشاكل حسب الفئة مع حلول خطوة بخطوة وأساليب التشخيص المناسبة.

## مشاكل تسجيل الدخول والمصادقة

### مشكلة: خطأ "بيانات الدخول غير صحيحة"

**الأعراض:**
- رسالة خطأ عند محاولة تسجيل الدخول
- إعادة توجيه إلى صفحة تسجيل الدخول
- رسالة "invalid_credentials" في وحدة التحكم

**السبب المحتمل:**
- بيانات تسجيل دخول خاطئة
- انتهاء صلاحية كلمة المرور
- قفل الحساب بسبب محاولات دخول فاشلة متعددة

**خطوات الحل:**

1. **التحقق من بيانات الدخول:**
   ```typescript
   // فحص صحة بيانات المستخدم
   const user = await authService.validateCredentials(email, password);
   if (!user) {
       console.log('بيانات الدخول غير صحيحة');
   }
   ```

2. **فحص حالة الحساب:**
   ```sql
   -- فحص حالة المستخدم في قاعدة البيانات
   SELECT id, email, status, failed_login_attempts, locked_until 
   FROM users 
   WHERE email = 'user@example.com';
   ```

3. **إعادة تعيين كلمة المرور:**
   ```typescript
   // إرسال رابط إعادة تعيين كلمة المرور
   const resetToken = await authService.generatePasswordResetToken(userId);
   await emailService.sendPasswordResetEmail(user.email, resetToken);
   ```

4. **فتح الحساب المقفل:**
   ```sql
   -- فتح الحساب المقفل (إذا كان مؤقت)
   UPDATE users 
   SET failed_login_attempts = 0, locked_until = NULL 
   WHERE email = 'user@example.com';
   ```

### مشكلة: انتهاء صلاحية الجلسة

**الأعراض:**
- تسجيل خروج تلقائي
- رسائل خطأ حول انتهاء الصلاحية
- فقدان البيانات غير المحفوظة

**الخطوات الوقائية:**

1. **إعدادات الجلسة:**
   ```typescript
   // تحسين إعدادات الجلسة
   const sessionConfig = {
     name: 'saler_session',
     secret: process.env.SESSION_SECRET,
     resave: false,
     saveUninitialized: false,
     cookie: {
       secure: process.env.NODE_ENV === 'production',
       httpOnly: true,
       maxAge: 24 * 60 * 60 * 1000 // 24 ساعة
     }
   };
   ```

2. **تجديد الجلسة التلقائي:**
   ```typescript
   // تحديث صلاحية الجلسة تلقائياً
   app.use((req, res, next) => {
     if (req.session) {
       req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
     }
     next();
   });
   ```

### مشكلة: خطأ "تسجيل دخول من مكان آخر"

**السبب المحتمل:**
- تسجيل دخول من جهاز أو متصفح آخر
- مشكلة في إدارة الجلسات المتعددة
- تناقض في بيانات الجلسة

**الحل:**

1. **إدارة الجلسات المتعددة:**
   ```typescript
   class SessionManager {
     async detectConcurrentLogins(userId: string, currentSessionId: string): Promise<boolean> {
       const activeSessions = await redisClient.smembers(`user_sessions:${userId}`);
       
       return activeSessions.length > 1 && !activeSessions.includes(currentSessionId);
     }

     async invalidateOtherSessions(userId: string, currentSessionId: string): Promise<void> {
       const sessions = await redisClient.smembers(`user_sessions:${userId}`);
       
       for (const sessionId of sessions) {
         if (sessionId !== currentSessionId) {
           await redisClient.del(`session:${sessionId}`);
           await redisClient.srem(`user_sessions:${userId}`, sessionId);
         }
       }
     }
   }
   ```

## مشاكل قاعدة البيانات

### مشكلة: بطء الاستعلامات

**الأعراض:**
- واجهات بطيئة التحميل
- انتهاء مهلة الاستعلامات
- استهلاك عالي للموارد

**خطوات التشخيص:**

1. **تحليل الاستعلامات البطيئة:**
   ```sql
   -- البحث عن الاستعلامات البطيئة
   SELECT 
     query,
     calls,
     total_time,
     mean_time,
     rows
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   ```

2. **فحص الفهارس:**
   ```sql
   -- فحص الفهارس المفقودة
   SELECT 
     schemaname,
     tablename,
     attname,
     n_distinct,
     correlation
   FROM pg_stats 
   WHERE tablename = 'orders';
   ```

3. **تحسين الاستعلامات:**
   ```typescript
   // تحسين استعلام المنتجات
   const optimizedQuery = `
     SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.status = 'active'
     AND p.deleted_at IS NULL
     ORDER BY p.created_at DESC
     LIMIT 20
   `;
   
   // استخدام pagination بدلاً من LIMIT كبير
   const products = await db.query(optimizedQuery);
   ```

**الحلول الشائعة:**

1. **إضافة فهارس:**
   ```sql
   -- فهرس للبحث في المنتجات
   CREATE INDEX idx_products_search ON products USING gin(to_tsvector('arabic', name || ' ' || description));
   
   -- فهرس للفلترة
   CREATE INDEX idx_orders_status_date ON orders(status, created_at DESC);
   ```

2. **تحسين معاملات الاستعلام:**
   ```typescript
   // استخدام Prepared Statements
   const query = `
     SELECT * FROM products 
     WHERE category_id = $1 
     AND price BETWEEN $2 AND $3
     ORDER BY created_at DESC
   `;
   const result = await db.query(query, [categoryId, minPrice, maxPrice]);
   ```

### مشكلة: أخطاء القفل (Deadlocks)

**الأعراض:**
- رسائل خطأ "deadlock detected"
- عمليات معلقة أو بطيئة
- استعلامات لا تكتمل

**الوقاية والحل:**

1. **ترتيب العمليات:**
   ```typescript
   // التأكد من نفس ترتيب الجداول في جميع العمليات
   const processOrder = async (orderData: OrderData) => {
     // دائماً ابدأ بالجدول نفسه
     await db.transaction(async (trx) => {
       // 1. تحديث المخزون أولاً
       await trx('inventory')
         .where('product_id', orderData.productId)
         .decrement('quantity', orderData.quantity);
         
       // 2. إنشاء الطلب ثانياً
       await trx('orders').insert({
         ...orderData,
         status: 'pending'
       });
     });
   };
   ```

2. **استخدام أصغر أقفال ممكنة:**
   ```sql
   -- استخدام SELECT FOR UPDATE بدلاً من LOCK TABLE
   SELECT quantity FROM inventory 
   WHERE product_id = $1 
   FOR UPDATE;
   ```

### مشكلة: نفاد مساحة قاعدة البيانات

**الإنذار المبكر:**

```typescript
class DatabaseHealthMonitor {
  async checkDiskUsage(): Promise<DiskUsageAlert> {
    const result = await this.db.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as db_size,
        pg_size_pretty(pg_total_relation_size('orders')) as orders_size,
        pg_size_pretty(pg_total_relation_size('products')) as products_size
    `);

    const dbSize = this.parseSize(result.rows[0].db_size);
    const ordersSize = this.parseSize(result.rows[0].orders_size);
    const productsSize = this.parseSize(result.rows[0].products_size);

    const usagePercentage = (dbSize / this.maxDatabaseSize) * 100;

    if (usagePercentage > 90) {
      await this.sendAlert({
        type: 'critical',
        message: `قاعدة البيانات تستخدم ${usagePercentage.toFixed(1)}% من المساحة`,
        sizes: {
          total: dbSize,
          orders: ordersSize,
          products: productsSize
        }
      });
    }

    return {
      totalSize: dbSize,
      ordersSize: ordersSize,
      productsSize: productsSize,
      usagePercentage: usagePercentage,
      recommendations: this.generateCleanupRecommendations()
    };
  }
}
```

## مشاكل الواجهة الأمامية (Frontend)

### مشكلة: بطء تحميل الصفحات

**الأعراض:**
- صفحات تستغرق وقتاً طويلاً للتحميل
- ظهور شاشات تحميل لفترات طويلة
- استهلاك عالي للذاكرة

**التشخيص:**

```typescript
class PerformanceAnalyzer {
  async analyzePagePerformance(pageUrl: string): Promise<PerformanceReport> {
    const metrics = await this.measurePageLoadTime(pageUrl);
    
    return {
      url: pageUrl,
      loadTime: metrics.loadTime,
      timeToFirstByte: metrics.timeToFirstByte,
      firstContentfulPaint: metrics.firstContentfulPaint,
      largestContentfulPaint: metrics.largestContentfulPaint,
      cumulativeLayoutShift: metrics.cumulativeLayoutShift,
      firstInputDelay: metrics.firstInputDelay,
      recommendations: this.generatePerformanceRecommendations(metrics)
    };
  }

  private async measurePageLoadTime(url: string): Promise<PerformanceMetrics> {
    // قياس الأداء باستخدام Performance API
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      timeToFirstByte: navigation.responseStart - navigation.requestStart,
      firstContentfulPaint: this.getFirstContentfulPaint(),
      largestContentfulPaint: this.getLargestContentfulPaint(),
      cumulativeLayoutShift: this.getCumulativeLayoutShift(),
      firstInputDelay: this.getFirstInputDelay()
    };
  }
}
```

**الحلول:**

1. **تحسين الصور:**
   ```typescript
   // ضغط وتحسين الصور
   class ImageOptimizer {
     async optimizeImage(imagePath: string, options: OptimizationOptions): Promise<string> {
       // ضغط الصورة
       const compressed = await sharp(imagePath)
         .resize(options.width, options.height, {
           fit: 'cover',
           withoutEnlargement: true
         })
         .jpeg({ quality: 85, progressive: true })
         .toBuffer();

       // تحويل إلى WebP للمتصفحات الحديثة
       const webp = await sharp(imagePath)
         .resize(options.width, options.height)
         .webp({ quality: 85 })
         .toBuffer();

       // حفظ النسخ المحسنة
       await this.saveOptimizedImages(imagePath, {
         jpeg: compressed,
         webp: webp
       });

       return this.getOptimizedImagePath(imagePath);
     }
   }
   ```

2. **تحسين JavaScript:**
   ```typescript
   // تحميل كسول للمكونات
   const LazyProductCard = React.lazy(() => import('./ProductCard'));
   
   function ProductList({ products }) {
     return (
       <div className="product-grid">
         {products.map(product => (
           <Suspense key={product.id} fallback={<ProductCardSkeleton />}>
             <LazyProductCard product={product} />
           </Suspense>
         ))}
       </div>
     );
   }
   ```

### مشكلة: أخطاء JavaScript في المتصفح

**التشخيص:**

```typescript
class JavaScriptErrorHandler {
  setupGlobalErrorHandling(): void {
    // معالج الأخطاء العامة
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
        userAgent: navigator.userAgent,
        timestamp: new Date(),
        url: window.location.href
      });
    });

    // معالج Promises المرفوضة
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'unhandled_promise_rejection',
        reason: event.reason,
        stack: event.reason?.stack,
        userAgent: navigator.userAgent,
        timestamp: new Date(),
        url: window.location.href
      });
    });
  }

  private logError(errorData: ErrorData): void {
    // إرسال الخطأ إلى خدمة المراقبة
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData)
    });
  }
}
```

**الحلول الشائعة:**

1. **معالجة أخطاء API:**
   ```typescript
   class APIErrorHandler {
     async handleApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
       try {
         return await apiCall();
       } catch (error) {
         if (error.status === 404) {
           this.showNotification('البيانات المطلوبة غير متوفرة', 'warning');
         } else if (error.status === 500) {
           this.showNotification('خطأ في الخادم، يرجى المحاولة لاحقاً', 'error');
         } else {
           this.showNotification('حدث خطأ غير متوقع', 'error');
         }
         throw error;
       }
     }
   }
   ```

2. **معالجة أخطاء الشبكة:**
   ```typescript
   // معالج أخطاء الشبكة
   function handleNetworkError(error: NetworkError): void {
     if (error.code === 'NETWORK_ERROR') {
       console.log('خطأ في الاتصال بالشبكة');
       showOfflineNotification();
     } else if (error.code === 'TIMEOUT') {
       console.log('انتهت مهلة الاتصال');
       showTimeoutNotification();
     }
   }
   ```

## مشاكل الأداء العام

### مشكلة: استهلاك عالي للذاكرة

**التشخيص:**

```typescript
class MemoryAnalyzer {
  analyzeMemoryUsage(): MemoryReport {
    const usage = process.memoryUsage();
    
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers || 0,
      rss: usage.rss,
      percentage: (usage.heapUsed / usage.heapTotal) * 100,
      recommendations: this.generateMemoryRecommendations(usage)
    };
  }

  detectMemoryLeaks(): Promise<MemoryLeakReport> {
    return new Promise((resolve) => {
      // مراقبة استهلاك الذاكرة لمدة 5 دقائق
      const measurements: MemoryMeasurement[] = [];
      const interval = setInterval(() => {
        const usage = process.memoryUsage();
        measurements.push({
          timestamp: new Date(),
          heapUsed: usage.heapUsed,
          heapTotal: usage.heapTotal
        });
      }, 1000);

      setTimeout(() => {
        clearInterval(interval);
        
        const analysis = this.analyzeMemoryTrend(measurements);
        
        resolve({
          measurements: measurements,
          trend: analysis.trend,
          possibleLeak: analysis.possibleLeak,
          recommendations: analysis.recommendations
        });
      }, 300000); // 5 دقائق
    });
  }

  private analyzeMemoryTrend(measurements: MemoryMeasurement[]): MemoryTrendAnalysis {
    if (measurements.length < 10) {
      return {
        trend: 'insufficient_data',
        possibleLeak: false,
        recommendations: ['جمع بيانات أكثر للمعالجة']
      };
    }

    const recentMeasurements = measurements.slice(-20);
    const firstMeasurement = recentMeasurements[0].heapUsed;
    const lastMeasurement = recentMeasurements[recentMeasurements.length - 1].heapUsed;
    
    const growthRate = ((lastMeasurement - firstMeasurement) / firstMeasurement) * 100;
    
    if (growthRate > 20) {
      return {
        trend: 'increasing',
        possibleLeak: true,
        recommendations: [
          'فحص الأكواد التي قد تسبب تسريب ذاكرة',
          'التأكد من تنظيف المراجع والـ event listeners',
          'فحص استخدام الـ closures'
        ]
      };
    }

    return {
      trend: 'stable',
      possibleLeak: false,
      recommendations: ['استهلاك الذاكرة طبيعي']
    };
  }
}
```

**الحلول:**

1. **تنظيف الذاكرة:**
   ```typescript
   class MemoryManager {
     private eventListeners = new Map();
     
     // تنظيف event listeners
     cleanupEventListeners(): void {
       for (const [element, listeners] of this.eventListeners) {
         listeners.forEach(listener => {
           element.removeEventListener(listener.type, listener.handler);
         });
       }
       this.eventListeners.clear();
     }
     
     // تنظيف المراجع
     cleanupReferences(): void {
       // تنظيف cache
       this.cache.clear();
       
       // تنظيف timers
       this.timers.forEach(timer => clearTimeout(timer));
       this.timers.clear();
       
       // تنظيف closures
       this.cleanupClosures();
     }
   }
   ```

2. **تحسين استخدام البيانات:**
   ```typescript
   // استخدام streaming للبيانات الكبيرة
   class DataProcessor {
     async processLargeDataset(dataSource: string): Promise<void> {
       const stream = fs.createReadStream(dataSource);
       const processor = new StreamProcessor();
       
       return new Promise((resolve, reject) => {
         stream
           .pipe(parser()) // CSV parser
           .pipe(processor) // البيانات
           .on('finish', resolve)
           .on('error', reject);
       });
     }
   }
   ```

### مشكلة: ارتفاع استخدام المعالج (CPU)

**التشخيص:**

```typescript
class CPUAnalyzer {
  async getCPUUsage(): Promise<CPUUsageReport> {
    const usage = await this.getCPUStats();
    
    return {
      user: usage.user,
      system: usage.system,
      idle: usage.idle,
      iowait: usage.iowait,
      total: 100 - usage.idle,
      processes: await this.getTopCPUProcesses(),
      recommendations: this.generateCPUOptimizations(usage)
    };
  }

  private async getTopCPUProcesses(): Promise<ProcessInfo[]> {
    const processes = await this.getRunningProcesses();
    
    return processes
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 10)
      .map(process => ({
        pid: process.pid,
        name: process.name,
        cpu: process.cpu,
        memory: process.memory
      }));
  }
}
```

**الحلول:**

1. **تحسين الخوارزميات:**
   ```typescript
   // تحسين خوارزمية البحث
   class OptimizedSearch {
     // استخدام مؤشر بدلاً من البحث الخطي
     private searchIndex = new Map();
     
     buildIndex(items: SearchableItem[]): void {
       items.forEach(item => {
         const keywords = this.extractKeywords(item.content);
         keywords.forEach(keyword => {
           if (!this.searchIndex.has(keyword)) {
             this.searchIndex.set(keyword, []);
           }
           this.searchIndex.get(keyword).push(item.id);
         });
       });
     }
     
     search(query: string): SearchableItem[] {
       const keywords = this.extractKeywords(query);
       const results = new Map();
       
       keywords.forEach(keyword => {
         const itemIds = this.searchIndex.get(keyword) || [];
         itemIds.forEach(id => {
           results.set(id, (results.get(id) || 0) + 1);
         });
       });
       
       return Array.from(results.entries())
         .sort((a, b) => b[1] - a[1])
         .map(([id, score]) => this.getItemById(id));
     }
   }
   ```

2. **تحسين الاستعلامات:**
   ```typescript
   // تحسين استعلام المنتجات
   class ProductQueryOptimizer {
     async getProductsOptimized(filters: ProductFilters): Promise<Product[]> {
       // استخدام indexes
       const query = this.db('products')
         .select('*')
         .where('status', 'active')
         .orderBy('created_at', 'desc');
       
       // تطبيق الفلاتر تدريجياً
       if (filters.categoryId) {
         query.andWhere('category_id', filters.categoryId);
       }
       
       if (filters.minPrice) {
         query.andWhere('price', '>=', filters.minPrice);
       }
       
       if (filters.maxPrice) {
         query.andWhere('price', '<=', filters.maxPrice);
       }
       
       // pagination لتحسين الأداء
       if (filters.limit) {
         query.limit(filters.limit).offset(filters.offset || 0);
       }
       
       return await query;
     }
   }
   ```

## مشاكل التكاملات

### مشكلة: فشل مزامنة البيانات

**التشخيص:**

```typescript
class SyncDiagnostics {
  async diagnoseSyncFailure(integrationId: string): Promise<SyncFailureReport> {
    const integration = await this.getIntegration(integrationId);
    const lastSyncLog = await this.getLastSyncLog(integrationId);
    
    return {
      integration: integration,
      lastSyncAttempt: lastSyncLog,
      failureReasons: await this.analyzeFailureReasons(lastSyncLog),
      connectionStatus: await this.testConnection(integration),
      dataValidationStatus: await this.validateSyncData(integration),
      recommendations: this.generateSyncRecommendations()
    };
  }

  private async analyzeFailureReasons(syncLog: SyncLog): Promise<FailureReason[]> {
    const reasons: FailureReason[] = [];
    
    if (syncLog.error?.includes('timeout')) {
      reasons.push({
        type: 'timeout',
        severity: 'medium',
        description: 'انتهت مهلة الاتصال',
        solution: 'زيادة مهلة الاتصال أو تحسين حجم البيانات'
      });
    }
    
    if (syncLog.error?.includes('unauthorized')) {
      reasons.push({
        type: 'authentication',
        severity: 'high',
        description: 'فشل في المصادقة',
        solution: 'تحديث رموز المصادقة أو فحص الصلاحيات'
      });
    }
    
    if (syncLog.error?.includes('validation')) {
      reasons.push({
        type: 'data_validation',
        severity: 'medium',
        description: 'بيانات غير صحيحة',
        solution: 'فحص وتحديث قواعد التحقق من البيانات'
      });
    }
    
    return reasons;
  }
}
```

**الحلول:**

1. **إعادة المحاولة الذكية:**
   ```typescript
   class RetryableSync {
     async syncWithRetry(syncFunction: () => Promise<SyncResult>): Promise<SyncResult> {
       const maxRetries = 3;
       const baseDelay = 1000; // 1 ثانية
       
       for (let attempt = 1; attempt <= maxRetries; attempt++) {
         try {
           return await syncFunction();
         } catch (error) {
           if (attempt === maxRetries) {
             throw new Error(`فشلت جميع المحاولات بعد ${maxRetries} مرات: ${error.message}`);
           }
           
           // تأخير تصاعدي
           const delay = baseDelay * Math.pow(2, attempt - 1);
           await this.sleep(delay);
         }
       }
       
       throw new Error('لم يتم حل المشكلة');
     }
     
     private sleep(ms: number): Promise<void> {
       return new Promise(resolve => setTimeout(resolve, ms));
     }
   }
   ```

2. **التحقق من البيانات:**
   ```typescript
   class DataValidator {
     validateSyncData(data: any): ValidationResult {
       const errors: ValidationError[] = [];
       
       // التحقق من الحقول المطلوبة
       if (!data.id) {
         errors.push({ field: 'id', message: 'معرف البيانات مطلوب' });
       }
       
       // التحقق من نوع البيانات
       if (data.email && !this.isValidEmail(data.email)) {
         errors.push({ field: 'email', message: 'البريد الإلكتروني غير صحيح' });
       }
       
       // التحقق من القيود
       if (data.price && data.price < 0) {
         errors.push({ field: 'price', message: 'السعر يجب أن يكون موجباً' });
       }
       
       return {
         isValid: errors.length === 0,
         errors: errors,
         suggestions: this.generateSuggestions(data)
       };
     }
     
     private isValidEmail(email: string): boolean {
       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
       return emailRegex.test(email);
     }
   }
   ```

## مشاكل البريد الإلكتروني

### مشكلة: عدم وصول الإشعارات

**التشخيص:**

```typescript
class EmailDeliveryTracker {
  async trackEmailDelivery(emailId: string): Promise<EmailDeliveryReport> {
    const email = await this.getEmailById(emailId);
    
    return {
      emailId: emailId,
      status: email.status,
      sentAt: email.sentAt,
      deliveredAt: email.deliveredAt,
      openedAt: email.openedAt,
      bouncedAt: email.bouncedAt,
      clickedAt: email.clickedAt,
      failureReason: email.failureReason,
      provider: email.provider,
      providerResponse: email.providerResponse
    };
  }

  async diagnoseDeliveryIssues(): Promise<DeliveryIssuesReport> {
    const issues = await Promise.all([
      this.checkSPFSettings(),
      this.checkDKIMSettings(),
      this.checkDNSSettings(),
      this.checkBounceRate(),
      this.checkBlacklistStatus()
    ]);

    return {
      issues: issues.filter(issue => !issue.passed),
      overallHealth: this.calculateOverallHealth(issues),
      recommendations: this.generateEmailRecommendations(issues)
    };
  }
}
```

**الحلول:**

1. **إعداد SPF وDKIM:**
   ```typescript
   // التحقق من إعدادات DNS
   class DNSConfigurator {
     async checkSPFRecord(domain: string): Promise<DNSRecordCheck> {
       const spfRecord = await this.queryDNS(domain, 'TXT', 'spf');
       
       return {
         record: spfRecord,
         isValid: this.validateSPFRecord(spfRecord),
         includes: this.extractSPFIncludes(spfRecord),
         recommendations: this.getSPFRecommendations(spfRecord)
       };
     }

     async checkDKIMRecord(domain: string, selector: string): Promise<DNSRecordCheck> {
       const dkimRecord = await this.queryDNS(`${selector}._domainkey.${domain}`, 'TXT');
       
       return {
         record: dkimRecord,
         isValid: this.validateDKIMRecord(dkimRecord),
         publicKey: this.extractDKIMPublicKey(dkimRecord),
         recommendations: this.getDKIMRecommendations(dkimRecord)
       };
     }
   }
   ```

2. **معالجة المرتد:**
   ```typescript
   class BounceHandler {
     async handleBounce(bounceData: BounceData): Promise<void> {
       const email = await this.findEmailByRecipient(bounceData.recipient);
       
       if (email) {
         // تحديث حالة البريد
         await this.updateEmailStatus(email.id, 'bounced', {
           bounceType: bounceData.type,
           bounceReason: bounceData.reason,
           bouncedAt: new Date()
         });
         
         // معالجة حسب نوع الارتداد
         if (bounceData.type === 'hard') {
           // ارتداد دائم - إزالة من قائمة المرسل إليهم
           await this.addToSuppressionList(email.recipient, 'hard_bounce');
         } else if (bounceData.type === 'soft') {
           // ارتداد مؤقت - إعادة المحاولة لاحقاً
           await this.scheduleRetry(email.id, 24 * 60 * 60 * 1000); // 24 ساعة
         }
         
         // إرسال تنبيه
         await this.sendBounceAlert(email, bounceData);
       }
     }
   }
   ```

## مشاكل الأمان

### مشكلة: محاولات تسجيل دخول مشبوهة

**الإنذار والحماية:**

```typescript
class SecurityMonitor {
  async detectSuspiciousActivity(): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    
    // فحص محاولات الدخول الفاشلة
    const failedLogins = await this.getRecentFailedLogins();
    const suspiciousPatterns = this.analyzeLoginPatterns(failedLogins);
    
    if (suspiciousPatterns.bruteForce) {
      alerts.push({
        type: 'brute_force_attack',
        severity: 'high',
        message: 'محاولات دخول متعددة فاشلة',
        source: suspiciousPatterns.sourceIP,
        affectedUsers: suspiciousPatterns.affectedUsers,
        timestamp: new Date()
      });
    }
    
    // فحص محاولة الدخول من مواقع غير مألوفة
    const geoAnomalies = await this.detectGeoAnomalies();
    if (geoAnomalies.length > 0) {
      alerts.push(...geoAnomalies);
    }
    
    return alerts;
  }

  private analyzeLoginPatterns(logins: FailedLogin[]): SuspiciousPattern {
    const recentLogins = logins.filter(login => 
      login.timestamp > new Date(Date.now() - 3600000) // آخر ساعة
    );
    
    const ipCounts = this.countByField(recentLogins, 'ipAddress');
    const userCounts = this.countByField(recentLogins, 'userId');
    
    const bruteForce = Object.entries(ipCounts).some(([ip, count]) => count >= 10);
    const distributedAttack = Object.keys(userCounts).length >= 5 && 
      Object.values(ipCounts).some(count => count >= 3);
    
    return {
      bruteForce: bruteForce,
      distributedAttack: distributedAttack,
      sourceIP: bruteForce ? this.getMostFrequentIP(recentLogins) : null,
      affectedUsers: Object.keys(userCounts).length
    };
  }

  async blockSuspiciousActivity(source: string, reason: string): Promise<void> {
    await this.blockIP(source, {
      reason: reason,
      duration: 3600000, // ساعة واحدة
      autoUnblock: false,
      severity: 'medium'
    });
    
    // إرسال تنبيه
    await this.sendSecurityAlert({
      type: 'ip_blocked',
      source: source,
      reason: reason,
      timestamp: new Date()
    });
  }
}
```

**الحلول الوقائية:**

1. **تطبيق CAPTCHA:**
   ```typescript
   class CAPTCHAMiddleware {
     async checkCAPTCHA(request: Request): Promise<boolean> {
       const userAgent = request.headers['user-agent'];
       const ipAddress = this.getClientIP(request);
       
       // فحص معدل المحاولات
       const attempts = await this.getRecentAttempts(ipAddress, 900000); // 15 دقيقة
       
       if (attempts.length >= 3) {
         return this.verifyCAPTCHA(request);
       }
       
       return true;
     }

     private async verifyCAPTCHA(request: Request): Promise<boolean> {
       const captchaToken = request.body.captcha_token;
       
       if (!captchaToken) {
         return false;
       }
       
       try {
         const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
           method: 'POST',
           headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
           body: `secret=${process.env.RECAPTCHA_SECRET}&response=${captchaToken}&remoteip=${this.getClientIP(request)}`
         });
         
         const result = await response.json();
         return result.success;
       } catch (error) {
         console.error('CAPTCHA verification failed:', error);
         return false;
       }
     }
   }
   ```

2. **تطبيق المصادقة متعددة العوامل:**
   ```typescript
   class TwoFactorAuth {
     async generateTOTP(userId: string): Promise<string> {
       const user = await this.getUserById(userId);
       const secret = user.twoFactorSecret;
       
       const totp = speakeasy.totp({
         secret: secret,
         encoding: 'base32'
       });
       
       return totp;
     }

     async verifyTOTP(userId: string, token: string): Promise<boolean> {
       const user = await this.getUserById(userId);
       const verified = speakeasy.totp.verify({
         secret: user.twoFactorSecret,
         encoding: 'base32',
         token: token,
         window: 1 //允许1个时间窗口的偏差
       });
       
       if (verified) {
         // تسجيل نجاح التحقق
         await this.logSuccessful2FA(userId);
       }
       
       return verified;
     }
   }
   ```

## نصائح عامة للحل

### المنهجية الأساسية لحل المشاكل

1. **حدد المشكلة بدقة**
2. **اجمع المعلومات المطلوبة**
3. **حلل البيانات**
4. **طبق الحلول التدريجية**
5. **تأكد من الحل**
6. **وثق الحلول**

### أدوات التشخيص المفيدة

```typescript
class DiagnosticTools {
  async generateSystemReport(): Promise<SystemDiagnosticReport> {
    return {
      timestamp: new Date(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: await this.getCPUInfo()
      },
      database: {
        connectionPool: await this.getDBConnectionStatus(),
        slowQueries: await this.getSlowQueries(),
        tableSizes: await this.getTableSizes()
      },
      applications: {
        activeUsers: await this.getActiveUsers(),
        requestRate: await this.getRequestRate(),
        errorRate: await this.getErrorRate()
      },
      integrations: {
        status: await this.getIntegrationsStatus(),
        lastSync: await this.getLastSyncTimes(),
        failures: await this.getRecentFailures()
      },
      recommendations: this.generateSystemRecommendations()
    };
  }
}
```

هذا المستند يوفر حلولاً شاملة للمشاكل الأكثر شيوعاً في نظام سالير، مع التركيز على التشخيص السريع والحلول العملية والوقاية من تكرار المشاكل.