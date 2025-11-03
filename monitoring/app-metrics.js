/**
 * Application Metrics Collection System
 * نظام جمع ميتريكس التطبيق
 * 
 * يتتبع الأداء والاستخدام والأخطاء للواجهة الأمامية
 */

class ApplicationMetrics {
    constructor(config = {}) {
        this.config = {
            endpoint: config.endpoint || '/api/metrics',
            batchSize: config.batchSize || 50,
            flushInterval: config.flushInterval || 30000, // 30 seconds
            enableConsole: config.enableConsole || false,
            enableLocalStorage: config.enableLocalStorage || true,
            ...config
        };
        
        this.metrics = {
            performance: {},
            user_interactions: {},
            errors: {},
            navigation: {},
            resource_loading: {},
            custom: {}
        };
        
        this.batch = [];
        this.startTime = Date.now();
        
        this.init();
    }
    
    init() {
        console.log('[Metrics] تم تهيئة نظام جمع الميتريكس') if this.config.enableConsole;
        
        // جمع البيانات الأولية
        this.collectInitialMetrics();
        
        // مراقبة أحداث الصفحة
        this.setupEventListeners();
        
        // مراقبة الأداء
        this.setupPerformanceMonitoring();
        
        // مراقبة الأخطاء
        this.setupErrorMonitoring();
        
        // بدء الإرسال الدوري
        this.startPeriodicFlush();
        
        // إرسال البيانات عند إغلاق الصفحة
        this.setupPageUnload();
    }
    
    /**
     * جمع الميتريكس الأولية
     */
    collectInitialMetrics() {
        // معلومات المتصفح
        this.metrics.browser = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: new Date().toISOString()
        };
        
        // معلومات الموقع
        this.metrics.page = {
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            loadTime: performance.now()
        };
        
