/**
 * نظام تحليلات المستخدمين
 * User Analytics System
 */

const EventEmitter = require('events');
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class UserAnalyticsSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // إعدادات الجمع
      enableRealTimeTracking: config.enableRealTimeTracking !== false,
      enableSessionTracking: config.enableSessionTracking !== false,
      enableEventTracking: config.enableEventTracking !== false,
      enablePageTracking: config.enablePageTracking !== false,
      enableUserIdentification: config.enableUserIdentification !== false,
      
      // إعدادات التحليل
      sessionTimeout: config.sessionTimeout || 30 * 60 * 1000, // 30 دقيقة
      batchSize: config.batchSize || 100,
      batchInterval: config.batchInterval || 5000, // 5 ثوان
      
      // إعدادات التصدير
      enableDataExport: config.enableDataExport !== false,
      exportPath: config.exportPath || './analytics_data',
      exportFormats: config.exportFormats || ['json', 'csv'],
      retentionDays: config.retentionDays || 30,
      
      // إعدادات التقارير
      enableReports: config.enableReports !== false,
      reportInterval: config.reportInterval || 60 * 60 * 1000, // ساعة
      enableDashboards: config.enableDashboards !== false,
      
      ...config
    };
    
    // إعداد نظام السجلات
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'user_analytics.log' }),
        new winston.transports.Console()
      ]
    });
    
    // تخزين البيانات
    this.userSessions = new Map();
    this.userProfiles = new Map();
    this.eventsQueue = [];
    this.pageViews = [];
    this.conversions = [];
    
    // إحصائيات التحليل
    this.analytics = {
      totalUsers: 0,
      totalSessions: 0,
      totalEvents: 0,
      totalPageViews: 0,
      totalConversions: 0,
      uniqueUsers: new Set(),
      sessionDurations: [],
      pageViewDurations: [],
      bounceRate: 0,
      averageSessionDuration: 0,
      topPages: [],
      topReferrers: [],
      userFlow: [],
      cohortAnalysis: [],
      segmentAnalysis: {}
    };
    
    // إنشاء مجلد التصدير
    if (this.config.enableDataExport && !fs.existsSync(this.config.exportPath)) {
      fs.mkdirSync(this.config.exportPath, { recursive: true });
    }
    
    this.initializeTracking();
  }
  
  /**
   * تهيئة التتبع
   */
  initializeTracking() {
    this.logger.info('Initializing user analytics system');
    
    // بدء معالجة الأحداث
    if (this.config.enableRealTimeTracking) {
      this.startEventProcessing();
    }
    
    // بدء تتبع الجلسات
    if (this.config.enableSessionTracking) {
      this.startSessionTracking();
    }
    
    // بدء تنظيف البيانات
    this.startDataCleanup();
    
    // بدء توليد التقارير
    if (this.config.enableReports) {
      this.startReportGeneration();
    }
    
    // تحميل البيانات المحفوظة
    this.loadStoredData();
  }
  
  /**
   * تتبع صفحة جديدة
   */
  trackPageView(pageData) {
    try {
      const pageView = {
        id: uuidv4(),
        sessionId: this.getCurrentSessionId(pageData.userId),
        userId: pageData.userId,
        page: {
          url: pageData.url,
          title: pageData.title,
          path: this.extractPath(pageData.url),
          referrer: pageData.referrer,
          referrerDomain: this.extractDomain(pageData.referrer || '')
        },
        device: {
          type: this.detectDeviceType(),
          os: this.detectOS(),
          browser: this.detectBrowser(),
          screenResolution: pageData.screenResolution,
          viewportSize: pageData.viewportSize
        },
        location: {
          country: pageData.country,
          region: pageData.region,
          city: pageData.city,
          timezone: pageData.timezone
        },
        timestamp: Date.now(),
        duration: 0, // سيتم تحديثه عند مغادرة الصفحة
        scrollDepth: 0,
        clicks: 0
      };
      
      // حفظ Page View
      this.pageViews.push(pageView);
      this.analytics.totalPageViews++;
      
      // تحديث User Profile
      if (pageData.userId) {
        this.updateUserProfile(pageData.userId, {
          lastSeen: Date.now(),
          lastPage: pageData.url,
          totalPageViews: (this.userProfiles.get(pageData.userId)?.totalPageViews || 0) + 1
        });
      }
      
      // إطلاق حدث
      this.emit('pageView', pageView);
      
      // تتبع التنقل
      this.trackNavigation(pageData.url, pageData.referrer);
      
      this.logger.debug('Page view tracked', { 
        sessionId: pageView.sessionId, 
        page: pageData.url 
      });
      
      return pageView.id;
      
    } catch (error) {
      this.logger.error('Error tracking page view', { error: error.message });
      return null;
    }
  }
  
  /**
   * تتبع حدث مخصص
   */
  trackEvent(eventData) {
    try {
      const event = {
        id: uuidv4(),
        sessionId: this.getCurrentSessionId(eventData.userId),
        userId: eventData.userId,
        category: eventData.category,
        action: eventData.action,
        label: eventData.label,
        value: eventData.value,
        properties: eventData.properties || {},
        timestamp: Date.now()
      };
      
      // إضافة إلى قائمة الانتظار
      this.eventsQueue.push(event);
      this.analytics.totalEvents++;
      
      // تحديث User Profile
      if (eventData.userId) {
        this.updateUserProfile(eventData.userId, {
          lastSeen: Date.now(),
          totalEvents: (this.userProfiles.get(eventData.userId)?.totalEvents || 0) + 1
        });
      }
      
      // إطلاق حدث
      this.emit('customEvent', event);
      
      this.logger.debug('Custom event tracked', { 
        sessionId: event.sessionId, 
        category: event.category,
        action: event.action
      });
      
      return event.id;
      
    } catch (error) {
      this.logger.error('Error tracking event', { error: error.message });
      return null;
    }
  }
  
  /**
   * تتبع التحويل
   */
  trackConversion(conversionData) {
    try {
      const conversion = {
        id: uuidv4(),
        sessionId: this.getCurrentSessionId(conversionData.userId),
        userId: conversionData.userId,
        type: conversionData.type, // 'purchase', 'signup', 'download', 'share', etc.
        value: conversionData.value || 0,
        currency: conversionData.currency || 'USD',
        items: conversionData.items || [],
        source: conversionData.source || 'direct',
        medium: conversionData.medium || 'direct',
        campaign: conversionData.campaign || '',
        goal: conversionData.goal || '',
        timestamp: Date.now()
      };
      
      // حفظ التحويل
      this.conversions.push(conversion);
      this.analytics.totalConversions++;
      
      // تحديث User Profile
      if (conversionData.userId) {
        this.updateUserProfile(conversionData.userId, {
          lastSeen: Date.now(),
          totalConversions: (this.userProfiles.get(conversionData.userId)?.totalConversions || 0) + 1,
          totalValue: (this.userProfiles.get(conversionData.userId)?.totalValue || 0) + conversion.value
        });
      }
      
      // إطلاق حدث
      this.emit('conversion', conversion);
      
      this.logger.info('Conversion tracked', { 
        sessionId: conversion.sessionId, 
        type: conversion.type,
        value: conversion.value
      });
      
      return conversion.id;
      
    } catch (error) {
      this.logger.error('Error tracking conversion', { error: error.message });
      return null;
    }
  }
  
  /**
   * تحديث ملف المستخدم
   */
  updateUserProfile(userId, updates) {
    if (!userId) return;
    
    const currentProfile = this.userProfiles.get(userId) || {
      userId,
      firstSeen: Date.now(),
      totalPageViews: 0,
      totalEvents: 0,
      totalConversions: 0,
      totalValue: 0,
      sessionsCount: 0,
      averageSessionDuration: 0,
      deviceTypes: {},
      browsers: {},
      countries: {},
      trafficSources: {},
      conversionRate: 0
    };
    
    // دمج التحديثات
    const updatedProfile = { ...currentProfile, ...updates };
    
    // تحديث الإحصائيات المجمعة
    if (updates.lastSeen) {
      updatedProfile.lastSeen = updates.lastSeen;
    }
    
    if (updates.totalPageViews !== undefined) {
      updatedProfile.totalPageViews = updates.totalPageViews;
    }
    
    if (updates.totalEvents !== undefined) {
      updatedProfile.totalEvents = updates.totalEvents;
    }
    
    if (updates.totalConversions !== undefined) {
      updatedProfile.totalConversions = updates.totalConversions;
      updatedProfile.conversionRate = updatedProfile.totalPageViews > 0 
        ? (updatedProfile.totalConversions / updatedProfile.totalPageViews) * 100 
        : 0;
    }
    
    // حساب متوسط مدة الجلسة
    if (updatedProfile.sessionsCount > 0) {
      const totalDuration = this.analytics.sessionDurations
        .filter(d => d.userId === userId)
        .reduce((sum, d) => sum + d.duration, 0);
      updatedProfile.averageSessionDuration = totalDuration / updatedProfile.sessionsCount;
    }
    
    this.userProfiles.set(userId, updatedProfile);
    this.analytics.uniqueUsers.add(userId);
  }
  
  /**
   * الحصول على معرف الجلسة الحالية
   */
  getCurrentSessionId(userId) {
    if (!userId) return null;
    
    const sessionKey = `user_${userId}`;
    let session = this.userSessions.get(sessionKey);
    
    const now = Date.now();
    
    // إنشاء جلسة جديدة إذا لم تكن موجودة أو انتهت صلاحيتها
    if (!session || (now - session.startTime) > this.config.sessionTimeout) {
      session = {
        id: uuidv4(),
        userId,
        startTime: now,
        lastActivity: now,
        pageViews: 0,
        events: 0,
        conversions: 0,
        referrer: null,
        landingPage: null,
        exitPage: null,
        bounce: false
      };
      
      this.userSessions.set(sessionKey, session);
      this.analytics.totalSessions++;
      
      // تحديث ملف المستخدم
      this.updateUserProfile(userId, {
        sessionsCount: (this.userProfiles.get(userId)?.sessionsCount || 0) + 1
      });
    } else {
      // تحديث آخر نشاط
      session.lastActivity = now;
    }
    
    return session.id;
  }
  
  /**
   * تتبع التنقل
   */
  trackNavigation(currentUrl, referrer) {
    const now = Date.now();
    
    // تحديث صفحات الدخول والخروج
    for (const [sessionKey, session] of this.userSessions.entries()) {
      if (!session.landingPage && currentUrl) {
        session.landingPage = currentUrl;
        session.referrer = referrer;
      }
      
      session.exitPage = currentUrl;
      session.pageViews++;
    }
  }
  
  /**
   * اكتشاف نوع الجهاز
   */
  detectDeviceType() {
    if (typeof window === 'undefined') return 'server';
    
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      return 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }
  
  /**
   * اكتشاف نظام التشغيل
   */
  detectOS() {
    if (typeof window === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/windows/i.test(userAgent)) return 'windows';
    if (/mac/i.test(userAgent)) return 'macos';
    if (/linux/i.test(userAgent)) return 'linux';
    if (/android/i.test(userAgent)) return 'android';
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
    
    return 'unknown';
  }
  
  /**
   * اكتشاف المتصفح
   */
  detectBrowser() {
    if (typeof window === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) return 'chrome';
    if (/firefox/i.test(userAgent)) return 'firefox';
    if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'safari';
    if (/edge/i.test(userAgent)) return 'edge';
    if (/opera/i.test(userAgent)) return 'opera';
    
    return 'unknown';
  }
  
  /**
   * استخراج المسار من URL
   */
  extractPath(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname || '/';
    } catch {
      return url;
    }
  }
  
  /**
   * استخراج النطاق من URL
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'direct';
    }
  }
  
  /**
   * بدء معالجة الأحداث
   */
  startEventProcessing() {
    const processEvents = () => {
      try {
        if (this.eventsQueue.length === 0) return;
        
        // معالجة دفعة من الأحداث
        const batch = this.eventsQueue.splice(0, this.config.batchSize);
        
        // تحليل الأحداث
        for (const event of batch) {
          this.analyzeEvent(event);
        }
        
        // تحديث التحليلات
        this.updateAnalytics();
        
      } catch (error) {
        this.logger.error('Error processing events', { error: error.message });
      }
    };
    
    setInterval(processEvents, this.config.batchInterval);
  }
  
  /**
   * تحليل حدث
   */
  analyzeEvent(event) {
    // تحليل مصدر الحركة
    if (event.category === 'page_view') {
      this.analyzeTrafficSource(event);
    }
    
    // تحليل سلوك المستخدم
    if (event.category === 'user_behavior') {
      this.analyzeUserBehavior(event);
    }
    
    // تحليل التفاعل
    if (event.category === 'interaction') {
      this.analyzeInteraction(event);
    }
  }
  
  /**
   * تحليل مصدر الحركة
   */
  analyzeTrafficSource(event) {
    const domain = event.properties?.referrerDomain || 'direct';
    
    // تحديث إحصائيات المصادر
    if (!this.analytics.trafficSources) {
      this.analytics.trafficSources = {};
    }
    
    if (!this.analytics.trafficSources[domain]) {
      this.analytics.trafficSources[domain] = {
        sessions: 0,
        pageViews: 0,
        conversions: 0,
        bounceRate: 0,
        averageSessionDuration: 0
      };
    }
    
    this.analytics.trafficSources[domain].pageViews++;
  }
  
  /**
   * تحليل سلوك المستخدم
   */
  analyzeUserBehavior(event) {
    // يمكن توسيع هذا لتشمل خوارزميات التعلم الآلي
    const behavior = {
      timestamp: event.timestamp,
      action: event.action,
      duration: event.properties?.duration || 0,
      interactionCount: event.properties?.interactions || 0
    };
    
    // إطلاق أحداث للتحليل المتقدم
    this.emit('userBehaviorAnalyzed', { userId: event.userId, behavior });
  }
  
  /**
   * تحليل التفاعل
   */
  analyzeInteraction(event) {
    // تحليل أنواع التفاعلات المختلفة
    const interactions = this.analytics.interactions || {};
    
    if (!interactions[event.action]) {
      interactions[event.action] = {
        count: 0,
        averageDuration: 0,
        totalDuration: 0
      };
    }
    
    interactions[event.action].count++;
    interactions[event.action].totalDuration += event.properties?.duration || 0;
    interactions[event.action].averageDuration = 
      interactions[event.action].totalDuration / interactions[event.action].count;
    
    this.analytics.interactions = interactions;
  }
  
  /**
   * تحديث التحليلات
   */
  updateAnalytics() {
    // حساب معدل الارتداد
    this.calculateBounceRate();
    
    // حساب متوسط مدة الجلسة
    this.calculateAverageSessionDuration();
    
    // تحديث أفضل الصفحات
    this.updateTopPages();
    
    // تحديث أفضل المصادر
    this.updateTopReferrers();
    
    // تحليل تدفق المستخدمين
    this.analyzeUserFlow();
    
    // تحليل المجموعات
    this.performCohortAnalysis();
    
    // تحليل المقاطع
    this.performSegmentAnalysis();
  }
  
  /**
   * حساب معدل الارتداد
   */
  calculateBounceRate() {
    const sessions = Array.from(this.userSessions.values());
    if (sessions.length === 0) return;
    
    const bouncedSessions = sessions.filter(s => s.pageViews === 1);
    this.analytics.bounceRate = (bouncedSessions.length / sessions.length) * 100;
  }
  
  /**
   * حساب متوسط مدة الجلسة
   */
  calculateAverageSessionDuration() {
    const sessionDurations = Array.from(this.userSessions.values())
      .map(s => (s.lastActivity - s.startTime) / 1000); // بالثواني
    
    if (sessionDurations.length === 0) return;
    
    this.analytics.averageSessionDuration = 
      sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length;
  }
  
  /**
   * تحديث أفضل الصفحات
   */
  updateTopPages() {
    const pageViews = this.pageViews.reduce((acc, pv) => {
      const page = pv.page.path;
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {});
    
    this.analytics.topPages = Object.entries(pageViews)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }));
  }
  
  /**
   * تحديث أفضل المصادر
   */
  updateTopReferrers() {
    const referrers = this.pageViews.reduce((acc, pv) => {
      const ref = pv.page.referrerDomain;
      if (ref && ref !== 'direct') {
        acc[ref] = (acc[ref] || 0) + 1;
      }
      return acc;
    }, {});
    
    this.analytics.topReferrers = Object.entries(referrers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([referrer, views]) => ({ referrer, views }));
  }
  
  /**
   * تحليل تدفق المستخدمين
   */
  analyzeUserFlow() {
    const flows = new Map();
    
    for (const [sessionKey, session] of this.userSessions.entries()) {
      if (session.landingPage && session.exitPage && session.pageViews > 0) {
        const flowKey = `${session.landingPage} -> ${session.exitPage}`;
        flows.set(flowKey, (flows.get(flowKey) || 0) + 1);
      }
    }
    
    this.analytics.userFlow = Array.from(flows.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([flow, count]) => ({ flow, count }));
  }
  
  /**
   * تحليل المجموعات (Cohort Analysis)
   */
  performCohortAnalysis() {
    // تجميع المستخدمين حسب تاريخ التسجيل
    const cohorts = new Map();
    
    for (const [userId, profile] of this.userProfiles.entries()) {
      const cohortDate = new Date(profile.firstSeen).toISOString().split('T')[0];
      
      if (!cohorts.has(cohortDate)) {
        cohorts.set(cohortDate, {
          users: [],
          totalUsers: 0,
          retainedUsers: new Set(),
          conversionRate: 0
        });
      }
      
      const cohort = cohorts.get(cohortDate);
      cohort.users.push(userId);
      cohort.totalUsers++;
      
      // حساب المستخدمين المحتفظ بهم (المستخدمين النشطين خلال آخر 7 أيام)
      const daysSinceFirstSeen = Math.floor((Date.now() - profile.firstSeen) / (1000 * 60 * 60 * 24));
      if (daysSinceFirstSeen <= 7) {
        cohort.retainedUsers.add(userId);
      }
    }
    
    // حساب معدل الاحتفاظ
    for (const cohort of cohorts.values()) {
      cohort.retentionRate = cohort.totalUsers > 0 
        ? (cohort.retainedUsers.size / cohort.totalUsers) * 100 
        : 0;
    }
    
    this.analytics.cohortAnalysis = Array.from(cohorts.entries())
      .map(([date, data]) => ({
        cohortDate: date,
        ...data
      }))
      .sort((a, b) => new Date(b.cohortDate) - new Date(a.cohortDate));
  }
  
  /**
   * تحليل المقاطع
   */
  performSegmentAnalysis() {
    const segments = {
      byDevice: {},
      byBrowser: {},
      byCountry: {},
      byTrafficSource: {}
    };
    
    // تحليل حسب نوع الجهاز
    for (const [userId, profile] of this.userProfiles.entries()) {
      const device = profile.deviceTypes || {};
      for (const [devType, count] of Object.entries(device)) {
        segments.byDevice[devType] = (segments.byDevice[devType] || 0) + 1;
      }
    }
    
    // تحليل حسب المتصفح
    for (const [userId, profile] of this.userProfiles.entries()) {
      const browser = profile.browsers || {};
      for (const [browserName, count] of Object.entries(browser)) {
        segments.byBrowser[browserName] = (segments.byBrowser[browserName] || 0) + 1;
      }
    }
    
    this.analytics.segmentAnalysis = segments;
  }
  
  /**
   * بدء تتبع الجلسات
   */
  startSessionTracking() {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000); // كل دقيقة
  }
  
  /**
   * تنظيف الجلسات المنتهية الصلاحية
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const expiredSessions = [];
    
    for (const [sessionKey, session] of this.userSessions.entries()) {
      if ((now - session.lastActivity) > this.config.sessionTimeout) {
        expiredSessions.push(sessionKey);
        
        // حساب مدة الجلسة
        const duration = (session.lastActivity - session.startTime) / 1000;
        this.analytics.sessionDurations.push({
          userId: session.userId,
          sessionId: session.id,
          duration
        });
      }
    }
    
    // حذف الجلسات المنتهية الصلاحية
    for (const sessionKey of expiredSessions) {
      this.userSessions.delete(sessionKey);
    }
  }
  
  /**
   * بدء تنظيف البيانات
   */
  startDataCleanup() {
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000); // كل 24 ساعة
  }
  
  /**
   * تنظيف البيانات القديمة
   */
  cleanupOldData() {
    const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
    
    // تنظيف Page Views القديمة
    this.pageViews = this.pageViews.filter(pv => pv.timestamp > cutoffTime);
    
    // تنظيف Conversions القديمة
    this.conversions = this.conversions.filter(c => c.timestamp > cutoffTime);
    
    // تنظيف البيانات المحفوظة
    if (this.config.enableDataExport) {
      this.cleanupStoredData(cutoffTime);
    }
    
    this.logger.info('Old data cleaned up', { 
      cutoffDate: new Date(cutoffTime).toISOString() 
    });
  }
  
  /**
   * بدء توليد التقارير
   */
  startReportGeneration() {
    setInterval(() => {
      this.generateReport();
    }, this.config.reportInterval);
  }
  
  /**
   * توليد تقرير
   */
  generateReport() {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        period: {
          start: new Date(Date.now() - this.config.reportInterval),
          end: new Date()
        },
        summary: {
          totalUsers: this.analytics.uniqueUsers.size,
          totalSessions: this.analytics.totalSessions,
          totalPageViews: this.analytics.totalPageViews,
          totalEvents: this.analytics.totalEvents,
          totalConversions: this.analytics.totalConversions
        },
        metrics: {
          bounceRate: this.analytics.bounceRate,
          averageSessionDuration: this.analytics.averageSessionDuration,
          pagesPerSession: this.analytics.totalSessions > 0 
            ? this.analytics.totalPageViews / this.analytics.totalSessions 
            : 0,
          conversionRate: this.analytics.uniqueUsers.size > 0 
            ? (this.analytics.totalConversions / this.analytics.uniqueUsers.size) * 100 
            : 0
        },
        topContent: {
          pages: this.analytics.topPages.slice(0, 5),
          referrers: this.analytics.topReferrers.slice(0, 5)
        },
        userFlow: this.analytics.userFlow.slice(0, 10),
        segments: this.analytics.segmentAnalysis
      };
      
      // حفظ التقرير
      if (this.config.enableDataExport) {
        this.saveReport(report);
      }
      
      // إطلاق حدث التقرير
      this.emit('reportGenerated', report);
      
      this.logger.info('Analytics report generated', {
        totalUsers: report.summary.totalUsers,
        totalSessions: report.summary.totalSessions
      });
      
      return report;
      
    } catch (error) {
      this.logger.error('Error generating report', { error: error.message });
      return null;
    }
  }
  
  /**
   * حفظ التقرير
   */
  saveReport(report) {
    const timestamp = report.timestamp.replace(/[:.]/g, '-');
    const filename = `analytics_report_${timestamp}`;
    
    for (const format of this.config.exportFormats) {
      try {
        const filepath = path.join(this.config.exportPath, `${filename}.${format}`);
        
        let content;
        if (format === 'json') {
          content = JSON.stringify(report, null, 2);
        } else if (format === 'csv') {
          content = this.convertReportToCSV(report);
        }
        
        fs.writeFileSync(filepath, content);
        
      } catch (error) {
        this.logger.error('Error saving report', { 
          format, 
          error: error.message 
        });
      }
    }
  }
  
  /**
   * تحويل التقرير إلى CSV
   */
  convertReportToCSV(report) {
    let csv = 'Metric,Value\n';
    
    csv += `Total Users,${report.summary.totalUsers}\n`;
    csv += `Total Sessions,${report.summary.totalSessions}\n`;
    csv += `Total Page Views,${report.summary.totalPageViews}\n`;
    csv += `Total Events,${report.summary.totalEvents}\n`;
    csv += `Total Conversions,${report.summary.totalConversions}\n`;
    csv += `Bounce Rate,${report.metrics.bounceRate.toFixed(2)}%\n`;
    csv += `Average Session Duration,${report.metrics.averageSessionDuration.toFixed(2)}s\n`;
    csv += `Pages Per Session,${report.metrics.pagesPerSession.toFixed(2)}\n`;
    csv += `Conversion Rate,${report.metrics.conversionRate.toFixed(2)}%\n`;
    
    return csv;
  }
  
  /**
   * تحميل البيانات المحفوظة
   */
  loadStoredData() {
    if (!this.config.enableDataExport) return;
    
    try {
      // تحميل آخر تقرير محفوظ
      const files = fs.readdirSync(this.config.exportPath);
      const reportFiles = files.filter(f => f.startsWith('analytics_report_') && f.endsWith('.json'));
      
      if (reportFiles.length > 0) {
        const latestFile = reportFiles.sort().pop();
        const filepath = path.join(this.config.exportPath, latestFile);
        
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        this.logger.info('Loaded previous analytics data', { file: latestFile });
      }
      
    } catch (error) {
      this.logger.error('Error loading stored data', { error: error.message });
    }
  }
  
  /**
   * تنظيف البيانات المحفوظة القديمة
   */
  cleanupStoredData(cutoffTime) {
    try {
      const files = fs.readdirSync(this.config.exportPath);
      
      for (const file of files) {
        const filepath = path.join(this.config.exportPath, file);
        const stats = fs.statSync(filepath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filepath);
        }
      }
      
    } catch (error) {
      this.logger.error('Error cleaning up stored data', { error: error.message });
    }
  }
  
  /**
   * الحصول على إحصائيات فورية
   */
  getRealTimeStats() {
    this.updateAnalytics();
    
    return {
      timestamp: new Date().toISOString(),
      activeUsers: Array.from(this.userSessions.values()).length,
      totalUsers: this.analytics.uniqueUsers.size,
      totalSessions: this.analytics.totalSessions,
      pageViews: this.analytics.totalPageViews,
      events: this.analytics.totalEvents,
      conversions: this.analytics.totalConversions,
      bounceRate: this.analytics.bounceRate,
      averageSessionDuration: this.analytics.averageSessionDuration,
      topPages: this.analytics.topPages.slice(0, 5),
      topReferrers: this.analytics.topReferrers.slice(0, 5)
    };
  }
  
  /**
   * الحصول على تحليلات مفصلة للمستخدم
   */
  getUserAnalytics(userId) {
    if (!userId || !this.userProfiles.has(userId)) {
      return null;
    }
    
    const profile = this.userProfiles.get(userId);
    const userSessions = Array.from(this.userSessions.values())
      .filter(s => s.userId === userId);
    
    return {
      userId,
      profile,
      sessions: userSessions,
      totalSessions: userSessions.length,
      averageSessionDuration: userSessions.length > 0
        ? userSessions.reduce((sum, s) => sum + (s.lastActivity - s.startTime), 0) / userSessions.length / 1000
        : 0,
      conversionRate: profile.totalPageViews > 0 
        ? (profile.totalConversions / profile.totalPageViews) * 100 
        : 0,
      lastActivity: Math.max(...userSessions.map(s => s.lastActivity)),
      engagement: this.calculateEngagementScore(userId)
    };
  }
  
  /**
   * حساب نقاط التفاعل
   */
  calculateEngagementScore(userId) {
    const profile = this.userProfiles.get(userId);
    if (!profile) return 0;
    
    // حساب نقاط بناء على عوامل مختلفة
    let score = 0;
    
    // نقاط الصفحة (0.1 لكل صفحة)
    score += (profile.totalPageViews || 0) * 0.1;
    
    // نقاط الأحداث (0.05 لكل حدث)
    score += (profile.totalEvents || 0) * 0.05;
    
    // نقاط التحويلات (10 نقاط لكل تحويل)
    score += (profile.totalConversions || 0) * 10;
    
    // نقاط مدة الجلسة
    score += (profile.averageSessionDuration || 0) / 60; // نقاط لكل دقيقة
    
    // نقاط التكرار (عدد الجلسات)
    score += (profile.sessionsCount || 0) * 2;
    
    return Math.round(score);
  }
}

