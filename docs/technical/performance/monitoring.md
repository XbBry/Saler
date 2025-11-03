# مراقبة الأداء - Performance Monitoring

## نظرة عامة

يقدم هذا الدليل نظاماً شاملاً لمراقبة أداء تطبيق Saler في الوقت الفعلي، مع التركيز على مقاييس الأداء الرئيسية، التنبيهات، والتقارير التفصيلية.

## محتويات الدليل

1. [إعداد نظام المراقبة](#إعداد-نظام-المراقبة)
2. [مقاييس الأداء الرئيسية](#مقاييس-الأداء-الرئيسية)
3. [مراقبة الخادم الخلفي](#مراقبة-الخادم-الخلفي)
4. [مراقبة قاعدة البيانات](#مراقبة-قاعدة-البيانات)
5. [مراقبة الواجهة الأمامية](#مراقبة-الواجهة-الأمامية)
6. [مراقبة الشبكة والبنية التحتية](#مراقبة-الشبكة-والبنية-التحتية)
7. [نظام التنبيهات](#نظام-التنبيهات)
8. [لوحة التحكم](#لوحة-التحكم)
9. [التقارير والتحليلات](#التقارير-والتحليلات)
10. [أدوات المراقبة](#أدوات-المراقبة)

## إعداد نظام المراقبة

### إعداد Prometheus مع Grafana

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: saler-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    restart: unless-stopped
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: saler-grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    restart: unless-stopped
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    container_name: saler-node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    restart: unless-stopped
    networks:
      - monitoring

  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: saler-redis-exporter
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=redis://redis:6379
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - redis

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: saler-postgres-exporter
    ports:
      - "9187:9187"
    environment:
      - DATA_SOURCE_NAME=postgresql://postgres:password@postgres:5432/saler?sslmode=disable
    restart: unless-stopped
    networks:
      - monitoring

volumes:
  prometheus_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge
```

### إعداد Prometheus

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 5s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'salar-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:9113']

  - job_name: 'blackbox'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
        - https://saler.app/health
        - https://saler.app/api/v1/products
        - https://saler.app/api/v1/orders
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
```

## مقاييس الأداء الرئيسية

### مقاييس الخادم الخلفي

```javascript
// performance-metrics.js - مقاييس الأداء

const promClient = require('prom-client');
const os = require('os');
const process = require('process');

// إعداد Registry للمقاييس
const register = new promClient.Registry();

// إضافة معلومات النظام
promClient.collectDefaultMetrics({ register });

// مقاييس التطبيق المخصصة
class AppMetrics {
    constructor() {
        this.setupMetrics();
    }

    setupMetrics() {
        // مقاييس HTTP
        this.httpRequestDuration = new promClient.Histogram({
            name: 'http_request_duration_seconds',
            help: 'زمن استجابة طلبات HTTP',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
        });

        this.httpRequestsTotal = new promClient.Counter({
            name: 'http_requests_total',
            help: 'إجمالي عدد طلبات HTTP',
            labelNames: ['method', 'route', 'status_code']
        });

        // مقاييس قاعدة البيانات
        this.dbQueryDuration = new promClient.Histogram({
            name: 'db_query_duration_seconds',
            help: 'زمن تنفيذ استعلامات قاعدة البيانات',
            labelNames: ['operation', 'table'],
            buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
        });

        this.dbConnectionsActive = new promClient.Gauge({
            name: 'db_connections_active',
            help: 'عدد اتصالات قاعدة البيانات النشطة'
        });

        // مقاييس الذاكرة
        this.memoryUsage = new promClient.Gauge({
            name: 'process_memory_usage_bytes',
            help: 'استخدام الذاكرة',
            labelNames: ['type']
        });

        // مقاييس الأعمال
        this.activeUsers = new promClient.Gauge({
            name: 'active_users_total',
            help: 'عدد المستخدمين النشطين'
        });

        this.orderProcessingTime = new promClient.Histogram({
            name: 'order_processing_duration_seconds',
            help: 'زمن معالجة الطلبات',
            buckets: [0.5, 1, 2, 5, 10, 30, 60]
        });

        // تسجيل المقاييس
        register.registerMetric(this.httpRequestDuration);
        register.registerMetric(this.httpRequestsTotal);
        register.registerMetric(this.dbQueryDuration);
        register.registerMetric(this.dbConnectionsActive);
        register.registerMetric(this.memoryUsage);
        register.registerMetric(this.activeUsers);
        register.registerMetric(this.orderProcessingTime);
    }

    // تسجيل طلب HTTP
    recordHttpRequest(method, route, statusCode, duration) {
        this.httpRequestsTotal.inc({ method, route, status_code: statusCode });
        this.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
    }

    // تسجيل استعلام قاعدة بيانات
    recordDbQuery(operation, table, duration) {
        this.dbQueryDuration.observe({ operation, table }, duration);
    }

    // تحديث مقاييس الذاكرة
    updateMemoryMetrics() {
        const memUsage = process.memoryUsage();
        
        this.memoryUsage.set({ type: 'rss' }, memUsage.rss);
        this.memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
        this.memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
        this.memoryUsage.set({ type: 'external' }, memUsage.external);
        this.memoryUsage.set({ type: 'arrayBuffers' }, memUsage.arrayBuffers || 0);
    }

    // تحديث مقاييس الأعمال
    updateBusinessMetrics(activeUsers, dbConnections) {
        this.activeUsers.set(activeUsers);
        this.dbConnectionsActive.set(dbConnections);
    }

    // تسجيل زمن معالجة الطلب
    recordOrderProcessing(duration) {
        this.orderProcessingTime.observe(duration);
    }

    // تصدير المقاييس
    async getMetrics() {
        this.updateMemoryMetrics();
        return await register.metrics();
    }
}

// Middleware لمراقبة الطلبات
function metricsMiddleware(req, res, next) {
    const startTime = Date.now();
    
    // حفظ معلومات الطلب
    req.metrics = {
        startTime,
        method: req.method,
        route: req.route?.path || req.path,
        userId: req.user?.id,
        ip: req.ip
    };

    res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000;
        appMetrics.recordHttpRequest(
            req.metrics.method,
            req.metrics.route,
            res.statusCode,
            duration
        );

        // تسجيل إضافية للطلبات البطيئة
        if (duration > 2) {
            console.warn(`طلب بطيء: ${req.metrics.method} ${req.metrics.route} - ${duration}s`);
        }
    });

    next();
}

// تصدير المقاييس
module.exports = {
    appMetrics,
    metricsMiddleware,
    register
};
```

### مقاييس قاعدة البيانات

```python
# db_monitoring.py - مراقبة قاعدة البيانات

import psycopg2
from psycopg2 import sql
import time
import logging
from typing import Dict, List, Any
from sqlalchemy import text
from sqlalchemy.orm import Session
import json

logger = logging.getLogger(__name__)

class DatabaseMonitor:
    """مراقب قاعدة البيانات"""
    
    def __init__(self, db_connection: str):
        self.db_connection = db_connection
        self.metrics = {
            'query_performance': {},
            'connection_stats': {},
            'table_stats': {},
            'index_stats': {},
            'lock_stats': {},
            'cache_stats': {}
        }
    
    def monitor_query_performance(self, duration_threshold: float = 1.0) -> Dict[str, Any]:
        """مراقبة أداء الاستعلامات"""
        
        with psycopg2.connect(self.db_connection) as conn:
            with conn.cursor() as cur:
                # الاستعلامات البطيئة
                cur.execute("""
                    SELECT 
                        query,
                        calls,
                        total_time,
                        mean_time,
                        stddev_time,
                        rows,
                        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
                    FROM pg_stat_statements 
                    WHERE mean_time > %s
                    ORDER BY total_time DESC 
                    LIMIT 20
                """, (duration_threshold,))
                
                slow_queries = cur.fetchall()
                
                self.metrics['query_performance'] = {
                    'slow_queries_count': len(slow_queries),
                    'queries': [
                        {
                            'query': query[0][:200] + '...' if len(query[0]) > 200 else query[0],
                            'calls': query[1],
                            'total_time': round(query[2], 2),
                            'mean_time': round(query[3], 2),
                            'stddev_time': round(query[4], 2),
                            'rows': query[5],
                            'hit_percent': round(query[6], 2)
                        }
                        for query in slow_queries
                    ]
                }
                
                return self.metrics['query_performance']
    
    def monitor_connection_stats(self) -> Dict[str, Any]:
        """مراقبة إحصائيات الاتصالات"""
        
        with psycopg2.connect(self.db_connection) as conn:
            with conn.cursor() as cur:
                # إحصائيات الاتصالات
                cur.execute("""
                    SELECT 
                        datname,
                        numbackends,
                        xact_commit,
                        xact_rollback,
                        blks_read,
                        blks_hit,
                        tup_returned,
                        tup_fetched,
                        tup_inserted,
                        tup_updated,
                        tup_deleted,
                        conflicts,
                        temp_files,
                        temp_bytes,
                        deadlocks,
                        blk_read_time,
                        blk_write_time
                    FROM pg_stat_database 
                    WHERE datname NOT IN ('template0', 'template1', 'postgres')
                    ORDER BY datname
                """)
                
                db_stats = cur.fetchall()
                
                self.metrics['connection_stats'] = {
                    'database_stats': [
                        {
                            'database': stat[0],
                            'numbackends': stat[1],
                            'xact_commit': stat[2],
                            'xact_rollback': stat[3],
                            'blks_read': stat[4],
                            'blks_hit': stat[5],
                            'tup_returned': stat[6],
                            'tup_fetched': stat[7],
                            'tup_inserted': stat[8],
                            'tup_updated': stat[9],
                            'tup_deleted': stat[10],
                            'conflicts': stat[11],
                            'temp_files': stat[12],
                            'temp_bytes': stat[13],
                            'deadlocks': stat[14],
                            'blk_read_time': stat[15],
                            'blk_write_time': stat[16],
                            'hit_ratio': round((stat[5] / (stat[4] + stat[5]) * 100) if (stat[4] + stat[5]) > 0 else 0, 2)
                        }
                        for stat in db_stats
                    ]
                }
                
                return self.metrics['connection_stats']
    
    def monitor_table_stats(self) -> Dict[str, Any]:
        """مراقبة إحصائيات الجداول"""
        
        with psycopg2.connect(self.db_connection) as conn:
            with conn.cursor() as cur:
                # إحصائيات الجداول
                cur.execute("""
                    SELECT 
                        schemaname,
                        relname,
                        seq_scan,
                        seq_tup_read,
                        idx_scan,
                        idx_tup_fetch,
                        n_tup_ins,
                        n_tup_upd,
                        n_tup_del,
                        n_live_tup,
                        n_dead_tup,
                        last_vacuum,
                        last_autovacuum,
                        last_analyze,
                        last_autoanalyze,
                        vacuum_count,
                        autovacuum_count,
                        analyze_count,
                        autoanalyze_count
                    FROM pg_stat_user_tables 
                    ORDER BY n_live_tup DESC
                    LIMIT 20
                """)
                
                table_stats = cur.fetchall()
                
                self.metrics['table_stats'] = {
                    'tables': [
                        {
                            'schema': stat[0],
                            'table': stat[1],
                            'seq_scan': stat[2],
                            'seq_tup_read': stat[3],
                            'idx_scan': stat[4],
                            'idx_tup_fetch': stat[5],
                            'n_tup_ins': stat[6],
                            'n_tup_upd': stat[7],
                            'n_tup_del': stat[8],
                            'n_live_tup': stat[9],
                            'n_dead_tup': stat[10],
                            'last_vacuum': stat[11],
                            'last_autovacuum': stat[12],
                            'last_analyze': stat[13],
                            'last_autoanalyze': stat[14],
                            'vacuum_count': stat[15],
                            'autovacuum_count': stat[16],
                            'analyze_count': stat[17],
                            'autoanalyze_count': stat[18],
                            'read_efficiency': round((stat[4] / (stat[2] + stat[4]) * 100) if (stat[2] + stat[4]) > 0 else 0, 2)
                        }
                        for stat in table_stats
                    ]
                }
                
                return self.metrics['table_stats']
    
    def monitor_index_usage(self) -> Dict[str, Any]:
        """مراقبة استخدام الفهارس"""
        
        with psycopg2.connect(self.db_connection) as conn:
            with conn.cursor() as cur:
                # إحصائيات الفهارس
                cur.execute("""
                    SELECT 
                        schemaname,
                        tablename,
                        indexname,
                        idx_scan,
                        idx_tup_read,
                        idx_tup_fetch,
                        indexdef
                    FROM pg_stat_user_indexes 
                    ORDER BY idx_scan DESC
                """)
                
                index_stats = cur.fetchall()
                
                # إحصائيات الفهارس غير المستخدمة
                cur.execute("""
                    SELECT 
                        schemaname,
                        tablename,
                        indexname,
                        idx_scan,
                        indexdef
                    FROM pg_stat_user_indexes 
                    WHERE idx_scan = 0
                    ORDER BY tablename, indexname
                """)
                
                unused_indexes = cur.fetchall()
                
                self.metrics['index_stats'] = {
                    'all_indexes': [
                        {
                            'schema': stat[0],
                            'table': stat[1],
                            'index': stat[2],
                            'idx_scan': stat[3],
                            'idx_tup_read': stat[4],
                            'idx_tup_fetch': stat[5],
                            'definition': stat[6]
                        }
                        for stat in index_stats
                    ],
                    'unused_indexes': [
                        {
                            'schema': stat[0],
                            'table': stat[1],
                            'index': stat[2],
                            'idx_scan': stat[3],
                            'definition': stat[4]
                        }
                        for stat in unused_indexes
                    ]
                }
                
                return self.metrics['index_stats']
    
    def monitor_lock_statistics(self) -> Dict[str, Any]:
        """مراقبة إحصائيات الأقفال"""
        
        with psycopg2.connect(self.db_connection) as conn:
            with conn.cursor() as cur:
                # الأقفال النشطة
                cur.execute("""
                    SELECT 
                        pl.pid,
                        pa.usename,
                        pa.application_name,
                        pa.client_addr,
                        pl.mode,
                        pl.locktype,
                        pl.relation::regclass,
                        pl.granted,
                        pl.query,
                        EXTRACT(EPOCH FROM (now() - pa.query_start)) as query_duration
                    FROM pg_locks pl
                    JOIN pg_stat_activity pa ON pl.pid = pa.pid
                    WHERE pl.pid != pg_backend_pid()
                    ORDER BY pl.granted, query_duration DESC
                """)
                
                active_locks = cur.fetchall()
                
                # إحصائيات الأقفال
                cur.execute("""
                    SELECT 
                        locktype,
                        mode,
                        granted,
                        COUNT(*) as count
                    FROM pg_locks
                    WHERE locktype NOT IN ('relation', 'extend', 'page')
                    GROUP BY locktype, mode, granted
                    ORDER BY count DESC
                """)
                
                lock_summary = cur.fetchall()
                
                self.metrics['lock_stats'] = {
                    'active_locks': [
                        {
                            'pid': lock[0],
                            'username': lock[1],
                            'application': lock[2],
                            'client_addr': lock[3],
                            'mode': lock[4],
                            'locktype': lock[5],
                            'relation': str(lock[6]),
                            'granted': lock[7],
                            'query': lock[8][:200] + '...' if len(lock[8]) > 200 else lock[8],
                            'query_duration': round(lock[9], 2)
                        }
                        for lock in active_locks
                    ],
                    'lock_summary': [
                        {
                            'locktype': summary[0],
                            'mode': summary[1],
                            'granted': summary[2],
                            'count': summary[3]
                        }
                        for summary in lock_summary
                    ]
                }
                
                return self.metrics['lock_stats']
    
    def get_database_health(self) -> Dict[str, Any]:
        """الحصول على صحة قاعدة البيانات"""
        
        with psycopg2.connect(self.db_connection) as conn:
            with conn.cursor() as cur:
                # فحص الاتصال
                cur.execute("SELECT 1")
                db_healthy = True
                
                # حجم قاعدة البيانات
                cur.execute("""
                    SELECT pg_size_pretty(pg_database_size(current_database())) as size
                """)
                db_size = cur.fetchone()[0]
                
                # عدد الاتصالات النشطة
                cur.execute("""
                    SELECT count(*) FROM pg_stat_activity WHERE state = 'active'
                """)
                active_connections = cur.fetchone()[0]
                
                # عدد الاتصالات الكلية
                cur.execute("""
                    SELECT count(*) FROM pg_stat_activity
                """)
                total_connections = cur.fetchone()[0]
                
                # نسبة البطء في الاستجابات
                cur.execute("""
                    SELECT 
                        COUNT(*) FILTER (WHERE mean_time > 1000) as slow_queries,
                        COUNT(*) as total_queries
                    FROM pg_stat_statements
                    WHERE calls > 0
                """)
                query_stats = cur.fetchone()
                
                return {
                    'healthy': db_healthy,
                    'database_size': db_size,
                    'active_connections': active_connections,
                    'total_connections': total_connections,
                    'slow_queries_count': query_stats[0],
                    'total_queries_count': query_stats[1],
                    'slow_query_ratio': round((query_stats[0] / query_stats[1] * 100) if query_stats[1] > 0 else 0, 2),
                    'timestamp': time.time()
                }
    
    def generate_performance_report(self) -> Dict[str, Any]:
        """إنشاء تقرير أداء شامل"""
        
        report = {
            'timestamp': time.time(),
            'health': self.get_database_health(),
            'performance': self.monitor_query_performance(),
            'connections': self.monitor_connection_stats(),
            'tables': self.monitor_table_stats(),
            'indexes': self.monitor_index_usage(),
            'locks': self.monitor_lock_statistics()
        }
        
        # حفظ التقرير
        with open(f"db_performance_report_{int(time.time())}.json", 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False, default=str)
        
        return report

# استخدام مراقب قاعدة البيانات
def monitor_database_performance():
    """مراقبة أداء قاعدة البيانات"""
    
    db_monitor = DatabaseMonitor(DATABASE_URL)
    
    # مراقبة مستمرة
    while True:
        try:
            report = db_monitor.generate_performance_report()
            
            # فحص مؤشرات التحذير
            if report['health']['slow_query_ratio'] > 10:
                logger.warning(f"نسبة عالية من الاستعلامات البطيئة: {report['health']['slow_query_ratio']}%")
            
            if report['health']['active_connections'] > 50:
                logger.warning(f"عدد عالي من الاتصالات النشطة: {report['health']['active_connections']}")
            
            # انتظار 60 ثانية للمراقبة التالية
            time.sleep(60)
            
        except Exception as e:
            logger.error(f"خطأ في مراقبة قاعدة البيانات: {e}")
            time.sleep(30)
```

## مراقبة الواجهة الأمامية

### نظام مراقبة الأداء في المتصفح

```javascript
// frontend-monitoring.js - مراقبة الواجهة الأمامية

class FrontendPerformanceMonitor {
    constructor(options = {}) {
        this.apiEndpoint = options.apiEndpoint || '/api/performance';
        this.sampleRate = options.sampleRate || 0.1; // 10% من المستخدمين
        this.sessionId = this.generateSessionId();
        this.userId = options.userId;
        this.startTime = Date.now();
        
        this.metrics = {
            performance: {},
            userInteraction: [],
            errors: [],
            navigation: [],
            resourceTiming: []
        };
        
        this.setupMonitoring();
    }

    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    setupMonitoring() {
        // مراقبة Core Web Vitals
        this.measureCoreWebVitals();
        
        // مراقبة تحميل الموارد
        this.measureResourceTiming();
        
        // مراقبة الأخطاء
        this.setupErrorMonitoring();
        
        // مراقبة تفاعل المستخدم
        this.setupUserInteractionMonitoring();
        
        // مراقبة التنقل
        this.setupNavigationMonitoring();
        
        // إرسال البيانات بشكل دوري
        this.setupPeriodicReporting();
    }

    // مراقبة Core Web Vitals
    measureCoreWebVitals() {
        // First Contentful Paint
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
                if (entry.name === 'first-contentful-paint') {
                    this.recordMetric('firstContentfulPaint', entry.startTime);
                }
            });
        }).observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
                this.recordMetric('largestContentfulPaint', lastEntry.startTime);
            }
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
            let clsValue = 0;
            list.getEntries().forEach((entry) => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            this.recordMetric('cumulativeLayoutShift', clsValue);
        }).observe({ entryTypes: ['layout-shift'] });

        // First Input Delay
        new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                this.recordMetric('firstInputDelay', entry.processingStart - entry.startTime);
            });
        }).observe({ entryTypes: ['first-input'] });

        // Time to Interactive
        this.measureTimeToInteractive();
    }

    // قياس Time to Interactive
    measureTimeToInteractive() {
        // حساب TTI بناءً على Performance APIs المتاحة
        if ('getEntriesByType' in performance) {
            const navigationEntries = performance.getEntriesByType('navigation');
            
            if (navigationEntries.length > 0) {
                const navEntry = navigationEntries[0];
                
                // تقدير TTI بناءً على DOMContentLoaded + 5 ثواني
                const estimatedTTI = navEntry.domContentLoadedEventEnd + 5000;
                this.recordMetric('timeToInteractive', estimatedTTI);
            }
        }
    }

    // مراقبة تحميل الموارد
    measureResourceTiming() {
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            
            entries.forEach((entry) => {
                this.metrics.resourceTiming.push({
                    name: entry.name,
                    type: entry.initiatorType,
                    duration: entry.duration,
                    size: entry.transferSize,
                    encodedSize: entry.encodedBodySize,
                    decodedSize: entry.decodedBodySize,
                    startTime: entry.startTime,
                    responseEnd: entry.responseEnd
                });
            });
        }).observe({ entryTypes: ['resource'] });
    }

    // مراقبة الأخطاء
    setupErrorMonitoring() {
        // أخطاء JavaScript
        window.addEventListener('error', (event) => {
            this.recordError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        // أخطاء Promise
        window.addEventListener('unhandledrejection', (event) => {
            this.recordError({
                type: 'promise',
                message: event.reason?.message || event.reason,
                stack: event.reason?.stack
            });
        });

        // أخطاء شبكة
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                if (!response.ok) {
                    this.recordError({
                        type: 'network',
                        url: args[0],
                        status: response.status,
                        statusText: response.statusText
                    });
                }
                return response;
            } catch (error) {
                this.recordError({
                    type: 'network',
                    url: args[0],
                    error: error.message
                });
                throw error;
            }
        };
    }

    // مراقبة تفاعل المستخدم
    setupUserInteractionMonitoring() {
        // مراقبة النقرات
        document.addEventListener('click', (event) => {
            this.recordUserInteraction('click', {
                element: event.target.tagName,
                id: event.target.id,
                className: event.target.className,
                coordinates: { x: event.clientX, y: event.clientY }
            });
        });

        // مراقبة التمرير
        let scrollTimeout;
        document.addEventListener('scroll', () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            
            scrollTimeout = setTimeout(() => {
                this.recordUserInteraction('scroll', {
                    scrollX: window.pageXOffset,
                    scrollY: window.pageYOffset,
                    scrollHeight: document.documentElement.scrollHeight,
                    clientHeight: document.documentElement.clientHeight
                });
            }, 100);
        });

        // مراقبة الكتابة
        let typingTimeout;
        document.addEventListener('keydown', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                if (typingTimeout) clearTimeout(typingTimeout);
                
                typingTimeout = setTimeout(() => {
                    this.recordUserInteraction('typing', {
                        element: event.target.tagName,
                        value: event.target.value,
                        maxLength: event.target.maxLength
                    });
                }, 1000);
            }
        });
    }

    // مراقبة التنقل
    setupNavigationMonitoring() {
        // مراقبة تغيير الصفحة
        window.addEventListener('beforeunload', () => {
            this.metrics.navigation.push({
                type: 'page_unload',
                timestamp: Date.now(),
                url: window.location.href
            });
        });

        // مراقبة إعادة التوجيه
        if ('performance' in window && 'getEntriesByType' in performance) {
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                
                entries.forEach((entry) => {
                    if (entry.entryType === 'navigation' && entry.type === 'navigate') {
                        this.metrics.navigation.push({
                            type: 'page_navigation',
                            timestamp: Date.now(),
                            url: window.location.href,
                            duration: entry.duration,
                            domContentLoaded: entry.domContentLoadedEventEnd,
                            loadComplete: entry.loadEventEnd
                        });
                    }
                });
            }).observe({ entryTypes: ['navigation'] });
        }
    }

    // تسجيل مقياس أداء
    recordMetric(name, value) {
        this.metrics.performance[name] = value;
    }

    // تسجيل خطأ
    recordError(errorData) {
        this.metrics.errors.push({
            ...errorData,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
        });
    }

    // تسجيل تفاعل مستخدم
    recordUserInteraction(type, data) {
        this.metrics.userInteraction.push({
            type,
            data,
            timestamp: Date.now()
        });
    }

    // إرسال البيانات للخادم
    async sendMetrics() {
        if (Math.random() > this.sampleRate) return; // Sampling
        
        try {
            const payload = {
                sessionId: this.sessionId,
                userId: this.userId,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                metrics: this.metrics
            };

            await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error('فشل في إرسال مقاييس الأداء:', error);
        }
    }

    // إعداد إرسال دوري
    setupPeriodicReporting() {
        // إرسال كل دقيقتين
        setInterval(() => {
            this.sendMetrics();
        }, 120000);

        // إرسال قبل إغلاق الصفحة
        window.addEventListener('beforeunload', () => {
            navigator.sendBeacon(this.apiEndpoint, JSON.stringify({
                sessionId: this.sessionId,
                userId: this.userId,
                timestamp: Date.now(),
                url: window.location.href,
                metrics: this.metrics
            }));
        });
    }

    // الحصول على تقرير الأداء
    getPerformanceReport() {
        return {
            sessionId: this.sessionId,
            duration: Date.now() - this.startTime,
            coreWebVitals: this.metrics.performance,
            errorsCount: this.metrics.errors.length,
            userInteractions: this.metrics.userInteraction.length,
            resourceCount: this.metrics.resourceTiming.length,
            performance: this.analyzePerformance()
        };
    }

    // تحليل الأداء
    analyzePerformance() {
        const analysis = {
            score: 100,
            issues: [],
            recommendations: []
        };

        // تحليل Core Web Vitals
        if (this.metrics.performance.firstContentfulPaint > 1800) {
            analysis.score -= 10;
            analysis.issues.push('First Contentful Paint بطيء');
            analysis.recommendations.push('تحسين صور الصفحة وتحميل CSS');
        }

        if (this.metrics.performance.largestContentfulPaint > 2500) {
            analysis.score -= 15;
            analysis.issues.push('Largest Contentful Paint بطيء');
            analysis.recommendations.push('تحسين أكبر عنصر في الصفحة');
        }

        if (this.metrics.performance.cumulativeLayoutShift > 0.1) {
            analysis.score -= 10;
            analysis.issues.push('تغيير تخطيط الصفحة كثيراً');
            analysis.recommendations.push('تحديد أحجام الصور والعناصر مسبقاً');
        }

        if (this.metrics.performance.firstInputDelay > 100) {
            analysis.score -= 10;
            analysis.issues.push('تأخير في أول تفاعل');
            analysis.recommendations.push('تقليل JavaScript على الصفحة');
        }

        // تحليل أخطاء JavaScript
        const jsErrors = this.metrics.errors.filter(e => e.type === 'javascript').length;
        if (jsErrors > 0) {
            analysis.score -= jsErrors * 5;
            analysis.issues.push(`${jsErrors} أخطاء JavaScript`);
            analysis.recommendations.push('مراجعة وإصلاح أخطاء JavaScript');
        }

        // تحليل أخطاء الشبكة
        const networkErrors = this.metrics.errors.filter(e => e.type === 'network').length;
        if (networkErrors > 0) {
            analysis.score -= networkErrors * 3;
            analysis.issues.push(`${networkErrors} أخطاء شبكة`);
            analysis.recommendations.push('فحص اتصال الشبكة وإعدادات CORS');
        }

        return analysis;
    }
}

// إنشاء مثيل مراقبة افتراضي
const performanceMonitor = new FrontendPerformanceMonitor({
    apiEndpoint: '/api/performance',
    sampleRate: 0.1,
    userId: window.currentUser?.id
});

// تصدير للاستخدام في التطبيق
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FrontendPerformanceMonitor, performanceMonitor };
}
```

## نظام التنبيهات

### إعداد التنبيهات في Grafana

```yaml
# alert_rules.yml - قواعد التنبيه في Prometheus

groups:
  - name: application_alerts
    rules:
      # تنبيه ارتفاع معدل الأخطاء
      - alert: HighErrorRate
        expr: (rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])) * 100 > 5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "معدل أخطاء عالي في التطبيق"
          description: "معدل الأخطاء وصل إلى {{ $value }}% في آخر 5 دقائق"
          runbook_url: "https://docs.saler.app/runbooks/high-error-rate"

      # تنبيه بطء الاستجابة
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "زمن استجابة بطيء"
          description: "زمن الاستجابة 95th percentile وصل إلى {{ $value }}s"
          runbook_url: "https://docs.saler.app/runbooks/slow-response"

      # تنبيه نفاد الذاكرة
      - alert: HighMemoryUsage
        expr: (process_memory_usage_bytes{type="heapUsed"} / process_memory_usage_bytes{type="heapTotal"}) * 100 > 80
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "استخدام عالي للذاكرة"
          description: "استخدام الذاكرة وصل إلى {{ $value }}%"
          runbook_url: "https://docs.saler.app/runbooks/high-memory"

      # تنبيه عدم توفر قاعدة البيانات
      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "قاعدة البيانات غير متاحة"
          description: "قاعدة البيانات معطلة لمدة {{ $value }} دقيقة"
          runbook_url: "https://docs.saler.app/runbooks/database-down"

  - name: database_alerts
    rules:
      # تنبيه بطء الاستعلامات
      - alert: SlowQueries
        expr: rate(db_query_duration_seconds_sum[5m]) > 1000
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "استعلامات قاعدة بيانات بطيئة"
          description: "متوسط زمن الاستعلام وصل إلى {{ $value }}ms"

      # تنبيه عدد عالي من الاتصالات
      - alert: HighDatabaseConnections
        expr: db_connections_active > 50
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "عدد عالي من اتصالات قاعدة البيانات"
          description: "عدد الاتصالات النشطة وصل إلى {{ $value }}"

      # تنبيه نسبة منخفضة من cache hits
      - alert: LowCacheHitRatio
        expr: (redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total)) * 100 < 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "نسبة منخفضة من Redis cache hits"
          description: "نسبة cache hits وصلت إلى {{ $value }}%"
```

### إعداد التنبيهات في التطبيق

```python
# alert_manager.py - نظام التنبيهات

import smtplib
import requests
import json
import logging
from typing import Dict, List, Any, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import os

logger = logging.getLogger(__name__)

class AlertManager:
    """مدير التنبيهات"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.alert_history = []
        self.active_alerts = {}
        self.alert_rules = []
        
        # إعداد طرق الإشعار
        self.setup_notification_channels()
    
    def setup_notification_channels(self):
        """إعداد قنوات الإشعار"""
        self.channels = {
            'email': self.send_email_alert,
            'slack': self.send_slack_alert,
            'sms': self.send_sms_alert,
            'webhook': self.send_webhook_alert,
            'pagerduty': self.send_pagerduty_alert
        }
    
    def add_alert_rule(self, rule: Dict[str, Any]):
        """إضافة قاعدة تنبيه"""
        rule['id'] = len(self.alert_rules) + 1
        rule['created_at'] = datetime.utcnow()
        rule['last_check'] = None
        rule['last_triggered'] = None
        self.alert_rules.append(rule)
    
    def check_alert_conditions(self) -> List[Dict[str, Any]]:
        """فحص شروط التنبيه"""
        triggered_alerts = []
        
        for rule in self.alert_rules:
            try:
                # تقييم الشرط
                condition_met = self.evaluate_condition(rule)
                
                # تحديث وقت آخر فحص
                rule['last_check'] = datetime.utcnow()
                
                # التحقق من التنبيه
                if condition_met and not self.is_alert_active(rule['id']):
                    alert = self.create_alert(rule)
                    triggered_alerts.append(alert)
                    self.activate_alert(rule['id'], alert)
                    
                    # إرسال التنبيه
                    self.send_alert(alert)
                    
                elif not condition_met and self.is_alert_active(rule['id']):
                    # إلغاء التنبيه
                    self.deactivate_alert(rule['id'])
                
            except Exception as e:
                logger.error(f"خطأ في فحص قاعدة التنبيه {rule['id']}: {e}")
        
        return triggered_alerts
    
    def evaluate_condition(self, rule: Dict[str, Any]) -> bool:
        """تقييم شرط التنبيه"""
        metric_name = rule['metric']
        operator = rule.get('operator', '>')
        threshold = rule['threshold']
        duration = rule.get('duration', 60)  # ثانية
        
        # جلب قيمة المقياس
        metric_value = self.get_metric_value(metric_name, duration)
        
        if metric_value is None:
            return False
        
        # تطبيق الشرط
        if operator == '>':
            return metric_value > threshold
        elif operator == '<':
            return metric_value < threshold
        elif operator == '>=':
            return metric_value >= threshold
        elif operator == '<=':
            return metric_value <= threshold
        elif operator == '==':
            return metric_value == threshold
        elif operator == '!=':
            return metric_value != threshold
        
        return False
    
    def get_metric_value(self, metric_name: str, duration: int) -> Optional[float]:
        """جلب قيمة مقياس"""
        try:
            # استخدام Prometheus API
            url = f"{self.config['prometheus_url']}/api/v1/query"
            
            # حساب الفترة الزمنية
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(seconds=duration)
            
            params = {
                'query': metric_name,
                'start': start_time.isoformat(),
                'end': end_time.isoformat(),
                'step': f"{duration}s"
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if data['status'] == 'success' and data['data']['result']:
                    # حساب المتوسط
                    values = [float(result['value'][1]) for result in data['data']['result']]
                    return sum(values) / len(values)
            
            return None
            
        except Exception as e:
            logger.error(f"خطأ في جلب قيمة المقياس {metric_name}: {e}")
            return None
    
    def create_alert(self, rule: Dict[str, Any]) -> Dict[str, Any]:
        """إنشاء تنبيه"""
        return {
            'id': f"{rule['id']}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            'rule_id': rule['id'],
            'rule_name': rule['name'],
            'severity': rule.get('severity', 'warning'),
            'message': rule.get('message', 'تم تفعيل التنبيه'),
            'description': rule.get('description', ''),
            'created_at': datetime.utcnow(),
            'metric': rule['metric'],
            'threshold': rule['threshold'],
            'tags': rule.get('tags', []),
            'metadata': rule.get('metadata', {})
        }
    
    def is_alert_active(self, rule_id: int) -> bool:
        """فحص إذا كان التنبيه نشط"""
        return rule_id in self.active_alerts
    
    def activate_alert(self, rule_id: int, alert: Dict[str, Any]):
        """تفعيل تنبيه"""
        self.active_alerts[rule_id] = alert
        alert['status'] = 'firing'
        
        # حفظ في تاريخ التنبيهات
        self.alert_history.append(alert)
        
        logger.info(f"تم تفعيل التنبيه: {alert['rule_name']}")
    
    def deactivate_alert(self, rule_id: int):
        """إلغاء تفعيل تنبيه"""
        if rule_id in self.active_alerts:
            alert = self.active_alerts[rule_id]
            alert['status'] = 'resolved'
            alert['resolved_at'] = datetime.utcnow()
            
            # نقل للتاريخ
            self.alert_history.append(alert)
            
            # حذف من النشطة
            del self.active_alerts[rule_id]
            
            logger.info(f"تم حل التنبيه: {alert['rule_name']}")
    
    def send_alert(self, alert: Dict[str, Any]):
        """إرسال تنبيه عبر جميع القنوات"""
        channels = alert.get('channels', ['email'])
        
        for channel in channels:
            if channel in self.channels:
                try:
                    self.channels[channel](alert)
                except Exception as e:
                    logger.error(f"خطأ في إرسال التنبيه عبر {channel}: {e}")
    
    def send_email_alert(self, alert: Dict[str, Any]):
        """إرسال تنبيه عبر البريد الإلكتروني"""
        if 'email' not in self.config:
            return
        
        email_config = self.config['email']
        
        msg = MIMEMultipart()
        msg['From'] = email_config['from']
        msg['To'] = ', '.join(email_config['to'])
        msg['Subject'] = f"[{alert['severity'].upper()}] {alert['rule_name']}"
        
        # محتوى البريد
        body = f"""
        <html>
        <body>
            <h2 style="color: {'red' if alert['severity'] == 'critical' else 'orange'};">
                تنبيه: {alert['rule_name']}
            </h2>
            
            <p><strong>الخطورة:</strong> {alert['severity']}</p>
            <p><strong>الوقت:</strong> {alert['created_at'].strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
            <p><strong>المقياس:</strong> {alert['metric']}</p>
            <p><strong>الحد:</strong> {alert['threshold']}</p>
            
            <h3>التفاصيل:</h3>
            <p>{alert['description']}</p>
            
            <h3>الرسالة:</h3>
            <p>{alert['message']}</p>
            
            <p>للاطلاع على المزيد من التفاصيل، يرجى زيارة لوحة التحكم.</p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        try:
            server = smtplib.SMTP(email_config['smtp_host'], email_config['smtp_port'])
            server.starttls()
            server.login(email_config['username'], email_config['password'])
            
            text = msg.as_string()
            server.sendmail(email_config['from'], email_config['to'], text)
            server.quit()
            
            logger.info(f"تم إرسال التنبيه عبر البريد الإلكتروني: {alert['rule_name']}")
            
        except Exception as e:
            logger.error(f"خطأ في إرسال البريد الإلكتروني: {e}")
    
    def send_slack_alert(self, alert: Dict[str, Any]):
        """إرسال تنبيه لـ Slack"""
        if 'slack' not in self.config:
            return
        
        slack_config = self.config['slack']
        
        color = 'danger' if alert['severity'] == 'critical' else 'warning'
        
        payload = {
            'channel': slack_config['channel'],
            'username': 'AlertsBot',
            'icon_emoji': ':warning:',
            'attachments': [
                {
                    'color': color,
                    'title': f"تنبيه: {alert['rule_name']}",
                    'fields': [
                        {
                            'title': 'الخطورة',
                            'value': alert['severity'],
                            'short': True
                        },
                        {
                            'title': 'الوقت',
                            'value': alert['created_at'].strftime('%H:%M:%S UTC'),
                            'short': True
                        },
                        {
                            'title': 'المقياس',
                            'value': alert['metric'],
                            'short': True
                        },
                        {
                            'title': 'الحد',
                            'value': str(alert['threshold']),
                            'short': True
                        }
                    ],
                    'text': alert['message'],
                    'footer': 'Saler Monitoring',
                    'ts': int(alert['created_at'].timestamp())
                }
            ]
        }
        
        try:
            response = requests.post(
                slack_config['webhook_url'],
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"تم إرسال التنبيه إلى Slack: {alert['rule_name']}")
            else:
                logger.error(f"فشل إرسال التنبيه إلى Slack: {response.status_code}")
                
        except Exception as e:
            logger.error(f"خطأ في إرسال Slack: {e}")
    
    def send_webhook_alert(self, alert: Dict[str, Any]):
        """إرسال تنبيه عبر webhook"""
        if 'webhook' not in self.config:
            return
        
        webhook_config = self.config['webhook']
        
        payload = {
            'alert': alert,
            'timestamp': datetime.utcnow().isoformat(),
            'source': 'saler-monitoring'
        }
        
        try:
            response = requests.post(
                webhook_config['url'],
                json=payload,
                headers=webhook_config.get('headers', {}),
                timeout=10
            )
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"تم إرسال التنبيه عبر webhook: {alert['rule_name']}")
            else:
                logger.error(f"فشل إرسال التنبيه عبر webhook: {response.status_code}")
                
        except Exception as e:
            logger.error(f"خطأ في إرسال webhook: {e}")
    
    def get_alert_summary(self) -> Dict[str, Any]:
        """الحصول على ملخص التنبيهات"""
        now = datetime.utcnow()
        last_24h = now - timedelta(days=1)
        
        recent_alerts = [a for a in self.alert_history if a['created_at'] > last_24h]
        
        return {
            'active_alerts': len(self.active_alerts),
            'total_alerts_24h': len(recent_alerts),
            'critical_alerts_24h': len([a for a in recent_alerts if a['severity'] == 'critical']),
            'warning_alerts_24h': len([a for a in recent_alerts if a['severity'] == 'warning']),
            'resolved_alerts_24h': len([a for a in recent_alerts if a.get('status') == 'resolved']),
            'most_frequent_rule': self.get_most_frequent_rule(recent_alerts),
            'alert_trend': self.calculate_alert_trend(recent_alerts)
        }
    
    def get_most_frequent_rule(self, alerts: List[Dict[str, Any]]) -> str:
        """الحصول على أكثر قاعدة تنبيه تفعيلاً"""
        if not alerts:
            return "لا توجد تنبيهات"
        
        rule_counts = {}
        for alert in alerts:
            rule_name = alert['rule_name']
            rule_counts[rule_name] = rule_counts.get(rule_name, 0) + 1
        
        return max(rule_counts, key=rule_counts.get)
    
    def calculate_alert_trend(self, alerts: List[Dict[str, Any]]) -> Dict[str, float]:
        """حساب اتجاه التنبيهات"""
        if not alerts:
            return {'trend': 0, 'change_percentage': 0}
        
        # تقسيم التنبيهات حسب الساعة
        hourly_counts = {}
        for alert in alerts:
            hour = alert['created_at'].hour
            hourly_counts[hour] = hourly_counts.get(hour, 0) + 1
        
        # حساب الاتجاه
        hours = sorted(hourly_counts.keys())
        if len(hours) < 2:
            return {'trend': 0, 'change_percentage': 0}
        
        # مقارنة آخر ساعتين
        latest_hour = max(hours)
        previous_hour = max(h for h in hours if h < latest_hour)
        
        latest_count = hourly_counts[latest_hour]
        previous_count = hourly_counts[previous_hour]
        
        trend = latest_count - previous_count
        change_percentage = ((latest_count - previous_count) / previous_count * 100) if previous_count > 0 else 0
        
        return {
            'trend': trend,
            'change_percentage': round(change_percentage, 2)
        }

# إعداد قواعد التنبيه الافتراضية
def setup_default_alert_rules(alert_manager: AlertManager):
    """إعداد قواعد التنبيه الافتراضية"""
    
    rules = [
        {
            'name': 'معدل أخطاء عالي',
            'metric': 'rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100',
            'operator': '>',
            'threshold': 5,
            'duration': 300,
            'severity': 'critical',
            'message': 'معدل أخطاء التطبيق مرتفع',
            'description': 'نسبة طلبات HTTP التي ترجع خطأ 5xx',
            'channels': ['email', 'slack'],
            'tags': ['http', 'errors']
        },
        {
            'name': 'زمن استجابة بطيء',
            'metric': 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
            'operator': '>',
            'threshold': 2,
            'duration': 300,
            'severity': 'warning',
            'message': 'زمن استجابة التطبيق بطيء',
            'description': 'الوقت اللازم لمعالجة 95% من الطلبات',
            'channels': ['email', 'slack'],
            'tags': ['performance', 'response-time']
        },
        {
            'name': 'استخدام عالي للذاكرة',
            'metric': 'process_memory_usage_bytes{type="heapUsed"} / process_memory_usage_bytes{type="heapTotal"} * 100',
            'operator': '>',
            'threshold': 80,
            'duration': 300,
            'severity': 'critical',
            'message': 'استخدام ذاكرة التطبيق مرتفع',
            'description': 'نسبة استخدام ذاكرة heap',
            'channels': ['email', 'slack', 'pagerduty'],
            'tags': ['memory', 'resources']
        },
        {
            'name': 'قاعدة البيانات غير متاحة',
            'metric': 'up{job="postgres"}',
            'operator': '==',
            'threshold': 0,
            'duration': 60,
            'severity': 'critical',
            'message': 'قاعدة البيانات معطلة',
            'description': 'PostgreSQL غير متاح',
            'channels': ['email', 'slack', 'pagerduty'],
            'tags': ['database', 'availability']
        }
    ]
    
    for rule in rules:
        alert_manager.add_alert_rule(rule)

# تشغيل نظام التنبيهات
def start_alert_monitoring():
    """بدء مراقبة التنبيهات"""
    
    config = {
        'prometheus_url': 'http://prometheus:9090',
        'email': {
            'smtp_host': 'smtp.gmail.com',
            'smtp_port': 587,
            'username': os.getenv('SMTP_USERNAME'),
            'password': os.getenv('SMTP_PASSWORD'),
            'from': os.getenv('ALERT_EMAIL_FROM'),
            'to': ['admin@saler.app', 'devops@saler.app']
        },
        'slack': {
            'webhook_url': os.getenv('SLACK_WEBHOOK_URL'),
            'channel': '#alerts'
        },
        'webhook': {
            'url': os.getenv('ALERT_WEBHOOK_URL'),
            'headers': {
                'Authorization': f"Bearer {os.getenv('WEBHOOK_TOKEN')}"
            }
        }
    }
    
    alert_manager = AlertManager(config)
    setup_default_alert_rules(alert_manager)
    
    # فحص دوري للتنبيهات
    while True:
        try:
            triggered_alerts = alert_manager.check_alert_conditions()
            
            if triggered_alerts:
                print(f"تم تفعيل {len(triggered_alerts)} تنبيه")
                
            # انتظار 30 ثانية للفحص التالي
            time.sleep(30)
            
        except Exception as e:
            logger.error(f"خطأ في مراقبة التنبيهات: {e}")
            time.sleep(60)

if __name__ == "__main__":
    start_alert_monitoring()
```

هذا هو جزء من دليل مراقبة الأداء، ويشمل:

1. **إعداد Prometheus و Grafana**: نظام مراقبة شامل
2. **مقاييس الأداء الرئيسية**: مقاييس الخادم وقاعدة البيانات والواجهة الأمامية
3. **مراقبة الأداء في الوقت الفعلي**: مقاييس مباشرة مع تنبيهات
4. **نظام التنبيهات**: نظام شامل لإرسال التنبيهات عبر قنوات متعددة
5. **التحليلات والتقارير**: تحليل شامل لأداء التطبيق

الممارسات المطلوبة:
- مراقبة مستمرة للأداء
- تنبيهات استباقية
- تحليل اتجاهات الأداء
- تحسين مستمر بناءً على البيانات
- توثيق شامل للمقاييس