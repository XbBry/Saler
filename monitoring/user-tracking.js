/**
 * User Tracking and Analytics System
 * نظام تتبع وتحليلات المستخدمين
 * 
 * يتتبع سلوك المستخدم وتفاعلاته مع التطبيق
 */

class UserTracking {
    constructor(config = {}) {
        this.config = {
            endpoint: config.endpoint || '/api/user-analytics',
            sessionTimeout: config.sessionTimeout || 1800000, // 30 minutes
            enableHeatmap: config.enableHeatmap !== false,
            enableClickPath: config.enableClickPath !== false,
            enableScrollTracking: config.enableScrollTracking !== false,
            trackingLevel: config.trackingLevel || 'basic', // basic, detailed, comprehensive
            anonymizeData: config.anonymizeData !== false,
            ...config
        };
        
        this.sessionId = this.generateSessionId();
        this.userId = this.getStoredUserId();
        this.sessionStartTime = Date.now();
        this.lastActivityTime = Date.now();
        this.pageViews = [];
        this.clickPath = [];
        this.heatmaps = new Map();
        this.scrollDepth = [];
        this.formInteractions = [];
        this.deviceInfo = this.getDeviceInfo();
        
        this.init();
    }
    
    init() {
        console.log('[UserTracking] تم تهيئة نظام تتبع المستخدمين');
        
        // بدء جلسة المستخدم
        this.startUserSession();
        
        // تتبع النشاط
        this.setupActivityTracking();
        
        // تتبع التنقل
        this.setupNavigationTracking();
        
        // تتبع النقرات
        this.setupClickTracking();
        
        // تتبع التمرير
        this.setupScrollTracking();
        
        // تتبع النماذج
        this.setupFormTracking();
        
        // تتبع تفاعلات اللمس
        this.setupTouchTracking();
        
        // تتبع البحث
        this.setupSearchTracking();
        
        // تتبع التحويلات
        this.setupConversionTracking();
        
        // إرسال البيانات بشكل دوري
        this.startPeriodicTracking();
        
        // تنظيف البيانات عند إغلاق الصفحة
        this.setupPageUnload();
    }
    
    /**
     * بدء جلسة المستخدم
     */
    startUserSession() {
        this.trackEvent('session_start', {
            user_id: this.userId,
            session_id: this.sessionId,
            timestamp: new Date().toISOString(),
            user_agent: this.anonymizeData(navigator.userAgent),
            referrer: document.referrer,
            landing_page: window.location.href
        });
    }
    
