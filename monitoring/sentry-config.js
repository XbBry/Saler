/**
 * نظام المراقبة الشامل - Sentry Configuration and Integration
 * Comprehensive Monitoring System - Sentry Configuration and Integration
 * 
 * تكامل متقدم مع Sentry لمراقبة الأخطاء والأداء والاستثناءات
 * Advanced Sentry integration for error monitoring, performance tracking, and exception handling
 * 
 * يتضمن:
 * - Error tracking & performance monitoring
 * - User context tracking & session replays
 * - Release tracking & health monitoring
 * - Advanced alerting & notifications
 * - Integration with backend services
 * - Real-time analytics & insights
 */

class SentryConfig {
    constructor(config = {}) {
        this.defaultConfig = {
            dsn: config.dsn || process.env.VITE_SENTRY_DSN || 'YOUR_SENTRY_DSN_HERE',
            environment: config.environment || process.env.NODE_ENV || 'development',
            release: config.release || '1.0.0',
            sampleRate: config.sampleRate || 1.0, // نسبة العينات
            enablePerformance: config.enablePerformance !== false,
            enableUserTracking: config.enableUserTracking !== false,
            enableBrowserErrorCapture: config.enableBrowserErrorCapture !== false,
            enableServerSideTracking: config.enableServerSideTracking !== false,
            enableReleaseTracking: config.enableReleaseTracking !== false,
            enableHealthMonitoring: config.enableHealthMonitoring !== false,
            enableRealTimeAlerts: config.enableRealTimeAlerts !== false,
            beforeSend: config.beforeSend || this.defaultBeforeSend,
            beforeBreadcrumb: config.beforeBreadcrumb || this.defaultBeforeBreadcrumb,
            integrations: config.integrations || [],
            tracesSampleRate: config.tracesSampleRate || 0.1,
            replaysSessionSampleRate: config.replaysSessionSampleRate || 0.1,
            replaysOnErrorSampleRate: config.replaysOnErrorSampleRate || 1.0,
            // Error filtering
            ignoreErrors: config.ignoreErrors || [
                'Script error.',
                'Non-Error promise rejection captured',
                'ResizeObserver loop limit exceeded',
                'Non-Error promise rejection captured asynchronously'
            ],
            ignoreUrls: config.ignoreUrls || [
                /graphite\.git/i,
                /graphite\.com/i,
                /extensions\//i,
                /^chrome:\/\//i,
                /^moz-extension:\/\//i,
                /^chrome-extension:\/\//i,
                /^moz-extension:\/\//i,
                /^edge:\/\//i,
                /localhost/i,
                /\.local/i,
                /connect\.facebook\.net/i,
                /googleadservices\.com/i
            ],
            include: {
                // تضمين المصادر
                paths: config.includePaths || ['src/'],
                // تضمين session storage
                session: config.includeSession !== false,
                // تضمين local storage
                localStorage: config.includeLocalStorage !== false
            },
            customTags: config.customTags || {},
            telemetry: {
                enableNetworkTracking: config.enableNetworkTracking !== false,
                enableSlowSQLTracking: config.enableSlowSQLTracking !== false,
                enableConnectionTracking: config.enableConnectionTracking !== false,
                enablePerformanceMonitoring: config.enablePerformanceMonitoring !== false
            },
            performance: {
                enableLongTaskTracking: config.enableLongTaskTracking !== false,
                enableWebVitals: config.enableWebVitals !== false,
                enableAssetTracking: config.enableAssetTracking !== false,
                enableMemoryTracking: config.enableMemoryTracking !== false,
                enableCPUTracking: config.enableCPUTracking !== false
            },
            alerting: {
                enableRealTimeAlerts: config.enableRealTimeAlerts !== false,
                alertThresholds: config.alertThresholds || {
                    errorRate: 5, // نسبة الخطأ
                    responseTime: 3000, // ms
                    memoryUsage: 80, // %
                    cpuUsage: 70 // %
                },
                channels: config.alertChannels || {
                    email: true,
                    slack: true,
                    discord: false,
                    sms: false
                }
            },
            backend: {
                endpoint: config.backendEndpoint || process.env.VITE_BACKEND_URL,
                apiKey: config.apiKey || process.env.VITE_API_KEY,
                enableHealthChecks: config.enableHealthChecks !== false,
                enablePerformanceMetrics: config.enablePerformanceMetrics !== false
            },
            debug: config.debug || false,
            logLevel: config.logLevel || 'error'
        };
        
        this.config = { ...this.defaultConfig, ...config };
        this.isInitialized = false;
        this.breadcrumbs = [];
        this.context = new Map();
        
        this.init();
    }
    
