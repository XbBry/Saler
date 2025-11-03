/**
 * Sentry Configuration and Integration
 * إعدادات وتكامل Sentry

تكامل متقدم مع Sentry لمراقبة الأخطاء والاستثناءات
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
            beforeSend: config.beforeSend || this.defaultBeforeSend,
            beforeBreadcrumb: config.beforeBreadcrumb || this.defaultBeforeBreadcrumb,
            integrations: config.integrations || [],
            tracesSampleRate: config.tracesSampleRate || 0.1,
            replaysSessionSampleRate: config.replaysSessionSampleRate || 0.1,
            replaysOnErrorSampleRate: config.replaysOnErrorSampleRate || 1.0,
            ignoreErrors: config.ignoreErrors || [
                'Script error.',
                'Non-Error promise rejection captured'
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
                /\.local/i
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
                enableSlowSQLTracking: config.enableSlowSQLTracking !== false
            },
            performance: {
                enableLongTaskTracking: config.enableLongTaskTracking !== false,
                enableWebVitals: config.enableWebVitals !== false,
                enableAssetTracking: config.enableAssetTracking !== false
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
     * تهيئة Sentry
     */
    init() {
        if (typeof Sentry === 'undefined') {
            console.warn('Sentry غير متوفر. تحقق من تحميل المكتبة');
            return;
        }
        
        try {
            // تكوين Sentry
            Sentry.init({
                dsn: this.config.dsn,
                environment: this.config.environment,
                release: this.config.release,
                sampleRate: this.config.sampleRate,
                maxBreadcrumbs: 50,
                beforeSend: (event) => this.config.beforeSend(event),
                beforeBreadcrumb: (breadcrumb) => this.config.beforeBreadcrumb(breadcrumb),
                tracesSampleRate: this.config.tracesSampleRate,
                integrations: this.getIntegrations(),
                ignoreErrors: this.config.ignoreErrors,
                ignoreUrls: this.config.ignoreUrls,
                debug: this.config.debug
            });
            
            this.isInitialized = true;
            console.log('تم تهيئة Sentry بنجاح');
            
            // إعداد المراقبين المخصصين
            this.setupCustomTracking();
            
        } catch (error) {
            console.error('خطأ في تهيئة Sentry:', error);
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
     * الإعداد المخصص للتتبع
     */
    setupCustomTracking() {
        // تتبع التنقل
        this.setupNavigationTracking();
        
        // تتبع التفاعل
        this.setupInteractionTracking();
        
        // تتبع الأداء
        if (this.config.enablePerformance) {
            this.setupPerformanceTracking();
        }
        
        // تتبع الشبكة
        if (this.config.telemetry.enableNetworkTracking) {
            this.setupNetworkTracking();
        }
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
     * الحصول على الإحصائيات
     */
    getStats() {
        return {
            is_initialized: this.isInitialized,
            breadcrumbs_count: this.breadcrumbs.length,
            contexts_count: this.context.size,
            config: this.config,
            breadcrumbs: this.breadcrumbs.slice(-10) // آخر 10 breadcrumbs
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