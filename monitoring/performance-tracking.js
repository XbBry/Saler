/**
 * Performance Tracking and Monitoring System
 * نظام تتبع ومراقبة الأداء
 * 
 * يتتبع أداء التطبيق والواجهة والأداء التقني
 */

class PerformanceTracking {
    constructor(config = {}) {
        this.config = {
            endpoint: config.endpoint || '/api/performance-metrics',
            sampleRate: config.sampleRate || 1.0, // 100% of users
            enableWebVitals: config.enableWebVitals !== false,
            enableResourceTracking: config.enableResourceTracking !== false,
            enableMemoryTracking: config.enableMemoryTracking !== false,
            enableLongTaskTracking: config.enableLongTaskTracking !== false,
            threshold: {
                fcp: 1800, // First Contentful Paint (ms)
                lcp: 2500, // Largest Contentful Paint (ms)
                fid: 100,  // First Input Delay (ms)
                cls: 0.1,  // Cumulative Layout Shift
                ttfb: 600, // Time to First Byte (ms)
                memory: 50 * 1024 * 1024, // 50MB
                longTask: 50 // 50ms
            },
            ...config
        };
        
        this.metrics = {
            navigation: {},
            paint: {},
            largest_contentful_paint: {},
            first_input: {},
            layout_shift: {},
            resources: {},
            memory: {},
            long_tasks: [],
            custom_measurements: {}
        };
        
        this.observers = new Map();
        this.sessionStart = Date.now();
        
        this.init();
    }
    
    init() {
        console.log('[Performance] تم تهيئة نظام تتبع الأداء');
        
        // جمع الميتريكس الأولية
        this.collectInitialMetrics();
        
        // إعداد مراقبة Web Vitals
        if (this.config.enableWebVitals) {
            this.setupWebVitalsTracking();
        }
        
        // إعداد مراقبة الموارد
        if (this.config.enableResourceTracking) {
            this.setupResourceTracking();
        }
        
        // إعداد مراقبة الذاكرة
        if (this.config.enableMemoryTracking) {
            this.setupMemoryTracking();
        }
        
        // إعداد مراقبة المهام الطويلة
        if (this.config.enableLongTaskTracking) {
            this.setupLongTaskTracking();
        }
        
        // إعداد مراقبة التفاعل
        this.setupInteractionTracking();
        
        // إعداد مراقبة الطلبات
        this.setupRequestTracking();
        
        // إرسال البيانات بشكل دوري
        this.startPeriodicReporting();
    }
    