        // إحصائيات المتصفح
        this.metrics.browser_stats = this.getBrowserStats();
    }
    
    /**
     * إحصائيات المتصفح
     */
    getBrowserStats() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        return {
            connection: connection ? {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            } : null,
            memory: performance.memory ? {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            } : null,
            hardwareConcurrency: navigator.hardwareConcurrency || null,
            deviceMemory: navigator.deviceMemory || null
        };
    }
    
    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // تتبع النقرات
        document.addEventListener('click', (event) => {
            this.trackClick(event);
        }, true);
        
        // تتبع النقرات على الأزرار والروابط
        document.addEventListener('click', (event) => {
            const target = event.target.closest('button, a, [role="button"]');
            if (target) {
                this.trackButtonClick(target);
            }
        }, true);
        
        // تتبع إرسال النماذج
        document.addEventListener('submit', (event) => {
            this.trackFormSubmission(event);
        });
        
        // تتبع تغيير حجم النافذة
        window.addEventListener('resize', this.debounce(() => {
            this.trackWindowResize();
        }, 1000));
        
        // تتبع التمرير
        window.addEventListener('scroll', this.throttle(() => {
            this.trackScrollDepth();
        }, 500));
        
        // تتبع التنقل في الصفحة
        window.addEventListener('popstate', () => {
            this.trackNavigation();
        });
    }
    
    /**
     * إعداد مراقبة الأداء
     */
    setupPerformanceMonitoring() {
        // مراقبة تحميل الصفحة
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    this.trackPageLoadPerformance();
                }, 0);
            });
            
            // مراقبة تحميل الموارد
            if ('PerformanceObserver' in window) {
                this.setupResourceMonitoring();
            }
        }
        
        // مراقبة Web Vitals
        this.trackWebVitals();
    }
    
    /**
     * مراقبة تحميل الموارد
     */
    setupResourceMonitoring() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    if (entry.entryType === 'resource') {
                        this.trackResourceLoad(entry);
                    }
                });
            });
            
            observer.observe({ entryTypes: ['resource', 'measure', 'navigation'] });
        } catch (e) {
            console.warn('فشل في إعداد مراقبة الموارد:', e) if this.config.enableConsole;
        }
    }
    
    /**
     * إعداد مراقبة الأخطاء
     */
    setupErrorMonitoring() {
        // أخطاء JavaScript
        window.addEventListener('error', (event) => {
            this.trackError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error ? event.error.stack : null,
                timestamp: new Date().toISOString()
            });
        });
        
        // أخطاء Promises
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError({
                type: 'unhandled_promise',
                message: event.reason,
                stack: event.reason && event.reason.stack,
                timestamp: new Date().toISOString()
            });
        });
        
        // أخطاء الشبكة
        this.setupNetworkErrorMonitoring();
    }
    
    /**
     * مراقبة أخطاء الشبكة
     */
    setupNetworkErrorMonitoring() {
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            return originalFetch.apply(this, args)
                .catch(error => {
                    this.trackError({
                        type: 'network',
                        message: error.message,
                        url: args[0],
                        timestamp: new Date().toISOString()
                    });
                    throw error;
                });
        };
    }
    
    /**
     * تتبع أداء تحميل الصفحة
     */
    trackPageLoadPerformance() {
        if (!performance.getEntriesByType) return;
        
        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return;
        
        this.metrics.performance.page_load = {
            dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp_connect: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            dom_processing: navigation.domComplete - navigation.responseEnd,
            load_complete: navigation.loadEventEnd - navigation.loadEventStart,
            total_time: navigation.loadEventEnd - navigation.navigationStart,
            timestamp: new Date().toISOString()
        };
        
        // Core Web Vitals
        this.trackCoreWebVitals();
    }
    
    /**
     * تتبع Core Web Vitals
     */
    trackCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        this.observeVital('largest-contentful-paint', (entries) => {
            const lastEntry = entries[entries.length - 1];
            this.metrics.performance.lcp = lastEntry.startTime;
        });
        
        // First Input Delay (FID)
        this.observeVital('first-input', (entries) => {
            const firstEntry = entries[0];
            this.metrics.performance.fid = firstEntry.processingStart - firstEntry.startTime;
        });
        
        // Cumulative Layout Shift (CLS)
        this.observeVital('layout-shift', (entries) => {
            let clsValue = 0;
            entries.forEach((entry) => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            this.metrics.performance.cls = clsValue;
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
            } catch (e) {
                console.warn(`فشل في مراقبة ${name}:`, e) if this.config.enableConsole;
            }
        }
    }
    
    /**
     * تتبع تحميل الموارد
     */
    trackResourceLoad(entry) {
        const resourceType = this.getResourceType(entry.name);
        const size = entry.transferSize || 0;
        
        if (!this.metrics.resource_loading[resourceType]) {
            this.metrics.resource_loading[resourceType] = {
                count: 0,
                total_size: 0,
                total_time: 0,
                errors: 0
            };
        }
        
        const metric = this.metrics.resource_loading[resourceType];
        metric.count++;
        metric.total_size += size;
        metric.total_time += entry.duration;
        
        if (entry.transferSize === 0 || entry.duration > 5000) {
            metric.errors++;
        }
    }
    
    /**
     * تحديد نوع المورد
     */
    getResourceType(url) {
        const extension = url.split('.').pop().toLowerCase();
        const typeMap = {
            js: 'javascript',
            css: 'stylesheet',
            png: 'image',
            jpg: 'image',
            jpeg: 'image',
            gif: 'image',
            svg: 'image',
            webp: 'image',
            mp4: 'video',
            mp3: 'audio',
            pdf: 'document',
            json: 'data',
            xml: 'data'
        };
        
        return typeMap[extension] || 'other';
    }
    
    /**
     * تتبع النقرات
     */
    trackClick(event) {
        this.metrics.user_interactions.clicks = (this.metrics.user_interactions.clicks || 0) + 1;
        
        // تتبع موقع النقر
        const clickData = {
            x: event.clientX,
            y: event.clientY,
            target: event.target.tagName,
            page_x: event.pageX,
            page_y: event.pageY,
            timestamp: new Date().toISOString()
        };
        
        if (!this.metrics.user_interactions.click_locations) {
            this.metrics.user_interactions.click_locations = [];
        }
        
        this.metrics.user_interactions.click_locations.push(clickData);
        
        // الاحتفاظ بآخر 100 موقع فقط
        if (this.metrics.user_interactions.click_locations.length > 100) {
            this.metrics.user_interactions.click_locations.shift();
        }
    }
    
    /**
     * تتبع نقرات الأزرار والروابط
     */
    trackButtonClick(element) {
        const buttonData = {
            tag: element.tagName,
            text: element.textContent?.substring(0, 50) || '',
            class: element.className || '',
            id: element.id || '',
            href: element.href || '',
            timestamp: new Date().toISOString()
        };
        
        if (!this.metrics.user_interactions.buttons) {
            this.metrics.user_interactions.buttons = [];
        }
        
        this.metrics.user_interactions.buttons.push(buttonData);
        
        if (this.metrics.user_interactions.buttons.length > 50) {
            this.metrics.user_interactions.buttons.shift();
        }
    }
    
    /**
     * تتبع إرسال النماذج
     */
    trackFormSubmission(event) {
        const form = event.target;
        const formData = {
            action: form.action || '',
            method: form.method || 'GET',
            elements: form.elements.length,
            fields: Array.from(form.elements).map(el => ({
                type: el.type,
                name: el.name,
                required: el.required
            })),
            timestamp: new Date().toISOString()
        };
        
        if (!this.metrics.user_interactions.forms) {
            this.metrics.user_interactions.forms = [];
        }
        
        this.metrics.user_interactions.forms.push(formData);
    }
    
    /**
     * تتبع تغيير حجم النافذة
     */
    trackWindowResize() {
        this.metrics.user_interactions.resizes = (this.metrics.user_interactions.resizes || 0) + 1;
        
        // حفظ آخر أبعاد
        this.metrics.user_interactions.last_viewport = {
            width: window.innerWidth,
            height: window.innerHeight,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * تتبع عمق التمرير
     */
    trackScrollDepth() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);
        
        // حفظ أقصى عمق تمرير
        if (!this.metrics.user_interactions.max_scroll_depth || 
            scrollPercent > this.metrics.user_interactions.max_scroll_depth) {
            this.metrics.user_interactions.max_scroll_depth = scrollPercent;
        }
    }
    
    /**
     * تتبع التنقل
     */
    trackNavigation() {
        this.metrics.navigation = {
            ...this.metrics.navigation,
            last_navigation: {
                url: window.location.href,
                title: document.title,
                timestamp: new Date().toISOString()
            },
            navigation_count: (this.metrics.navigation.navigation_count || 0) + 1
        };
    }
    
    /**
     * تتبع الأخطاء
     */
    trackError(errorData) {
        if (!this.metrics.errors.history) {
            this.metrics.errors.history = [];
        }
        
        this.metrics.errors.history.push(errorData);
        this.metrics.errors.count = (this.metrics.errors.count || 0) + 1;
        
        // الاحتفاظ بآخر 20 خطأ فقط
        if (this.metrics.errors.history.length > 20) {
            this.metrics.errors.history.shift();
        }
    }
    
    /**
     * إضافة ميتريكس مخصصة
     */
    addCustomMetric(name, value, tags = {}) {
        this.metrics.custom[name] = {
            value: value,
            tags: tags,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * تجميع الميتريكس
     */
    aggregateMetrics() {
        const aggregated = {
            ...this.metrics,
            session: {
                duration: Date.now() - this.startTime,
                session_id: this.generateSessionId(),
                start_time: new Date(this.startTime).toISOString(),
                end_time: new Date().toISOString()
            },
            summary: this.generateSummary()
        };
        
        return aggregated;
    }
    
    /**
     * إنشاء ملخص
     */
    generateSummary() {
        const summary = {
            total_clicks: this.metrics.user_interactions.clicks || 0,
            total_errors: this.metrics.errors.count || 0,
            page_load_time: this.metrics.performance.page_load?.total_time || 0,
            scroll_depth: this.metrics.user_interactions.max_scroll_depth || 0,
            forms_submitted: this.metrics.user_interactions.forms?.length || 0,
            resources_loaded: Object.values(this.metrics.resource_loading)
                .reduce((sum, type) => sum + type.count, 0)
        };
        
        return summary;
    }
    
    /**
     * إنشاء معرف جلسة
     */
    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    /**
     * إرسال الميتريكس
     */
    async flushMetrics() {
        const metrics = this.aggregateMetrics();
        
        try {
            // إرسال إلى الخادم
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(metrics)
            });
            
            if (response.ok) {
                console.log('تم إرسال الميتريكس بنجاح') if this.config.enableConsole;
            } else {
                console.warn('فشل في إرسال الميتريكس:', response.status) if this.config.enableConsole;
            }
        } catch (error) {
            console.error('خطأ في إرسال الميتريكس:', error) if this.config.enableConsole;
            
            // حفظ محلياً في حالة الفشل
            this.saveLocally(metrics);
        }
        
        // إعادة تعيين الميتريكس
        this.resetMetrics();
    }
    
    /**
     * حفظ محلي
     */
    saveLocally(data) {
        if (this.config.enableLocalStorage) {
            try {
                const key = 'app_metrics_' + Date.now();
                localStorage.setItem(key, JSON.stringify(data));
                
                // حذف البيانات القديمة
                this.cleanupLocalStorage();
            } catch (e) {
                console.warn('فشل في الحفظ المحلي:', e) if this.config.enableConsole;
            }
        }
    }
    
    /**
     * تنظيف التخزين المحلي
     */
    cleanupLocalStorage() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('app_metrics_'));
        if (keys.length > 10) {
            const keysToDelete = keys.slice(0, keys.length - 10);
            keysToDelete.forEach(key => localStorage.removeItem(key));
        }
    }
    
    /**
     * إعادة تعيين الميتريكس
     */
    resetMetrics() {
        this.metrics = {
            performance: {},
            user_interactions: {},
            errors: {},
            navigation: {},
            resource_loading: {},
            custom: {}
        };
    }
    
    /**
     * بدء الإرسال الدوري
     */
    startPeriodicFlush() {
        setInterval(() => {
            this.flushMetrics();
        }, this.config.flushInterval);
    }
    
    /**
     * إعداد إرسال البيانات عند إغلاق الصفحة
     */
    setupPageUnload() {
        window.addEventListener('beforeunload', () => {
            // إرسال البيانات المتبقية
            this.flushMetrics();
        });
    }
    
    /**
     * أدوات مساعدة
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * الحصول على الميتريكس الحالية
     */
    getCurrentMetrics() {
        return this.aggregateMetrics();
    }
    
    /**
     * تصدير الميتريكس
     */
    exportMetrics() {
        const metrics = this.getCurrentMetrics();
        const dataStr = JSON.stringify(metrics, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `app-metrics-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// إنشاء مثيل عام
window.AppMetrics = new ApplicationMetrics();

// تصدير للاستخدام مع وحدات
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApplicationMetrics;
}