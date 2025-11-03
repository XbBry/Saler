/**
 * Error Tracking and Monitoring System
 * نظام تتبع ومراقبة الأخطاء
 * 
 * يتتبع الأخطاء والاستثناءات والمشاكل في التطبيق
 */

class ErrorTracking {
    constructor(config = {}) {
        this.config = {
            endpoint: config.endpoint || '/api/error-tracking',
            enableConsoleErrors: config.enableConsoleErrors !== false,
            enableUnhandledErrors: config.enableUnhandledErrors !== false,
            enableNetworkErrors: config.enableNetworkErrors !== false,
            enableResourceErrors: config.enableResourceErrors !== false,
            maxErrors: config.maxErrors || 100,
            batchSize: config.batchSize || 10,
            enableSentry: config.enableSentry || false,
            environment: config.environment || 'development',
            ignorePatterns: config.ignorePatterns || [
                'Script error.',
                'Non-Error promise rejection captured'
            ],
            ...config
        };
        
        this.errors = [];
        this.errorCount = 0;
        this.sessionId = this.generateSessionId();
        this.userAgent = navigator.userAgent;
        this.pageUrl = window.location.href;
        this.pageTitle = document.title;
        
        this.init();
    }
    
    init() {
        console.log('[ErrorTracking] تم تهيئة نظام تتبع الأخطاء');
        
        // إعداد تتبعات الأخطاء
        this.setupErrorTracking();
        
        // إعداد تتبعات console
        if (this.config.enableConsoleErrors) {
            this.setupConsoleTracking();
        }
        
        // إعداد تتبعات الشبكة
        if (this.config.enableNetworkErrors) {
            this.setupNetworkErrorTracking();
        }
        
        // إعداد تتبعات الموارد
        if (this.config.enableResourceErrors) {
            this.setupResourceErrorTracking();
        }
        
        // إعداد تتبعات الأخطاء غير المعالجة
        if (this.config.enableUnhandledErrors) {
            this.setupUnhandledErrorTracking();
        }
        
        // إعداد تتبعات Promise
        this.setupPromiseErrorTracking();
        
        // إعداد التنظيف الدوري
        this.setupPeriodicCleanup();
        
        // إعداد الإرسال الدوري
        this.startPeriodicReporting();
        
        // إعداد Sentry إذا كان مفعلاً
        if (this.config.enableSentry) {
            this.setupSentry();
        }
    }
    
