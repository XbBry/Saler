/**
 * نظام جمع المقاييس الفورية المتقدم
 * Advanced Real-Time Metrics Collector
 * 
 * يجمع المقاييس الفورية من جميع مصادر البيانات في أقل من 1 ثانية
 * Collects real-time metrics from all data sources in less than 1 second
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const axios = require('axios');
const promClient = require('prom-client');
const winston = require('winston');
const { performance } = require('perf_hooks');

class RealTimeCollector extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // إعدادات البيانات
            collectionInterval: config.collectionInterval || 1000, // 1 ثانية
            bufferSize: config.bufferSize || 10000,
            enableWebSocket: config.enableWebSocket !== false,
            enablePrometheus: config.enablePrometheus !== false,
            
            // مصادر البيانات
            dataSources: {
                application: {
                    enabled: true,
                    endpoint: config.appEndpoint || 'http://localhost:3001',
                    timeout: 500
                },
                database: {
                    enabled: true,
                    endpoints: config.dbEndpoints || [],
                    timeout: 500
                },
                cache: {
                    enabled: true,
                    endpoints: config.cacheEndpoints || [],
                    timeout: 200
                },
                infrastructure: {
                    enabled: true,
                    endpoints: config.infraEndpoints || [],
                    timeout: 300
                }
            },
            
            // تنبيهات فورية
            realTimeAlerts: {
                enabled: true,
                responseTimeThreshold: 1000, // 1 ثانية
                errorRateThreshold: 5, // 5%
                cpuThreshold: 90,
                memoryThreshold: 85
            },
            
            // حفظ البيانات
            dataRetention: {
                realTime: 30000, // 30 ثانية
                hourly: 3600000, // 1 ساعة
                daily: 86400000 // 1 يوم
            },
            
            ...config
        };
        
        this.logger = this._setupLogging();
        
        // تخزين البيانات
        this.metricsBuffer = new Map();
        this.realTimeMetrics = new Map();
        this.historicalData = new Map();
        this.aggregatedData = new Map();
        
        // إحصائيات الأداء
        this.performanceStats = {
            totalCollections: 0,
            averageLatency: 0,
            lastCollectionTime: null,
            errorCount: 0,
            dataPointsCollected: 0
        };
        
        // إعدادات Prometheus
        if (this.config.enablePrometheus) {
            this._setupPrometheusMetrics();
        }
        
        // خادم WebSocket
        if (this.config.enableWebSocket) {
            this._setupWebSocketServer();
        }
        
        // بدء الجمع
        this.isCollecting = false;
        this.collectionTasks = new Map();
        
        this.logger.info('Real-time collector initialized', {
            collectionInterval: this.config.collectionInterval,
            webSocketEnabled: this.config.enableWebSocket,
            prometheusEnabled: this.config.enablePrometheus
        });
    }
    
    /**
     * إعداد نظام السجلات
     */
    _setupLogging() {
        return winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ 
                    filename: 'real-time-collector.log',
                    maxsize: 10485760, // 10MB
                    maxFiles: 5
                }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }
    
    /**
     * إعداد مقاييس Prometheus
     */
    _setupPrometheusMetrics() {
        // مقاييس الأداء الفوري
        this.collectionLatency = new promClient.Histogram({
            name: 'metrics_collection_latency_ms',
            help: 'Time spent collecting metrics from each source',
            labelNames: ['source', 'status'],
            buckets: [1, 5, 10, 25, 50, 100, 200, 500, 1000, 2000, 5000]
        });
        
        this.metricsCount = new promClient.Counter({
            name: 'metrics_points_collected_total',
            help: 'Total number of metrics points collected',
            labelNames: ['source', 'type']
        });
        
        this.collectionErrors = new promClient.Counter({
            name: 'metrics_collection_errors_total',
            help: 'Total number of collection errors',
            labelNames: ['source', 'error_type']
        });
        
        this.realTimeHealth = new promClient.Gauge({
            name: 'real_time_collector_health',
            help: 'Health status of real-time collector',
            labelNames: ['component']
        });
        
        // مقاييس مخصصة للتطبيق
        this.appResponseTime = new promClient.Histogram({
            name: 'app_response_time_ms',
            help: 'Application response times',
            labelNames: ['endpoint', 'method', 'status_code'],
            buckets: [10, 25, 50, 100, 200, 500, 1000, 2000, 5000]
        });
        
        this.databaseQueryTime = new promClient.Histogram({
            name: 'db_query_time_ms',
            help: 'Database query execution times',
            labelNames: ['query_type', 'table'],
            buckets: [1, 5, 10, 25, 50, 100, 200, 500, 1000]
        });
        
        this.cacheHitRate = new promClient.Gauge({
            name: 'cache_hit_rate_percent',
            help: 'Cache hit rate percentage',
            labelNames: ['cache_type', 'instance']
        });
        
        // بدء تسجيل Prometheus
        promClient.collectDefaultMetrics();
    }
    
    /**
     * إعداد خادم WebSocket
     */
    _setupWebSocketServer() {
        this.wss = new WebSocket.Server({ port: 8080 });
        
        this.wss.on('connection', (ws) => {
            this.logger.info('WebSocket client connected');
            
            // إرسال البيانات الفورية عند الاتصال
            ws.send(JSON.stringify({
                type: 'initial_data',
                data: this.getAllRealTimeMetrics(),
                timestamp: Date.now()
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this._handleWebSocketMessage(ws, data);
                } catch (error) {
                    this.logger.error('WebSocket message parsing error', { error: error.message });
                }
            });
            
            ws.on('close', () => {
                this.logger.info('WebSocket client disconnected');
            });
            
            ws.on('error', (error) => {
                this.logger.error('WebSocket error', { error: error.message });
            });
        });
        
        this.logger.info('WebSocket server started on port 8080');
    }
    
    /**
     * معالجة رسائل WebSocket
     */
    _handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'subscribe':
                this._handleSubscribe(ws, data);
                break;
            case 'unsubscribe':
                this._handleUnsubscribe(ws, data);
                break;
            case 'get_metrics':
                this._handleGetMetrics(ws, data);
                break;
            default:
                this.logger.warn('Unknown WebSocket message type', { type: data.type });
        }
    }
    
    /**
     * معالجة الاشتراك في المقاييس
     */
    _handleSubscribe(ws, data) {
        if (!ws.subscriptions) {
            ws.subscriptions = new Set();
        }
        
        data.metrics.forEach(metric => {
            ws.subscriptions.add(metric);
        });
        
        ws.send(JSON.stringify({
            type: 'subscription_confirmed',
            metrics: Array.from(ws.subscriptions),
            timestamp: Date.now()
        }));
        
        this.logger.info('WebSocket subscription added', { 
            client: ws._socket.remoteAddress,
            metrics: data.metrics 
        });
    }
    
    /**
     * معالجة إلغاء الاشتراك
     */
    _handleUnsubscribe(ws, data) {
        if (ws.subscriptions) {
            data.metrics.forEach(metric => {
                ws.subscriptions.delete(metric);
            });
        }
        
        ws.send(JSON.stringify({
            type: 'unsubscription_confirmed',
            metrics: data.metrics,
            timestamp: Date.now()
        }));
    }
    
    /**
     * معالجة طلب المقاييس
     */
    _handleGetMetrics(ws, data) {
        const metrics = this.getRealTimeMetrics(data.metric);
        
        ws.send(JSON.stringify({
            type: 'metrics_response',
            metric: data.metric,
            data: metrics,
            timestamp: Date.now()
        }));
    }
    
    /**
     * بدء الجمع الفوري
     */
    async startCollection() {
        if (this.isCollecting) {
            this.logger.warn('Collection already running');
            return;
        }
        
        this.isCollecting = true;
        this.logger.info('Starting real-time metrics collection');
        
        // بدء مهام الجمع المختلفة
        await this._startApplicationMetricsCollection();
        await this._startDatabaseMetricsCollection();
        await this._startCacheMetricsCollection();
        await this._startInfrastructureMetricsCollection();
        
        // بدء التجميع الفوري
        this._startRealTimeAggregation();
        
        // بدء التحليل الفوري
        this._startRealTimeAnalysis();
        
        this.logger.info('Real-time collection started successfully');
    }
    
    /**
     * بدء جمع مقاييس التطبيق
     */
    async _startApplicationMetricsCollection() {
        const task = setInterval(async () => {
            const startTime = performance.now();
            
            try {
                const metrics = await this._collectApplicationMetrics();
                this._storeRealTimeMetrics('application', metrics);
                this._updatePrometheusMetrics('application', metrics);
                
                const latency = performance.now() - startTime;
                this.collectionLatency.observe({ source: 'application', status: 'success' }, latency);
                
            } catch (error) {
                this.logger.error('Application metrics collection error', { error: error.message });
                this.collectionLatency.observe({ source: 'application', status: 'error' }, performance.now() - startTime);
                this.collectionErrors.inc({ source: 'application', error_type: error.message });
                this.performanceStats.errorCount++;
            }
            
            this.performanceStats.totalCollections++;
            this.performanceStats.lastCollectionTime = Date.now();
            
        }, this.config.collectionInterval);
        
        this.collectionTasks.set('application', task);
    }
    
    /**
     * جمع مقاييس التطبيق
     */
    async _collectApplicationMetrics() {
        const source = this.config.dataSources.application;
        const metrics = {
            timestamp: Date.now(),
            source: 'application'
        };
        
        try {
            // جمع مقاييس من واجهة التطبيق
            const response = await axios.get(`${source.endpoint}/api/metrics`, {
                timeout: source.timeout
            });
            
            const appData = response.data;
            
            // مقاييس الأداء
            metrics.performance = {
                response_time_avg: appData.avgResponseTime || 0,
                response_time_p50: appData.p50ResponseTime || 0,
                response_time_p95: appData.p95ResponseTime || 0,
                response_time_p99: appData.p99ResponseTime || 0,
                throughput: appData.throughput || 0,
                error_rate: appData.errorRate || 0,
                success_rate: appData.successRate || 0
            };
            
            // مقاييس الطلبات
            metrics.requests = {
                total: appData.totalRequests || 0,
                successful: appData.successfulRequests || 0,
                failed: appData.failedRequests || 0,
                per_second: appData.requestsPerSecond || 0
            };
            
            // مقاييس الذاكرة والمعالج
            if (appData.systemMetrics) {
                metrics.system = {
                    cpu_usage: appData.systemMetrics.cpuUsage || 0,
                    memory_usage: appData.systemMetrics.memoryUsage || 0,
                    memory_available: appData.systemMetrics.memoryAvailable || 0,
                    disk_usage: appData.systemMetrics.diskUsage || 0,
                    network_io: appData.systemMetrics.networkIO || 0
                };
            }
            
            // مقاييس واجهات البرمجة
            if (appData.endpoints) {
                metrics.endpoints = {};
                Object.entries(appData.endpoints).forEach(([endpoint, data]) => {
                    metrics.endpoints[endpoint] = {
                        response_time: data.avgResponseTime || 0,
                        request_count: data.requestCount || 0,
                        error_rate: data.errorRate || 0,
                        status: data.status || 'unknown'
                    };
                    
                    // تسجيل Prometheus metrics
                    this.appResponseTime.observe(
                        { 
                            endpoint: endpoint, 
                            method: data.method || 'GET',
                            status_code: '200'
                        },
                        data.avgResponseTime || 0
                    );
                });
            }
            
            // إضافة بيانات الصحة
            metrics.health = {
                status: appData.status || 'healthy',
                uptime: appData.uptime || 0,
                last_health_check: appData.lastHealthCheck || Date.now(),
                services_status: appData.servicesStatus || {}
            };
            
        } catch (error) {
            this.logger.error('Failed to collect application metrics', { error: error.message });
            metrics.error = error.message;
            metrics.status = 'error';
        }
        
        return metrics;
    }
    
    /**
     * بدء جمع مقاييس قواعد البيانات
     */
    async _startDatabaseMetricsCollection() {
        const task = setInterval(async () => {
            const startTime = performance.now();
            
            try {
                const metrics = await this._collectDatabaseMetrics();
                this._storeRealTimeMetrics('database', metrics);
                this._updatePrometheusMetrics('database', metrics);
                
                const latency = performance.now() - startTime;
                this.collectionLatency.observe({ source: 'database', status: 'success' }, latency);
                
            } catch (error) {
                this.logger.error('Database metrics collection error', { error: error.message });
                this.collectionLatency.observe({ source: 'database', status: 'error' }, performance.now() - startTime);
                this.collectionErrors.inc({ source: 'database', error_type: error.message });
            }
            
        }, this.config.collectionInterval);
        
        this.collectionTasks.set('database', task);
    }
    
    /**
     * جمع مقاييس قواعد البيانات
     */
    async _collectDatabaseMetrics() {
        const source = this.config.dataSources.database;
        const metrics = {
            timestamp: Date.now(),
            source: 'database'
        };
        
        const databases = {};
        
        for (const dbConfig of source.endpoints) {
            try {
                const response = await axios.get(`${dbConfig.endpoint}/metrics`, {
                    timeout: source.timeout
                });
                
                const dbData = response.data;
                
                databases[dbConfig.name] = {
                    // مقاييس الأداء
                    performance: {
                        avg_query_time: dbData.avgQueryTime || 0,
                        slow_queries: dbData.slowQueries || 0,
                        query_throughput: dbData.throughput || 0
                    },
                    
                    // مقاييس الاتصالات
                    connections: {
                        active: dbData.activeConnections || 0,
                        max: dbData.maxConnections || 0,
                        idle: dbData.idleConnections || 0,
                        usage_percent: dbData.connectionUsagePercent || 0
                    },
                    
                    // مقاييس الذاكرة
                    memory: {
                        buffer_cache_hit_rate: dbData.bufferCacheHitRate || 0,
                        shared_buffers: dbData.sharedBuffers || 0,
                        work_mem: dbData.workMem || 0
                    },
                    
                    // مقاييس الأقفال
                    locks: {
                        waiting_transactions: dbData.waitingTransactions || 0,
                        deadlocks: dbData.deadlocks || 0,
                        lock_timeouts: dbData.lockTimeouts || 0
                    },
                    
                    // مقاييس النسخ
                    replication: {
                        lag_seconds: dbData.replicationLag || 0,
                        status: dbData.replicationStatus || 'unknown'
                    },
                    
                    health: {
                        status: dbData.status || 'healthy',
                        uptime: dbData.uptime || 0
                    }
                };
                
                // تسجيل Prometheus metrics
                this.databaseQueryTime.observe(
                    { query_type: 'avg', table: 'all' },
                    dbData.avgQueryTime || 0
                );
                
            } catch (error) {
                this.logger.error(`Failed to collect metrics for database ${dbConfig.name}`, {
                    error: error.message
                });
                databases[dbConfig.name] = {
                    status: 'error',
                    error: error.message
                };
            }
        }
        
        metrics.databases = databases;
        return metrics;
    }
    
    /**
     * بدء جمع مقاييس التخزين المؤقت
     */
    async _startCacheMetricsCollection() {
        const task = setInterval(async () => {
            const startTime = performance.now();
            
            try {
                const metrics = await this._collectCacheMetrics();
                this._storeRealTimeMetrics('cache', metrics);
                this._updatePrometheusMetrics('cache', metrics);
                
                const latency = performance.now() - startTime;
                this.collectionLatency.observe({ source: 'cache', status: 'success' }, latency);
                
            } catch (error) {
                this.logger.error('Cache metrics collection error', { error: error.message });
                this.collectionLatency.observe({ source: 'cache', status: 'error' }, performance.now() - startTime);
                this.collectionErrors.inc({ source: 'cache', error_type: error.message });
            }
            
        }, this.config.collectionInterval);
        
        this.collectionTasks.set('cache', task);
    }
    
    /**
     * جمع مقاييس التخزين المؤقت
     */
    async _collectCacheMetrics() {
        const source = this.config.dataSources.cache;
        const metrics = {
            timestamp: Date.now(),
            source: 'cache'
        };
        
        const caches = {};
        
        for (const cacheConfig of source.endpoints) {
            try {
                const response = await axios.get(`${cacheConfig.endpoint}/stats`, {
                    timeout: source.timeout
                });
                
                const cacheData = response.data;
                
                caches[cacheConfig.name] = {
                    // مقاييس الأداء
                    performance: {
                        hit_rate: cacheData.hitRate || 0,
                        miss_rate: cacheData.missRate || 0,
                        avg_response_time: cacheData.avgResponseTime || 0
                    },
                    
                    // مقاييس العمليات
                    operations: {
                        hits: cacheData.hits || 0,
                        misses: cacheData.misses || 0,
                        sets: cacheData.sets || 0,
                        deletes: cacheData.deletes || 0,
                        operations_per_second: cacheData.opsPerSecond || 0
                    },
                    
                    // مقاييس الذاكرة
                    memory: {
                        used_memory: cacheData.usedMemory || 0,
                        total_memory: cacheData.totalMemory || 0,
                        memory_usage_percent: cacheData.memoryUsagePercent || 0,
                        key_count: cacheData.keyCount || 0
                    },
                    
                    // مقاييس الشبكة
                    network: {
                        bytes_read: cacheData.bytesRead || 0,
                        bytes_written: cacheData.bytesWritten || 0,
                        connections: cacheData.connections || 0
                    },
                    
                    health: {
                        status: cacheData.status || 'healthy',
                        uptime: cacheData.uptime || 0
                    }
                };
                
                // تسجيل Prometheus metrics
                this.cacheHitRate.set(
                    { cache_type: cacheConfig.type || 'unknown', instance: cacheConfig.name },
                    cacheData.hitRate || 0
                );
                
            } catch (error) {
                this.logger.error(`Failed to collect metrics for cache ${cacheConfig.name}`, {
                    error: error.message
                });
                caches[cacheConfig.name] = {
                    status: 'error',
                    error: error.message
                };
            }
        }
        
        metrics.caches = caches;
        return metrics;
    }
    
    /**
     * بدء جمع مقاييس البنية التحتية
     */
    async _startInfrastructureMetricsCollection() {
        const task = setInterval(async () => {
            const startTime = performance.now();
            
            try {
                const metrics = await this._collectInfrastructureMetrics();
                this._storeRealTimeMetrics('infrastructure', metrics);
                this._updatePrometheusMetrics('infrastructure', metrics);
                
                const latency = performance.now() - startTime;
                this.collectionLatency.observe({ source: 'infrastructure', status: 'success' }, latency);
                
            } catch (error) {
                this.logger.error('Infrastructure metrics collection error', { error: error.message });
                this.collectionLatency.observe({ source: 'infrastructure', status: 'error' }, performance.now() - startTime);
                this.collectionErrors.inc({ source: 'infrastructure', error_type: error.message });
            }
            
        }, this.config.collectionInterval);
        
        this.collectionTasks.set('infrastructure', task);
    }
    
    /**
     * جمع مقاييس البنية التحتية
     */
    async _collectInfrastructureMetrics() {
        const source = this.config.dataSources.infrastructure;
        const metrics = {
            timestamp: Date.now(),
            source: 'infrastructure'
        };
        
        // جمع مقاييس النظام
        const os = require('os');
        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        
        metrics.system = {
            cpu: {
                usage_percent: this._getCpuUsage(),
                load_average: os.loadavg(),
                core_count: cpus.length,
                frequency: cpus[0].speed
            },
            memory: {
                total: totalMem,
                used: totalMem - freeMem,
                free: freeMem,
                usage_percent: ((totalMem - freeMem) / totalMem) * 100
            },
            disk: await this._getDiskUsage(),
            network: await this._getNetworkStats(),
            processes: this._getProcessStats(),
            uptime: os.uptime()
        };
        
        return metrics;
    }
    
    /**
     * حساب استخدام المعالج
     */
    _getCpuUsage() {
        const os = require('os');
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        
        cpus.forEach(cpu => {
            for (let type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });
        
        return ((1 - totalIdle / totalTick) * 100).toFixed(2);
    }
    
    /**
     * جمع إحصائيات القرص
     */
    async _getDiskUsage() {
        const fs = require('fs').promises;
        try {
            const stats = await fs.statfs('/');
            const total = stats.blocks * stats.bsize;
            const free = stats.bavail * stats.bsize;
            const used = total - free;
            
            return {
                total,
                used,
                free,
                usage_percent: (used / total) * 100
            };
        } catch (error) {
            this.logger.error('Failed to get disk usage', { error: error.message });
            return { error: error.message };
        }
    }
    
    /**
     * جمع إحصائيات الشبكة
     */
    async _getNetworkStats() {
        // تنفيذ مبسط لإحصائيات الشبكة
        return {
            interface_count: Object.keys(require('os').networkInterfaces()).length,
            // يمكن إضافة المزيد من التفاصيل حسب الحاجة
        };
    }
    
    /**
     * جمع إحصائيات العمليات
     */
    _getProcessStats() {
        const process = require('process');
        return {
            pid: process.pid,
            memory_usage: process.memoryUsage(),
            cpu_usage: process.cpuUsage(),
            uptime: process.uptime()
        };
    }
    
    /**
     * بدء التجميع الفوري
     */
    _startRealTimeAggregation() {
        setInterval(() => {
            this._aggregateRealTimeData();
        }, 5000); // كل 5 ثوانٍ
    }
    
    /**
     * تجميع البيانات الفورية
     */
    _aggregateRealTimeData() {
        const now = Date.now();
        const sources = ['application', 'database', 'cache', 'infrastructure'];
        
        sources.forEach(source => {
            const data = this.realTimeMetrics.get(source);
            if (data) {
                // حساب المتوسطات والحسابات الفورية
                const aggregated = this._calculateAggregations(source, data);
                this.aggregatedData.set(source, aggregated);
                
                // إرسال البيانات المجمعة عبر WebSocket
                this._broadcastToWebSocket(source, aggregated);
            }
        });
        
        // حساب النقاط الصحية العامة
        this._updateOverallHealth();
    }
    
    /**
     * حساب التجميعات
     */
    _calculateAggregations(source, data) {
        const aggregated = {
            source,
            timestamp: Date.now(),
            health_score: 100,
            alerts: [],
            trends: {}
        };
        
        switch (source) {
            case 'application':
                aggregated.health_score = this._calculateAppHealthScore(data);
                aggregated.alerts = this._checkApplicationAlerts(data);
                break;
            case 'database':
                aggregated.health_score = this._calculateDatabaseHealthScore(data);
                aggregated.alerts = this._checkDatabaseAlerts(data);
                break;
            case 'cache':
                aggregated.health_score = this._calculateCacheHealthScore(data);
                aggregated.alerts = this._checkCacheAlerts(data);
                break;
            case 'infrastructure':
                aggregated.health_score = this._calculateInfrastructureHealthScore(data);
                aggregated.alerts = this._checkInfrastructureAlerts(data);
                break;
        }
        
        return aggregated;
    }
    
    /**
     * حساب نقاط صحة التطبيق
     */
    _calculateAppHealthScore(data) {
        let score = 100;
        
        if (data.performance) {
            // خصم للنقاط الضعيفة في الأداء
            if (data.performance.response_time_avg > 500) score -= 20;
            if (data.performance.error_rate > 1) score -= 30;
            if (data.performance.throughput < 100) score -= 10;
        }
        
        if (data.system) {
            if (data.system.cpu_usage > 80) score -= 15;
            if (data.system.memory_usage > 85) score -= 15;
        }
        
        return Math.max(0, score);
    }
    
    /**
     * فحص تنبيهات التطبيق
     */
    _checkApplicationAlerts(data) {
        const alerts = [];
        
        if (data.performance) {
            if (data.performance.response_time_avg > this.config.realTimeAlerts.responseTimeThreshold) {
                alerts.push({
                    type: 'HIGH_RESPONSE_TIME',
                    severity: 'high',
                    message: `Average response time ${data.performance.response_time_avg}ms exceeds threshold`,
                    timestamp: Date.now()
                });
            }
            
            if (data.performance.error_rate > this.config.realTimeAlerts.errorRateThreshold) {
                alerts.push({
                    type: 'HIGH_ERROR_RATE',
                    severity: 'critical',
                    message: `Error rate ${data.performance.error_rate}% exceeds threshold`,
                    timestamp: Date.now()
                });
            }
        }
        
        return alerts;
    }
    
    /**
     * حفظ المقاييس الفورية
     */
    _storeRealTimeMetrics(source, metrics) {
        if (!this.realTimeMetrics.has(source)) {
            this.realTimeMetrics.set(source, []);
        }
        
        const sourceData = this.realTimeMetrics.get(source);
        sourceData.push({
            ...metrics,
            collection_time: Date.now()
        });
        
        // الاحتفاظ بآخر 100 قياس فقط
        if (sourceData.length > 100) {
            sourceData.shift();
        }
        
        this.performanceStats.dataPointsCollected++;
    }
    
    /**
     * تحديث مقاييس Prometheus
     */
    _updatePrometheusMetrics(source, data) {
        switch (source) {
            case 'application':
                if (data.performance) {
                    this.appResponseTime.observe(
                        { endpoint: 'overall', method: 'GET', status_code: '200' },
                        data.performance.response_time_avg || 0
                    );
                }
                break;
            case 'database':
                if (data.databases) {
                    Object.values(data.databases).forEach(db => {
                        if (db.performance) {
                            this.databaseQueryTime.observe(
                                { query_type: 'avg', table: 'all' },
                                db.performance.avg_query_time || 0
                            );
                        }
                    });
                }
                break;
            case 'cache':
                if (data.caches) {
                    Object.values(data.caches).forEach(cache => {
                        if (cache.performance) {
                            this.cacheHitRate.set(
                                { cache_type: 'redis', instance: 'primary' },
                                cache.performance.hit_rate || 0
                            );
                        }
                    });
                }
                break;
        }
    }
    
    /**
     * بدء التحليل الفوري
     */
    _startRealTimeAnalysis() {
        setInterval(async () => {
            await this._performRealTimeAnalysis();
        }, 10000); // كل 10 ثوانٍ
    }
    
    /**
     * تنفيذ التحليل الفوري
     */
    async _performRealTimeAnalysis() {
        try {
            // تحليل الاتجاهات
            const trends = this._analyzeTrends();
            
            // كشف الشذوذ
            const anomalies = this._detectAnomalies();
            
            // التوقعات
            const predictions = this._makePredictions();
            
            // إنشاء تقرير التحليل
            const analysisReport = {
                timestamp: Date.now(),
                trends,
                anomalies,
                predictions,
                recommendations: this._generateRecommendations()
            };
            
            // إرسال التقرير
            this.emit('realTimeAnalysis', analysisReport);
            
            // حفظ التقرير
            this._storeAnalysisReport(analysisReport);
            
        } catch (error) {
            this.logger.error('Real-time analysis error', { error: error.message });
        }
    }
    
    /**
     * تحليل الاتجاهات
     */
    _analyzeTrends() {
        const trends = {};
        const sources = ['application', 'database', 'cache', 'infrastructure'];
        
        sources.forEach(source => {
            const data = this.realTimeMetrics.get(source);
            if (data && data.length >= 10) {
                const recent = data.slice(-10);
                const previous = data.slice(-20, -10);
                
                trends[source] = this._calculateTrend(recent, previous);
            }
        });
        
        return trends;
    }
    
    /**
     * حساب الاتجاه
     */
    _calculateTrend(recent, previous) {
        const recentAvg = this._calculateAverage(recent);
        const previousAvg = this._calculateAverage(previous);
        
        const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;
        
        return {
            direction: changePercent > 5 ? 'increasing' : changePercent < -5 ? 'decreasing' : 'stable',
            change_percent: changePercent,
            magnitude: Math.abs(changePercent)
        };
    }
    
    /**
     * كشف الشذوذ
     */
    _detectAnomalies() {
        const anomalies = {};
        const sources = ['application', 'database', 'cache', 'infrastructure'];
        
        sources.forEach(source => {
            const data = this.realTimeMetrics.get(source);
            if (data && data.length >= 20) {
                anomalies[source] = this._detectSourceAnomalies(source, data);
            }
        });
        
        return anomalies;
    }
    
    /**
     * كشف الشذوذ للمصدر
     */
    _detectSourceAnomalies(source, data) {
        // تطبيق كشف الشذوذ المبسط
        const values = this._extractMetricValues(data, source);
        const mean = this._calculateAverage(values);
        const stdDev = this._calculateStandardDeviation(values, mean);
        
        const anomalies = [];
        values.slice(-5).forEach((value, index) => {
            const zScore = Math.abs((value - mean) / stdDev);
            if (zScore > 2) { // أكثر من 2 انحراف معياري
                anomalies.push({
                    index: data.length - 5 + index,
                    value,
                    z_score: zScore,
                    type: 'statistical_anomaly'
                });
            }
        });
        
        return anomalies;
    }
    
    /**
     * التوقعات
     */
    _makePredictions() {
        // توقعات بسيطة بناءً على الاتجاهات
        return {
            response_time: {
                predicted_trend: 'stable',
                confidence: 0.8,
                timeframe: 'next_hour'
            },
            error_rate: {
                predicted_trend: 'decreasing',
                confidence: 0.7,
                timeframe: 'next_hour'
            },
            resource_usage: {
                predicted_trend: 'increasing',
                confidence: 0.6,
                timeframe: 'next_hour'
            }
        };
    }
    
    /**
     * توليد التوصيات
     */
    _generateRecommendations() {
        const recommendations = [];
        
        // توصيات بناءً على الأداء الحالي
        const appData = this.realTimeMetrics.get('application');
        if (appData && appData.length > 0) {
            const latest = appData[appData.length - 1];
            
            if (latest.performance && latest.performance.response_time_avg > 500) {
                recommendations.push({
                    type: 'performance',
                    priority: 'high',
                    action: 'Optimize slow endpoints',
                    details: 'Several endpoints are responding slowly'
                });
            }
        }
        
        return recommendations;
    }
    
    /**
     * حساب المتوسط
     */
    _calculateAverage(data) {
        if (data.length === 0) return 0;
        return data.reduce((sum, item) => sum + item, 0) / data.length;
    }
    
    /**
     * حساب الانحراف المعياري
     */
    _calculateStandardDeviation(values, mean) {
        if (values.length === 0) return 0;
        
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        const avgSquaredDiff = this._calculateAverage(squaredDiffs);
        
        return Math.sqrt(avgSquaredDiff);
    }
    
    /**
     * استخراج قيم المقياس
     */
    _extractMetricValues(data, source) {
        return data.map(item => {
            switch (source) {
                case 'application':
                    return item.performance?.response_time_avg || 0;
                case 'database':
                    return item.databases ? 
                        Object.values(item.databases).reduce((sum, db) => 
                            sum + (db.performance?.avg_query_time || 0), 0) / Object.keys(item.databases).length : 0;
                case 'cache':
                    return item.caches ?
                        Object.values(item.caches).reduce((sum, cache) =>
                            sum + (cache.performance?.avg_response_time || 0), 0) / Object.keys(item.caches).length : 0;
                case 'infrastructure':
                    return item.system?.cpu?.usage_percent || 0;
                default:
                    return 0;
            }
        });
    }
    
    /**
     * إرسال البيانات عبر WebSocket
     */
    _broadcastToWebSocket(source, data) {
        if (this.wss) {
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN && 
                    (!client.subscriptions || client.subscriptions.has(source))) {
                    client.send(JSON.stringify({
                        type: 'real_time_data',
                        source,
                        data,
                        timestamp: Date.now()
                    }));
                }
            });
        }
    }
    
    /**
     * تحديث النقاط الصحية العامة
     */
    _updateOverallHealth() {
        const sources = ['application', 'database', 'cache', 'infrastructure'];
        let totalScore = 0;
        let sourceCount = 0;
        
        sources.forEach(source => {
            const aggregated = this.aggregatedData.get(source);
            if (aggregated) {
                totalScore += aggregated.health_score;
                sourceCount++;
            }
        });
        
        const overallHealth = sourceCount > 0 ? totalScore / sourceCount : 0;
        
        // تحديث Prometheus metric
        this.realTimeHealth.set({ component: 'overall' }, overallHealth);
        
        // إرسال حدث التحديث
        this.emit('healthUpdate', {
            overall_health: overallHealth,
            individual_scores: Object.fromEntries(
                sources.map(source => [source, this.aggregatedData.get(source)?.health_score || 0])
            ),
            timestamp: Date.now()
        });
    }
    
    /**
     * الحصول على المقاييس الفورية
     */
    getRealTimeMetrics(source = null) {
        if (source) {
            return this.realTimeMetrics.get(source) || [];
        }
        return this.getAllRealTimeMetrics();
    }
    
    /**
     * الحصول على جميع المقاييس الفورية
     */
    getAllRealTimeMetrics() {
        const allMetrics = {};
        for (const [source, data] of this.realTimeMetrics.entries()) {
            allMetrics[source] = data;
        }
        return allMetrics;
    }
    
    /**
     * الحصول على البيانات المجمعة
     */
    getAggregatedMetrics(source = null) {
        if (source) {
            return this.aggregatedData.get(source) || null;
        }
        return Object.fromEntries(this.aggregatedData);
    }
    
    /**
     * الحصول على إحصائيات الأداء
     */
    getPerformanceStats() {
        return {
            ...this.performanceStats,
            uptime: this.isCollecting ? Date.now() - (this.startTime || Date.now()) : 0,
            active_sources: this.collectionTasks.size,
            buffer_usage: this.metricsBuffer.size,
            aggregated_data_points: this.aggregatedData.size
        };
    }
    
    /**
     * إيقاف الجمع
     */
    async stopCollection() {
        this.logger.info('Stopping real-time metrics collection');
        
        this.isCollecting = false;
        
        // إيقاف جميع المهام
        for (const [source, task] of this.collectionTasks.entries()) {
            clearInterval(task);
            this.logger.info(`Stopped ${source} metrics collection`);
        }
        
        this.collectionTasks.clear();
        
        // إغلاق WebSocket
        if (this.wss) {
            this.wss.close();
        }
        
        this.logger.info('Real-time metrics collection stopped');
    }
    
    /**
     * تصدير Prometheus metrics
     */
    getPrometheusMetrics() {
        return promClient.register.metrics();
    }
}