    /**
     * تهيئة Sentry الشاملة
     * Initialize comprehensive Sentry setup
     */
    init() {
        if (typeof Sentry === 'undefined') {
            console.warn('Sentry غير متوفر. تحقق من تحميل المكتبة');
            return;
        }
        
        try {
            // تكوين Sentry المتقدم
            Sentry.init({
                dsn: this.config.dsn,
                environment: this.config.environment,
                release: this.config.release,
                sampleRate: this.config.sampleRate,
                maxBreadcrumbs: 100, // زيادة عدد breadcrumbs
                maxValueLength: 1000,
                maxAdditionalBreadcrumbLength: 1000,
                beforeSend: (event) => this.config.beforeSend(event),
                beforeBreadcrumb: (breadcrumb) => this.config.beforeBreadcrumb(breadcrumb),
                tracesSampleRate: this.config.tracesSampleRate,
                integrations: this.getIntegrations(),
                ignoreErrors: this.config.ignoreErrors,
                ignoreUrls: this.config.ignoreUrls,
                debug: this.config.debug,
                attachStacktrace: true,
                showReportDialog: {
                    showReportDialog: this.config.environment === 'production',
                    lang: 'ar'
                }
            });
            
            this.isInitialized = true;
            console.log('تم تهيئة نظام المراقبة الشامل بنجاح');
            
            // إعداد المراقبين المتقدمين
            this.setupAdvancedTracking();
            
            // إعداد التكامل مع Backend
            if (this.config.enableServerSideTracking) {
                this.setupBackendIntegration();
            }
            
            // إعداد تتبع الإصدارات
            if (this.config.enableReleaseTracking) {
                this.setupReleaseTracking();
            }
            
            // إعداد المراقبة الصحية
            if (this.config.enableHealthMonitoring) {
                this.setupHealthMonitoring();
            }
            
            // إعداد التنبيهات الفورية
            if (this.config.enableRealTimeAlerts) {
                this.setupRealTimeAlerts();
            }
            
        } catch (error) {
            console.error('خطأ في تهيئة نظام المراقبة:', error);
            this.captureException(error, { component: 'SentryConfig.init' });
        }
    }
    
