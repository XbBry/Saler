/**
 * نظام مراقبة أداء Cache
 * Cache Performance Monitoring System
 */

const promClient = require('prom-client');
const Redis = require('ioredis');
const Memcached = require('memcached');
const winston = require('winston');
const EventEmitter = require('events');

class CachePerformanceMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      redisConfigs: config.redisConfigs || [],
      memcachedConfigs: config.memcachedConfigs || [],
      monitoringInterval: config.monitoringInterval || 30000,
      alertThresholds: {
        hitRate: config.alertThresholds?.hitRate || 80,
        responseTime: config.alertThresholds?.responseTime || 100,
        memoryUsage: config.alertThresholds?.memoryUsage || 85,
        connectionErrors: config.alertThresholds?.connectionErrors || 5
      },
      enableDetailedLogging: config.enableDetailedLogging || false,
      ...config
    };
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'cache-performance.log' }),
        new winston.transports.Console()
      ]
    });
    
    // إعداد Prometheus Metrics
    this.setupPrometheusMetrics();
    
    // إعدادات الـ caches
    this.redisClients = new Map();
    this.memcachedClients = new Map();
    
    // تخزين المقاييس
    this.metrics = {
      redis: new Map(),
      memcached: new Map(),
      overall: {
        totalHits: 0,
        totalMisses: 0,
        totalErrors: 0,
        totalOperations: 0
      }
    };
    
    this.startTime = Date.now();
    
    this.initializeClients();
  }
  
  /**
   * إعداد مقاييس Prometheus
   */
  setupPrometheusMetrics() {
    // معدل命中率 Cache
    this.cacheHitRate = new promClient.Gauge({
      name: 'cache_hit_rate_percent',
      help: 'Cache hit rate percentage',
      labelNames: ['cache_type', 'instance']
    });
    
    // زمن استجابة Cache
    this.cacheResponseTime = new promClient.Histogram({
      name: 'cache_response_time_seconds',
      help: 'Cache response time in seconds',
      labelNames: ['cache_type', 'operation', 'instance'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
    });
    
    // عدد عمليات Cache
    this.cacheOperations = new promClient.Counter({
      name: 'cache_operations_total',
      help: 'Total number of cache operations',
      labelNames: ['cache_type', 'operation', 'status', 'instance']
    });
    
    // استخدام الذاكرة
    this.cacheMemoryUsage = new promClient.Gauge({
      name: 'cache_memory_usage_bytes',
      help: 'Cache memory usage in bytes',
      labelNames: ['cache_type', 'instance']
    });
    
    // عدد الاتصالات النشطة
    this.cacheConnections = new promClient.Gauge({
      name: 'cache_connections_active',
      help: 'Number of active cache connections',
      labelNames: ['cache_type', 'instance']
    });
    
    // معدل أخطاء Cache
    this.cacheErrorRate = new promClient.Gauge({
      name: 'cache_error_rate_percent',
      help: 'Cache error rate percentage',
      labelNames: ['cache_type', 'instance']
    });
  }
  
  /**
   * تهيئة عملاء Cache
   */
  initializeClients() {
    // تهيئة Redis clients
    for (const config of this.config.redisConfigs) {
      try {
        const client = new Redis({
          host: config.host,
          port: config.port,
          password: config.password,
          db: config.db || 0,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true
        });
        
        client.on('error', (err) => {
          this.logger.error('Redis connection error', { 
            host: config.host, 
            port: config.port, 
            error: err.message 
          });
        });
        
        client.on('connect', () => {
          this.logger.info('Redis connected', { host: config.host, port: config.port });
        });
        
        this.redisClients.set(config.name || `${config.host}:${config.port}`, client);
        
        // تهيئة مقاييس Redis
        this.metrics.redis.set(config.name || `${config.host}:${config.port}`, {
          hits: 0,
          misses: 0,
          errors: 0,
          responseTimes: [],
          memoryUsage: 0,
          connections: 0,
          lastUpdate: Date.now()
        });
        
      } catch (error) {
        this.logger.error('Failed to initialize Redis client', { 
          config, 
          error: error.message 
        });
      }
    }
    
    // تهيئة Memcached clients
    for (const config of this.config.memcachedConfigs) {
      try {
        const client = new Memcached(`${config.host}:${config.port}`, {
          retries: 3,
          retry: 1000,
          remove: true,
          failOverServers: config.servers || []
        });
        
        client.on('error', (err) => {
          this.logger.error('Memcached connection error', { 
            host: config.host, 
            port: config.port, 
            error: err.message 
          });
        });
        
        this.memcachedClients.set(config.name || `${config.host}:${config.port}`, client);
        
        // تهيئة مقاييس Memcached
        this.metrics.memcached.set(config.name || `${config.host}:${config.port}`, {
          hits: 0,
          misses: 0,
          errors: 0,
          responseTimes: [],
          memoryUsage: 0,
          connections: 0,
          lastUpdate: Date.now()
        });
        
      } catch (error) {
        this.logger.error('Failed to initialize Memcached client', { 
          config, 
          error: error.message 
        });
      }
    }
  }
  
  /**
   * تنفيذ عملية Get مع مراقبة الأداء
   */
  async get(cacheName, key, cacheType = 'redis') {
    const startTime = Date.now();
    let success = false;
    let error = null;
    let value = null;
    
    try {
      if (cacheType === 'redis') {
        value = await this.redisGet(cacheName, key);
      } else {
        value = await this.memcachedGet(cacheName, key);
      }
      
      success = true;
      
      // تسجيل hit/miss
      if (value !== null) {
        this.recordHit(cacheName, cacheType);
      } else {
        this.recordMiss(cacheName, cacheType);
      }
      
    } catch (err) {
      error = err;
      this.recordError(cacheName, cacheType);
      
      this.logger.warn('Cache get operation failed', {
        cacheName,
        cacheType,
        key,
        error: err.message
      });
    }
    
    // تسجيل المقاييس
    const duration = (Date.now() - startTime) / 1000;
    this.recordOperation(cacheName, cacheType, 'get', success, duration);
    
    return value;
  }
  
  /**
   * تنفيذ عملية Set مع مراقبة الأداء
   */
  async set(cacheName, key, value, ttl = null, cacheType = 'redis') {
    const startTime = Date.now();
    let success = false;
    let error = null;
    
    try {
      if (cacheType === 'redis') {
        await this.redisSet(cacheName, key, value, ttl);
      } else {
        await this.memcachedSet(cacheName, key, value, ttl);
      }
      
      success = true;
      
    } catch (err) {
      error = err;
      this.recordError(cacheName, cacheType);
      
      this.logger.warn('Cache set operation failed', {
        cacheName,
        cacheType,
        key,
        error: err.message
      });
    }
    
    // تسجيل المقاييس
    const duration = (Date.now() - startTime) / 1000;
    this.recordOperation(cacheName, cacheType, 'set', success, duration);
    
    return success;
  }
  
  /**
   * تنفيذ عملية Redis Get
   */
  async redisGet(cacheName, key) {
    const client = this.redisClients.get(cacheName);
    if (!client) {
      throw new Error(`Redis client not found: ${cacheName}`);
    }
    
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  /**
   * تنفيذ عملية Redis Set
   */
  async redisSet(cacheName, key, value, ttl) {
    const client = this.redisClients.get(cacheName);
    if (!client) {
      throw new Error(`Redis client not found: ${cacheName}`);
    }
    
    const serialized = JSON.stringify(value);
    
    if (ttl) {
      await client.setex(key, ttl, serialized);
    } else {
      await client.set(key, serialized);
    }
  }
  
  /**
   * تنفيذ عملية Memcached Get
   */
  async memcachedGet(cacheName, key) {
    const client = this.memcachedClients.get(cacheName);
    if (!client) {
      throw new Error(`Memcached client not found: ${cacheName}`);
    }
    
    return new Promise((resolve, reject) => {
      client.get(key, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data ? JSON.parse(data) : null);
        }
      });
    });
  }
  
  /**
   * تنفيذ عملية Memcached Set
   */
  async memcachedSet(cacheName, key, value, ttl) {
    const client = this.memcachedClients.get(cacheName);
    if (!client) {
      throw new Error(`Memcached client not found: ${cacheName}`);
    }
    
    const serialized = JSON.stringify(value);
    const lifetime = ttl || 0;
    
    return new Promise((resolve, reject) => {
      client.set(key, serialized, lifetime, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }
  
  /**
   * تسجيل Cache Hit
   */
  recordHit(cacheName, cacheType) {
    const metrics = this.getMetrics(cacheName, cacheType);
    metrics.hits++;
    this.metrics.overall.totalHits++;
    
    if (this.config.enableDetailedLogging) {
      this.logger.debug('Cache hit recorded', { cacheName, cacheType });
    }
  }
  
  /**
   * تسجيل Cache Miss
   */
  recordMiss(cacheName, cacheType) {
    const metrics = this.getMetrics(cacheName, cacheType);
    metrics.misses++;
    this.metrics.overall.totalMisses++;
    
    if (this.config.enableDetailedLogging) {
      this.logger.debug('Cache miss recorded', { cacheName, cacheType });
    }
  }
  
  /**
   * تسجيل Cache Error
   */
  recordError(cacheName, cacheType) {
    const metrics = this.getMetrics(cacheName, cacheType);
    metrics.errors++;
    this.metrics.overall.totalErrors++;
  }
  
  /**
   * تسجيل عملية Cache
   */
  recordOperation(cacheName, cacheType, operation, success, duration) {
    const metrics = this.getMetrics(cacheName, cacheType);
    
    // تسجيل Prometheus metrics
    this.cacheResponseTime.observe(
      { cache_type: cacheType, operation, instance: cacheName },
      duration
    );
    
    this.cacheOperations.inc({
      cache_type: cacheType,
      operation,
      status: success ? 'success' : 'error',
      instance: cacheName
    });
    
    // تحديث أوقات الاستجابة
    metrics.responseTimes.push(duration);
    
    // الاحتفاظ بآخر 1000 قياس فقط
    if (metrics.responseTimes.length > 1000) {
      metrics.responseTimes.shift();
    }
    
    metrics.lastUpdate = Date.now();
    this.metrics.overall.totalOperations++;
    
    // فحص التنبيهات
    this.checkAlerts(cacheName, cacheType, duration, success);
  }
  
  /**
   * الحصول على المقاييس لـ cache معين
   */
  getMetrics(cacheName, cacheType) {
    const metricsMap = cacheType === 'redis' ? this.metrics.redis : this.metrics.memcached;
    
    if (!metricsMap.has(cacheName)) {
      throw new Error(`Cache metrics not found: ${cacheName} (${cacheType})`);
    }
    
    return metricsMap.get(cacheName);
  }
  
  /**
   * فحص التنبيهات
   */
  checkAlerts(cacheName, cacheType, duration, success) {
    const alerts = [];
    
    try {
      const metrics = this.getMetrics(cacheName, cacheType);
      const total = metrics.hits + metrics.misses;
      
      if (total > 0) {
        const hitRate = (metrics.hits / total) * 100;
        
        // تنبيه معدل命中率 منخفض
        if (hitRate < this.config.alertThresholds.hitRate) {
          alerts.push({
            type: 'LOW_HIT_RATE',
            cacheName,
            cacheType,
            hitRate,
            threshold: this.config.alertThresholds.hitRate,
            severity: 'warning'
          });
        }
      }
      
      // تنبيه زمن استجابة مرتفع
      if (duration > this.config.alertThresholds.responseTime / 1000) {
        alerts.push({
          type: 'HIGH_RESPONSE_TIME',
          cacheName,
          cacheType,
          duration,
          threshold: this.config.alertThresholds.responseTime,
          severity: 'warning'
        });
      }
      
      // تنبيه معدل أخطاء مرتفع
      const errorRate = (metrics.errors / this.metrics.overall.totalOperations) * 100;
      if (errorRate > this.config.alertThresholds.connectionErrors) {
        alerts.push({
          type: 'HIGH_ERROR_RATE',
          cacheName,
          cacheType,
          errorRate,
          threshold: this.config.alertThresholds.connectionErrors,
          severity: 'critical'
        });
      }
      
      // إرسال التنبيهات
      if (alerts.length > 0) {
        this.emit('alerts', alerts);
        
        for (const alert of alerts) {
          this.logger.warn('Cache performance alert', alert);
        }
      }
      
    } catch (error) {
      this.logger.error('Error checking alerts', { error: error.message, cacheName, cacheType });
    }
  }
  
  /**
   * جمع إحصائيات Redis
   */
  async collectRedisStats() {
    for (const [cacheName, client] of this.redisClients.entries()) {
      try {
        const info = await client.info();
        const stats = this.parseRedisInfo(info);
        
        const metrics = this.metrics.redis.get(cacheName);
        if (metrics) {
          metrics.memoryUsage = stats.used_memory || 0;
          metrics.connections = stats.connected_clients || 0;
          
          // تسجيل Prometheus metrics
          this.cacheMemoryUsage.set(
            { cache_type: 'redis', instance: cacheName },
            metrics.memoryUsage
          );
          
          this.cacheConnections.set(
            { cache_type: 'redis', instance: cacheName },
            metrics.connections
          );
        }
        
      } catch (error) {
        this.logger.error('Failed to collect Redis stats', { cacheName, error: error.message });
      }
    }
  }
  
  /**
   * جمع إحصائيات Memcached
   */
  async collectMemcachedStats() {
    for (const [cacheName, client] of this.memcachedClients.entries()) {
      try {
        const stats = await new Promise((resolve, reject) => {
          client.stats((err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
        
        const metrics = this.metrics.memcached.get(cacheName);
        if (metrics) {
          metrics.memoryUsage = stats.bytes || 0;
          metrics.connections = stats.curr_connections || 0;
          
          // تسجيل Prometheus metrics
          this.cacheMemoryUsage.set(
            { cache_type: 'memcached', instance: cacheName },
            metrics.memoryUsage
          );
          
          this.cacheConnections.set(
            { cache_type: 'memcached', instance: cacheName },
            metrics.connections
          );
        }
        
      } catch (error) {
        this.logger.error('Failed to collect Memcached stats', { cacheName, error: error.message });
      }
    }
  }
  
  /**
   * تحليل Redis info response
   */
  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const stats = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key] = parseFloat(value) || value;
      }
    }
    
    return stats;
  }
  
  /**
   * حساب معدل命中率
   */
  calculateHitRate(cacheName, cacheType) {
    const metrics = this.getMetrics(cacheName, cacheType);
    const total = metrics.hits + metrics.misses;
    
    if (total === 0) return 0;
    
    const hitRate = (metrics.hits / total) * 100;
    
    // تسجيل Prometheus metric
    this.cacheHitRate.set(
      { cache_type: cacheType, instance: cacheName },
      hitRate
    );
    
    return hitRate;
  }
  
  /**
   * حساب متوسط زمن الاستجابة
   */
  calculateAverageResponseTime(cacheName, cacheType) {
    const metrics = this.getMetrics(cacheName, cacheType);
    
    if (metrics.responseTimes.length === 0) return 0;
    
    const sum = metrics.responseTimes.reduce((total, time) => total + time, 0);
    return sum / metrics.responseTimes.length;
  }
  
  /**
   * حساب معدل الأخطاء
   */
  calculateErrorRate(cacheName, cacheType) {
    const metrics = this.getMetrics(cacheName, cacheType);
    
    if (this.metrics.overall.totalOperations === 0) return 0;
    
    const errorRate = (metrics.errors / this.metrics.overall.totalOperations) * 100;
    
    // تسجيل Prometheus metric
    this.cacheErrorRate.set(
      { cache_type: cacheType, instance: cacheName },
      errorRate
    );
    
    return errorRate;
  }
  
  /**
   * الحصول على تقرير أداء شامل
   */
  getPerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
      overall: {
        ...this.metrics.overall,
        hit_rate_percent: this.metrics.overall.totalHits + this.metrics.overall.totalMisses > 0 
          ? (this.metrics.overall.totalHits / (this.metrics.overall.totalHits + this.metrics.overall.totalMisses)) * 100 
          : 0,
        error_rate_percent: this.metrics.overall.totalOperations > 0 
          ? (this.metrics.overall.totalErrors / this.metrics.overall.totalOperations) * 100 
          : 0
      },
      redis: {},
      memcached: {}
    };
    
    // إحصائيات Redis
    for (const [cacheName, metrics] of this.metrics.redis.entries()) {
      report.redis[cacheName] = {
        hits: metrics.hits,
        misses: metrics.misses,
        errors: metrics.errors,
        hit_rate_percent: this.calculateHitRate(cacheName, 'redis'),
        avg_response_time_seconds: this.calculateAverageResponseTime(cacheName, 'redis'),
        error_rate_percent: this.calculateErrorRate(cacheName, 'redis'),
        memory_usage_bytes: metrics.memoryUsage,
        active_connections: metrics.connections,
        last_update: new Date(metrics.lastUpdate).toISOString()
      };
    }
    
    // إحصائيات Memcached
    for (const [cacheName, metrics] of this.metrics.memcached.entries()) {
      report.memcached[cacheName] = {
        hits: metrics.hits,
        misses: metrics.misses,
        errors: metrics.errors,
        hit_rate_percent: this.calculateHitRate(cacheName, 'memcached'),
        avg_response_time_seconds: this.calculateAverageResponseTime(cacheName, 'memcached'),
        error_rate_percent: this.calculateErrorRate(cacheName, 'memcached'),
        memory_usage_bytes: metrics.memoryUsage,
        active_connections: metrics.connections,
        last_update: new Date(metrics.lastUpdate).toISOString()
      };
    }
    
    return report;
  }
  
  /**
   * بدء المراقبة المستمرة
   */
  startMonitoring() {
    // جمع إحصائيات دورية
    this.monitoringInterval = setInterval(async () => {
      try {
        await Promise.all([
          this.collectRedisStats(),
          this.collectMemcachedStats()
        ]);
        
        // تحديث تقرير الأداء
        this.emit('performanceUpdate', this.getPerformanceReport());
        
      } catch (error) {
        this.logger.error('Error in monitoring interval', { error: error.message });
      }
    }, this.config.monitoringInterval);
    
    this.logger.info('Cache performance monitoring started', {
      redisClients: this.redisClients.size,
      memcachedClients: this.memcachedClients.size,
      interval: this.config.monitoringInterval
    });
  }
  
  /**
   * إيقاف المراقبة
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // إغلاق اتصالات Redis
    for (const client of this.redisClients.values()) {
      client.disconnect();
    }
    
    // إغلاق اتصالات Memcached
    for (const client of this.memcachedClients.values()) {
      client.end();
    }
    
    this.logger.info('Cache performance monitoring stopped');
  }
  
  /**
   * تصدير Prometheus metrics
   */
  getPrometheusMetrics() {
    return promClient.register.metrics();
  }
}

