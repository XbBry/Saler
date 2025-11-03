/**
 * نظام السجلات المتقدم الشامل - Advanced Comprehensive Logging System
 * نظام متقدم لإدارة وتنظيم السجلات مع التنبيهات والتدوير والتخزين المركزي
 * Advanced system for managing and organizing logs with alerts, rotation, and centralized storage
 */

class AdvancedLoggingSystem {
    constructor(config = {}) {
        this.config = {
            // إعدادات عامة
            level: config.level || 'info', // debug, info, warn, error, critical
            enableConsole: config.enableConsole !== false,
            enableFile: config.enableFile !== false,
            enableRemote: config.enableRemote !== false,
            enableDatabase: config.enableDatabase !== false,
            enableAlerts: config.enableAlerts !== false,
            
            // إعدادات التخزين
            storage: {
                maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
                maxFiles: config.maxFiles || 30, // 30 ملف
                rotateInterval: config.rotateInterval || 'daily', // daily, weekly, monthly
                compression: config.compression || true,
                archivePath: config.archivePath || './logs/archive/',
                
                // إعدادات قاعدة البيانات
                dbConnection: config.dbConnection || process.env.LOGS_DB_CONNECTION,
                tableName: config.tableName || 'application_logs',
                
                // إعدادات الخادم البعيد
                remoteEndpoint: config.remoteEndpoint || process.env.LOGS_REMOTE_ENDPOINT,
                apiKey: config.apiKey || process.env.LOGS_API_KEY,
                batchSize: config.batchSize || 100,
                flushInterval: config.flushInterval || 30000 // 30 ثانية
            },
            
            // إعدادات التنسيق
            format: {
                timestamp: config.timestamp || 'ISO',
                timezone: config.timezone || 'UTC',
                includeStack: config.includeStack !== false,
                includeContext: config.includeContext !== false,
                customFields: config.customFields || {},
                jsonIndent: config.jsonIndent || 0,
                colorizeConsole: config.colorizeConsole !== false
            },
            
            // إعدادات التنبيهات
            alerts: {
                channels: config.alertChannels || {
                    email: true,
                    slack: false,
                    discord: false,
                    webhook: false
                },
                thresholds: {
                    errorRate: 10, // عدد الأخطاء في الدقيقة
                    criticalErrors: 5,
                    responseTime: 5000, // ms
                    memoryUsage: 80 // %
                },
                recipients: config.alertRecipients || []
            },
            
            // إعدادات الأداء
            performance: {
                bufferSize: config.bufferSize || 1000,
                flushOnError: config.flushOnError !== false,
                asyncLogging: config.asyncLogging !== false,
                batchProcessing: config.batchProcessing !== false
            },
            
            ...config
        };
        
        // إعداد المتغيرات الداخلية
        this.setupInternalState();
        
        // إعداد المكونات
        this.setupFormatters();
        this.setupStorage();
        this.setupAlerts();
        this.setupPerformance();
        
        // بدء العمليات
        this.start();
    }
    
    /**
     * إعداد الحالة الداخلية
     */
    setupInternalState() {
        this.logBuffer = [];
        this.errorCount = new Map(); // عدد الأخطاء حسب الوقت
        this.stats = {
            totalLogs: 0,
            logsByLevel: new Map(),
            logsByCategory: new Map(),
            startTime: Date.now(),
            lastFlush: Date.now(),
            lastError: null,
            lastErrorTime: null
        };
        
        // إعدادات الوقت
        this.startTime = Date.now();
        this.sessionId = this.generateSessionId();
        
        // إعدادات الأداء
        this.performanceMonitor = {
            memoryUsage: [],
            responseTimes: [],
            cpuUsage: [],
            logProcessingTime: []
        };
        
        // فئات السجلات
        this.categories = [
            'system', 'security', 'performance', 'business', 
            'user', 'network', 'database', 'cache', 'api',
            'error', 'debug', 'audit'
        ];
    }
    