// تصدير الكلاس
module.exports = UserAnalyticsSystem;

// مثال على الاستخدام
if (require.main === module) {
  const analytics = new UserAnalyticsSystem({
    enableRealTimeTracking: true,
    enableSessionTracking: true,
    exportPath: './analytics_data',
    retentionDays: 7
  });
  
  // تسجيل مستمعي الأحداث
  analytics.on('pageView', (pv) => {
    console.log('Page view:', pv.page.url);
  });
  
  analytics.on('customEvent', (event) => {
    console.log('Custom event:', event.category, event.action);
  });
  
  analytics.on('conversion', (conversion) => {
    console.log('Conversion:', conversion.type, conversion.value);
  });
  
  analytics.on('reportGenerated', (report) => {
    console.log('Report generated:', report.summary);
  });
  
  // محاكاة بيانات
  setTimeout(() => {
    // محاكاة صفحة
    analytics.trackPageView({
      userId: 'user123',
      url: 'https://example.com/dashboard',
      title: 'Dashboard',
      referrer: 'https://google.com',
      screenResolution: '1920x1080',
      viewportSize: '1920x900'
    });
    
    // محاكاة حدث
    analytics.trackEvent({
      userId: 'user123',
      category: 'interaction',
      action: 'button_click',
      label: 'purchase_button',
      properties: {
        buttonId: 'buy_now',
        page: 'product_detail'
      }
    });
    
    // محاكاة تحويل
    analytics.trackConversion({
      userId: 'user123',
      type: 'purchase',
      value: 99.99,
      currency: 'USD',
      items: [
        { id: 'prod1', name: 'Product 1', price: 99.99, quantity: 1 }
      ]
    });
    
  }, 1000);
  
  // عرض الإحصائيات
  setInterval(() => {
    const stats = analytics.getRealTimeStats();
    console.log('Real-time stats:', JSON.stringify(stats, null, 2));
  }, 5000);
  
  // إيقاف نظيفة
  setTimeout(() => {
    console.log('Shutting down analytics system...');
    process.exit(0);
  }, 30000);
}