    /**
     * إعداد تتبع النشاط
     */
    setupActivityTracking() {
        // تحديث آخر نشاط
        const updateActivity = () => {
            this.lastActivityTime = Date.now();
        };
        
        // أحداث النشاط
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, updateActivity, { passive: true });
        });
        
        // تتبع الوقت النشط
        setInterval(() => {
            this.trackActiveTime();
        }, 60000); // كل دقيقة
    }
    
    /**
     * إعداد تتبع التنقل
     */
    setupNavigationTracking() {
        // تتبع تغيير URL
        let lastUrl = window.location.href;
        const trackUrlChange = () => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                this.trackPageView(currentUrl, lastUrl);
                lastUrl = currentUrl;
            }
        };
        
        // مراقبة تغيير URL
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function(...args) {
            originalPushState.apply(history, args);
            setTimeout(trackUrlChange, 0);
        };
        
        history.replaceState = function(...args) {
            originalReplaceState.apply(history, args);
            setTimeout(trackUrlChange, 0);
        };
        
        window.addEventListener('popstate', trackUrlChange);
        
        // تتبع أول صفحة مشروحة
        this.trackPageView(window.location.href, document.referrer);
    }
    
    /**
     * تتبع صفحة مشروحة
     */
    trackPageView(currentUrl, previousUrl) {
        const pageView = {
            user_id: this.userId,
            session_id: this.sessionId,
            url: currentUrl,
            title: document.title,
            referrer: previousUrl,
            timestamp: new Date().toISOString(),
            load_time: performance.now()
        };
        
        this.pageViews.push(pageView);
        
        this.trackEvent('page_view', pageView);
        
        // تتبع Google Analytics 4 إذا كان متوفراً
        if (typeof gtag !== 'undefined') {
            gtag('config', 'GA_MEASUREMENT_ID', {
                page_title: document.title,
                page_location: currentUrl
            });
        }
    }
    
    /**
     * إعداد تتبع النقرات
     */
    setupClickTracking() {
        if (!this.config.enableClickPath) return;
        
        document.addEventListener('click', (event) => {
            const clickData = this.getClickData(event);
            this.trackClick(clickData);
        }, true);
    }
    
    /**
     * الحصول على بيانات النقر
     */
    getClickData(event) {
        const target = event.target;
        const rect = target.getBoundingClientRect();
        
        return {
            user_id: this.userId,
            session_id: this.sessionId,
            element: target.tagName.toLowerCase(),
            id: target.id || null,
            class: target.className || null,
            text: this.anonymizeData(target.textContent?.trim().substring(0, 100) || ''),
            href: target.href || null,
            position: {
                x: event.clientX,
                y: event.clientY,
                relative_x: event.clientX - rect.left,
                relative_y: event.clientY - rect.top,
                percentage_x: (event.clientX / window.innerWidth * 100).toFixed(2),
                percentage_y: (event.clientY / window.innerHeight * 100).toFixed(2)
            },
            page_position: {
                scroll_x: window.pageXOffset,
                scroll_y: window.pageYOffset,
                viewport_width: window.innerWidth,
                viewport_height: window.innerHeight
            },
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * تتبع النقر
     */
    trackClick(clickData) {
        // إضافة إلى مسار النقر
        this.clickPath.push(clickData);
        
        // الاحتفاظ بآخر 50 نقرة فقط
        if (this.clickPath.length > 50) {
            this.clickPath.shift();
        }
        
        // إضافة إلى خريطة الحرارة
        if (this.config.enableHeatmap) {
            this.addToHeatmap(clickData.position);
        }
        
        this.trackEvent('click', clickData);
        
        // تتبع تفاعلات خاصة
        this.trackSpecialInteractions(clickData);
    }
    
    /**
     * إضافة إلى خريطة الحرارة
     */
    addToHeatmap(position) {
        const key = `${Math.floor(position.percentage_x)}_${Math.floor(position.percentage_y)}`;
        
        if (!this.heatmaps.has(key)) {
            this.heatmaps.set(key, {
                x: Math.floor(position.percentage_x),
                y: Math.floor(position.percentage_y),
                clicks: 0,
                total_time: 0
            });
        }
        
        const heatPoint = this.heatmaps.get(key);
        heatPoint.clicks++;
    }
    
    /**
     * إعداد تتبع التمرير
     */
    setupScrollTracking() {
        if (!this.config.enableScrollTracking) return;
        
        let scrollStartTime = null;
        let maxScrollDepth = 0;
        let scrollDirection = null;
        
        const trackScroll = this.throttle(() => {
            const scrollTop = window.pageYOffset;
            const scrollHeight = document.documentElement.scrollHeight;
            const viewportHeight = window.innerHeight;
            const scrollPercent = Math.round((scrollTop / (scrollHeight - viewportHeight)) * 100);
            
            // تتبع أقصى عمق
            if (scrollPercent > maxScrollDepth) {
                maxScrollDepth = scrollPercent;
            }
            
            // تتبع اتجاه التمرير
            if (scrollStartTime === null) {
                scrollStartTime = Date.now();
            }
            
            const direction = scrollTop > (this.lastScrollTop || 0) ? 'down' : 'up';
            if (direction !== scrollDirection) {
                scrollDirection = direction;
                scrollStartTime = Date.now();
            }
            
            this.lastScrollTop = scrollTop;
            
            // حفظ بيانات التمرير
            this.scrollDepth.push({
                user_id: this.userId,
                session_id: this.sessionId,
                scroll_depth: Math.min(scrollPercent, 100),
                direction: scrollDirection,
                timestamp: new Date().toISOString()
            });
            
            // الاحتفاظ بآخر 100 قراءة فقط
            if (this.scrollDepth.length > 100) {
                this.scrollDepth.shift();
            }
        }, 500);
        
        window.addEventListener('scroll', trackScroll, { passive: true });
    }
    
    /**
     * إعداد تتبع النماذج
     */
    setupFormTracking() {
        document.addEventListener('focus', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                this.trackFormInteraction('focus', event.target);
            }
        }, true);
        
        document.addEventListener('blur', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                this.trackFormInteraction('blur', event.target);
            }
        }, true);
        
        document.addEventListener('submit', (event) => {
            this.trackFormSubmission(event.target);
        });
        
        // تتبع تغيير القيم
        document.addEventListener('input', this.debounce((event) => {
            if (event.target.tagName === 'INPUT') {
                this.trackFormInput(event.target);
            }
        }, 1000));
    }
    
    /**
     * تتبع تفاعل النموذج
     */
    trackFormInteraction(type, element) {
        const interaction = {
            user_id: this.userId,
            session_id: this.sessionId,
            type: type,
            element_type: element.type || element.tagName.toLowerCase(),
            element_name: element.name || '',
            element_id: element.id || '',
            timestamp: new Date().toISOString()
        };
        
        this.formInteractions.push(interaction);
        
        if (this.formInteractions.length > 100) {
            this.formInteractions.shift();
        }
        
        this.trackEvent('form_interaction', interaction);
    }
    
    /**
     * تتبع إدخال النموذج
     */
    trackFormInput(element) {
        this.trackFormInteraction('input', element);
        
        // تتبع طول النص
        if (element.value.length > 0) {
            this.trackEvent('form_input_length', {
                user_id: this.userId,
                session_id: this.sessionId,
                element_name: element.name || element.id,
                length: element.value.length,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * تتبع إرسال النموذج
     */
    trackFormSubmission(form) {
        const formData = {
            user_id: this.userId,
            session_id: this.sessionId,
            action: form.action || '',
            method: form.method || 'GET',
            elements_count: form.elements.length,
            required_fields: Array.from(form.elements).filter(el => el.required).length,
            timestamp: new Date().toISOString()
        };
        
        this.trackEvent('form_submission', formData);
    }
    
    /**
     * إعداد تتبع اللمس
     */
    setupTouchTracking() {
        let touchStart = null;
        
        document.addEventListener('touchstart', (event) => {
            touchStart = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
                time: Date.now()
            };
        }, { passive: true });
        
        document.addEventListener('touchend', (event) => {
            if (touchStart) {
                const touchEnd = {
                    x: event.changedTouches[0].clientX,
                    y: event.changedTouches[0].clientY,
                    time: Date.now()
                };
                
                const distance = Math.sqrt(
                    Math.pow(touchEnd.x - touchStart.x, 2) + 
                    Math.pow(touchEnd.y - touchStart.y, 2)
                );
                
                this.trackEvent('touch_interaction', {
                    user_id: this.userId,
                    session_id: this.sessionId,
                    start_position: touchStart,
                    end_position: touchEnd,
                    distance: distance,
                    duration: touchEnd.time - touchStart.time,
                    timestamp: new Date().toISOString()
                });
                
                touchStart = null;
            }
        }, { passive: true });
    }
    
    /**
     * إعداد تتبع البحث
     */
    setupSearchTracking() {
        document.addEventListener('input', (event) => {
            if (event.target.type === 'search' || 
                event.target.getAttribute('role') === 'searchbox' ||
                event.target.closest('[role="search"]')) {
                
                this.trackSearchQuery(event.target.value);
            }
        });
    }
    
    /**
     * تتبع استعلام البحث
     */
    trackSearchQuery(query) {
        if (query.length >= 2) {
            this.trackEvent('search_query', {
                user_id: this.userId,
                session_id: this.sessionId,
                query: this.anonymizeData(query),
                query_length: query.length,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * إعداد تتبع التحويلات
     */
    setupConversionTracking() {
        // تتبع الأحداث المخصصة
        this.setupCustomEventTracking();
    }
    
    /**
     * تتبع الأحداث المخصصة
     */
    setupCustomEventTracking() {
        // تتبع تسجيل المستخدم
        document.addEventListener('user_registered', (event) => {
            this.trackConversion('user_registration', event.detail);
        });
        
        // تتبع شراء المنتج
        document.addEventListener('product_purchased', (event) => {
            this.trackConversion('product_purchase', event.detail);
        });
        
        // تتبع الاشتراك
        document.addEventListener('subscription_created', (event) => {
            this.trackConversion('subscription', event.detail);
        });
        
        // تتبع التحميل
        document.addEventListener('download_started', (event) => {
            this.trackConversion('download', event.detail);
        });
        
        // تتبع مشاركة المحتوى
        document.addEventListener('content_shared', (event) => {
            this.trackConversion('content_share', event.detail);
        });
    }
    
    /**
     * تتبع التحويل
     */
    trackConversion(type, data) {
        const conversion = {
            user_id: this.userId,
            session_id: this.sessionId,
            type: type,
            value: data.value || 0,
            currency: data.currency || 'USD',
            category: data.category || '',
            label: data.label || '',
            timestamp: new Date().toISOString()
        };
        
        this.trackEvent('conversion', conversion);
        
        // تتبع Google Analytics إذا كان متوفراً
        if (typeof gtag !== 'undefined') {
            gtag('event', 'conversion', {
                send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
                value: conversion.value,
                currency: conversion.currency
            });
        }
    }
    
    /**
     * تتبع وقت النشاط
     */
    trackActiveTime() {
        const activeTime = Date.now() - this.lastActivityTime;
        if (activeTime < 60000) { // أقل من دقيقة
            this.trackEvent('active_time', {
                user_id: this.userId,
                session_id: this.sessionId,
                active_time: activeTime,
                timestamp: new Date().toISOString()
            });
        }
        this.lastActivityTime = Date.now();
    }
    
    /**
     * تتبع تفاعلات خاصة
     */
    trackSpecialInteractions(clickData) {
        // تتبع نقرات الأزرار الرئيسية
        if (clickData.element === 'button' && clickData.text) {
            this.trackEvent('button_click', clickData);
        }
        
        // تتبع الروابط الخارجية
        if (clickData.href && !clickData.href.includes(window.location.hostname)) {
            this.trackEvent('external_link', clickData);
        }
        
        // تتبع تحميل الملفات
        if (clickData.href && this.isFileDownload(clickData.href)) {
            this.trackEvent('file_download', clickData);
        }
        
        // تتبع تفاعلات الوسائط الاجتماعية
        if (this.isSocialInteraction(clickData)) {
            this.trackEvent('social_interaction', clickData);
        }
    }
    
    /**
     * تحديد إذا كان الملف للتحميل
     */
    isFileDownload(url) {
        const fileExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar'];
        return fileExtensions.some(ext => url.toLowerCase().includes(ext));
    }
    
    /**
     * تحديد إذا كان تفاعل وسائط اجتماعية
     */
    isSocialInteraction(clickData) {
        const socialDomains = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'youtube.com'];
        return socialDomains.some(domain => clickData.href && clickData.href.includes(domain));
    }
    
    /**
     * الحصول على معلومات الجهاز
     */
    getDeviceInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        return {
            user_agent: this.anonymizeData(navigator.userAgent),
            language: navigator.language,
            platform: navigator.platform,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            color_depth: screen.colorDepth,
            pixel_ratio: window.devicePixelRatio || 1,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            online_status: navigator.onLine,
            cookies_enabled: navigator.cookieEnabled,
            touch_support: 'ontouchstart' in window,
            connection: connection ? {
                effective_type: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt
            } : null
        };
    }
    
    /**
     * إنشاء معرف مستخدم
     */
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    /**
     * الحصول على معرف المستخدم المحفوظ
     */
    getStoredUserId() {
        let userId = localStorage.getItem('user_tracking_id');
        if (!userId) {
            userId = this.generateUserId();
            localStorage.setItem('user_tracking_id', userId);
        }
        return userId;
    }
    
    /**
     * إخفاء البيانات الحساسة
     */
    anonymizeData(data) {
        if (!this.config.anonymizeData) return data;
        
        // إخفاء عناوين IP (إذا كانت موجودة)
        if (typeof data === 'string' && data.match(/\d+\.\d+\.\d+\.\d+/)) {
            return data.replace(/\d+\.\d+\.\d+\.\d+/, 'xxx.xxx.xxx.xxx');
        }
        
        // إزالة المعلومات الشخصية من النصوص
        if (typeof data === 'string') {
            return data
                .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***')
                .replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '****-****-****-****')
                .replace(/\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g, '***-**-****');
        }
        
        return data;
    }
    
    /**
     * تتبع حدث
     */
    trackEvent(type, data) {
        const event = {
            type: type,
            data: data,
            timestamp: new Date().toISOString()
        };
        
        // إضافة إلى قائمة الأحداث
        if (!this.events) this.events = [];
        this.events.push(event);
        
        // الاحتفاظ بآخر 200 حدث فقط
        if (this.events.length > 200) {
            this.events.shift();
        }
        
        // إرسال فوري للأحداث المهمة
        if (['conversion', 'form_submission', 'external_link'].includes(type)) {
            this.sendTrackingData([event]);
        }
    }
    
    /**
     * بدء التتبع الدوري
     */
    startPeriodicTracking() {
        setInterval(() => {
            this.sendTrackingData();
        }, 60000); // كل دقيقة
    }
    
    /**
     * إرسال بيانات التتبع
     */
    async sendTrackingData(events = null) {
        const dataToSend = events || this.events;
        if (!dataToSend || dataToSend.length === 0) return;
        
        try {
            const payload = {
                user_id: this.userId,
                session_id: this.sessionId,
                device_info: this.deviceInfo,
                events: dataToSend,
                analytics: {
                    page_views: this.pageViews,
                    click_path: this.clickPath,
                    heatmap_data: Array.from(this.heatmaps.values()),
                    scroll_depth: this.scrollDepth,
                    form_interactions: this.formInteractions
                }
            };
            
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                console.log('تم إرسال بيانات التتبع بنجاح');
                
                // مسح البيانات المرسلة
                if (!events) {
                    this.events = [];
                }
            }
        } catch (error) {
            console.error('فشل في إرسال بيانات التتبع:', error);
        }
    }
    
    /**
     * إعداد إغلاق الصفحة
     */
    setupPageUnload() {
        window.addEventListener('beforeunload', () => {
            this.trackEvent('session_end', {
                user_id: this.userId,
                session_id: this.sessionId,
                duration: Date.now() - this.sessionStartTime,
                page_views: this.pageViews.length,
                clicks: this.clickPath.length
            });
            
            this.sendTrackingData();
        });
    }
    
    /**
     * الحصول على ملخص الجلسة
     */
    getSessionSummary() {
        return {
            user_id: this.userId,
            session_id: this.sessionId,
            duration: Date.now() - this.sessionStartTime,
            page_views: this.pageViews.length,
            clicks: this.clickPath.length,
            scroll_events: this.scrollDepth.length,
            form_interactions: this.formInteractions.length,
            max_scroll_depth: Math.max(...this.scrollDepth.map(s => s.scroll_depth), 0),
            device_info: this.deviceInfo
        };
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
}

// إنشاء مثيل عام
window.UserTracking = new UserTracking();

// تصدير للاستخدام مع وحدات
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserTracking;
}