    /**
     * إعداد المهيئات (Formatters)
     */
    setupFormatters() {
        this.formatters = {
            json: this.formatJSON.bind(this),
            simple: this.formatSimple.bind(this),
            colored: this.formatColored.bind(this),
            detailed: this.formatDetailed.bind(this),
            syslog: this.formatSyslog.bind(this)
        };
        
        this.currentFormatter = this.formatters[this.config.format.format || 'json'];
    }
    
    /**
     * إعداد التخزين
     */
    setupStorage() {
        this.storage = {
            local: null,
            remote: null,
            database: null
        };
        
        // إعداد التخزين المحلي
        if (this.config.enableFile) {
            this.setupLocalStorage();
        }
        
        // إعداد التخزين البعيد
        if (this.config.enableRemote) {
            this.setupRemoteStorage();
        }
        
        // إعداد قاعدة البيانات
        if (this.config.enableDatabase) {
            this.setupDatabaseStorage();
        }
    }
    
    /**
     * إعداد التخزين المحلي
     */
    setupLocalStorage() {
        const fs = require('fs');
        const path = require('path');
        
        this.logDirectory = path.join(process.cwd(), 'logs');
        
        // إنشاء مجلد السجلات إذا لم يكن موجوداً
        if (!fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory, { recursive: true });
        }
        
        // إنشاء مجلد الأرشيف
        if (!fs.existsSync(this.config.storage.archivePath)) {
            fs.mkdirSync(this.config.storage.archivePath, { recursive: true });
        }
        