    /**
     * الحصول على التكاملات
     */
    getIntegrations() {
        const integrations = [];
        
        // Integration للطبيعة
        if (this.config.enablePerformance) {
            integrations.push(
                new Sentry.BrowserTracing({
                    tracingOrigins: ['localhost', 'saler.com', /^\//],
                    routingInstrumentation: Sentry.routingInstrumentation
                })
            );
        }
        
        // Integration للـ Replays
        if (this.config.replaysSessionSampleRate > 0) {
            integrations.push(
                new Sentry.Replay({
                    sessionSampleRate: this.config.replaysSessionSampleRate,
                    errorSampleRate: this.config.replaysOnErrorSampleRate
                })
            );
        }
        
        // Integration لتتبع المستخدم
        if (this.config.enableUserTracking) {
            integrations.push(
                new Sentry.UserAgent()
            );
        }
        
        // Integration لتتبع المتصفح
        if (this.config.enableBrowserErrorCapture) {
            integrations.push(
                new Sentry.BrowserGlobalErrorIntegration()
            );
        }
        
        // إضافة التكاملات المخصصة
        if (this.config.integrations.length > 0) {
            integrations.push(...this.config.integrations);
        }
        
        return integrations;
    }
    
    /**
     * الإعداد المتقدم للتتبع الشامل
     * Advanced comprehensive tracking setup
     */
    setupAdvancedTracking() {
        // تتبع التنقل المتقدم
        this.setupNavigationTracking();
        
        // تتبع التفاعل المتقدم
        this.setupInteractionTracking();
        
        // تتبع الأداء المتقدم
        if (this.config.enablePerformance) {
            this.setupAdvancedPerformanceTracking();
        }
        
        // تتبع الشبكة المتقدم
        if (this.config.telemetry.enableNetworkTracking) {
            this.setupAdvancedNetworkTracking();
        }
        
        // تتبع الذاكرة والمعالج
        if (this.config.performance.enableMemoryTracking) {
            this.setupMemoryTracking();
        }
        
        if (this.config.performance.enableCPUTracking) {
            this.setupCPUTracking();
        }
        
        // تتبع الاتصال
        if (this.config.telemetry.enableConnectionTracking) {
            this.setupConnectionTracking();
        }
        
        // تتبع الأخطاء المخصصة
        this.setupCustomErrorTracking();
        
        // تتبع المستخدم المتقدم
        this.setupAdvancedUserTracking();
    }
    
    /**
     * إعداد التكامل مع Backend
     */
    setupBackendIntegration() {
        if (!this.config.backend.endpoint || !this.config.backend.apiKey) {
            console.warn('Backend integration disabled - missing endpoint or API key');
            return;
        }
        
        // إرسال البيانات إلى Backend
        this.backendSync = setInterval(() => {
            this.syncDataWithBackend();
        }, 30000); // كل 30 ثانية
        
        // إرسال الأحداث الحرجة فوراً
        this.setupCriticalEventForwarding();
    }
    
    /**
     * إعداد تتبع الإصدارات
     */
    setupReleaseTracking() {
        // تتبع معلومات الإصدار
        this.setTag('version', this.config.release);
        this.setTag('build_time', this.getBuildTime());
        this.setTag('git_commit', this.getGitCommit());
        
        // تتبع إصدار المتصفح
        this.setTag('browser_version', navigator.userAgent);
        this.setTag('platform', navigator.platform);
        
        // تتبع معلومات التوزيع
        this.setContext('deployment', {
            environment: this.config.environment,
            release: this.config.release,
            timestamp: new Date().toISOString(),
            git_commit: this.getGitCommit(),
            build_info: this.getBuildInfo()
        });
    }
    
    /**
     * إعداد المراقبة الصحية
     */
    setupHealthMonitoring() {
        // مراقبة دورية للـ health checks
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, 60000); // كل دقيقة
        
        // مراقبة الذاكرة والـ performance
        if ('performance' in window && 'memory' in performance) {
            this.setupMemoryMonitoring();
        }
        
        // مراقبة معدل الأخطاء
        this.setupErrorRateMonitoring();
    }
    
    /**
     * إعداد التنبيهات الفورية
     */
    setupRealTimeAlerts() {
        this.alertRules = {
            highErrorRate: { threshold: this.config.alerting.alertThresholds.errorRate, window: 300 },
            highResponseTime: { threshold: this.config.alerting.alertThresholds.responseTime, window: 60 },
            highMemoryUsage: { threshold: this.config.alerting.alertThresholds.memoryUsage, window: 120 },
            highCPUUsage: { threshold: this.config.alerting.alertThresholds.cpuUsage, window: 120 }
        };
        
        // مراقبة مستمرة للتنبيهات
        this.alertMonitoringInterval = setInterval(() => {
            this.checkAlertConditions();
        }, 30000); // كل 30 ثانية
    }
    
    /**
     * التتبع المتقدم للأداء
     */
    setupAdvancedPerformanceTracking() {
        // تتبع Web Vitals المتقدم
        if (this.config.performance.enableWebVitals) {
            this.setupAdvancedWebVitals();
        }
        
        // تتبع الموارد المتقدم
        if (this.config.performance.enableAssetTracking) {
            this.setupAdvancedAssetTracking();
        }
        
        // تتبع المهام الطويلة
        if (this.config.performance.enableLongTaskTracking) {
            this.setupLongTaskTracking();
        }
        
        // تتبع استخدام الطاقة (للأجهزة المحمولة)
        this.setupEnergyTracking();
    }
    