// تصدير الكلاس
module.exports = CachePerformanceMonitor;

// مثال على الاستخدام
if (require.main === module) {
  const monitor = new CachePerformanceMonitor({
    redisConfigs: [
      {
        name: 'primary-redis',
        host: 'localhost',
        port: 6379,
        password: null,
        db: 0
      }
    ],
    memcachedConfigs: [
      {
        name: 'primary-memcached',
        host: 'localhost',
        port: 11211
      }
    ],
    monitoringInterval: 30000,
    alertThresholds: {
      hitRate: 85,
      responseTime: 50,
      memoryUsage: 80,
      connectionErrors: 3
    },
    enableDetailedLogging: true
  });
  
  // تسجيل مستمعي الأحداث
  monitor.on('alerts', (alerts) => {
    console.log('Cache alerts:', alerts);
  });
  
  monitor.on('performanceUpdate', (report) => {
    console.log('Performance update:', JSON.stringify(report, null, 2));
  });
  
  // بدء المراقبة
  monitor.startMonitoring();
  
  // اختبار العمليات
  setTimeout(async () => {
    await monitor.set('primary-redis', 'test-key', { message: 'Hello Cache' }, 60, 'redis');
    const value = await monitor.get('primary-redis', 'test-key', 'redis');
    console.log('Retrieved value:', value);
  }, 2000);
  
  // الحصول على تقرير
  setTimeout(() => {
    const report = monitor.getPerformanceReport();
    console.log('Performance report:', JSON.stringify(report, null, 2));
  }, 5000);
  
  // إيقاف نظيفة
  setTimeout(() => {
    monitor.stopMonitoring();
    process.exit(0);
  }, 10000);
}