        this.storage.local = {
            basePath: this.logDirectory,
            currentFile: null,
            currentSize: 0,
            fileDate: null
        };
    }
    
    /**
     * إعداد التخزين البعيد
     */
    setupRemoteStorage() {
        this.storage.remote = {
            endpoint: this.config.storage.remoteEndpoint,
            apiKey: this.config.storage.apiKey,
            batchSize: this.config.storage.batchSize,
            buffer: [],
            flushing: false,
            lastFlush: Date.now()
        };
    }
    
    /**
     * إعداد قاعدة البيانات
     */
    setupDatabaseStorage() {
        this.storage.database = {
            connection: this.config.storage.dbConnection,
            tableName: this.config.storage.tableName,
            buffer: [],
            flushing: false
        };
    }
    
    /**
     * إعداد التنبيهات
     */
    setupAlerts() {
        if (!this.config.enableAlerts) return;
        
        this.alertSystem = {
            channels: this.config.alerts.channels,
            thresholds: this.config.alerts.thresholds,
            recipients: this.config.alerts.recipients,
            activeAlerts: new Map(),
            alertHistory: []
        };
        
        // إعداد مراقبة التنبيهات
        this.setupAlertMonitoring();
    }
    
    /**
     * إعداد مراقبة التنبيهات
     */
    setupAlertMonitoring() {
        // مراقبة معدل الأخطاء
        setInterval(() => {
            this.checkErrorRateAlert();
        }, 60000); // كل دقيقة
        
        // مراقبة الذاكرة
        setInterval(() => {
            this.checkMemoryAlert();
        }, 30000); // كل 30 ثانية
        
        // مراقبة الأخطاء الحرجة
        setInterval(() => {
            this.checkCriticalErrorsAlert();
        }, 30000); // كل 30 ثانية
    }
    
    /**
     * إعداد مراقبة الأداء
     */
    setupPerformance() {
        // مراقبة الذاكرة
        setInterval(() => {
            this.monitorMemoryUsage();
        }, 10000); // كل 10 ثوان
        
        // مراقبة وقت معالجة السجلات
        setInterval(() => {
            this.monitorLogProcessingTime();
        }, 30000); // كل 30 ثانية
        
        // تدوير السجلات
        this.setupLogRotation();
        
        // فلاش البيانات
        if (this.config.performance.asyncLogging) {
            this.setupAutoFlush();
        }
    }
    
    /**
     * بدء النظام
     */
    start() {
        console.log('بدء تشغيل نظام السجلات المتقدم...');
        
        // تسجيل بدء التشغيل
        this.log('info', 'system', 'Logging system started', {
            sessionId: this.sessionId,
            config: this.getConfigSummary(),
            timestamp: new Date().toISOString()
        });
        
        // بدء مراقبة الأداء
        this.startPerformanceMonitoring();
        
        console.log('تم بدء تشغيل نظام السجلات بنجاح');
    }
    
    /**
     * تسجيل رسالة - Log message
     */
    log(level, category, message, context = {}, metadata = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            id: this.generateLogId(),
            timestamp,
            level: level.toLowerCase(),
            category: category.toLowerCase(),
            message: message,
            context: { ...this.config.format.customFields, ...context },
            metadata,
            sessionId: this.sessionId,
            pid: process.pid,
            hostname: require('os').hostname(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
            url: typeof window !== 'undefined' ? window.location.href : null,
            lineNumber: this.getLineNumber(),
            stackTrace: level === 'error' || level === 'critical' ? 
                this.getStackTrace() : null
        };
        
        // تحديث الإحصائيات
        this.updateStats(logEntry);
        
        // إضافة إلى الذاكرة المؤقتة
        this.addToBuffer(logEntry);
        
        // كتابة فورية للأخطاء الحرجة
        if (level === 'critical' && this.config.performance.flushOnError) {
            this.flush();
        }
        
        // فحص التنبيهات
        if (this.config.enableAlerts) {
            this.checkAlerts(logEntry);
        }
        
        return logEntry.id;
    }
    
    /**
     * طرق مريحة للتسجيل
     */
    debug(category, message, context) {
        return this.log('debug', category, message, context);
    }
    
    info(category, message, context) {
        return this.log('info', category, message, context);
    }
    
    warn(category, message, context) {
        return this.log('warn', category, message, context);
    }
    
    error(category, message, context, error) {
        return this.log('error', category, message, context, { 
            error: error ? error.message : null,
            stack: error ? error.stack : null 
        });
    }
    
    critical(category, message, context, error) {
        return this.log('critical', category, message, context, {
            error: error ? error.message : null,
            stack: error ? error.stack : null
        });
    }
    
    /**
     * إضافة إلى الذاكرة المؤقتة
     */
    addToBuffer(logEntry) {
        this.logBuffer.push(logEntry);
        
        // تحديد حجم الذاكرة المؤقتة
        if (this.logBuffer.length > this.config.performance.bufferSize) {
            this.logBuffer.shift();
        }
        
        // كتابة فورية للوحدة الطرفية
        if (this.config.enableConsole) {
            this.writeToConsole(logEntry);
        }
        
        // كتابة للملف
        if (this.config.enableFile) {
            this.writeToFile(logEntry);
        }
        
        // إضافة إلى التخزين البعيد
        if (this.config.enableRemote) {
            this.addToRemoteStorage(logEntry);
        }
        
        // إضافة إلى قاعدة البيانات
        if (this.config.enableDatabase) {
            this.addToDatabase(logEntry);
        }
    }
    
    /**
     * كتابة للوحدة الطرفية
     */
    writeToConsole(logEntry) {
        const formatted = this.currentFormatter(logEntry);
        
        switch (logEntry.level) {
            case 'debug':
                console.debug(formatted);
                break;
            case 'info':
                console.info(formatted);
                break;
            case 'warn':
                console.warn(formatted);
                break;
            case 'error':
                console.error(formatted);
                break;
            case 'critical':
                console.error(formatted);
                break;
            default:
                console.log(formatted);
        }
    }
    
    /**
     * كتابة للملف
     */
    writeToFile(logEntry) {
        if (!this.storage.local) return;
        
        const fs = require('fs');
        const path = require('path');
        
        try {
            const currentDate = new Date().toISOString().split('T')[0];
            const logFileName = `application-${currentDate}.log`;
            const logFilePath = path.join(this.storage.local.basePath, logFileName);
            
            const formatted = this.formatters.simple(logEntry) + '\n';
            
            fs.appendFileSync(logFilePath, formatted, 'utf8');
            
        } catch (error) {
            console.error('خطأ في كتابة السجل للملف:', error);
        }
    }
    
    /**
     * إضافة للتخزين البعيد
     */
    addToRemoteStorage(logEntry) {
        if (!this.storage.remote) return;
        
        this.storage.remote.buffer.push(logEntry);
        
        // فلاش إذا امتلأت الذاكرة المؤقتة
        if (this.storage.remote.buffer.length >= this.storage.remote.batchSize) {
            this.flushRemoteStorage();
        }
    }
    
    /**
     * إضافة لقاعدة البيانات
     */
    addToDatabase(logEntry) {
        if (!this.storage.database) return;
        
        this.storage.database.buffer.push(logEntry);
        
        // فلاش إذا امتلأت الذاكرة المؤقتة
        if (this.storage.database.buffer.length >= this.config.storage.batchSize) {
            this.flushDatabase();
        }
    }
    
    /**
     * فلاش التخزين البعيد
     */
    async flushRemoteStorage() {
        if (!this.storage.remote || this.storage.remote.buffer.length === 0) return;
        
        try {
            const logs = [...this.storage.remote.buffer];
            this.storage.remote.buffer = [];
            
            // إرسال دفعي للخادم البعيد
            const response = await fetch(this.storage.remote.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.storage.remote.apiKey}`
                },
                body: JSON.stringify({
                    logs,
                    sessionId: this.sessionId,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error(`Remote logging failed: ${response.status}`);
            }
            
            this.info('system', 'Successfully flushed logs to remote storage', {
                count: logs.length
            });
            
        } catch (error) {
            console.error('خطأ في فلاش التخزين البعيد:', error);
            // إرجاع السجلات للذاكرة المؤقتة في حالة الفشل
            this.storage.remote.buffer.unshift(...this.storage.remote.buffer);
        }
    }
    
    /**
     * فلاش قاعدة البيانات
     */
    async flushDatabase() {
        if (!this.storage.database || this.storage.database.buffer.length === 0) return;
        
        // تنفيذ في البيئة المناسبة فقط
        if (typeof window !== 'undefined') return; // المتصفح
        
        try {
            const logs = [...this.storage.database.buffer];
            this.storage.database.buffer = [];
            
            // حفظ في قاعدة البيانات
            const { Pool } = require('pg');
            const pool = new Pool({
                connectionString: this.storage.database.connection
            });
            
            const client = await pool.connect();
            
            try {
                for (const log of logs) {
                    await client.query(
                        `INSERT INTO ${this.storage.database.tableName} 
                         (id, timestamp, level, category, message, context, metadata, session_id)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [
                            log.id, log.timestamp, log.level, log.category,
                            log.message, JSON.stringify(log.context),
                            JSON.stringify(log.metadata), log.sessionId
                        ]
                    );
                }
                
                this.info('system', 'Successfully flushed logs to database', {
                    count: logs.length
                });
                
            } finally {
                client.release();
                await pool.end();
            }
            
        } catch (error) {
            console.error('خطأ في فلاش قاعدة البيانات:', error);
            // إرجاع السجلات للذاكرة المؤقتة
            this.storage.database.buffer.unshift(...this.storage.database.buffer);
        }
    }
    
    /**
     * فلاش جميع التخزينات
     */
    async flush() {
        const startTime = Date.now();
        
        // فلاش التخزين البعيد
        if (this.config.enableRemote) {
            await this.flushRemoteStorage();
        }
        
        // فلاش قاعدة البيانات
        if (this.config.enableDatabase) {
            await this.flushDatabase();
        }
        
        // تحديث وقت آخر فلاش
        this.stats.lastFlush = Date.now();
        
        this.debug('system', 'Flushed all log storage systems', {
            duration: Date.now() - startTime
        });
    }
    
    /**
     * فحص التنبيهات
     */
    checkAlerts(logEntry) {
        if (!this.alertSystem) return;
        
        // فحص مستوى الخطورة
        if (logEntry.level === 'critical') {
            this.triggerAlert('critical_error', logEntry);
        }
        
        // فحص معدل الأخطاء
        this.updateErrorCount(logEntry);
        
        // فحص فئات معينة
        if (logEntry.category === 'security') {
            this.triggerAlert('security_event', logEntry);
        }
        
        if (logEntry.category === 'performance' && logEntry.level === 'error') {
            this.triggerAlert('performance_error', logEntry);
        }
    }
    
    /**
     * تحديث عدد الأخطاء
     */
    updateErrorCount(logEntry) {
        if (logEntry.level !== 'error' && logEntry.level !== 'critical') return;
        
        const now = Date.now();
        const minute = Math.floor(now / 60000); // الدقيقة الحالية
        
        if (!this.errorCount.has(minute)) {
            this.errorCount.set(minute, 0);
        }
        
        this.errorCount.set(minute, this.errorCount.get(minute) + 1);
        
        // إزالة العدادات القديمة (أكثر من 10 دقائق)
        const tenMinutesAgo = minute - 10;
        for (const key of this.errorCount.keys()) {
            if (key < tenMinutesAgo) {
                this.errorCount.delete(key);
            }
        }
    }
    
    /**
     * تشغيل تنبيه
     */
    triggerAlert(type, logEntry) {
        const alertId = `${type}_${Date.now()}`;
        const alert = {
            id: alertId,
            type,
            timestamp: new Date().toISOString(),
            logEntry,
            status: 'active',
            channels: this.getAlertChannels(type),
            recipients: this.getAlertRecipients(type)
        };
        
        this.alertSystem.activeAlerts.set(alertId, alert);
        this.alertSystem.alertHistory.push(alert);
        
        // إرسال التنبيه
        this.sendAlert(alert);
        
        // إزالة التنبيه من النشطة بعد 5 دقائق
        setTimeout(() => {
            alert.status = 'resolved';
            this.alertSystem.activeAlerts.delete(alertId);
        }, 300000); // 5 دقائق
    }
    
    /**
     * إرسال التنبيه
     */
    async sendAlert(alert) {
        const promises = [];
        
        // البريد الإلكتروني
        if (alert.channels.email && this.emailService) {
            promises.push(this.sendEmailAlert(alert));
        }
        
        // Slack
        if (alert.channels.slack && this.slackService) {
            promises.push(this.sendSlackAlert(alert));
        }
        
        // Discord
        if (alert.channels.discord && this.discordService) {
            promises.push(this.sendDiscordAlert(alert));
        }
        
        // Webhook
        if (alert.channels.webhook && this.webhookService) {
            promises.push(this.sendWebhookAlert(alert));
        }
        
        await Promise.allSettled(promises);
    }
    
    /**
     * مراقبة الأداء
     */
    startPerformanceMonitoring() {
        // مراقبة الذاكرة
        setInterval(() => {
            this.recordMemoryUsage();
        }, 30000); // كل 30 ثانية
        
        // مراقبة وقت الاستجابة
        setInterval(() => {
            this.recordResponseTime();
        }, 60000); // كل دقيقة
        
        // إحصائيات النظام
        setInterval(() => {
            this.recordSystemStats();
        }, 30000); // كل 30 ثانية
    }
    
    /**
     * تسجيل استخدام الذاكرة
     */
    recordMemoryUsage() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const memUsage = process.memoryUsage();
            this.performanceMonitor.memoryUsage.push({
                timestamp: Date.now(),
                rss: memUsage.rss,
                heapTotal: memUsage.heapTotal,
                heapUsed: memUsage.heapUsed,
                external: memUsage.external
            });
            
            // الاحتفاظ بآخر 100 قياس فقط
            if (this.performanceMonitor.memoryUsage.length > 100) {
                this.performanceMonitor.memoryUsage.shift();
            }
        }
    }
    
    /**
     * تدوير السجلات
     */
    setupLogRotation() {
        let rotateInterval;
        
        switch (this.config.storage.rotateInterval) {
            case 'daily':
                rotateInterval = 24 * 60 * 60 * 1000; // 24 ساعة
                break;
            case 'weekly':
                rotateInterval = 7 * 24 * 60 * 60 * 1000; // 7 أيام
                break;
            case 'monthly':
                rotateInterval = 30 * 24 * 60 * 60 * 1000; // 30 يوم
                break;
            default:
                rotateInterval = 24 * 60 * 60 * 1000; // افتراضي: يومي
        }
        
        setInterval(() => {
            this.rotateLogs();
        }, rotateInterval);
    }
    
    /**
     * تدوير السجلات
     */
    rotateLogs() {
        if (!this.config.enableFile || !this.storage.local) return;
        
        try {
            const fs = require('fs');
            const path = require('path');
            const compression = require('zlib');
            
            // قراءة قائمة الملفات
            const files = fs.readdirSync(this.storage.local.basePath)
                .filter(file => file.startsWith('application-') && file.endsWith('.log'))
                .map(file => ({
                    name: file,
                    path: path.join(this.storage.local.basePath, file),
                    time: fs.statSync(path.join(this.storage.local.basePath, file)).mtime
                }))
                .sort((a, b) => b.time - a.time);
            
            // ضغط الملفات القديمة
            if (this.config.storage.compression && files.length > 1) {
                const oldFile = files[1]; // الملف الثاني (الأقدم)
                const compressedPath = path.join(
                    this.config.storage.archivePath,
                    oldFile.name.replace('.log', '.gz')
                );
                
                const gzip = compression.createGzip();
                const input = fs.createReadStream(oldFile.path);
                const output = fs.createWriteStream(compressedPath);
                
                input.pipe(gzip).pipe(output);
                
                // حذف الملف الأصلي بعد الضغط
                output.on('close', () => {
                    fs.unlinkSync(oldFile.path);
                });
            }
            
            // حذف الملفات الزائدة
            if (files.length > this.config.storage.maxFiles) {
                const filesToDelete = files.slice(this.config.storage.maxFiles);
                filesToDelete.forEach(file => {
                    try {
                        fs.unlinkSync(file.path);
                    } catch (error) {
                        this.error('system', 'Failed to delete old log file', { 
                            file: file.name, 
                            error: error.message 
                        });
                    }
                });
            }
            
            this.info('system', 'Log rotation completed', {
                totalFiles: files.length,
                compressed: this.config.storage.compression,
                maxFiles: this.config.storage.maxFiles
            });
            
        } catch (error) {
            this.error('system', 'Log rotation failed', { error: error.message });
        }
    }
    
    /**
     * إعداد الفلاش التلقائي
     */
    setupAutoFlush() {
        setInterval(() => {
            this.flush();
        }, this.config.storage.flushInterval);
        
        // حفظ عند إغلاق التطبيق
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.flush();
            });
        } else if (typeof process !== 'undefined') {
            process.on('exit', () => {
                this.flush();
            });
            process.on('SIGINT', () => {
                this.flush();
                process.exit();
            });
        }
    }
    
    /**
     * تنسيق JSON
     */
    formatJSON(logEntry) {
        return JSON.stringify(logEntry, null, this.config.format.jsonIndent);
    }
    
    /**
     * تنسيق بسيط
     */
    formatSimple(logEntry) {
        const timestamp = new Date(logEntry.timestamp).toISOString();
        return `[${timestamp}] [${logEntry.level.toUpperCase()}] [${logEntry.category}] ${logEntry.message}`;
    }
    
    /**
     * تنسيق ملون للوحدة الطرفية
     */
    formatColored(logEntry) {
        const colors = {
            debug: '\x1b[36m',    // cyan
            info: '\x1b[32m',     // green
            warn: '\x1b[33m',     // yellow
            error: '\x1b[31m',    // red
            critical: '\x1b[35m'  // magenta
        };
        
        const reset = '\x1b[0m';
        const timestamp = new Date(logEntry.timestamp).toLocaleString();
        const color = colors[logEntry.level] || colors.info;
        
        let output = `${color}[${timestamp}] [${logEntry.level.toUpperCase()}] [${logEntry.category}] ${logEntry.message}${reset}`;
        
        if (Object.keys(logEntry.context).length > 0) {
            output += `\n${JSON.stringify(logEntry.context, null, 2)}`;
        }
        
        return output;
    }
    
    /**
     * تنسيق مفصل
     */
    formatDetailed(logEntry) {
        let output = '\n=== تفاصيل السجل ===\n';
        output += `المعرف: ${logEntry.id}\n`;
        output += `الوقت: ${logEntry.timestamp}\n`;
        output += `المستوى: ${logEntry.level}\n`;
        output += `الفئة: ${logEntry.category}\n`;
        output += `الرسالة: ${logEntry.message}\n`;
        output += `الجلسة: ${logEntry.sessionId}\n`;
        output += `العملية: ${logEntry.pid}\n`;
        output += `المضيف: ${logEntry.hostname}\n`;
        
        if (Object.keys(logEntry.context).length > 0) {
            output += `السياق: ${JSON.stringify(logEntry.context, null, 2)}\n`;
        }
        
        if (logEntry.metadata && Object.keys(logEntry.metadata).length > 0) {
            output += `البيانات الوصفية: ${JSON.stringify(logEntry.metadata, null, 2)}\n`;
        }
        
        if (logEntry.stackTrace) {
            output += `تتبع المكدس: ${logEntry.stackTrace}\n`;
        }
        
        output += '=====================\n';
        
        return output;
    }
    
    /**
     * تنسيق syslog
     */
    formatSyslog(logEntry) {
        const priorities = {
            debug: 7,
            info: 6,
            warn: 4,
            error: 3,
            critical: 0
        };
        
        const timestamp = new Date(logEntry.timestamp).toUTCString();
        const priority = priorities[logEntry.level] || 6;
        const hostname = logEntry.hostname || 'localhost';
        const appName = 'saler-app';
        
        return `<${priority}>${timestamp} ${hostname} ${appName}[${logEntry.pid}]: ${logEntry.level.toUpperCase()}[${logEntry.category}]: ${logEntry.message}`;
    }
    
    /**
     * تحديث الإحصائيات
     */
    updateStats(logEntry) {
        this.stats.totalLogs++;
        
        // إحصائيات حسب المستوى
        const levelCount = this.stats.logsByLevel.get(logEntry.level) || 0;
        this.stats.logsByLevel.set(logEntry.level, levelCount + 1);
        
        // إحصائيات حسب الفئة
        const categoryCount = this.stats.logsByCategory.get(logEntry.category) || 0;
        this.stats.logsByCategory.set(logEntry.category, categoryCount + 1);
        
        // آخر خطأ
        if (logEntry.level === 'error' || logEntry.level === 'critical') {
            this.stats.lastError = logEntry;
            this.stats.lastErrorTime = logEntry.timestamp;
        }
    }
    
    /**
     * الحصول على ملخص الإحصائيات
     */
    getStats() {
        return {
            ...this.stats,
            logsByLevel: Object.fromEntries(this.stats.logsByLevel),
            logsByCategory: Object.fromEntries(this.stats.logsByCategory),
            bufferSize: this.logBuffer.length,
            activeAlerts: this.alertSystem ? this.alertSystem.activeAlerts.size : 0,
            uptime: Date.now() - this.startTime,
            memoryUsage: this.getCurrentMemoryUsage(),
            performance: this.getPerformanceStats()
        };
    }
    
    /**
     * الحصول على إحصائيات الأداء
     */
    getPerformanceStats() {
        return {
            averageLogProcessingTime: this.getAverageLogProcessingTime(),
            memoryTrend: this.getMemoryTrend(),
            errorRate: this.getErrorRate(),
            throughput: this.getThroughputStats()
        };
    }
    
    /**
     * الحصول على استخدام الذاكرة الحالي
     */
    getCurrentMemoryUsage() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            return process.memoryUsage();
        }
        return null;
    }
    
    /**
     * الحصول على اتجاه الذاكرة
     */
    getMemoryTrend() {
        if (this.performanceMonitor.memoryUsage.length < 2) return 'stable';
        
        const recent = this.performanceMonitor.memoryUsage.slice(-5);
        const trend = recent[recent.length - 1].heapUsed - recent[0].heapUsed;
        
        if (trend > 1024 * 1024) return 'increasing';
        if (trend < -1024 * 1024) return 'decreasing';
        return 'stable';
    }
    
    /**
     * الحصول على معدل الأخطاء
     */
    getErrorRate() {
        const now = Date.now();
        const last5Minutes = now - (5 * 60 * 1000);
        const recentErrors = Array.from(this.errorCount.entries())
            .filter(([minute]) => minute >= Math.floor(last5Minutes / 60000))
            .reduce((sum, [, count]) => sum + count, 0);
        
        return recentErrors / 5; // أخطاء في الدقيقة
    }
    
    /**
     * الحصول على إحصائيات الإنتاجية
     */
    getThroughputStats() {
        const uptime = (Date.now() - this.startTime) / 1000; // ثانية
        const logsPerSecond = this.stats.totalLogs / uptime;
        const logsPerMinute = logsPerSecond * 60;
        const logsPerHour = logsPerMinute * 60;
        
        return {
            perSecond: parseFloat(logsPerSecond.toFixed(2)),
            perMinute: parseFloat(logsPerMinute.toFixed(2)),
            perHour: parseFloat(logsPerHour.toFixed(2))
        };
    }
    
    /**
     * مساعدة: إنشاء معرف السجل
     */
    generateLogId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * مساعدة: إنشاء معرف الجلسة
     */
    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * مساعدة: الحصول على رقم السطر
     */
    getLineNumber() {
        try {
            const stack = new Error().stack.split('\n');
            const callerLine = stack[2] || stack[1];
            const match = callerLine.match(/:(\d+):/);
            return match ? parseInt(match[1], 10) : null;
        } catch {
            return null;
        }
    }
    
    /**
     * مساعدة: الحصول على تتبع المكدس
     */
    getStackTrace() {
        try {
            const stack = new Error().stack.split('\n');
            return stack.slice(2, 6).join('\n'); // أول 4 مستويات
        } catch {
            return null;
        }
    }
    
    /**
     * مساعدة: الحصول على ملخص الإعدادات
     */
    getConfigSummary() {
        return {
            level: this.config.level,
            storageEnabled: {
                console: this.config.enableConsole,
                file: this.config.enableFile,
                remote: this.config.enableRemote,
                database: this.config.enableDatabase
            },
            alertsEnabled: this.config.enableAlerts,
            performance: this.config.performance
        };
    }
    
    /**
     * إغلاق النظام
     */
    async close() {
        console.log('إغلاق نظام السجلات...');
        
        // فلاش جميع البيانات
        await this.flush();
        
        // إنهاء الخدمات
        if (this.performanceMonitor) {
            clearInterval(this.performanceMonitor);
        }
        
        if (this.alertSystem) {
            clearInterval(this.alertSystem);
        }
        
        this.info('system', 'Logging system closed');
        console.log('تم إغلاق نظام السجلات بنجاح');
    }
}

// إنشاء instance عام
const logger = new AdvancedLoggingSystem();

// إضافة طرق سهلة للاستخدام
logger.logSystem = (level, message, context) => logger.log(level, 'system', message, context);
logger.logSecurity = (level, message, context) => logger.log(level, 'security', message, context);
logger.logPerformance = (level, message, context) => logger.log(level, 'performance', message, context);
logger.logBusiness = (level, message, context) => logger.log(level, 'business', message, context);
logger.logUser = (level, message, context) => logger.log(level, 'user', message, context);
logger.logNetwork = (level, message, context) => logger.log(level, 'network', message, context);
logger.logDatabase = (level, message, context) => logger.log(level, 'database', message, context);
logger.logCache = (level, message, context) => logger.log(level, 'cache', message, context);
logger.logAPI = (level, message, context) => logger.log(level, 'api', message, context);

// إضافة للمراجع العامة
if (typeof window !== 'undefined') {
    window.logger = logger;
    window.AdvancedLoggingSystem = AdvancedLoggingSystem;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdvancedLoggingSystem, logger };
}
