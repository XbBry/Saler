/**
 * نظام تتبع أوقات الاستجابة
 * Response Time Tracking System
 */

const promClient = require('prom-client');
const axios = require('axios');
const winston = require('winston');

// إعداد Prometheus Metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const responseTimePercentiles = new promClient.Gauge({
  name: 'response_time_percentiles',
  help: 'Response time percentiles',
  labelNames: ['percentile', 'route']
});

class ResponseTimeTracker {
  constructor(config = {}) {
    this.config = {
      endpoints: config.endpoints || [],
      samplingRate: config.samplingRate || 0.1,
      timeout: config.timeout || 30000,
      alertingThreshold: config.alertingThreshold || 5000,
      trendAnalysis: config.trendAnalysis || true,
      ...config
    };
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'response-time.log' }),
        new winston.transports.Console()
      ]
    });
    
    this.metrics = {
      responseTimes: new Map(),
      baselines: new Map(),
      trends: new Map(),
      alerts: []
    };
    
    this.startCollection();
  }
  
  /**
   * تتبع طلب HTTP
   */
  async trackRequest(method, url, startTime, endTime, statusCode, route) {
    const duration = (endTime - startTime) / 1000; // تحويل إلى ثواني
    
    // تسجيل Metric
    httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      duration
    );
    
    httpRequestTotal.inc({
      method,
      route,
      status_code: statusCode
    });
    
    // تحديث الإحصائيات
    this.updateResponseTimeStats(route, duration);
    
    // فحص التنبيهات
    await this.checkAlertThresholds(route, duration);
    
    // تسجيل في الـ log
    this.logger.info('HTTP Request tracked', {
      method,
      url,
      route,
      duration,
      statusCode,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * تحديث إحصائيات أوقات الاستجابة
   */
  updateResponseTimeStats(route, duration) {
    if (!this.metrics.responseTimes.has(route)) {
      this.metrics.responseTimes.set(route, []);
    }
    
    const times = this.metrics.responseTimes.get(route);
    times.push({
      duration,
      timestamp: Date.now()
    });
    
    // الاحتفاظ بآخر 1000 قياس فقط
    if (times.length > 1000) {
      times.shift();
    }
    
    // حساب الـ percentiles
    this.calculatePercentiles(route);
    
    // تحديث baseline إذا لزم الأمر
    this.updateBaseline(route);
  }
  
  /**
   * حساب الـ percentiles
   */
  calculatePercentiles(route) {
    const times = this.metrics.responseTimes.get(route);
    if (!times || times.length < 10) return;
    
    const durations = times.map(t => t.duration).sort((a, b) => a - b);
    const p50 = this.getPercentile(durations, 50);
    const p90 = this.getPercentile(durations, 90);
    const p95 = this.getPercentile(durations, 95);
    const p99 = this.getPercentile(durations, 99);
    
    responseTimePercentiles.set({ percentile: 'p50', route }, p50);
    responseTimePercentiles.set({ percentile: 'p90', route }, p90);
    responseTimePercentiles.set({ percentile: 'p95', route }, p95);
    responseTimePercentiles.set({ percentile: 'p99', route }, p99);
  }
  
  /**
   * حساب percentile معين
   */
  getPercentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }
  
  /**
   * تحديث baseline للاستجابة
   */
  updateBaseline(route) {
    const times = this.metrics.responseTimes.get(route);
    if (!times || times.length < 100) return;
    
    // أخذ آخر 100 قياس
    const recent = times.slice(-100).map(t => t.duration);
    const avg = recent.reduce((sum, d) => sum + d, 0) / recent.length;
    const variance = recent.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / recent.length;
    const stdDev = Math.sqrt(variance);
    
    this.metrics.baselines.set(route, {
      average: avg,
      stdDev,
      upperBound: avg + (2 * stdDev),
      lowerBound: Math.max(0, avg - (2 * stdDev)),
      lastUpdated: Date.now()
    });
  }
  
  /**
   * فحص عتبات التنبيه
   */
  async checkAlertThresholds(route, duration) {
    const baseline = this.metrics.baselines.get(route);
    if (!baseline) return;
    
    const alerts = [];
    
    // تنبيه زمن الاستجابة المرتفع
    if (duration > this.config.alertingThreshold / 1000) {
      alerts.push({
        type: 'HIGH_RESPONSE_TIME',
        route,
        duration,
        threshold: this.config.alertingThreshold,
        severity: 'warning',
        timestamp: Date.now()
      });
    }
    
    // تنبيه انحراف كبير عن baseline
    if (duration > baseline.upperBound * 1.5) {
      alerts.push({
        type: 'ANOMALY_DETECTED',
        route,
        duration,
        baseline: baseline.average,
        severity: 'critical',
        timestamp: Date.now()
      });
    }
    
    // تسجيل التنبيهات
    if (alerts.length > 0) {
      this.metrics.alerts.push(...alerts);
      await this.sendAlerts(alerts);
    }
  }
  
  /**
   * إرسال التنبيهات
   */
  async sendAlerts(alerts) {
    for (const alert of alerts) {
      this.logger.warn('Response time alert', alert);
      
      try {
        // إرسال إلى webhook إذا كان موجود
        if (this.config.webhookUrl) {
          await axios.post(this.config.webhookUrl, {
            alert_type: alert.type,
            severity: alert.severity,
            route: alert.route,
            current_duration: alert.duration,
            timestamp: new Date(alert.timestamp).toISOString()
          }, {
            timeout: 5000
          });
        }
      } catch (error) {
        this.logger.error('Failed to send alert', { error: error.message, alert });
      }
    }
  }
  
  /**
   * قياس زمن استجابة endpoint معين
   */
  async measureEndpoint(endpoint) {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(endpoint.url, {
        timeout: this.config.timeout
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // تتبع الطلب
      await this.trackRequest(
        'GET',
        endpoint.url,
        startTime,
        endTime,
        response.status,
        endpoint.name || endpoint.url
      );
      
      return {
        success: true,
        duration,
        statusCode: response.status,
        endpoint: endpoint.url
      };
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // تتبع الطلب الفاشل
      await this.trackRequest(
        'GET',
        endpoint.url,
        startTime,
        endTime,
        error.response?.status || 0,
        endpoint.name || endpoint.url
      );
      
      return {
        success: false,
        duration,
        error: error.message,
        endpoint: endpoint.url
      };
    }
  }
  
  /**
   * جمع قياس جميع الـ endpoints
   */
  async measureAllEndpoints() {
    const results = [];
    
    for (const endpoint of this.config.endpoints) {
      // تطبيق sampling rate
      if (Math.random() > this.config.samplingRate) {
        continue;
      }
      
      const result = await this.measureEndpoint(endpoint);
      results.push(result);
      
      // إضافة تأخير بين القياسات
      if (this.config.measurementDelay) {
        await new Promise(resolve => setTimeout(resolve, this.config.measurementDelay));
      }
    }
    
    return results;
  }
  
  /**
   * تحليل الاتجاهات
   */
  analyzeTrends() {
    const trends = [];
    
    for (const [route, times] of this.metrics.responseTimes.entries()) {
      if (times.length < 50) continue;
      
      // أخذ آخر 20 قياس ومقارنتها بالـ 20 السابقة
      const recent = times.slice(-20).map(t => t.duration);
      const previous = times.slice(-40, -20).map(t => t.duration);
      
      const recentAvg = recent.reduce((sum, d) => sum + d, 0) / recent.length;
      const previousAvg = previous.reduce((sum, d) => sum + d, 0) / previous.length;
      
      const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;
      
      trends.push({
        route,
        recentAverage: recentAvg,
        previousAverage: previousAvg,
        changePercent,
        trend: changePercent > 10 ? 'increasing' : changePercent < -10 ? 'decreasing' : 'stable',
        timestamp: Date.now()
      });
    }
    
    this.metrics.trends.set('lastAnalysis', trends);
    return trends;
  }
  
  /**
   * الحصول على إحصائيات شاملة
   */
  getStatistics() {
    const stats = {
      routes: {},
      trends: this.metrics.trends.get('lastAnalysis') || [],
      alerts: this.metrics.alerts.slice(-10), // آخر 10 تنبيهات
      baseline: {}
    };
    
    for (const [route, times] of this.metrics.responseTimes.entries()) {
      if (times.length === 0) continue;
      
      const durations = times.map(t => t.duration);
      stats.routes[route] = {
        totalMeasurements: times.length,
        average: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        p50: this.getPercentile([...durations].sort((a, b) => a - b), 50),
        p90: this.getPercentile([...durations].sort((a, b) => a - b), 90),
        p95: this.getPercentile([...durations].sort((a, b) => a - b), 95),
        p99: this.getPercentile([...durations].sort((a, b) => a - b), 99),
        lastUpdated: times[times.length - 1].timestamp
      };
    }
    
    for (const [route, baseline] of this.metrics.baselines.entries()) {
      stats.baseline[route] = baseline;
    }
    
    return stats;
  }
  
  /**
   * بدء جمع البيانات
   */
  startCollection() {
    // جمع دوري للـ endpoints
    if (this.config.endpoints.length > 0) {
      setInterval(async () => {
        try {
          await this.measureAllEndpoints();
          
          if (this.config.trendAnalysis) {
            this.analyzeTrends();
          }
        } catch (error) {
          this.logger.error('Error in response time collection', { error: error.message });
        }
      }, this.config.collectionInterval || 60000);
    }
    
    this.logger.info('Response time tracking started', {
      endpoints: this.config.endpoints.length,
      samplingRate: this.config.samplingRate
    });
  }
  
  /**
   * تصدير Prometheus metrics
   */
  getPrometheusMetrics() {
    return promClient.register.metrics();
  }
  
  /**
   * إيقاف النظام
   */
  async shutdown() {
    this.logger.info('Response time tracker shutting down');
    
    // حفظ البيانات إذا لزم الأمر
    if (this.config.persistData) {
      const stats = this.getStatistics();
      // حفظ في قاعدة البيانات أو ملف
    }
  }
}

// تصدير الكلاس
module.exports = ResponseTimeTracker;

// مثال على الاستخدام
if (require.main === module) {
  const tracker = new ResponseTimeTracker({
    endpoints: [
      { url: 'http://localhost:3000/api/health', name: 'health' },
      { url: 'http://localhost:3000/api/users', name: 'users' },
      { url: 'http://localhost:3000/api/products', name: 'products' }
    ],
    samplingRate: 0.5,
    alertingThreshold: 3000,
    collectionInterval: 30000,
    webhookUrl: process.env.ALERT_WEBHOOK_URL
  });
  
  // مثال على تتبع طلب يدوي
  const startTime = Date.now();
  // ... معالجة الطلب ...
  const endTime = Date.now();
  
  tracker.trackRequest('GET', '/api/test', startTime, endTime, 200, 'test-route');
  
  // الحصول على الإحصائيات
  setTimeout(() => {
    const stats = tracker.getStatistics();
    console.log(JSON.stringify(stats, null, 2));
  }, 10000);
}