    /**
     * إرسال البيانات إلى Backend
     */
    async syncDataWithBackend() {
        try {
            const stats = this.getStats();
            const healthData = this.collectHealthData();
            
            const response = await fetch(`${this.config.backend.endpoint}/api/monitoring/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.backend.apiKey}`
                },
                body: JSON.stringify({
                    sentry_stats: stats,
                    health_data: healthData,
                    timestamp: new Date().toISOString(),
                    environment: this.config.environment
                })
            });
            
            if (response.ok) {
                this.addBreadcrumb({
                    category: 'backend_sync',
                    message: 'Successfully synced monitoring data with backend',
                    level: 'info'
                });
            }
        } catch (error) {
            console.warn('فشل في مزامنة البيانات مع Backend:', error);
        }
    }
    
    /**
     * جمع بيانات المراقبة الصحية
     */
    collectHealthData() {
        const data = {
            timestamp: new Date().toISOString(),
            performance: {},
            memory: {},
            network: {},
            errors: {}
        };
        
        // بيانات الأداء
        if (performance.timing) {
            const timing = performance.timing;
            data.performance = {
                loadTime: timing.loadEventEnd - timing.navigationStart,
                domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                firstByte: timing.responseStart - timing.navigationStart
            };
        }
        
        // بيانات الذاكرة
        if (performance.memory) {
            data.memory = {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }
        
        // معدل الأخطاء
        data.errors = this.getErrorStatistics();
        
        return data;
    }
    
    /**
     * إعداد تتبع التنقل
     */
    setupNavigationTracking() {
        // تتبع تغيير الصفحة
        window.addEventListener('popstate', () => {
            this.addBreadcrumb({
                category: 'navigation',
                message: 'Page navigation',
                level: 'info',
                data: {
                    url: window.location.href,
                    referrer: document.referrer
                }
            });
        });
        
        // تتبع تغيير الرابط
        const pushState = history.pushState;
        const replaceState = history.replaceState;
        
        history.pushState = function(...args) {
            const result = pushState.apply(this, args);
            
            Sentry.addBreadcrumb({
                category: 'navigation',
                message: 'Page navigation',
                level: 'info',
                data: {
                    url: window.location.href,
                    referrer: document.referrer
                }
            });
            
            return result;
        };
        
        history.replaceState = function(...args) {
            const result = replaceState.apply(this, args);
            
            Sentry.addBreadcrumb({
                category: 'navigation',
                message: 'Page navigation',
                level: 'info',
                data: {
                    url: window.location.href,
                    referrer: document.referrer
                }
            });
            
            return result;
        };
    }
    
    /**
     * إعداد تتبع التفاعل
     */
    setupInteractionTracking() {
        // تتبع النقرات المهمة
        document.addEventListener('click', (event) => {
            const target = event.target.closest('button, a, [role="button"]');
            
            if (target) {
                this.addBreadcrumb({
                    category: 'ui',
                    message: `User interaction: ${target.tagName.toLowerCase()}`,
                    level: 'info',
                    data: {
                        tag: target.tagName.toLowerCase(),
                        id: target.id,
                        class: target.className,
                        text: target.textContent?.substring(0, 50),
                        href: target.href
                    }
                });
            }
        }, true);
        
        // تتبع إرسال النماذج
        document.addEventListener('submit', (event) => {
            this.addBreadcrumb({
                category: 'ui',
                message: 'Form submission',
                level: 'info',
                data: {
                    form_id: event.target.id,
                    form_action: event.target.action,
                    fields_count: event.target.elements.length
                }
            });
        });
        
        // تتبع تغيير القيم
        document.addEventListener('input', (event) => {
            if (event.target.type === 'password') return;
            
            this.addBreadcrumb({
                category: 'ui',
                message: 'Input change',
                level: 'info',
                data: {
                    element: event.target.tagName.toLowerCase(),
                    type: event.target.type,
                    name: event.target.name,
                    value_length: event.target.value.length
                }
            });
        });
    }
    
    /**
     * إعداد تتبع الأداء
     */
    setupPerformanceTracking() {
        // تتبع أداء تحميل الصفحة
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                
                if (navigation) {
                    this.addBreadcrumb({
                        category: 'performance',
                        message: 'Page load performance',
                        level: 'info',
                        data: {
                            dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
                            load_complete: navigation.loadEventEnd - navigation.navigationStart,
                            first_paint: this.getFirstPaint(),
                            first_contentful_paint: this.getFirstContentfulPaint()
                        }
                    });
                }
            }, 100);
        });
        
        // تتبع أداء الموارد
        if ('PerformanceObserver' in window) {
            this.setupResourcePerformanceTracking();
        }
        
        // تتبع Web Vitals
        if (this.config.performance.enableWebVitals) {
            this.setupWebVitalsTracking();
        }
    }
    
    /**
     * تتبع أداء الموارد
     */
    setupResourcePerformanceTracking() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                
                entries.forEach((entry) => {
                    if (entry.entryType === 'resource') {
                        // تتبع الموارد البطيئة
                        if (entry.duration > 2000) {
                            this.addBreadcrumb({
                                category: 'performance',
                                message: `Slow resource: ${entry.name}`,
                                level: 'warning',
                                data: {
                                    url: entry.name,
                                    duration: entry.duration,
                                    size: entry.transferSize,
                                    type: entry.initiatorType
                                }
                            });
                        }
                        
                        // تتبع أخطاء تحميل الموارد
                        if (entry.transferSize === 0 || entry.duration > 10000) {
                            Sentry.captureMessage(`Resource load failed: ${entry.name}`, 'warning');
                        }
                    }
                });
            });
            
            observer.observe({ entryTypes: ['resource'] });
        } catch (error) {
            console.warn('فشل في إعداد تتبع أداء الموارد:', error);
        }
    }
    
    /**
     * إعداد تتبع Web Vitals
     */
    setupWebVitalsTracking() {
        // LCP - Largest Contentful Paint
        this.observeVital('largest-contentful-paint', (entries) => {
            const lastEntry = entries[entries.length - 1];
            
            this.addBreadcrumb({
                category: 'performance',
                message: `LCP: ${lastEntry.startTime}ms`,
                level: lastEntry.startTime > 2500 ? 'warning' : 'info',
                data: {
                    lcp: lastEntry.startTime,
                    element: lastEntry.element?.tagName
                }
            });
            
            if (lastEntry.startTime > 4000) {
                Sentry.captureMessage(`Critical LCP: ${lastEntry.startTime}ms`, 'error');
            }
        });
        
        // FID - First Input Delay
        this.observeVital('first-input', (entries) => {
            const firstEntry = entries[0];
            const fid = firstEntry.processingStart - firstEntry.startTime;
            
            this.addBreadcrumb({
                category: 'performance',
                message: `FID: ${fid}ms`,
                level: fid > 100 ? 'warning' : 'info',
                data: {
                    fid: fid,
                    event_type: firstEntry.name
                }
            });
            
            if (fid > 300) {
                Sentry.captureMessage(`Critical FID: ${fid}ms`, 'error');
            }
        });
        
        // CLS - Cumulative Layout Shift
        let clsValue = 0;
        this.observeVital('layout-shift', (entries) => {
            entries.forEach((entry) => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            
            this.addBreadcrumb({
                category: 'performance',
                message: `CLS: ${clsValue.toFixed(3)}`,
                level: clsValue > 0.1 ? 'warning' : 'info',
                data: { cls: clsValue }
            });
        });
    }
    
    /**
     * مراقبة مقياس حيوي
     */
    observeVital(name, callback) {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    callback(list.getEntries());
                });
                observer.observe({ type: name, buffered: true });
            } catch (error) {
                console.warn(`فشل في مراقبة ${name}:`, error);
            }
        }
    }
    
    /**
     * إعداد تتبع الشبكة
     */
    setupNetworkTracking() {
        // تتبع fetch
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            const startTime = performance.now();
            const url = args[0].toString();
            
            return originalFetch(...args)
                .then(response => {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    if (response.ok) {
                        this.addBreadcrumb({
                            category: 'http',
                            message: `HTTP Success: ${response.status}`,
                            level: 'info',
                            data: {
                                url: url,
                                method: args[1]?.method || 'GET',
                                status: response.status,
                                duration: duration
                            }
                        });
                    } else {
                        Sentry.captureMessage(`HTTP Error: ${response.status} ${url}`, 'error');
                    }
                    
                    return response;
                })
                .catch(error => {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    this.addBreadcrumb({
                        category: 'http',
                        message: `Network Error: ${error.message}`,
                        level: 'error',
                        data: {
                            url: url,
                            method: args[1]?.method || 'GET',
                            error: error.message,
                            duration: duration
                        }
                    });
                    
                    throw error;
                });
        };
    }
    
    /**
     * إضافة breadcrumb
     */
    addBreadcrumb(breadcrumb) {
        if (!this.isInitialized) return;
        
        try {
            Sentry.addBreadcrumb(breadcrumb);
            this.breadcrumbs.push(breadcrumb);
            
            // الاحتفاظ بآخر 50 breadcrumb فقط
            if (this.breadcrumbs.length > 50) {
                this.breadcrumbs.shift();
            }
        } catch (error) {
            console.warn('فشل في إضافة breadcrumb:', error);
        }
    }
    
    /**
     * تعيين معلومات المستخدم
     */
    setUser(user) {
        if (!this.isInitialized) return;
        
        try {
            Sentry.setUser(user);
            
            this.addBreadcrumb({
                category: 'user',
                message: 'User context updated',
                level: 'info',
                data: user
            });
        } catch (error) {
            console.warn('فشل في تعيين معلومات المستخدم:', error);
        }
    }
    
    /**
     * تعيين السياق الإضافي
     */
    setContext(name, context) {
        if (!this.isInitialized) return;
        
        try {
            Sentry.setContext(name, context);
            this.context.set(name, context);
            
            this.addBreadcrumb({
                category: 'context',
                message: `Context updated: ${name}`,
                level: 'info',
                data: context
            });
        } catch (error) {
            console.warn('فشل في تعيين السياق:', error);
        }
    }
    
    /**
     * تعيين الوسوم
     */
    setTag(name, value) {
        if (!this.isInitialized) return;
        
        try {
            Sentry.setTag(name, value);
        } catch (error) {
            console.warn('فشل في تعيين الوسم:', error);
        }
    }
    
    /**
     * تسجيل رسالة
     */
    captureMessage(message, level = 'info', context = {}) {
        if (!this.isInitialized) return;
        
        try {
            Sentry.captureMessage(message, level, {
                extra: context
            });
        } catch (error) {
            console.warn('فشل في تسجيل الرسالة:', error);
        }
    }
    
    /**
     * تسجيل استثناء
     */
    captureException(exception, context = {}) {
        if (!this.isInitialized) return;
        
        try {
            Sentry.captureException(exception, {
                extra: context
            });
        } catch (error) {
            console.warn('فشل في تسجيل الاستثناء:', error);
        }
    }
    
    /**
     * تنظيف السياق
     */
    clearContext(name = null) {
        if (!this.isInitialized) return;
        
        try {
            if (name) {
                Sentry.setContext(name, {});
                this.context.delete(name);
            } else {
                Sentry.configureScope(scope => {
                    scope.clear();
                });
                this.context.clear();
            }
        } catch (error) {
            console.warn('فشل في تنظيف السياق:', error);
        }
    }
    
    /**
     * الحصول على First Paint
     */
    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : null;
    }
    
    /**
     * الحصول على First Contentful Paint
     */
    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : null;
    }
    
    /**
     * المعالج الافتراضي قبل الإرسال
     */
    defaultBeforeSend(event) {
        // إضافة معلومات إضافية
        if (event.exception) {
            event.extra = {
                ...event.extra,
                user_agent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString(),
                breadcrumbs_count: this.breadcrumbs.length
            };
        }
        
        // تجاهل بعض الأخطاء
        if (event.message && this.config.ignoreErrors.some(pattern => 
            typeof pattern === 'string' ? 
                event.message.includes(pattern) : 
                pattern.test(event.message)
        )) {
            return null;
        }
        
        return event;
    }
    
    /**
     * المعالج الافتراضي لـ breadcrumb
     */
    defaultBeforeBreadcrumb(breadcrumb) {
        // تجاهل بعض الـ breadcrumbs غير المهمة
        if (breadcrumb.category === 'ui' && breadcrumb.message.includes('mousemove')) {
            return null;
        }
        
        return breadcrumb;
    }
    
    /**
     * الحصول على الإحصائيات الشاملة
     */
    getStats() {
        return {
            is_initialized: this.isInitialized,
            breadcrumbs_count: this.breadcrumbs.length,
            contexts_count: this.context.size,
            config: this.config,
            breadcrumbs: this.breadcrumbs.slice(-10), // آخر 10 breadcrumbs
            performance_stats: this.getPerformanceStats(),
            error_stats: this.getErrorStatistics(),
            health_status: this.getHealthStatus(),
            user_analytics: this.getUserAnalytics(),
            uptime: this.getUptimeStats()
        };
    }
    
    /**
     * إحصائيات الأداء المتقدمة
     */
    getPerformanceStats() {
        const stats = {
            page_load: {},
            resource_timing: {},
            vitals: {},
            network: {},
            memory: {}
        };
        
        // صفحة تحميل
        if (performance.timing) {
            const timing = performance.timing;
            stats.page_load = {
                dns_lookup: timing.domainLookupEnd - timing.domainLookupStart,
                tcp_connection: timing.connectEnd - timing.connectStart,
                server_response: timing.responseEnd - timing.requestStart,
                dom_processing: timing.domComplete - timing.domLoading,
                load_complete: timing.loadEventEnd - timing.navigationStart
            };
        }
        
        // Web Vitals
        if (this.vitals) {
            stats.vitals = this.vitals;
        }
        
        // الذاكرة
        if (performance.memory) {
            stats.memory = {
                used_heap_size: performance.memory.usedJSHeapSize,
                total_heap_size: performance.memory.totalJSHeapSize,
                heap_size_limit: performance.memory.jsHeapSizeLimit
            };
        }
        
        return stats;
    }
    
    /**
     * إحصائيات الأخطاء المتقدمة
     */
    getErrorStatistics() {
        const errorStats = {
            total_errors: this.errorCount || 0,
            error_types: {},
            error_frequency: {},
            last_errors: this.recentErrors || []
        };
        
        // تصنيف الأخطاء
        if (this.breadcrumbs) {
            this.breadcrumbs.forEach(breadcrumb => {
                if (breadcrumb.category === 'exception' || breadcrumb.level === 'error') {
                    const errorType = breadcrumb.message || 'Unknown';
                    errorStats.error_types[errorType] = (errorStats.error_types[errorType] || 0) + 1;
                }
            });
        }
        
        return errorStats;
    }
    
    /**
     * حالة الصحة الحالية
     */
    getHealthStatus() {
        const status = {
            overall: 'healthy',
            components: {},
            issues: [],
            recommendations: []
        };
        
        // فحص الذاكرة
        if (performance.memory) {
            const memoryUsage = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;
            if (memoryUsage > this.config.alerting.alertThresholds.memoryUsage) {
                status.components.memory = 'warning';
                status.issues.push('High memory usage');
                status.recommendations.push('Consider optimizing memory usage or garbage collection');
            } else {
                status.components.memory = 'healthy';
            }
        }
        
        // فحص الأداء
        if (this.vitals) {
            if (this.vitals.lcp && this.vitals.lcp > 2500) {
                status.components.performance = 'warning';
                status.issues.push('Slow Largest Contentful Paint');
                status.recommendations.push('Optimize largest content element loading');
            } else {
                status.components.performance = 'healthy';
            }
        }
        
        // تحديد الحالة العامة
        if (status.issues.length > 0) {
            status.overall = status.issues.some(issue => issue.includes('High memory') || issue.includes('critical')) ? 'critical' : 'warning';
        }
        
        return status;
    }
    
    /**
     * تحليلات المستخدم المتقدمة
     */
    getUserAnalytics() {
        return {
            session_duration: this.getSessionDuration(),
            page_views: this.getPageViewCount(),
            interactions: this.getInteractionCount(),
            device_info: this.getDeviceInfo(),
            geo_location: this.getGeoLocation(),
            browser_info: this.getBrowserInfo()
        };
    }
    
    /**
     * إحصائيات التشغيل
     */
    getUptimeStats() {
        return {
            start_time: this.startTime,
            current_time: Date.now(),
            uptime_ms: Date.now() - this.startTime,
            health_checks: this.healthCheckResults || [],
            last_error: this.lastError || null
        };
    }
    
    /**
     * مساعدة: الحصول على مدة الجلسة
     */
    getSessionDuration() {
        if (!this.sessionStartTime) return 0;
        return Date.now() - this.sessionStartTime;
    }
    
    /**
     * مساعدة: الحصول على عدد مشاهدة الصفحات
     */
    getPageViewCount() {
        return this.pageViewCount || 0;
    }
    
    /**
     * مساعدة: الحصول على معلومات الجهاز
     */
    getDeviceInfo() {
        return {
            user_agent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookie_enabled: navigator.cookieEnabled,
            on_line: navigator.onLine,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`
        };
    }
    
    /**
     * مساعدة: الحصول على معلومات المتصفح
     */
    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let version = 'Unknown';
        
        if (ua.includes('Chrome')) {
            browser = 'Chrome';
            version = ua.match(/Chrome\/(\d+)/)?.[1];
        } else if (ua.includes('Firefox')) {
            browser = 'Firefox';
            version = ua.match(/Firefox\/(\d+)/)?.[1];
        } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
            browser = 'Safari';
            version = ua.match(/Version\/(\d+)/)?.[1];
        } else if (ua.includes('Edge')) {
            browser = 'Edge';
            version = ua.match(/Edge\/(\d+)/)?.[1];
        }
        
        return { browser, version, user_agent: ua };
    }
    
    /**
     * المساعدة: الحصول على معلومات Git
     */
    getGitCommit() {
        // محاولة الحصول على معلومات Git من meta tags أو global variables
        const metaTag = document.querySelector('meta[name="git-commit"]');
        if (metaTag) return metaTag.content;
        
        if (window.GIT_COMMIT) return window.GIT_COMMIT;
        
        return 'unknown';
    }
    
    /**
     * المساعدة: الحصول على وقت البناء
     */
    getBuildTime() {
        const metaTag = document.querySelector('meta[name="build-time"]');
        if (metaTag) return metaTag.content;
        
        if (window.BUILD_TIME) return window.BUILD_TIME;
        
        return new Date().toISOString();
    }
    
    /**
     * المساعدة: الحصول على معلومات البناء
     */
    getBuildInfo() {
        return {
            version: this.config.release,
            environment: this.config.environment,
            build_time: this.getBuildTime(),
            git_commit: this.getGitCommit(),
            node_version: process?.version || 'unknown',
            build_number: window.BUILD_NUMBER || 'unknown'
        };
    }
    
    /**
     * إغلاق Sentry
     */
    async close(timeout = 5000) {
        if (!this.isInitialized) return;
        
        try {
            await Sentry.close({ timeout });
            this.isInitialized = false;
            console.log('تم إغلاق Sentry');
        } catch (error) {
            console.warn('خطأ في إغلاق Sentry:', error);
        }
    }
}

// إنشاء instances عامة
const sentryConfig = new SentryConfig();

// إضافة functions على window للسهولة
window.SentryConfig = sentryConfig;
window.sentrySetUser = (user) => sentryConfig.setUser(user);
window.sentrySetContext = (name, context) => sentryConfig.setContext(name, context);
window.sentrySetTag = (name, value) => sentryConfig.setTag(name, value);
window.sentryCaptureMessage = (message, level, context) => sentryConfig.captureMessage(message, level, context);
window.sentryCaptureException = (exception, context) => sentryConfig.captureException(exception, context);

// تصدير للاستخدام مع وحدات
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SentryConfig, sentryConfig };
}