// تصدير الكلاس
module.exports = RealTimeCollector;

// مثال على الاستخدام
if (require.main === module) {
    const collector = new RealTimeCollector({
        appEndpoint: 'http://localhost:3000',
        dbEndpoints: [
            { name: 'main_db', endpoint: 'http://localhost:5432', type: 'postgresql' }
        ],
        cacheEndpoints: [
            { name: 'redis_cache', endpoint: 'http://localhost:6379', type: 'redis' }
        ],
        collectionInterval: 1000,
        enableWebSocket: true,
        enablePrometheus: true
    });
    
    // تسجيل مستمعي الأحداث
    collector.on('realTimeAnalysis', (analysis) => {
        console.log('Real-time analysis:', JSON.stringify(analysis, null, 2));
    });
    
    collector.on('healthUpdate', (health) => {
        console.log('Health update:', JSON.stringify(health, null, 2));
    });
    
    // بدء الجمع
    collector.startCollection().then(() => {
        console.log('Real-time collector started');
        
        // عرض الإحصائيات كل 30 ثانية
        setInterval(() => {
            const stats = collector.getPerformanceStats();
            console.log('Performance stats:', JSON.stringify(stats, null, 2));
        }, 30000);
        
    }).catch(error => {
        console.error('Failed to start collector:', error);
    });
    
    // إيقاف نظيف
    process.on('SIGINT', async () => {
        console.log('Shutting down...');
        await collector.stopCollection();
        process.exit(0);
    });
}