    /**
     * إعداد تتبع الأخطاء الرئيسي
     */
    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.captureError({
                type: 'javascript_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error ? event.error.stack : null,
                source: 'window.onerror',
                timestamp: new Date().toISOString()
            });
        }, true);
        
        // تتبع أخطاء التصغير
        window.addEventListener('error', (event) => {
            if (event.error && event.error.stack) {
                const stack = event.error.stack;
                
                // البحث عن ملفات مصغرة
                const minifiedPattern = /([a-zA-Z0-9]+)\.min\.js/;
                if (minifiedPattern.test(stack)) {
                    this.captureError({
                        type: 'minified_js_error',
                        message: 'خطأ في ملف JavaScript مصغر',
                        stack: stack,
                        source: 'minified_error',
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }, true);
    }
    
    /**
     * إعداد تتبع console
     */
    setupConsoleTracking() {
        // حفظ console methods الأصلية
        const originalConsole = {
            error: console.error,
            warn: console.warn,
            info: console.info,
            log: console.log
        };
        
        // تتبع console.error
        console.error = (...args) => {
            this.captureConsoleError('error', args);
            originalConsole.error.apply(console, args);
        };
        
        // تتبع console.warn
        console.warn = (...args) => {
            this.captureConsoleError('warn', args);
            originalConsole.warn.apply(console, args);
        };
        
        // تتبع console.info (قد يحتوي على معلومات مهمة)
        console.info = (...args) => {
            const message = args.join(' ');
            if (this.isImportantInfo(message)) {
                this.captureConsoleError('info', args);
            }
            originalConsole.info.apply(console, args);
        };
    }
    
    /**
     * تحديد إذا كانت المعلومات مهمة
     */
    isImportantInfo(message) {
        const importantPatterns = [
            /warning/i,
            /error/i,
            /exception/i,
            /failed/i,
            /timeout/i,
            /network/i
        ];
        
        return importantPatterns.some(pattern => pattern.test(message));
    }
    
    /**
     * التقاط أخطاء console
     */
    captureConsoleError(level, args) {
        const message = args.join(' ');
        
        // تجاهل الرسائل المحظورة
        if (this.shouldIgnoreMessage(message)) {
            return;
        }
        
        this.captureError({
            type: 'console_error',
            level: level,
            message: message,
            args: args.map(arg => this.serializeArgument(arg)),
            stack: new Error().stack,
            source: 'console',
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * إعداد تتبع أخطاء الشبكة
     */
    setupNetworkErrorTracking() {
        // تتبع fetch errors
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            return originalFetch.apply(this, args)
                .catch(error => {
                    this.captureNetworkError('fetch', args[0], error);
                    throw error;
                });
        };
        
        // تتبع XMLHttpRequest errors
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(...args) {
            this._url = args[1];
            this._method = args[0];
            return originalXHROpen.apply(this, args);
        };
        
        XMLHttpRequest.prototype.send = function(...args) {
            const xhr = this;
            
            this.addEventListener('error', () => {
                this.captureNetworkError('xhr', this._url, new Error('Network Error'));
            });
            
            this.addEventListener('abort', () => {
                this.captureNetworkError('xhr', this._url, new Error('Request Aborted'));
            });
            
            this.addEventListener('timeout', () => {
                this.captureNetworkError('xhr', this._url, new Error('Request Timeout'));
            });
            
            this.addEventListener('load', () => {
                if (this.status >= 400) {
                    this.captureNetworkError('xhr', this._url, 
                        new Error(`HTTP ${this.status}: ${this.statusText}`));
                }
            });
            
            return originalXHRSend.apply(this, args);
        };
    }
    
    /**
     * التقاط أخطاء الشبكة
     */
    captureNetworkError(type, url, error) {
        this.captureError({
            type: 'network_error',
            network_type: type,
            url: url.toString(),
            message: error.message,
            stack: error.stack,
            source: 'network',
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * إعداد تتبع أخطاء الموارد
     */
    setupResourceErrorTracking() {
        // تتبع أخطاء تحميل الموارد
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                // هذا خطأ في تحميل مورد
                const element = event.target;
                const resourceInfo = this.getResourceInfo(element);
                
                this.captureError({
                    type: 'resource_error',
                    element: this.serializeElement(element),
                    resource_type: resourceInfo.type,
                    resource_url: resourceInfo.url,
                    message: `فشل في تحميل المورد: ${resourceInfo.url}`,
                    source: 'resource',
                    timestamp: new Date().toISOString()
                });
            }
        }, true);
    }
    
    /**
     * الحصول على معلومات المورد
     */
    getResourceInfo(element) {
        let url = '';
        let type = 'unknown';
        
        switch (element.tagName) {
            case 'IMG':
                url = element.src;
                type = 'image';
                break;
            case 'SCRIPT':
                url = element.src;
                type = 'script';
                break;
            case 'LINK':
                url = element.href;
                type = 'stylesheet';
                break;
            case 'IFRAME':
                url = element.src;
                type = 'iframe';
                break;
            case 'VIDEO':
                url = element.src;
                type = 'video';
                break;
            case 'AUDIO':
                url = element.src;
                type = 'audio';
                break;
        }
        
        return { url, type };
    }
    
    /**
     * إعداد تتبع الأخطاء غير المعالجة
     */
    setupUnhandledErrorTracking() {
        window.addEventListener('unhandledrejection', (event) => {
            this.captureError({
                type: 'unhandled_promise_rejection',
                message: event.reason ? event.reason.toString() : 'Unhandled Promise Rejection',
                reason: this.serializeArgument(event.reason),
                stack: event.reason && event.reason.stack,
                source: 'unhandled_promise',
                timestamp: new Date().toISOString()
            });
            
            // منع الإظهار الافتراضي
            event.preventDefault();
        });
    }
    
    /**
     * إعداد تتبع أخطاء Promise
     */
    setupPromiseErrorTracking() {
        // تتبع أخطاء .catch()
        const originalThen = Promise.prototype.then;
        const originalCatch = Promise.prototype.catch;
        
        Promise.prototype.catch = function(onreject) {
            const result = originalCatch.call(this, (error) => {
                // التقاط الأخطاء التي تم التعامل معها
                this.captureError({
                    type: 'promise_error_caught',
                    message: error.message || error.toString(),
                    stack: error.stack,
                    source: 'promise_catch',
                    timestamp: new Date().toISOString()
                });
                
                return onreject ? onreject(error) : error;
            });
            
            return result;
        };
    }
    
    /**
     * التقاط الخطأ الرئيسي
     */
    captureError(errorData) {
        // زيادة عداد الأخطاء
        this.errorCount++;
        
        // إضافة معلومات السياق
        const enrichedError = {
            ...errorData,
            session_id: this.sessionId,
            error_id: this.generateErrorId(),
            count: this.errorCount,
            user_agent: this.userAgent,
            page_url: this.pageUrl,
            page_title: this.pageTitle,
            referrer: document.referrer,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            performance: {
                memory: performance.memory ? {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                } : null,
                navigation: performance.getEntriesByType('navigation')[0] || null
            }
        };
        
        // تجاهل الأخطاء المحظورة
        if (this.shouldIgnoreError(enrichedError)) {
            return;
        }
        
        // إضافة إلى قائمة الأخطاء
        this.errors.push(enrichedError);
        
        // الاحتفاظ بآخر N خطأ فقط
        if (this.errors.length > this.config.maxErrors) {
            this.errors.shift();
        }
        
        // إرسال فوري للأخطاء الحرجة
        if (this.isCriticalError(enrichedError)) {
            this.sendErrors([enrichedError]);
        }
        
        // تشغيل callbacks مخصصة
        this.executeErrorCallbacks(enrichedError);
        
        // إرسال إلى Sentry إذا كان مفعلاً
        if (this.config.enableSentry && window.Sentry) {
            this.sendToSentry(enrichedError);
        }
    }
    
    /**
     * تحديد إذا كان يجب تجاهل الخطأ
     */
    shouldIgnoreError(error) {
        // تجاهل الرسائل المحظورة
        if (this.config.ignorePatterns.some(pattern => {
            if (pattern instanceof RegExp) {
                return pattern.test(error.message);
            }
            return error.message.includes(pattern);
        })) {
            return true;
        }
        
        // تجاهل الأخطاء المكررة
        const recentErrors = this.errors.slice(-5);
        const isDuplicate = recentErrors.some(e => 
            e.message === error.message && 
            e.filename === error.filename &&
            Math.abs(new Date(e.timestamp) - new Date(error.timestamp)) < 1000
        );
        
        return isDuplicate;
    }
    
    /**
     * تحديد إذا كان الخطأ حرجاً
     */
    isCriticalError(error) {
        const criticalPatterns = [
            /chunk.*loading.*failed/i,
            /script.*error/i,
            /network.*error/i,
            /failed.*fetch/i,
            /cors.*error/i
        ];
        
        return criticalPatterns.some(pattern => pattern.test(error.message)) ||
               error.type === 'network_error' ||
               error.type === 'unhandled_promise_rejection';
    }
    
    /**
     * تنفيذ callbacks للأخطاء
     */
    executeErrorCallbacks(error) {
        if (typeof window.onError === 'function') {
            try {
                window.onError(error);
            } catch (e) {
                console.error('خطأ في callback onError:', e);
            }
        }
        
        // إرسال event للأخطاء
        try {
            window.dispatchEvent(new CustomEvent('errorCaptured', {
                detail: error
            }));
        } catch (e) {
            console.error('خطأ في إرسال event الخطأ:', e);
        }
    }
    
    /**
     * إرسال إلى Sentry
     */
    sendToSentry(error) {
        if (window.Sentry && window.Sentry.captureException) {
            const sentryError = new Error(error.message);
            sentryError.stack = error.stack;
            
            window.Sentry.captureException(sentryError, {
                tags: {
                    type: error.type,
                    session_id: error.session_id
                },
                extra: {
                    error_id: error.error_id,
                    page_url: error.page_url,
                    user_agent: error.user_agent
                }
            });
        }
    }
    
    /**
     * إعداد Sentry
     */
    setupSentry() {
        if (!window.Sentry) {
            console.warn('Sentry غير متوفر');
            return;
        }
        
        // إعداد السياق
        window.Sentry.configureScope(scope => {
            scope.setTag('environment', this.config.environment);
            scope.setTag('session_id', this.sessionId);
            scope.setExtra('page_url', this.pageUrl);
            scope.setExtra('user_agent', this.userAgent);
        });
    }
    
    /**
     * إرسال الأخطاء
     */
    async sendErrors(errors = null) {
        const errorsToSend = errors || this.errors;
        
        if (errorsToSend.length === 0) return;
        
        try {
            const payload = {
                session_id: this.sessionId,
                errors: errorsToSend,
                summary: this.getErrorSummary(),
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                console.log(`تم إرسال ${errorsToSend.length} خطأ`);
                
                // إزالة الأخطاء المرسلة
                if (!errors) {
                    this.errors = [];
                }
            } else {
                console.warn('فشل في إرسال الأخطاء:', response.status);
            }
        } catch (error) {
            console.error('خطأ في إرسال الأخطاء:', error);
        }
    }
    
    /**
     * الحصول على ملخص الأخطاء
     */
    getErrorSummary() {
        const summary = {
            total_errors: this.errorCount,
            error_types: {},
            error_count_per_type: {},
            recent_errors: this.errors.slice(-5).map(e => ({
                type: e.type,
                message: e.message,
                timestamp: e.timestamp
            }))
        };
        
        this.errors.forEach(error => {
            // عد الأنواع
            summary.error_types[error.type] = (summary.error_types[error.type] || 0) + 1;
            
            // عد الأخطاء لكل نوع
            const key = `${error.type}_${error.message.substring(0, 50)}`;
            summary.error_count_per_type[key] = (summary.error_count_per_type[key] || 0) + 1;
        });
        
        return summary;
    }
    
    /**
     * بدء التقارير الدورية
     */
    startPeriodicReporting() {
        setInterval(() => {
            if (this.errors.length > 0) {
                this.sendErrors();
            }
        }, 60000); // كل دقيقة
    }
    
    /**
     * إعداد التنظيف الدوري
     */
    setupPeriodicCleanup() {
        setInterval(() => {
            this.cleanupOldErrors();
        }, 300000); // كل 5 دقائق
    }
    
    /**
     * تنظيف الأخطاء القديمة
     */
    cleanupOldErrors() {
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        
        this.errors = this.errors.filter(error => {
            return new Date(error.timestamp).getTime() > fiveMinutesAgo;
        });
    }
    
    /**
     * تسجيل خطأ مخصص
     */
    logCustomError(message, context = {}) {
        this.captureError({
            type: 'custom_error',
            message: message,
            context: context,
            source: 'custom',
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * تسجيل تحذير
     */
    logWarning(message, context = {}) {
        this.captureError({
            type: 'warning',
            level: 'warning',
            message: message,
            context: context,
            source: 'warning',
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * تسجيل معلومات
     */
    logInfo(message, context = {}) {
        if (this.isImportantInfo(message)) {
            this.captureError({
                type: 'info',
                level: 'info',
                message: message,
                context: context,
                source: 'info',
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * إنشاء معرف خطأ
     */
    generateErrorId() {
        return 'err_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    /**
     * إنشاء معرف جلسة
     */
    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    /**
     * تحديد إذا كان يجب تجاهل الرسالة
     */
    shouldIgnoreMessage(message) {
        const ignorePatterns = [
            'Script error.',
            'Non-Error promise rejection captured',
            'ResizeObserver loop limit exceeded'
        ];
        
        return ignorePatterns.some(pattern => message.includes(pattern));
    }
    
    /**
     * تسلسل المعطى
     */
    serializeArgument(arg) {
        if (typeof arg === 'string') {
            return arg.substring(0, 1000); // قصر النص
        }
        if (typeof arg === 'object' && arg !== null) {
            try {
                return JSON.stringify(arg, null, 2);
            } catch (e) {
                return '[Object]';
            }
        }
        return arg.toString();
    }
    
    /**
     * تسلسل العنصر
     */
    serializeElement(element) {
        return {
            tagName: element.tagName,
            id: element.id || null,
            className: element.className || null,
            src: element.src || null,
            href: element.href || null
        };
    }
    
    /**
     * الحصول على تقرير الأخطاء
     */
    getErrorReport() {
        return {
            session_info: {
                session_id: this.sessionId,
                error_count: this.errorCount,
                timestamp: new Date().toISOString()
            },
            errors: this.errors,
            summary: this.getErrorSummary()
        };
    }
    
    /**
     * مسح الأخطاء
     */
    clearErrors() {
        this.errors = [];
        this.errorCount = 0;
        console.log('تم مسح جميع الأخطاء');
    }
}

// إنشاء مثيل عام
window.ErrorTracking = new ErrorTracking();

// إضافة methods على الـ window للسهولة
window.logError = (message, context) => window.ErrorTracking.logCustomError(message, context);
window.logWarning = (message, context) => window.ErrorTracking.logWarning(message, context);
window.logInfo = (message, context) => window.ErrorTracking.logInfo(message, context);

// تصدير للاستخدام مع وحدات
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorTracking;
}