    /**
     * جمع الميتريكس الأولية
     */
    collectInitialMetrics() {
        if (performance.getEntriesByType) {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.metrics.navigation = {
                    // أوقات تحميل الصفحة
                    dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
                    tcp_connection: navigation.connectEnd - navigation.connectStart,
                    tls_setup: navigation.connectEnd - navigation.secureConnectionStart,
                    ttfb: navigation.responseStart - navigation.requestStart,
                    download: navigation.responseEnd - navigation.responseStart,
                    dom_processing: navigation.domComplete - navigation.responseEnd,
                    dom_ready: navigation.domContentLoadedEventEnd - navigation.navigationStart,
                    load_complete: navigation.loadEventEnd - navigation.navigationStart,
                    total_load_time: navigation.loadEventEnd - navigation.navigationStart,
                    
                    // معلومات الصفحة
                    page_type: navigation.type,
                    redirect_count: navigation.redirectCount,
                    transfer_size: navigation.transferSize,
                    encoded_body_size: navigation.encodedBodySize,
                    decoded_body_size: navigation.decodedBodySize,
                    
                    timestamp: new Date().toISOString()
                };
            }
            
            // أوقات الطلاء (Paint Times)
            const paintEntries = performance.getEntriesByType('paint');
            paintEntries.forEach(entry => {
                this.metrics.paint[entry.name] = {
                    start_time: entry.startTime,
                    duration: entry.duration,
                    timestamp: new Date().toISOString()
                };
            });
        }
    }
    
    /**
     * إعداد مراقبة Web Vitals
     */
    setupWebVitalsTracking() {
        // Largest Contentful Paint (LCP)
        this.observePerformanceEntry('largest-contentful-paint', (entries) => {
            const lastEntry = entries[entries.length - 1];
            this.metrics.largest_contentful_paint = {
                value: lastEntry.startTime,
                element: this.getElementInfo(lastEntry.element),
                url: lastEntry.url,
                timestamp: new Date().toISOString()
            };
            
            this.checkThreshold('lcp', lastEntry.startTime);
            
            // إرسال تنبيه إذا كان الأداء ضعيفاً
            if (lastEntry.startTime > this.config.threshold.lcp) {
                this.reportPerformanceIssue('lcp', {
                    value: lastEntry.startTime,
                    threshold: this.config.threshold.lcp,
                    element: this.getElementInfo(lastEntry.element)
                });
            }
        });
        
        // First Input Delay (FID)
        this.observePerformanceEntry('first-input', (entries) => {
            const firstEntry = entries[0];
            const fid = firstEntry.processingStart - firstEntry.startTime;
            
            this.metrics.first_input = {
                value: fid,
                event_type: firstEntry.name,
                target: this.getElementInfo(firstEntry.target),
                timestamp: new Date().toISOString()
            };
            
            this.checkThreshold('fid', fid);
            
            if (fid > this.config.threshold.fid) {
                this.reportPerformanceIssue('fid', {
                    value: fid,
                    threshold: this.config.threshold.fid,
                    event_type: firstEntry.name
                });
            }
        });
        
        // Cumulative Layout Shift (CLS)
        this.setupCLSTracking();
        
        // Total Blocking Time (TBT)
        this.setupTBTTracking();
        
        // Time to Interactive (TTI)
        this.setupTTITracking();
    }
    
    /**
     * إعداد تتبع CLS
     */
    setupCLSTracking() {
        let clsValue = 0;
        let clsEntries = [];
        
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    clsEntries.push({
                        value: entry.value,
                        layout_shift_score: entry.value,
                        timestamp: entry.startTime,
                        sources: entry.sources
                    });
                }
            }
            
            this.metrics.layout_shift = {
                value: clsValue,
                entries: clsEntries,
                timestamp: new Date().toISOString()
            };
            
            this.checkThreshold('cls', clsValue);
            
            if (clsValue > this.config.threshold.cls) {
                this.reportPerformanceIssue('cls', {
                    value: clsValue,
                    threshold: this.config.threshold.cls,
                    entries: clsEntries.slice(-5) // آخر 5 أحداث
                });
            }
        });
        
        try {
            observer.observe({ type: 'layout-shift', buffered: true });
            this.observers.set('cls', observer);
        } catch (e) {
            console.warn('Layout Shift Observer غير مدعوم:', e);
        }
    }
    
    /**
     * إعداد تتبع TBT
     */
    setupTBTTracking() {
        if (!('PerformanceEventTiming' in window)) return;
        
        // حساب وقت الحظر الكلي
        setTimeout(() => {
            const longTasks = performance.getEntriesByType('longtask');
            let totalBlockingTime = 0;
            
            longTasks.forEach(task => {
                totalBlockingTime += Math.max(0, task.duration - 50);
            });
            
            this.metrics.total_blocking_time = {
                value: totalBlockingTime,
                long_tasks_count: longTasks.length,
                timestamp: new Date().toISOString()
            };
            
            this.checkThreshold('tbt', totalBlockingTime);
        }, 0);
    }

        
    /**
     * إعداد تتبع TTI
     */
    setupTTITracking() {
        // حساب الوقت التفاعلي
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.metrics.time_to_interactive = {
                    value: this.calculateTTI(),
                    timestamp: new Date().toISOString()
                };
            });
        }
    }
    
    /**
     * حساب الوقت التفاعلي
     */
    calculateTTI() {
        // تقدير مبسط لـ TTI
        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return 0;
        
        // TTI هو الوقت الذي يصبح فيه التطبيق تفاعلياً
        // يتم حسابه بعد اكتمال DOM وتوقف المهام الطويلة
        return navigation.domInteractive + 2000; // تقدير بسيط
    }
    
    /**
     * إعداد مراقبة الموارد
     */
    setupResourceTracking() {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.processResourceEntry(entry);
            }
        });
        
        try {
            observer.observe({ type: 'resource', buffered: true });
            this.observers.set('resource', observer);
        } catch (e) {
            console.warn('Resource Observer غير مدعوم:', e);
        }
    }
    
    /**
     * معالجة إدخال مورد
     */
    processResourceEntry(entry) {
        const resourceType = this.getResourceType(entry.name);
        const duration = entry.responseEnd - entry.startTime;
        
        // معلومات المورد
        const resourceInfo = {
            url: entry.name,
            type: resourceType,
            size: entry.transferSize || 0,
            duration: duration,
            cache_status: this.getCacheStatus(entry),
            priority: entry.initiatorType,
            timestamp: new Date().toISOString()
        };
        
        // إضافة إلى قائمة الموارد
        if (!this.metrics.resources[resourceType]) {
            this.metrics.resources[resourceType] = {
                count: 0,
                total_size: 0,
                total_duration: 0,
                slow_resources: [],
                failed_resources: 0
            };
        }
        
        const resourceMetrics = this.metrics.resources[resourceType];
        resourceMetrics.count++;
        resourceMetrics.total_size += resourceInfo.size;
        resourceMetrics.total_duration += duration;
        
        // الموارد البطيئة
        if (duration > 2000) { // أكثر من ثانيتين
            resourceMetrics.slow_resources.push(resourceInfo);
            if (resourceMetrics.slow_resources.length > 10) {
                resourceMetrics.slow_resources.shift();
            }
        }
        
        // الموارد الفاشلة
        if (entry.transferSize === 0 || duration > 10000) {
            resourceMetrics.failed_resources++;
            this.reportPerformanceIssue('resource_failure', resourceInfo);
        }
    }
    
    /**
     * تحديد نوع المورد
     */
    getResourceType(url) {
        const extension = url.split('.').pop().toLowerCase();
        const typeMap = {
            'js': 'javascript',
            'css': 'stylesheet',
            'png': 'image',
            'jpg': 'jpeg',
            'jpeg': 'jpeg',
            'gif': 'image',
            'svg': 'image',
            'webp': 'image',
            'mp4': 'video',
            'mp3': 'audio',
            'woff': 'font',
            'woff2': 'font',
            'ttf': 'font',
            'otf': 'font',
            'pdf': 'document',
            'json': 'data',
            'xml': 'data'
        };
        
        return typeMap[extension] || 'other';
    }
    
    /**
     * تحديد حالة التخزين المؤقت
     */
    getCacheStatus(entry) {
        if (entry.transferSize === 0) {
            return 'cache_hit';
        } else if (entry.transferSize > 0) {
            return entry.responseStatus === 304 ? 'not_modified' : 'cache_miss';
        }
        return 'unknown';
    }
    
    /**
     * إعداد مراقبة الذاكرة
     */
    setupMemoryTracking() {
        if (!performance.memory) {
            console.warn('Memory API غير مدعوم');
            return;
        }
        
        // جمع معلومات الذاكرة
        const collectMemoryInfo = () => {
            const memory = performance.memory;
            
            this.metrics.memory = {
                used_heap: memory.usedJSHeapSize,
                total_heap: memory.totalJSHeapSize,
                heap_limit: memory.jsHeapSizeLimit,
                used_heap_percent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
                timestamp: new Date().toISOString()
            };
            
            this.checkThreshold('memory', memory.usedJSHeapSize);
            
            if (memory.usedJSHeapSize > this.config.threshold.memory) {
                this.reportPerformanceIssue('high_memory_usage', {
                    used: memory.usedJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                    percent: this.metrics.memory.used_heap_percent
                });
            }
        };
        
        // جمع فوري
        collectMemoryInfo();
        
        // جمع دوري كل 30 ثانية
        setInterval(collectMemoryInfo, 30000);
    }
    
    /**
     * إعداد مراقبة المهام الطويلة
     */
    setupLongTaskTracking() {
        if (!('PerformanceObserver' in window)) return;
        
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.metrics.long_tasks.push({
                    duration: entry.duration,
                    start_time: entry.startTime,
                    end_time: entry.startTime + entry.duration,
                    attribution: entry.attribution,
                    timestamp: new Date().toISOString()
                });
                
                // الاحتفاظ بآخر 20 مهمة فقط
                if (this.metrics.long_tasks.length > 20) {
                    this.metrics.long_tasks.shift();
                }
                
                this.checkThreshold('long_task', entry.duration);
                
                if (entry.duration > this.config.threshold.longTask) {
                    this.reportPerformanceIssue('long_task', {
                        duration: entry.duration,
                        threshold: this.config.threshold.longTask,
                        start_time: entry.startTime
                    });
                }
            }
        });
        
        try {
            observer.observe({ type: 'longtask', buffered: true });
            this.observers.set('longtask', observer);
        } catch (e) {
            console.warn('Long Task Observer غير مدعوم:', e);
        }
    }
    
    /**
     * إعداد مراقبة التفاعل
     */
    setupInteractionTracking() {
        // تتبع أداء النقرات
        document.addEventListener('click', (event) => {
            const startTime = performance.now();
            
            // مراقبة استجابة العنصر
            const element = event.target;
            const nextFrame = () => {
                const endTime = performance.now();
                const interactionTime = endTime - startTime;
                
                this.trackInteraction('click', {
                    element: this.getElementInfo(element),
                    interaction_time: interactionTime,
                    timestamp: new Date().toISOString()
                });
            };
            
            if (document.readyState === 'complete') {
                requestAnimationFrame(nextFrame);
            }
        });
        
        // تتبع أداء الكتابة
        document.addEventListener('input', (event) => {
            const startTime = performance.now();
            
            setTimeout(() => {
                const endTime = performance.now();
                const interactionTime = endTime - startTime;
                
                this.trackInteraction('input', {
                    element: this.getElementInfo(event.target),
                    interaction_time: interactionTime,
                    timestamp: new Date().toISOString()
                });
            }, 0);
        });
    }
    
    /**
     * تتبع التفاعل
     */
    trackInteraction(type, data) {
        if (!this.metrics.interactions) {
            this.metrics.interactions = {};
        }
        
        if (!this.metrics.interactions[type]) {
            this.metrics.interactions[type] = {
                count: 0,
                total_time: 0,
                slow_interactions: []
            };
        }
        
        const interactionMetrics = this.metrics.interactions[type];
        interactionMetrics.count++;
        interactionMetrics.total_time += data.interaction_time;
        
        if (data.interaction_time > 100) { // أكثر من 100ms
            interactionMetrics.slow_interactions.push(data);
            if (interactionMetrics.slow_interactions.length > 10) {
                interactionMetrics.slow_interactions.shift();
            }
        }
    }
    
    /**
     * إعداد مراقبة الطلبات
     */
    setupRequestTracking() {
        // مراقبة fetch
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];
            const options = args[1] || {};
            
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                this.trackRequest({
                    url: url.toString(),
                    method: options.method || 'GET',
                    status: response.status,
                    duration: duration,
                    timestamp: new Date().toISOString()
                });
                
                return response;
            } catch (error) {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                this.trackRequest({
                    url: url.toString(),
                    method: options.method || 'GET',
                    error: error.message,
                    duration: duration,
                    timestamp: new Date().toISOString()
                });
                
                throw error;
            }
        };
        
        // مراقبة XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url) {
            this._method = method;
            this._url = url;
            this._startTime = performance.now();
            return originalXHROpen.apply(this, arguments);
        };
        
        XMLHttpRequest.prototype.send = function() {
            const xhr = this;
            const startTime = this._startTime;
            
            this.addEventListener('load', () => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                this.trackRequest({
                    url: this._url,
                    method: this._method,
                    status: this.status,
                    duration: duration,
                    timestamp: new Date().toISOString()
                });
            });
            
            this.addEventListener('error', () => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                this.trackRequest({
                    url: this._url,
                    method: this._method,
                    error: 'Network Error',
                    duration: duration,
                    timestamp: new Date().toISOString()
                });
            });
            
            return originalXHRSend.apply(this, arguments);
        };
    }
    
    /**
     * تتبع الطلب
     */
    trackRequest(data) {
        if (!this.metrics.requests) {
            this.metrics.requests = {
                count: 0,
                total_duration: 0,
                slow_requests: [],
                failed_requests: 0,
                status_codes: {}
            };
        }
        
        const requestMetrics = this.metrics.requests;
        requestMetrics.count++;
        requestMetrics.total_duration += data.duration;
        
        // جمع رموز الحالة
        if (data.status) {
            requestMetrics.status_codes[data.status] = (requestMetrics.status_codes[data.status] || 0) + 1;
        }
        
        // الطلبات البطيئة
        if (data.duration > 3000) { // أكثر من 3 ثوانٍ
            requestMetrics.slow_requests.push(data);
            if (requestMetrics.slow_requests.length > 20) {
                requestMetrics.slow_requests.shift();
            }
        }
        
        // الطلبات الفاشلة
        if (data.error || (data.status && data.status >= 400)) {
            requestMetrics.failed_requests++;
            this.reportPerformanceIssue('request_failure', data);
        }
    }
    
    /**
     * مراقبة أداء محسوب
     */
    measure(name, fn) {
        const startTime = performance.now();
        const result = fn();
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.addCustomMeasurement(name, duration);
        
        return result;
    }
    
    /**
     * قياس الأداء غير المتزامن
     */
    async measureAsync(name, fn) {
        const startTime = performance.now();
        const result = await fn();
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.addCustomMeasurement(name, duration);
        
        return result;
    }
    
    /**
     * إضافة قياس مخصص
     */
    addCustomMeasurement(name, value) {
        this.metrics.custom_measurements[name] = {
            value: value,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * التحقق من الحدود
     */
    checkThreshold(type, value) {
        const threshold = this.config.threshold[type];
        if (!threshold) return false;
        
        // قواعد مخصصة لكل نوع
        switch (type) {
            case 'lcp':
            case 'fid':
            case 'cls':
            case 'tbt':
                return value > threshold;
            case 'memory':
                return value > threshold;
            case 'long_task':
                return value > threshold;
            default:
                return false;
        }
    }
    
    /**
     * الإبلاغ عن مشكلة أداء
     */
    reportPerformanceIssue(type, data) {
        const issue = {
            type: type,
            severity: this.getSeverity(type, data.value || data.duration),
            data: data,
            timestamp: new Date().toISOString()
        };
        
        // إرسال تنبيه فوري
        this.sendPerformanceAlert(issue);
        
        // حفظ محلياً
        this.storePerformanceIssue(issue);
    }
    
    /**
     * تحديد خطورة المشكلة
     */
    getSeverity(type, value) {
        const threshold = this.config.threshold[type];
        if (!threshold) return 'low';
        
        const ratio = value / threshold;
        if (ratio > 2) return 'critical';
        if (ratio > 1.5) return 'high';
        if (ratio > 1) return 'medium';
        return 'low';
    }
    
    /**
     * إرسال تنبيه أداء
     */
    async sendPerformanceAlert(issue) {
        try {
            await fetch('/api/performance-alerts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(issue)
            });
        } catch (error) {
            console.error('فشل في إرسال تنبيه الأداء:', error);
        }
    }
    
    /**
     * حفظ مشكلة الأداء محلياً
     */
    storePerformanceIssue(issue) {
        if (!this.metrics.performance_issues) {
            this.metrics.performance_issues = [];
        }
        
        this.metrics.performance_issues.push(issue);
        
        // الاحتفاظ بآخر 50 مشكلة فقط
        if (this.metrics.performance_issues.length > 50) {
            this.metrics.performance_issues.shift();
        }
    }
    
    /**
     * بدء التقارير الدورية
     */
    startPeriodicReporting() {
        setInterval(() => {
            this.sendMetrics();
        }, 60000); // كل دقيقة
    }
    
    /**
     * إرسال الميتريكس
     */
    async sendMetrics() {
        try {
            // حساب الإحصائيات
            this.calculateSummaryStats();
            
            const payload = {
                session_id: this.sessionId,
                duration: Date.now() - this.sessionStart,
                metrics: this.metrics,
                summary: this.metrics.summary || {},
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
                console.log('تم إرسال ميتريكس الأداء');
                
                // مسح الميتريكس الموقتة
                this.clearTemporaryMetrics();
            }
        } catch (error) {
            console.error('فشل في إرسال ميتريكس الأداء:', error);
        }
    }
    
    /**
     * حساب الإحصائيات الملخصة
     */
    calculateSummaryStats() {
        this.metrics.summary = {
            // أداء عام
            average_load_time: this.metrics.navigation.total_load_time || 0,
            lcp: this.metrics.largest_contentful_paint.value || 0,
            fid: this.metrics.first_input.value || 0,
            cls: this.metrics.layout_shift.value || 0,
            
            // الموارد
            total_resources: Object.values(this.metrics.resources)
                .reduce((sum, type) => sum + type.count, 0),
            failed_resources: Object.values(this.metrics.resources)
                .reduce((sum, type) => sum + type.failed_resources, 0),
            
            // الذاكرة
            peak_memory: this.metrics.memory.used_heap || 0,
            
            // التفاعلات
            total_interactions: Object.values(this.metrics.interactions || {})
                .reduce((sum, type) => sum + type.count, 0),
            
            // الطلبات
            total_requests: this.metrics.requests?.count || 0,
            failed_requests: this.metrics.requests?.failed_requests || 0,
            
            // المشاكل
            performance_issues: this.metrics.performance_issues?.length || 0
        };
    }
    
    /**
     * مسح الميتريكس المؤقتة
     */
    clearTemporaryMetrics() {
        // مسح القائمة المؤقتة
        if (this.metrics.long_tasks) {
            this.metrics.long_tasks = [];
        }
        if (this.metrics.performance_issues) {
            this.metrics.performance_issues = [];
        }
    }
    
    /**
     * مراقبة أداء مخصص
     */
    observePerformanceEntry(type, callback) {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    callback(list.getEntries());
                });
                observer.observe({ type: type, buffered: true });
                this.observers.set(type, observer);
            } catch (e) {
                console.warn(`${type} Observer غير مدعوم:`, e);
            }
        }
    }
    
    /**
     * الحصول على معلومات العنصر
     */
    getElementInfo(element) {
        if (!element) return null;
        
        return {
            tag: element.tagName,
            id: element.id || null,
            class: element.className || null,
            text: element.textContent ? element.textContent.substring(0, 50) : null,
            href: element.href || null
        };
    }
    
    /**
     * الحصول على تقرير شامل
     */
    getPerformanceReport() {
        return {
            session_info: {
                session_id: this.sessionId,
                duration: Date.now() - this.sessionStart,
                timestamp: new Date().toISOString()
            },
            metrics: this.metrics,
            summary: this.metrics.summary || {},
            health_score: this.calculateHealthScore()
        };
    }
    
    /**
     * حساب نقاط الصحة
     */
    calculateHealthScore() {
        let score = 100;
        
        // خصم للأداء الضعيف
        if (this.metrics.largest_contentful_paint.value > this.config.threshold.lcp) {
            score -= 20;
        }
        if (this.metrics.first_input.value > this.config.threshold.fid) {
            score -= 20;
        }
        if (this.metrics.layout_shift.value > this.config.threshold.cls) {
            score -= 15;
        }
        if (this.metrics.memory.used_heap_percent > 80) {
            score -= 15;
        }
        
        return Math.max(0, score);
    }
    
    /**
     * تنظيف الموارد
     */
    cleanup() {
        this.observers.forEach(observer => {
            if (observer && observer.disconnect) {
                observer.disconnect();
            }
        });
        this.observers.clear();
    }
}

// إنشاء مثيل عام
window.PerformanceTracking = new PerformanceTracking();

// تصدير للاستخدام مع وحدات
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceTracking;
}