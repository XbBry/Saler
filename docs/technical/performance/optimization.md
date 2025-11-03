# تحسين الأداء - Performance Optimization

## نظرة عامة

يقدم هذا الدليل استراتيجيات وتقنيات شاملة لتحسين أداء تطبيق Saler، من تحسين قاعدة البيانات إلى تحسين الواجهة الأمامية والخلفية.

## محتويات الدليل

1. [تحليل الأداء](#تحليل-الأداء)
2. [تحسين قاعدة البيانات](#تحسين-قاعدة-البيانات)
3. [تحسين الخادم الخلفي](#تحسين-الخادم-الخلفي)
4. [تحسين الواجهة الأمامية](#تحسين-الواجهة-الأمامية)
5. [تحسين الذاكرة والتخزين](#تحسين-الذاكرة-والتخزين)
6. [تحسين الشبكة](#تحسين-الشبكة)
7. [تقنيات التحميل التدريجي](#تقنيات-التحميل-التدريجي)
8. [تحسين الصور](#تحسين-الصور)
9. [تحسين CSS و JavaScript](#تحسين-css-و-javascript)
10. [أدوات المراقبة](#أدوات-المراقبة)

## تحليل الأداء

### أدوات قياس الأداء

```javascript
// performance-monitor.js - مراقبة الأداء
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoadTime: 0,
            domContentLoaded: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            cumulativeLayoutShift: 0,
            firstInputDelay: 0,
            timeToInteractive: 0
        };
    }

    // مراقبة تحميل الصفحة
    measurePageLoad() {
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            
            this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.loadEventStart;
            this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
            
            this.reportMetrics();
        });
    }

    // مراقبة Core Web Vitals
    measureCoreWebVitals() {
        // First Contentful Paint
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
                if (entry.name === 'first-contentful-paint') {
                    this.metrics.firstContentfulPaint = entry.startTime;
                }
            });
        }).observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.largestContentfulPaint = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
            let clsValue = 0;
            list.getEntries().forEach((entry) => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            this.metrics.cumulativeLayoutShift = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });

        // First Input Delay
        new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
            });
        }).observe({ entryTypes: ['first-input'] });
    }

    // قياس أداء API
    measureAPICall(endpoint, startTime) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // إرسال المقاييس للخادم
        this.sendAPIMetrics(endpoint, duration);
        
        return duration;
    }

    // إرسال المقاييس للخادم
    async sendAPIMetrics(endpoint, duration) {
        try {
            await fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint,
                    duration,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent
                })
            });
        } catch (error) {
            console.error('فشل في إرسال مقاييس الأداء:', error);
        }
    }

    // تقرير المقاييس
    reportMetrics() {
        console.table(this.metrics);
        
        // إرسال للخادم للمراقبة
        this.sendMetricsToServer();
    }

    async sendMetricsToServer() {
        try {
            await fetch('/api/performance-metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...this.metrics,
                    url: window.location.href,
                    timestamp: Date.now()
                })
            });
        } catch (error) {
            console.error('فشل في إرسال مقاييس الأداء:', error);
        }
    }
}

// تشغيل مراقبة الأداء
const performanceMonitor = new PerformanceMonitor();
performanceMonitor.measurePageLoad();
performanceMonitor.measureCoreWebVitals();
```

### تحليل بطء الاستجابة

```python
# slow_query_analyzer.py - تحليل الاستعلامات البطيئة
import time
import logging
from typing import List, Dict, Any
from sqlalchemy import text
from sqlalchemy.orm import Session
from models import QueryLog

class SlowQueryAnalyzer:
    """محلل الاستعلامات البطيئة"""
    
    def __init__(self, db: Session, threshold_ms: float = 1000):
        self.db = db
        self.threshold = threshold_ms
        self.logger = logging.getLogger(__name__)
    
    def enable_query_profiling(self) -> None:
        """تفعيل تحليل الاستعلامات"""
        # تفعيل تحليل MySQL/PostgreSQL
        self.db.execute(text("""
            SET log_statement = 'all';
            SET log_min_duration_statement = 100;
            SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';
        """))
    
    def analyze_slow_queries(self) -> List[Dict[str, Any]]:
        """تحليل الاستعلامات البطيئة"""
        # استعلامات PostgreSQL
        slow_queries = self.db.execute(text("""
            SELECT 
                query,
                calls,
                total_time,
                mean_time,
                rows,
                100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
            FROM pg_stat_statements 
            WHERE mean_time > :threshold
            ORDER BY total_time DESC 
            LIMIT 20
        """), {'threshold': self.threshold}).fetchall()
        
        results = []
        for query in slow_queries:
            results.append({
                'query': query.query[:200] + '...' if len(query.query) > 200 else query.query,
                'calls': query.calls,
                'total_time': round(query.total_time, 2),
                'mean_time': round(query.mean_time, 2),
                'rows': query.rows,
                'hit_percent': round(query.hit_percent, 2)
            })
        
        return results
    
    def suggest_optimizations(self, query_info: Dict[str, Any]) -> List[str]:
        """اقتراح تحسينات للاستعلام"""
        suggestions = []
        
        # تحليل وقت الاستعلام
        if query_info['mean_time'] > 5000:
            suggestions.append("وقت الاستعلام طويل جداً (>5 ثانية). جدد هيكل الاستعلام.")
        
        # تحليل معدل الضربات
        if query_info['hit_percent'] < 95:
            suggestions.append(f"معدل الضربات منخفض ({query_info['hit_percent']:.1f}%). فكر في إضافة فهارس.")
        
        # تحليل عدد الصفوف
        if query_info['rows'] > 10000:
            suggestions.append("عدد كبير من الصفوف. استخدم LIMIT أو pagination.")
        
        # تحليل تكرار الاستدعاء
        if query_info['calls'] > 1000:
            suggestions.append("استدعاء متكرر. فكر في cache النتائج.")
        
        return suggestions
    
    def generate_report(self) -> str:
        """إنشاء تقرير تحسين الأداء"""
        slow_queries = self.analyze_slow_queries()
        
        if not slow_queries:
            return "✅ لا توجد استعلامات بطيئة مكتشفة."
        
        report = "تقرير الاستعلامات البطيئة:\n\n"
        
        for i, query in enumerate(slow_queries, 1):
            report += f"{i}. الاستعلام:\n"
            report += f"   النص: {query['query']}\n"
            report += f"   عدد الاستدعاءات: {query['calls']}\n"
            report += f"   الوقت الإجمالي: {query['total_time']}ms\n"
            report += f"   الوقت المتوسط: {query['mean_time']}ms\n"
            report += f"   عدد الصفوف: {query['rows']}\n"
            report += f"   معدل الضربات: {query['hit_percent']:.1f}%\n"
            
            suggestions = self.suggest_optimizations(query)
            if suggestions:
                report += "   اقتراحات التحسين:\n"
                for suggestion in suggestions:
                    report += f"   - {suggestion}\n"
            
            report += "\n"
        
        return report

# تشغيل التحليل
def run_slow_query_analysis():
    """تشغيل تحليل الاستعلامات البطيئة"""
    analyzer = SlowQueryAnalyzer()
    analyzer.enable_query_profiling()
    
    report = analyzer.generate_report()
    print(report)
    
    # حفظ التقرير
    with open('slow_queries_report.txt', 'w', encoding='utf-8') as f:
        f.write(report)
    
    return report
```

## تحسين قاعدة البيانات

### تحسين الاستعلامات

```sql
-- database_optimization.sql - تحسين قاعدة البيانات

-- 1. إضافة فهارس مناسبة
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);
CREATE INDEX CONCURRENTLY idx_stores_owner_id ON stores(owner_id);
CREATE INDEX CONCURRENTLY idx_products_store_id ON products(store_id);
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);
CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders(created_at);
CREATE INDEX CONCURRENTLY idx_order_items_order_id ON order_items(order_id);
CREATE INDEX CONCURRENTLY idx_inventory_product_id ON inventory(product_id);

-- 2. فهارس مركبة للاستعلامات الشائعة
CREATE INDEX CONCURRENTLY idx_orders_user_created ON orders(user_id, created_at);
CREATE INDEX CONCURRENTLY idx_products_store_status ON products(store_id, status) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_users_active_email ON users(is_active, email) WHERE is_active = true;

-- 3. فهارس جزئية للبيانات الشائعة
CREATE INDEX CONCURRENTLY idx_orders_recent ON orders(created_at) 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY idx_products_popular ON products(popularity_score DESC) 
WHERE popularity_score > 100;

-- 4. تحسين إعدادات قاعدة البيانات
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- إعادة تحميل الإعدادات
SELECT pg_reload_conf();

-- 5. تنظيف قاعدة البيانات
VACUUM ANALYZE users;
VACUUM ANALYZE stores;
VACUUM ANALYZE products;
VACUUM ANALYZE orders;

-- 6. إحصائيات تفصيلية
ANALYZE users;
ANALYZE stores;
ANALYZE products;
ANALYZE orders;

-- 7. إنشاء إحصائيات موسعة
CREATE STATISTICS IF NOT EXISTS users_email_stats ON email FROM users;
CREATE STATISTICS IF NOT EXISTS orders_user_stats ON user_id, created_at FROM orders;

-- 8. تحديث الجداول الكبيرة
REINDEX INDEX CONCURRENTLY idx_orders_user_id;
REINDEX TABLE orders;

-- 9. إعدادات تحسين إضافية
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET max_parallel_workers_per_gather = 2;
ALTER SYSTEM SET parallel_tuple_cost = 0.1;
ALTER SYSTEM SET parallel_setup_cost = 1000;
```

### تحسين الأداء بـ Django ORM

```python
# database_optimization.py - تحسين أداء Django ORM

from django.db import connection
from django.db.models import Prefetch, Q
from django.core.cache import cache
from django.conf import settings
from .models import User, Store, Product, Order, OrderItem
import time
import logging

class DatabaseOptimizer:
    """محسن أداء قاعدة البيانات"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    # تحسين Select Related و Prefetch Related
    def optimized_user_orders(self, user_id: int):
        """استرجاع طلبات المستخدم مع البيانات المرتبطة"""
        start_time = time.time()
        
        # استخدام select_related للعلاقات ForeignKey
        orders = Order.objects.select_related('user', 'store')\
            .prefetch_related(
                Prefetch('orderitem_set', 
                        queryset=OrderItem.objects.select_related('product'))
            )\
            .filter(user_id=user_id)\
            .order_by('-created_at')
        
        # حساب عدد الاستعلامات
        queries_count = len(connection.queries)
        execution_time = time.time() - start_time
        
        self.logger.info(f"استعلامات: {queries_count}, الوقت: {execution_time:.2f}s")
        
        return orders
    
    # استخدام التعليقات التوضيحية
    def get_orders_with_annotations(self):
        """استعلامات مع تعليقات توضيحية"""
        from django.db.models import Count, Sum, Avg, F, ExpressionWrapper
        
        orders = Order.objects.annotate(
            item_count=Count('orderitem'),
            total_amount=Sum('orderitem__price'),
            avg_item_price=Avg('orderitem__price'),
            discount_applied=ExpressionWrapper(
                F('total_amount') * F('discount_percent') / 100,
                output_field=models.DecimalField()
            )
        ).select_related('user', 'store')
        
        return orders
    
    # استخدام cache للاستعلامات المتكررة
    @cache.memoize(timeout=300)  # 5 دقائق
    def get_popular_products(self, store_id: int, limit: int = 10):
        """استرجاع المنتجات الشائعة مع cache"""
        products = Product.objects.filter(
            store_id=store_id,
            status='active'
        ).order_by('-popularity_score')[:limit]
        
        return list(products)
    
    # تحسين pagination
    def optimized_pagination(self, page: int = 1, per_page: int = 20):
        """pagination محسن باستخدام keyset"""
        offset = (page - 1) * per_page
        
        # استخدام keyset pagination بدلاً من offset للصفحات الكبيرة
        if offset > 1000:  # صفحة كبيرة
            # الحصول على آخر عنصر من الصفحة السابقة
            last_item = Order.objects.order_by('-id')[(offset - 1):offset].first()
            
            if last_item:
                orders = Order.objects.filter(
                    id__lt=last_item.id
                ).select_related('user', 'store')[:per_page]
            else:
                orders = Order.objects.none()
        else:
            orders = Order.objects.select_related('user', 'store')[
                offset:offset + per_page
            ]
        
        return orders
    
    # تحسين Bulk Operations
    def bulk_create_products(self, products_data: list):
        """إنشاء منتجات بشكل مجمع"""
        # تقسيم البيانات إلى دفعات
        batch_size = 1000
        
        for i in range(0, len(products_data), batch_size):
            batch = products_data[i:i + batch_size]
            Product.objects.bulk_create(
                [Product(**data) for data in batch],
                batch_size=batch_size
            )
    
    # تحسين تحديث البيانات
    def bulk_update_prices(self, price_updates: dict):
        """تحديث أسعار المنتجات بشكل مجمع"""
        from django.db.models import F
        
        # استخدام F() expressions لتجنب race conditions
        Product.objects.filter(
            id__in=price_updates.keys()
        ).update(
            price=F('price') * 1.1  # زيادة 10%
        )
    
    # تحليل أداء الاستعلامات
    def analyze_query_performance(self, queryset):
        """تحليل أداء استعلام"""
        start_time = time.time()
        
        # تنفيذ الاستعلام
        results = list(queryset)
        
        execution_time = time.time() - start_time
        query_count = len(connection.queries)
        
        self.logger.info(f"""
        تحليل أداء الاستعلام:
        - عدد النتائج: {len(results)}
        - عدد الاستعلامات: {query_count}
        - وقت التنفيذ: {execution_time:.3f}s
        - متوسط وقت الاستعلام: {execution_time/query_count:.3f}s
        """)
        
        return {
            'results_count': len(results),
            'query_count': query_count,
            'execution_time': execution_time,
            'avg_query_time': execution_time / query_count if query_count > 0 else 0
        }
    
    # تحسين فهرسة النص الكامل
    def setup_full_text_search(self):
        """إعداد البحث النص الكامل"""
        from django.contrib.postgres.fields import ArrayField
        from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
        
        # إضافة عمود البحث
        User._meta.get_field('search_vector').db_type = 'tsvector'
    
    def perform_full_text_search(self, search_term: str):
        """بحث نص كامل محسن"""
        from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
        
        query = SearchQuery(search_term)
        
        # إنشاء SearchVector للبحث
        search_vector = SearchVector(
            'title', weight='A',
            'description', weight='B',
            'tags', weight='C'
        )
        
        products = Product.objects.annotate(
            rank=SearchRank(search_vector, query)
        ).filter(rank__gt=0.1).order_by('-rank')
        
        return products
    
    # تحسين البيانات المقروءة بكثرة
    def cache_frequently_accessed_data(self):
        """cache البيانات المقروءة بكثرة"""
        # cache إعدادات المتجر
        stores = Store.objects.all()
        for store in stores:
            cache.set(f'store_settings_{store.id}', store.settings, timeout=3600)
    
    # تنظيف cache
    def clear_related_cache(self, store_id: int):
        """تنظيف cache البيانات المرتبطة"""
        cache.delete_pattern(f'store_*_{store_id}')
        cache.delete_pattern(f'product_store_{store_id}_*')

# استخدام المحسن
def optimize_queries():
    """استخدام تقنيات التحسين"""
    optimizer = DatabaseOptimizer()
    
    # مثال على استخدام
    user_orders = optimizer.optimized_user_orders(1)
    products = optimizer.get_popular_products(1)
    
    # تحليل الأداء
    analysis = optimizer.analyze_query_performance(user_orders)
    print(f"تحليل الأداء: {analysis}")
```

## تحسين الخادم الخلفي

### تحسين Express.js

```javascript
// server-optimization.js - تحسين خادم Express

const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

// تحسين الأمان
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// تحسين CORS
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://saler.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 24 ساعة
}));

// ضغط الاستجابات
app.use(compression({
    filter: (req, res) => {
        // عدم ضغط الملفات الصغيرة أو الصور
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    threshold: 1024,
    level: 6
}));

// تحسين تسجيل الطلبات
app.use(morgan('combined', {
    skip: (req, res) => process.env.NODE_ENV === 'test',
    stream: {
        write: (message) => {
            console.log(message.trim());
            // إرسال للسجلات المركزية
            logToCentralSystem(message);
        }
    }
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100, // حد أقصى 100 طلب لكل IP
    message: {
        error: 'تم تجاوز الحد المسموح للطلبات، حاول مرة أخرى لاحقاً',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // حد أقصى 5 محاولات تسجيل دخول
    message: {
        error: 'تم تجاوز حد محاولات تسجيل الدخول',
        retryAfter: '15 minutes'
    }
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// تحسين Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// تحسين headers
app.use((req, res, next) => {
    // Cache headers
    if (req.method === 'GET') {
        res.set({
            'Cache-Control': 'public, max-age=300', // 5 دقائق
            'ETag': generateETag(req.url),
            'Last-Modified': new Date().toISOString()
        });
    }
    
    // CORS headers
    res.set({
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
    });
    
    next();
});

// تحسين استجابات JSON
app.set('json spaces', process.env.NODE_ENV === 'development' ? 2 : 0);
app.set('json replacer', (key, value) => {
    // إزالة القيم undefined أو null غير المرغوب فيها
    if (value === undefined || value === null && key !== 'null') {
        return undefined;
    }
    return value;
});

// تحسين معالجة الأخطاء
app.use((err, req, res, next) => {
    console.error('خطأ في الخادم:', err);
    
    // خطأ في التحقق من صحة البيانات
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'خطأ في البيانات المرسلة',
            details: err.details || err.message
        });
    }
    
    // خطأ في قاعدة البيانات
    if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({
            error: 'بيانات مكررة أو مخالفة للقيود'
        });
    }
    
    // خطأ عام
    res.status(500).json({
        error: 'خطأ داخلي في الخادم',
        requestId: req.id || 'unknown'
    });
});

// تحسين الـ health check
app.get('/health', (req, res) => {
    const healthCheck = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
    };
    
    res.json(healthCheck);
});

// تحسين الـ middleware للأداء
const slowDown = require('express-slow-down');

const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per windowMs without delay
    delayMs: 500 // add 500ms delay per request after delayAfter
});

app.use('/api/', speedLimiter);

// تحسين Static Files
app.use(express.static('public', {
    etag: true,
    maxAge: '1d',
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.set('Cache-Control', 'no-cache');
        }
    }
}));

// تحسين Error Handling
process.on('uncaughtException', (err) => {
    console.error('خطأ غير معالج:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promise مرفوض غير معالج:', reason);
    process.exit(1);
});

// تحسين cluster mode
if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    
    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    
    cluster.on('exit', (worker) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork(); // استبدال worker muerto
    });
} else {
    // Workers can share any TCP connection
    app.listen(port, () => {
        console.log(`Worker ${process.pid} started`);
    });
}

module.exports = app;
```

### تحسين Python Flask

```python
# server_optimization.py - تحسين خادم Flask

from flask import Flask, request, jsonify, g
from flask_caching import Cache
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import time
import functools
import logging
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.exceptions import HTTPException

# إعداد التطبيق
app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

# إعداد الأمان
CORS(app, 
     origins=["https://saler.app"],
     methods=["GET", "POST", "PUT", "DELETE"],
     allow_headers=["Content-Type", "Authorization"])

# إعداد Cache
cache = Cache(app, config={
    'CACHE_TYPE': 'redis',
    'CACHE_REDIS_URL': 'redis://localhost:6379/0',
    'CACHE_DEFAULT_TIMEOUT': 300
})

# إعداد Rate Limiting
limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

# إعداد السجلات
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# تحسين معالجة الطلبات
@app.before_request
def before_request():
    """تحضير طلب جديد"""
    g.request_start_time = time.time()
    g.request_id = generate_request_id()
    
    # تسجيل الطلب
    logger.info(f"طلب جديد: {request.method} {request.path}")

@app.after_request
def after_request(response):
    """معالجة الاستجابة"""
    # إضافة headers آمنة
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    # حساب وقت الاستجابة
    if hasattr(g, 'request_start_time'):
        duration = time.time() - g.request_start_time
        response.headers['X-Response-Time'] = f"{duration:.3f}s"
    
    # تسجيل الاستجابة
    logger.info(f"استجابة: {response.status_code}")
    
    return response

# تحسين Error Handling
@app.errorhandler(HTTPException)
def handle_http_exception(e):
    """معالجة أخطاء HTTP"""
    logger.error(f"خطأ HTTP: {e.code} - {e.description}")
    return jsonify({
        'error': e.name,
        'message': e.description,
        'status_code': e.code,
        'request_id': getattr(g, 'request_id', 'unknown')
    }), e.code

@app.errorhandler(500)
def handle_500_error(e):
    """معالجة أخطاء الخادم الداخلي"""
    logger.error(f"خطأ داخلي: {str(e)}")
    return jsonify({
        'error': 'خطأ داخلي في الخادم',
        'message': 'حدث خطأ غير متوقع',
        'request_id': getattr(g, 'request_id', 'unknown')
    }), 500

# تحسين الـ health check
@app.route('/health')
@cache.cached(timeout=30) # cache لمدة 30 ثانية
def health_check():
    """فحص صحة الخادم"""
    try:
        # فحص قاعدة البيانات
        db_health = check_database_health()
        
        # فحص Redis
        redis_health = check_redis_health()
        
        health_data = {
            'status': 'healthy' if db_health and redis_health else 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0',
            'uptime': time.time() - start_time,
            'checks': {
                'database': db_health,
                'redis': redis_health
            }
        }
        
        status_code = 200 if health_data['status'] == 'healthy' else 503
        return jsonify(health_data), status_code
        
    except Exception as e:
        logger.error(f"خطأ في health check: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

# تحسين Rate Limiting للـ API
@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    """تسجيل الدخول مع rate limiting"""
    # منطق تسجيل الدخول
    pass

@app.route('/api/users/<int:user_id>')
@limiter.limit("100 per hour")
@cache.memoize(timeout=300)
def get_user(user_id):
    """استرجاع بيانات المستخدم مع cache"""
    # منطق استرجاع المستخدم
    pass

# تحسين الـ middleware للأداء
def performance_monitor(f):
    """مراقب الأداء للـ endpoints"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = f(*args, **kwargs)
            
            # حساب وقت التنفيذ
            execution_time = time.time() - start_time
            
            # تسجيل الأداء
            logger.info(f"Endpoint {request.path} took {execution_time:.3f}s")
            
            # إضافة header وقت الاستجابة
            if isinstance(result, tuple):
                return (result[0], {
                    **result[1] if len(result) > 1 else {},
                    'X-Response-Time': f"{execution_time:.3f}s"
                })
            else:
                response = make_response(result)
                response.headers['X-Response-Time'] = f"{execution_time:.3f}s"
                return response
                
        except Exception as e:
            logger.error(f"Error in {request.path}: {e}")
            raise
    
    return decorated_function

# استخدام المراقب
@app.route('/api/products')
@performance_monitor
@cache.cached(timeout=60) # cache لمدة دقيقة
def get_products():
    """استرجاع المنتجات"""
    # منطق استرجاع المنتجات
    pass

# تحسين معاملات الطلبات
@app.route('/api/search')
def search():
    """بحث محسن مع pagination"""
    query = request.args.get('q', '')
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 20)), 100)
    
    # استخدام keyset pagination للصفحات الكبيرة
    if page > 10:
        # منطق keyset pagination
        cursor = request.args.get('cursor')
        products = search_products_keyset(query, cursor, per_page)
    else:
        products = search_products_offset(query, page, per_page)
    
    return jsonify(products)

# تحسين معالجة الملفات المرفوعة
from werkzeug.utils import secure_filename
import os

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """رفع ملفات محسن"""
    if 'file' not in request.files:
        return jsonify({'error': 'لم يتم اختيار ملف'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'اسم ملف غير صالح'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        
        # ضغط الصور تلقائياً
        if file.content_type.startswith('image/'):
            compressed_file = compress_image(file)
            file = compressed_file
        
        # رفع للـ S3
        file_url = upload_to_s3(file, filename)
        
        return jsonify({
            'message': 'تم رفع الملف بنجاح',
            'url': file_url
        })
    
    return jsonify({'error': 'نوع ملف غير مدعوم'}), 400

# تحسين Background Tasks
from celery import Celery

celery = Celery('app', broker='redis://localhost:6379/0')

@app.route('/api/export')
def export_data():
    """تصدير البيانات مع background task"""
    task = export_data_task.delay(current_user.id)
    
    return jsonify({
        'task_id': task.id,
        'status': 'processing'
    })

# إعداد Connection Pooling
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600
)

# تحسين معالجة JSON
from flask.json.provider import DefaultJSONProvider

class OptimizedJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

app.json = OptimizedJSONProvider(app)

# تشغيل الخادم
if __name__ == '__main__':
    start_time = time.time()
    
    # تحسين إعدادات التشغيل
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=False,
        threaded=True,
        use_reloader=False  # تجنب إعادة التحميل في الإنتاج
    )
```

## تحسين الواجهة الأمامية

### تحسين React Components

```jsx
// OptimizedComponents.jsx - مكونات React محسنة

import React, { memo, useMemo, useCallback, useEffect, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from 'react-query';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import IntersectionObserver from 'react-intersection-observer';

// مكون محسن مع memo و useMemo
const ProductCard = memo(({ product, onAddToCart }) => {
    // استخدام useMemo للحسابات المعقدة
    const formattedPrice = useMemo(() => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR'
        }).format(product.price);
    }, [product.price]);
    
    const discountPrice = useMemo(() => {
        if (product.discount > 0) {
            return product.price * (1 - product.discount / 100);
        }
        return product.price;
    }, [product.price, product.discount]);
    
    // استخدام useCallback للـ event handlers
    const handleAddToCart = useCallback(() => {
        onAddToCart(product.id);
    }, [product.id, onAddToCart]);
    
    // تحسين CSS classes
    const cardClasses = useMemo(() => {
        return `product-card ${product.isPopular ? 'popular' : ''} ${product.isNew ? 'new' : ''}`;
    }, [product.isPopular, product.isNew]);
    
    return (
        <div className={cardClasses}>
            <div className="product-image">
                <LazyLoadImage
                    src={product.image}
                    alt={product.name}
                    effect="blur"
                    threshold={100}
                    placeholderSrc={product.thumbnail}
                />
            </div>
            <div className="product-info">
                <h3>{product.name}</h3>
                <p className="description">{product.description}</p>
                <div className="price-info">
                    {discountPrice < product.price && (
                        <span className="original-price">{formattedPrice}</span>
                    )}
                    <span className="current-price">
                        {new Intl.NumberFormat('ar-SA', {
                            style: 'currency',
                            currency: 'SAR'
                        }).format(discountPrice)}
                    </span>
                </div>
                <button 
                    onClick={handleAddToCart}
                    className="add-to-cart-btn"
                    disabled={product.stock <= 0}
                >
                    {product.stock > 0 ? 'أضف إلى السلة' : 'نفدت الكمية'}
                </button>
            </div>
        </div>
    );
});

// مكون قائمة منتجات مع virtualization
const VirtualizedProductList = memo(({ products, onLoadMore, hasNextPage }) => {
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
    const ITEM_HEIGHT = 200;
    
    // حساب العناصر المرئية
    const visibleProducts = useMemo(() => {
        return products.slice(visibleRange.start, visibleRange.end);
    }, [products, visibleRange]);
    
    // استخدام Intersection Observer للتحميل التدريجي
    const { ref, inView } = IntersectionObserver({
        threshold: 0.1,
        rootMargin: '100px',
    });
    
    useEffect(() => {
        if (inView && hasNextPage) {
            onLoadMore();
        }
    }, [inView, hasNextPage, onLoadMore]);
    
    return (
        <div className="virtualized-list" style={{ height: `${products.length * ITEM_HEIGHT}px` }}>
            <div 
                style={{ 
                    transform: `translateY(${visibleRange.start * ITEM_HEIGHT}px)`,
                    height: `${visibleProducts.length * ITEM_HEIGHT}px`
                }}
            >
                {visibleProducts.map((product, index) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={onAddToCart}
                    />
                ))}
                {hasNextPage && <div ref={ref} style={{ height: ITEM_HEIGHT }} />}
            </div>
        </div>
    );
});

// Hook مخصص للبيانات المحلية
const useLocalData = (key, initialValue) => {
    const [data, setData] = useState(() => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : initialValue;
        } catch {
            return initialValue;
        }
    });
    
    const updateData = useCallback((newData) => {
        setData(newData);
        try {
            localStorage.setItem(key, JSON.stringify(newData));
        } catch (error) {
            console.error('فشل في حفظ البيانات:', error);
        }
    }, [key]);
    
    return [data, updateData];
};

// مكون محسن للفورم
const OptimizedForm = memo(({ onSubmit, initialData }) => {
    const [formData, setFormData] = useLocalData('cart-form', initialData);
    const [errors, setErrors] = useState({});
    
    // تحسين validation
    const validateForm = useCallback((data) => {
        const newErrors = {};
        
        if (!data.name?.trim()) {
            newErrors.name = 'اسم المنتج مطلوب';
        }
        
        if (!data.price || data.price <= 0) {
            newErrors.price = 'سعر صحيح مطلوب';
        }
        
        if (data.price && data.price > 999999) {
            newErrors.price = 'السعر مرتفع جداً';
        }
        
        return newErrors;
    }, []);
    
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        
        const newErrors = validateForm(formData);
        setErrors(newErrors);
        
        if (Object.keys(newErrors).length === 0) {
            onSubmit(formData);
        }
    }, [formData, onSubmit, validateForm]);
    
    const handleChange = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // إزالة الخطأ عند التعديل
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    }, [setFormData, errors]);
    
    return (
        <form onSubmit={handleSubmit} className="optimized-form">
            <div className="form-group">
                <label>اسم المنتج</label>
                <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
            
            <div className="form-group">
                <label>السعر</label>
                <input
                    type="number"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                    className={errors.price ? 'error' : ''}
                />
                {errors.price && <span className="error-message">{errors.price}</span>}
            </div>
            
            <button type="submit" className="submit-btn">
                حفظ المنتج
            </button>
        </form>
    );
});

// مكون Lazy Loading للصور
const LazyImage = memo(({ src, alt, className, ...props }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    
    return (
        <div className={`lazy-image-container ${className || ''}`}>
            {!imageLoaded && !imageError && (
                <div className="image-placeholder">
                    <div className="loading-spinner"></div>
                </div>
            )}
            
            <img
                src={src}
                alt={alt}
                className={`lazy-image ${imageLoaded ? 'loaded' : ''}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                loading="lazy"
                {...props}
            />
            
            {imageError && (
                <div className="image-error">
                    <span>فشل في تحميل الصورة</span>
                </div>
            )}
        </div>
    );
});

// Hook للـ infinite scrolling
const useInfiniteScroll = (fetchFunction, options = {}) => {
    const queryClient = useQueryClient();
    
    return useInfiniteQuery({
        queryKey: options.queryKey || ['infinite-data'],
        queryFn: fetchFunction,
        getNextPageParam: (lastPage) => {
            return lastPage.hasNextPage ? lastPage.nextCursor : undefined;
        },
        staleTime: 5 * 60 * 1000, // 5 دقائق
        cacheTime: 10 * 60 * 1000, // 10 دقائق
        refetchOnWindowFocus: false,
        ...options
    });
};

export {
    ProductCard,
    VirtualizedProductList,
    OptimizedForm,
    LazyImage,
    useLocalData,
    useInfiniteScroll
};
```

### تحسين CSS

```css
/* optimized-styles.css - تحسينات CSS للأداء */

/* تحسين الأداء العام */
* {
    box-sizing: border-box;
}

/* استخدام will-change للعناصر المتحركة */
.will-animate {
    will-change: transform, opacity;
}

/* تحسين Font Loading */
@font-face {
    font-family: 'CustomFont';
    src: url('fonts/custom-font.woff2') format('woff2'),
         url('fonts/custom-font.woff') format('woff');
    font-display: swap; /* تحسين عرض النص */
    font-weight: 400;
    font-style: normal;
}

/* تحسين Layout */
.container {
    /* استخدام CSS Grid بدلاً من Flexbox للعناصر المعقدة */
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    padding: 1rem;
}

.flex-container {
    /* تحسين Flexbox */
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

/* تحسين النصوص */
.text {
    /* تحسين قابلية القراءة */
    line-height: 1.6;
    letter-spacing: 0.02em;
    word-break: break-word;
    
    /* تحسين الأداء */
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* تحسين الأزرار */
.btn {
    /* تحسين الأداء مع transform */
    transform: translateZ(0);
    backface-visibility: hidden;
    
    /* تحسين التفاعل */
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
}

.btn:hover {
    transform: translateY(-1px);
}

.btn:active {
    transform: translateY(0);
}

/* تحسين البطاقات */
.card {
    /* تحسين أداء الرسم */
    contain: layout style paint;
    
    /* تحسين الظلال */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.3s ease;
}

.card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* تحسين الصور */
img {
    /* تحسين أداء العرض */
    max-width: 100%;
    height: auto;
    
    /* تحسين جودة العرض */
    image-rendering: -webkit-optimize-contrast;
    image-rendering: optimize-contrast;
}

/* تحسين Form Elements */
input, select, textarea {
    /* تحسين الأداء */
    transform: translateZ(0);
    
    /* تحسين التركيز */
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

/* تحسين Animations */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.fade-in {
    animation: fadeIn 0.5s ease-out;
}

@keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
}

.slide-in {
    animation: slideIn 0.3s ease-out;
}

/* تحسين Performance للـ Lists */
.virtualized-list {
    /* تحسين أداء التمرير */
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    
    /* تحسين الرسم */
    contain: strict;
}

/* تحسين Responsive Design */
@media (max-width: 768px) {
    .container {
        grid-template-columns: 1fr;
        padding: 0.5rem;
    }
    
    .btn {
        min-height: 44px; /* تحسين إمكانية اللمس */
    }
    
    .card {
        margin-bottom: 1rem;
    }
}

/* تحسين الطباعة */
@media print {
    .no-print {
        display: none !important;
    }
    
    .card {
        break-inside: avoid;
    }
}

/* تحسين الوضع المظلم */
@media (prefers-color-scheme: dark) {
    .card {
        background-color: #2d3748;
        color: #e2e8f0;
    }
    
    .btn {
        background-color: #4a5568;
        color: #e2e8f0;
    }
}

/* تحسين إمكانية الوصول */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* تحسين الأداء للعناصر الكبيرة */
.large-list {
    /* تحسين الذاكرة */
    contain: strict;
    
    /* تحسين التمرير */
    overflow: auto;
    scroll-behavior: smooth;
}

/* تحسين الحاويات */
.responsive-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    padding: 1rem;
    
    /* تحسين الأداء */
    contain: layout;
}

/* تحسين الطبقات */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    
    /* تحسين الأداء */
    transform: translateZ(0);
    will-change: opacity;
}

.modal-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    
    /* تحسين الأداء */
    contain: layout style;
    will-change: transform;
}
```

## تحسين الذاكرة والتخزين

### إعداد Redis Cache

```python
# redis_cache.py - تحسين Redis Cache

import redis
import json
import pickle
import hashlib
from typing import Any, Optional, Dict, List
from functools import wraps
import time
import logging

logger = logging.getLogger(__name__)

class OptimizedRedisCache:
    """محسن Redis Cache"""
    
    def __init__(self, host='localhost', port=6379, db=0, password=None):
        self.redis_client = redis.Redis(
            host=host,
            port=port,
            db=db,
            password=password,
            decode_responses=False,  # لتجنب التحويل التلقائي
            socket_connect_timeout=5,
            socket_timeout=5,
            health_check_interval=30,
            retry_on_timeout=True,
            max_connections=100,
            connection_pool_kwargs={
                'max_connections': 100,
                'retry_on_timeout': True,
                'health_check_interval': 30
            }
        )
        
        # إعدادات التهيئة
        self.default_timeout = 3600  # ساعة واحدة
        self.compression_threshold = 1024  # 1KB
        
    def cache_result(self, timeout=None, key_prefix=''):
        """decorator للـ cache النتائج"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # إنشاء مفتاح فريد
                cache_key = self._generate_cache_key(func, args, kwargs, key_prefix)
                
                # محاولة جلب من cache
                cached_result = self.get(cache_key)
                if cached_result is not None:
                    logger.debug(f"Cache hit for {cache_key}")
                    return cached_result
                
                # تنفيذ الوظيفة
                start_time = time.time()
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time
                
                # حفظ في cache
                if execution_time > 0.1:  # cache فقط للعمليات البطيئة
                    self.set(cache_key, result, timeout)
                    logger.debug(f"Cached result for {cache_key}")
                
                return result
            return wrapper
        return decorator
    
    def _generate_cache_key(self, func, args, kwargs, prefix='') -> str:
        """إنشاء مفتاح فريد للـ cache"""
        # دمج المعاملات
        params = []
        
        # إضافة args
        for arg in args:
            if hasattr(arg, '__dict__'):
                params.append(str(hash(str(arg.__dict__))))
            else:
                params.append(str(arg))
        
        # إضافة kwargs
        for k, v in sorted(kwargs.items()):
            params.append(f"{k}={v}")
        
        # إنشاء hash
        param_string = ":".join(params)
        param_hash = hashlib.md5(param_string.encode()).hexdigest()
        
        return f"{prefix}:{func.__name__}:{param_hash}"
    
    def set(self, key: str, value: Any, timeout: Optional[int] = None) -> bool:
        """حفظ قيمة في cache"""
        try:
            # ضغط القيم الكبيرة
            if self._should_compress(value):
                serialized_value = self._compress(value)
                compressed = True
            else:
                serialized_value = pickle.dumps(value)
                compressed = False
            
            # حفظ مع metadata
            cache_data = {
                'data': serialized_value,
                'compressed': compressed,
                'timestamp': time.time()
            }
            
            # حفظ في Redis
            result = self.redis_client.setex(
                key, 
                timeout or self.default_timeout, 
                pickle.dumps(cache_data)
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    def get(self, key: str) -> Any:
        """جلب قيمة من cache"""
        try:
            cache_data = self.redis_client.get(key)
            if not cache_data:
                return None
            
            # فك metadata
            cache_info = pickle.loads(cache_data)
            data = cache_info['data']
            compressed = cache_info['compressed']
            
            # فك الضغط إذا لزم الأمر
            if compressed:
                return self._decompress(data)
            else:
                return pickle.loads(data)
                
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None
    
    def get_multiple(self, keys: List[str]) -> Dict[str, Any]:
        """جلب قيم متعددة"""
        try:
            result = self.redis_client.mget(keys)
            cache_data = {}
            
            for key, value in zip(keys, result):
                if value:
                    try:
                        cache_info = pickle.loads(value)
                        data = cache_info['data']
                        if cache_info['compressed']:
                            cache_data[key] = self._decompress(data)
                        else:
                            cache_data[key] = pickle.loads(data)
                    except:
                        cache_data[key] = None
                else:
                    cache_data[key] = None
            
            return cache_data
            
        except Exception as e:
            logger.error(f"Cache mget error: {e}")
            return {}
    
    def set_multiple(self, data: Dict[str, Any], timeout: Optional[int] = None) -> bool:
        """حفظ قيم متعددة"""
        try:
            pipeline = self.redis_client.pipeline()
            
            for key, value in data.items():
                if self._should_compress(value):
                    serialized_value = self._compress(value)
                    compressed = True
                else:
                    serialized_value = pickle.dumps(value)
                    compressed = False
                
                cache_data = {
                    'data': serialized_value,
                    'compressed': compressed,
                    'timestamp': time.time()
                }
                
                if timeout:
                    pipeline.setex(key, timeout, pickle.dumps(cache_data))
                else:
                    pipeline.set(key, pickle.dumps(cache_data))
            
            pipeline.execute()
            return True
            
        except Exception as e:
            logger.error(f"Cache mset error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """حذف مفتاح"""
        try:
            return bool(self.redis_client.delete(key))
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """حذف مفاتيح بنمط"""
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {e}")
            return 0
    
    def clear(self) -> bool:
        """مسح جميع البيانات"""
        try:
            return bool(self.redis_client.flushdb())
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """إحصائيات cache"""
        try:
            info = self.redis_client.info()
            return {
                'used_memory': info.get('used_memory'),
                'used_memory_human': info.get('used_memory_human'),
                'connected_clients': info.get('connected_clients'),
                'total_commands_processed': info.get('total_commands_processed'),
                'keyspace_hits': info.get('keyspace_hits'),
                'keyspace_misses': info.get('keyspace_misses'),
                'hit_rate': self._calculate_hit_rate(info)
            }
        except Exception as e:
            logger.error(f"Cache stats error: {e}")
            return {}
    
    def _should_compress(self, value: Any) -> bool:
        """تحديد ما إذا كان يجب ضغط القيمة"""
        import sys
        
        # تقدير حجم البيانات
        serialized_size = len(pickle.dumps(value))
        
        return serialized_size > self.compression_threshold
    
    def _compress(self, value: Any) -> bytes:
        """ضغط القيمة"""
        import zlib
        
        serialized = pickle.dumps(value)
        return zlib.compress(serialized)
    
    def _decompress(self, compressed_data: bytes) -> Any:
        """فك ضغط القيمة"""
        import zlib
        
        decompressed = zlib.decompress(compressed_data)
        return pickle.loads(decompressed)
    
    def _calculate_hit_rate(self, info: Dict) -> float:
        """حساب معدل الضربات"""
        hits = info.get('keyspace_hits', 0)
        misses = info.get('keyspace_misses', 0)
        total = hits + misses
        
        return (hits / total * 100) if total > 0 else 0
    
    def cleanup_expired(self) -> int:
        """تنظيف المفاتيح المنتهية الصلاحية"""
        try:
            # استخدام SCAN لإيجاد المفاتيح المنتهية
            expired_keys = []
            cursor = 0
            
            while True:
                cursor, keys = self.redis_client.scan(
                    cursor=cursor, 
                    match='*', 
                    count=100
                )
                
                for key in keys:
                    ttl = self.redis_client.ttl(key)
                    if ttl == -1:  # مفتاح بدون انتهاء صلاحية
                        continue
                    elif ttl <= 0:  # مفتاح منتهي الصلاحية
                        expired_keys.append(key)
                
                if cursor == 0:
                    break
            
            # حذف المفاتيح المنتهية
            if expired_keys:
                return self.redis_client.delete(*expired_keys)
            
            return 0
            
        except Exception as e:
            logger.error(f"Cache cleanup error: {e}")
            return 0

# استخدام محسن cache
cache = OptimizedRedisCache()

@cache.cache_result(timeout=300, key_prefix='user')
def get_user_products(user_id: int) -> List[Dict]:
    """استرجاع منتجات المستخدم مع cache"""
    # منطق استرجاع المنتجات
    products = Product.objects.filter(user_id=user_id).values()
    return list(products)

@cache.cache_result(timeout=60, key_prefix='store')
def get_store_statistics(store_id: int) -> Dict:
    """إحصائيات المتجر مع cache"""
    # منطق حساب الإحصائيات
    stats = {
        'total_orders': Order.objects.filter(store_id=store_id).count(),
        'total_revenue': Order.objects.filter(store_id=store_id).aggregate(
            total=models.Sum('total_amount')
        )['total'] or 0,
        'average_order_value': Order.objects.filter(store_id=store_id).aggregate(
            avg=models.Avg('total_amount')
        )['avg'] or 0
    }
    return stats
```

### تحسين الصور

```python
# image_optimization.py - تحسين الصور

import os
import io
from PIL import Image, ImageOps
import pillow_heif
from typing import Tuple, Optional
import hashlib
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class ImageOptimizer:
    """محسن الصور"""
    
    # إعدادات الجودة
    JPEG_QUALITY = 85
    WEBP_QUALITY = 85
    PNG_OPTIMIZATION_LEVEL = 6
    
    # أحجام متاحة
    AVAILABLE_SIZES = {
        'thumbnail': (150, 150),
        'small': (300, 300),
        'medium': (600, 600),
        'large': (1200, 1200),
        'xlarge': (1920, 1920)
    }
    
    def __init__(self, upload_dir: str = 'uploads/images'):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def optimize_image(self, 
                      image_path: str,
                      output_dir: Optional[str] = None,
                      sizes: Optional[list] = None,
                      formats: Optional[list] = None) -> Dict[str, str]:
        """تحسين صورة بجميع الأحجام والتنسيقات"""
        
        if sizes is None:
            sizes = list(self.AVAILABLE_SIZES.keys())
        
        if formats is None:
            formats = ['webp', 'jpeg']
        
        try:
            # فتح الصورة الأصلية
            with Image.open(image_path) as img:
                # تحويل ألوان الصورة
                img = self._process_image(img)
                
                results = {}
                
                for size_name in sizes:
                    size = self.AVAILABLE_SIZES[size_name]
                    resized_img = self._resize_image(img, size)
                    
                    for format_name in formats:
                        output_filename = self._generate_filename(
                            image_path, size_name, format_name
                        )
                        
                        output_path = self._save_optimized_image(
                            resized_img, output_filename, format_name, output_dir
                        )
                        
                        results[f"{size_name}_{format_name}"] = output_path
                
                return results
                
        except Exception as e:
            logger.error(f"خطأ في تحسين الصورة {image_path}: {e}")
            return {}
    
    def _process_image(self, img: Image.Image) -> Image.Image:
        """معالجة الصورة الأساسية"""
        
        # إزالة معلومات EXIF غير المرغوب فيها
        img = ImageOps.exif_transpose(img)
        
        # تحويل إلى RGB إذا كانت الصورة RGBA
        if img.mode in ('RGBA', 'LA'):
            # إنشاء خلفية بيضاء للصور الشفافة
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[-1])
            else:
                background.paste(img, mask=img.split()[-1])
            img = background
        
        # تصحيح orientación الصور
        img = ImageOps.exif_transpose(img)
        
        return img
    
    def _resize_image(self, img: Image.Image, size: Tuple[int, int]) -> Image.Image:
        """تغيير حجم الصورة"""
        
        # استخدام高品質 resize
        return img.resize(size, Image.Resampling.LANCZOS)
    
    def _save_optimized_image(self, 
                             img: Image.Image, 
                             filename: str, 
                             format_name: str,
                             output_dir: Optional[str] = None) -> str:
        """حفظ الصورة المحسنة"""
        
        if output_dir:
            output_path = Path(output_dir) / filename
        else:
            output_path = self.upload_dir / filename
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # إعدادات حفظ بالتنسيق
        save_options = self._get_save_options(format_name)
        
        # حفظ الصورة
        img.save(output_path, format=format_name.upper(), **save_options)
        
        return str(output_path)
    
    def _get_save_options(self, format_name: str) -> dict:
        """الحصول على إعدادات الحفظ بالتنسيق"""
        
        options = {}
        
        if format_name == 'webp':
            options.update({
                'method': 6,  # أفضل ضغط
                'quality': self.WEBP_QUALITY,
                'subsampling': 0  # 4:4:4 Subsampling للحصول على أفضل جودة
            })
        
        elif format_name == 'jpeg':
            options.update({
                'quality': self.JPEG_QUALITY,
                'optimize': True,
                'progressive': True
            })
        
        elif format_name == 'png':
            options.update({
                'optimize': True,
                'compress_level': self.PNG_OPTIMIZATION_LEVEL
            })
        
        return options
    
    def _generate_filename(self, original_path: str, size_name: str, format_name: str) -> str:
        """إنشاء اسم ملف فريد"""
        
        # حساب hash للملف الأصلي
        with open(original_path, 'rb') as f:
            file_hash = hashlib.md5(f.read()).hexdigest()
        
        # إنشاء اسم الملف
        original_name = Path(original_path).stem
        filename = f"{original_name}_{size_name}_{file_hash[:8]}.{format_name}"
        
        return filename
    
    def convert_to_webp(self, image_path: str, quality: int = 85) -> str:
        """تحويل صورة إلى WebP"""
        
        try:
            with Image.open(image_path) as img:
                img = self._process_image(img)
                
                # إنشاء اسم ملف جديد
                original_name = Path(image_path).stem
                webp_filename = f"{original_name}_{quality}webp.webp"
                webp_path = self.upload_dir / webp_filename
                
                # حفظ كـ WebP
                img.save(
                    webp_path,
                    'WEBP',
                    method=6,
                    quality=quality,
                    lossless=False
                )
                
                return str(webp_path)
                
        except Exception as e:
            logger.error(f"خطأ في تحويل {image_path} إلى WebP: {e}")
            return ""
    
    def create_webp_responsive_set(self, image_path: str) -> Dict[str, str]:
        """إنشاء مجموعة WebP responsive"""
        
        try:
            with Image.open(image_path) as img:
                img = self._process_image(img)
                
                results = {}
                
                for size_name, size in self.AVAILABLE_SIZES.items():
                    resized = self._resize_image(img, size)
                    
                    # إنشاء اسم الملف
                    original_name = Path(image_path).stem
                    filename = f"{original_name}_{size_name}.webp"
                    
                    # حفظ الصورة
                    output_path = self.upload_dir / filename
                    resized.save(
                        output_path,
                        'WEBP',
                        method=6,
                        quality=self.WEBP_QUALITY
                    )
                    
                    results[size_name] = str(output_path)
                
                return results
                
        except Exception as e:
            logger.error(f"خطأ في إنشاء مجموعة responsive: {e}")
            return {}
    
    def get_image_info(self, image_path: str) -> Dict:
        """الحصول على معلومات الصورة"""
        
        try:
            with Image.open(image_path) as img:
                return {
                    'filename': Path(image_path).name,
                    'format': img.format,
                    'mode': img.mode,
                    'size': img.size,
                    'width': img.width,
                    'height': img.height,
                    'aspect_ratio': round(img.width / img.height, 2),
                    'file_size': os.path.getsize(image_path),
                    'has_transparency': img.mode in ('RGBA', 'LA'),
                    'exif_data': getattr(img, '_getexif', lambda: {})() is not None
                }
        except Exception as e:
            logger.error(f"خطأ في الحصول على معلومات الصورة {image_path}: {e}")
            return {}

# دالة تحسين تلقائي للصور المرفوعة
def auto_optimize_uploaded_image(file_path: str) -> Dict[str, str]:
    """تحسين تلقائي للصور المرفوعة"""
    
    optimizer = ImageOptimizer()
    
    # تحسين صورة بجميع الأحجام
    optimized_images = optimizer.optimize_image(file_path)
    
    # إنشاء مجموعة WebP responsive
    webp_set = optimizer.create_webp_responsive_set(file_path)
    
    return {
        'original': file_path,
        'optimized': optimized_images,
        'webp_responsive': webp_set
    }

# Example usage
if __name__ == "__main__":
    # تحسين صورة واحدة
    optimizer = ImageOptimizer()
    result = optimizer.optimize_image("path/to/image.jpg")
    
    print(f"تم تحسين الصورة: {result}")
```

هذا جزء من دليل تحسين الأداء. الملف يحتوي على:

1. **تحليل الأداء**: أدوات قياس ومراقبة الأداء
2. **تحسين قاعدة البيانات**: فهارس واستعلامات محسنة
3. **تحسين الخادم الخلفي**: تحسين Express.js و Flask
4. **تحسين الواجهة الأمامية**: React و CSS محسن
5. **تحسين الذاكرة**: Redis Cache محسن
6. **تحسين الصور**: ضغط ومعالجة تلقائية للصور

الممارسات المطلوبة:
- استحدام معايير الأداء الحديثة
- تطبيق أفضل التقنيات
- ضمان التوافق مع المتصفحات
- تحسين تجربة المستخدم
- مراقبة الأداء المستمر