/**
 * نظام تتبع التحويلات
 * Conversion Tracking System
 */

const EventEmitter = require('events');
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class ConversionTrackingSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // إعدادات التتبع
      enableAttribution: config.enableAttribution !== false,
      enableMultiTouch: config.enableMultiTouch !== false,
      attributionModels: config.attributionModels || [
        'first_touch', 'last_touch', 'linear', 'time_decay', 'position_based'
      ],
      
      // إعدادات الأهداف
      conversionGoals: config.conversionGoals || [],
      funnelSteps: config.funnelSteps || [],
      
      // إعدادات التحليل
      enableROAS: config.enableROAS !== false, // Return on Ad Spend
      enableLTV: config.enableLTV !== false, // Lifetime Value
      enableCohort: config.enableCohort !== false,
      
      // إعدادات التصدير
      enableDataExport: config.enableDataExport !== false,
      exportPath: config.exportPath || './conversion_data',
      exportFormats: config.exportFormats || ['json', 'csv'],
      retentionDays: config.retentionDays || 90,
      
      // إعدادات التقارير
      enableReports: config.enableReports !== false,
      reportInterval: config.reportInterval || 24 * 60 * 60 * 1000, // يومي
      
      // إعدادات التنبيهات
      enableAlerts: config.enableAlerts !== false,
      alertThresholds: config.alertThresholds || {
        conversionRateDrop: 20, // انخفاض 20%
        ROASTarget: 3.0, // هدف ROAS
        LTVTarget: 100 // هدف LTV
      },
      
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
        new winston.transports.File({ filename: 'conversion_tracking.log' }),
        new winston.transports.Console()
      ]
    });
    
    // تخزين البيانات
    this.conversions = [];
    this.touchpoints = [];
    this.conversionPaths = new Map();
    this.funnels = new Map();
    this.goalAttribution = new Map();
    
    // تحليلات التحويل
    this.analytics = {
      totalConversions: 0,
      conversionRate: 0,
      averageOrderValue: 0,
      totalRevenue: 0,
      conversionValue: new Map(),
      sourceAttribution: new Map(),
      channelAttribution: new Map(),
      campaignAttribution: new Map(),
      funnelPerformance: new Map(),
      ROAS: 0,
      LTV: 0,
      cohortMetrics: [],
      attributionBreakdown: {}
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
    this.logger.info('Initializing conversion tracking system');
    
    // إنشاء الأهداف الافتراضية إذا لم تكن موجودة
    this.createDefaultGoals();
    
    // بدء معالجة البيانات
    this.startDataProcessing();
    
    // بدء التنظيف
    this.startDataCleanup();
    
    // بدء التقارير
    if (this.config.enableReports) {
      this.startReportGeneration();
    }
    
    // بدء التنبيهات
    if (this.config.enableAlerts) {
      this.startAlertMonitoring();
    }
    
    // تحميل البيانات المحفوظة
    this.loadStoredData();
  }
  
  /**
   * إنشاء الأهداف الافتراضية
   */
  createDefaultGoals() {
    const defaultGoals = [
      {
        id: 'purchase',
        name: 'Purchase',
        type: 'ecommerce',
        value: 'transaction_value',
        currency: 'USD',
        category: 'commerce',
        description: 'E-commerce purchase conversion'
      },
      {
        id: 'signup',
        name: 'Sign Up',
        type: 'lead',
        value: 10, // قيمة افتراضية للتسجيل
        category: 'acquisition',
        description: 'User sign up conversion'
      },
      {
        id: 'download',
        name: 'Download',
        type: 'engagement',
        value: 5,
        category: 'engagement',
        description: 'File download conversion'
      },
      {
        id: 'share',
        name: 'Social Share',
        type: 'engagement',
        value: 2,
        category: 'engagement',
        description: 'Social media share conversion'
      }
    ];
    
    // دمج الأهداف من الإعدادات مع الافتراضية
    this.config.conversionGoals = [
      ...defaultGoals,
      ...this.config.conversionGoals.filter(g => !defaultGoals.find(d => d.id === g.id))
    ];
    
    this.logger.info('Conversion goals initialized', {
      goalsCount: this.config.conversionGoals.length
    });
  }
  
  /**
   * تتبع تحويل جديد
   */
  trackConversion(conversionData) {
    try {
      const conversion = {
        id: uuidv4(),
        timestamp: Date.now(),
        goalId: conversionData.goalId,
        goalType: this.getGoalType(conversionData.goalId),
        userId: conversionData.userId,
        sessionId: conversionData.sessionId,
        
        // البيانات المالية
        value: this.calculateConversionValue(conversionData),
        currency: conversionData.currency || 'USD',
        transactionId: conversionData.transactionId,
        
        // عناصر الطلب (للمتجر الإلكتروني)
        items: conversionData.items || [],
        subtotal: conversionData.subtotal || 0,
        tax: conversionData.tax || 0,
        shipping: conversionData.shipping || 0,
        discount: conversionData.discount || 0,
        
        // مصادر التحويل
        source: this.extractAttributionData(conversionData.source),
        medium: this.extractAttributionData(conversionData.medium),
        campaign: this.extractAttributionData(conversionData.campaign),
        content: this.extractAttributionData(conversionData.content),
        term: this.extractAttributionData(conversionData.term),
        
        // معلومات إضافية
        page: conversionData.page,
        referrer: conversionData.referrer,
        device: conversionData.device,
        location: conversionData.location,
        
        // بيانات مخصصة
        customData: conversionData.customData || {},
        
        // حالة التحويل
        status: conversionData.status || 'completed',
        processed: false
      };
      
      // التحقق من صحة البيانات
      if (!this.validateConversionData(conversion)) {
        this.logger.warn('Invalid conversion data', { conversionData });
        return null;
      }
      
      // حفظ التحويل
      this.conversions.push(conversion);
      this.analytics.totalConversions++;
      
      // تحديث التحليلات
      this.updateConversionAnalytics(conversion);
      
      // تتبع مسار التحويل
      if (this.config.enableAttribution) {
        this.processConversionAttribution(conversion);
      }
      
      // تحليل القمع
      if (this.config.funnelSteps.length > 0) {
        this.updateFunnelAnalysis(conversion);
      }
      
      // إطلاق أحداث
      this.emit('conversionTracked', conversion);
      this.emit('conversionByGoal', conversion.goalId, conversion);
      
      this.logger.info('Conversion tracked', {
        id: conversion.id,
        goalId: conversion.goalId,
        value: conversion.value,
        userId: conversion.userId
      });
      
      return conversion.id;
      
    } catch (error) {
      this.logger.error('Error tracking conversion', { 
        error: error.message,
        conversionData 
      });
      return null;
    }
  }
  
  /**
   * تتبع نقطة اتصال (Touchpoint)
   */
  trackTouchpoint(touchpointData) {
    try {
      const touchpoint = {
        id: uuidv4(),
        timestamp: touchpointData.timestamp || Date.now(),
        userId: touchpointData.userId,
        sessionId: touchpointData.sessionId,
        
        // نوع نقطة الاتصال
        type: touchpoint.type, // 'page_view', 'click', 'form_submit', 'download', etc.
        category: touchpoint.category,
        action: touchpoint.action,
        
        // مصدر الحركة
        source: this.extractAttributionData(touchpoint.source),
        medium: this.extractAttributionData(touchpoint.medium),
        campaign: this.extractAttributionData(touchpoint.campaign),
        content: this.extractAttributionData(touchpoint.content),
        term: this.extractAttributionData(touchpoint.term),
        
        // البيانات الإضافية
        page: touchpoint.page,
        referrer: touchpoint.referrer,
        device: touchpoint.device,
        location: touchpoint.location,
        
        // بيانات مخصصة
        properties: touchpoint.properties || {},
        
        // قيمة مؤقتة (يمكن تعديلها لاحقاً)
        touchpointValue: touchpoint.touchpointValue || 0
      };
      
      // حفظ نقطة الاتصال
      this.touchpoints.push(touchpoint);
      
      this.logger.debug('Touchpoint tracked', {
        id: touchpoint.id,
        type: touchpoint.type,
        userId: touchpoint.userId
      });
      
      return touchpoint.id;
      
    } catch (error) {
      this.logger.error('Error tracking touchpoint', { 
        error: error.message,
        touchpointData 
      });
      return null;
    }
  }
  
  /**
   * حساب قيمة التحويل
   */
  calculateConversionValue(conversionData) {
    if (conversionData.value !== undefined) {
      return conversionData.value;
    }
    
    if (conversionData.items && conversionData.items.length > 0) {
      // حساب قيمة الطلب من العناصر
      return conversionData.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    }
    
    // استخدام قيمة افتراضية حسب نوع الهدف
    const goal = this.config.conversionGoals.find(g => g.id === conversionData.goalId);
    return goal ? goal.value : 0;
  }
  
  /**
   * الحصول على نوع الهدف
   */
  getGoalType(goalId) {
    const goal = this.config.conversionGoals.find(g => g.id === goalId);
    return goal ? goal.type : 'unknown';
  }
  
  /**
   * استخراج بيانات الإسناد
   */
  extractAttributionData(data) {
    if (!data) return null;
    
    if (typeof data === 'string') {
      return {
        value: data,
        hash: crypto.createHash('md5').update(data).digest('hex').substring(0, 8)
      };
    }
    
    return data;
  }
  
  /**
   * التحقق من صحة بيانات التحويل
   */
  validateConversionData(conversion) {
    if (!conversion.goalId) {
      this.logger.warn('Conversion missing goalId');
      return false;
    }
    
    if (!conversion.value || conversion.value < 0) {
      this.logger.warn('Conversion missing or invalid value');
      return false;
    }
    
    return true;
  }
  
  /**
   * تحديث تحليلات التحويل
   */
  updateConversionAnalytics(conversion) {
    // إجمالي الإيرادات
    this.analytics.totalRevenue += conversion.value;
    
    // متوسط قيمة الطلب
    const totalValue = Array.from(this.analytics.conversionValue.values())
      .reduce((sum, val) => sum + val, 0) + conversion.value;
    this.analytics.conversionValue.set(conversion.id, conversion.value);
    this.analytics.averageOrderValue = totalValue / this.analytics.conversionValue.size;
    
    // معدل التحويل (سيتم حسابه بناءً على الجلسات أو المستخدمين)
    this.analytics.conversionRate = this.calculateConversionRate();
    
    // تحليل مصادر التحويل
    this.analyzeSourceAttribution(conversion);
    
    // تحليل قنوات التحويل
    this.analyzeChannelAttribution(conversion);
    
    // تحليل حملات التحويل
    this.analyzeCampaignAttribution(conversion);
  }
  
  /**
   * حساب معدل التحويل
   */
  calculateConversionRate() {
    // حساب معدل التحويل بناءً على إجمالي الجلسات أو المستخدمين
    const totalSessions = this.getTotalSessions();
    const totalUsers = this.getTotalUsers();
    
    if (totalSessions > 0) {
      return (this.analytics.totalConversions / totalSessions) * 100;
    } else if (totalUsers > 0) {
      return (this.analytics.totalConversions / totalUsers) * 100;
    }
    
    return 0;
  }
  
  /**
   * تحليل إسناد المصادر
   */
  analyzeSourceAttribution(conversion) {
    if (conversion.source && conversion.source.value) {
      const source = conversion.source.value;
      
      if (!this.analytics.sourceAttribution.has(source)) {
        this.analytics.sourceAttribution.set(source, {
          conversions: 0,
          revenue: 0,
          value: 0
        });
      }
      
      const sourceData = this.analytics.sourceAttribution.get(source);
      sourceData.conversions++;
      sourceData.revenue += conversion.value;
      sourceData.value += conversion.value;
    }
  }
  
  /**
   * تحليل إسناد القنوات
   */
  analyzeChannelAttribution(conversion) {
    if (conversion.medium && conversion.medium.value) {
      const medium = conversion.medium.value;
      
      if (!this.analytics.channelAttribution.has(medium)) {
        this.analytics.channelAttribution.set(medium, {
          conversions: 0,
          revenue: 0,
          value: 0
        });
      }
      
      const mediumData = this.analytics.channelAttribution.get(medium);
      mediumData.conversions++;
      mediumData.revenue += conversion.value;
      mediumData.value += conversion.value;
    }
  }
  
  /**
   * تحليل إسناد الحملات
   */
  analyzeCampaignAttribution(conversion) {
    if (conversion.campaign && conversion.campaign.value) {
      const campaign = conversion.campaign.value;
      
      if (!this.analytics.campaignAttribution.has(campaign)) {
        this.analytics.campaignAttribution.set(campaign, {
          conversions: 0,
          revenue: 0,
          value: 0,
          ROAS: 0,
          cost: 0
        });
      }
      
      const campaignData = this.analytics.campaignAttribution.get(campaign);
      campaignData.conversions++;
      campaignData.revenue += conversion.value;
      campaignData.value += conversion.value;
      
      // حساب ROAS إذا كانت بيانات التكلفة متوفرة
      if (campaignData.cost > 0) {
        campaignData.ROAS = campaignData.revenue / campaignData.cost;
      }
    }
  }
  
  /**
   * معالجة إسناد التحويل
   */
  processConversionAttribution(conversion) {
    if (!this.config.enableMultiTouch) {
      // إسناد بسيط (نقطة الاتصال الأخيرة)
      this.processSingleTouchAttribution(conversion);
    } else {
      // إسناد متعدد النقاط
      this.processMultiTouchAttribution(conversion);
    }
  }
  
  /**
   * إسناد بسيط (نقطة اتصال واحدة)
   */
  processSingleTouchAttribution(conversion) {
    // الحصول على آخر نقطة اتصال للمستخدم
    const userTouchpoints = this.touchpoints
      .filter(tp => tp.userId === conversion.userId)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    if (userTouchpoints.length > 0) {
      const lastTouchpoint = userTouchpoints[0];
      const attribution = {
        touchpointId: lastTouchpoint.id,
        conversionId: conversion.id,
        model: 'last_touch',
        weight: 1.0,
        timestamp: Date.now()
      };
      
      if (!this.goalAttribution.has(conversion.goalId)) {
        this.goalAttribution.set(conversion.goalId, []);
      }
      
      this.goalAttribution.get(conversion.goalId).push(attribution);
    }
  }
  
  /**
   * إسناد متعدد النقاط
   */
  processMultiTouchAttribution(conversion) {
    const userTouchpoints = this.touchpoints
      .filter(tp => tp.userId === conversion.userId)
      .filter(tp => tp.timestamp < conversion.timestamp)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    if (userTouchpoints.length === 0) return;
    
    // تطبيق نماذج الإسناد المختلفة
    for (const model of this.config.attributionModels) {
      const attribution = this.calculateAttributionForModel(
        userTouchpoints, 
        conversion, 
        model
      );
      
      if (attribution) {
        if (!this.analytics.attributionBreakdown[model]) {
          this.analytics.attributionBreakdown[model] = [];
        }
        
        this.analytics.attributionBreakdown[model].push(attribution);
      }
    }
  }
  
  /**
   * حساب الإسناد لنموذج معين
   */
  calculateAttributionForModel(touchpoints, conversion, model) {
    let weights = [];
    
    switch (model) {
      case 'first_touch':
        weights = [1.0]; // 100% للنقطة الأولى
        break;
        
      case 'last_touch':
        weights = [1.0]; // 100% للنقطة الأخيرة
        break;
        
      case 'linear':
        // توزيع متساوي على جميع النقاط
        weights = new Array(touchpoints.length).fill(1.0 / touchpoints.length);
        break;
        
      case 'time_decay':
        // نقاط أكثر قرباً من التحويل تحصل على وزن أكبر
        const maxTime = touchpoints[touchpoints.length - 1].timestamp - touchpoints[0].timestamp;
        weights = touchpoints.map(tp => {
          const timeFromEnd = conversion.timestamp - tp.timestamp;
          return Math.exp(-timeFromEnd / (maxTime / 4)); // ثابت تحلل زمني
        });
        // تطبيع الأوزان
        const sum = weights.reduce((a, b) => a + b, 0);
        weights = weights.map(w => w / sum);
        break;
        
      case 'position_based':
        // 40% للنقطة الأولى، 40% للنقطة الأخيرة، 20% للنقاط الوسطى
        if (touchpoints.length === 1) {
          weights = [1.0];
        } else if (touchpoints.length === 2) {
          weights = [0.5, 0.5];
        } else {
          const middleCount = touchpoints.length - 2;
          weights = [0.4]; // النقطة الأولى
          weights.push(...new Array(middleCount).fill(0.2 / middleCount)); // النقاط الوسطى
          weights.push(0.4); // النقطة الأخيرة
        }
        break;
        
      default:
        weights = [1.0];
    }
    
    return {
      touchpointIds: touchpoints.map(tp => tp.id),
      conversionId: conversion.id,
      model: model,
      weights: weights,
      timestamp: Date.now()
    };
  }
  
  /**
   * تحديث تحليل القمع
   */
  updateFunnelAnalysis(conversion) {
    const userId = conversion.userId;
    
    if (!this.funnels.has(userId)) {
      this.funnels.set(userId, {
        userId: userId,
        steps: new Map(),
        completedSteps: [],
        started: Date.now(),
        lastActivity: Date.now()
      });
    }
    
    const funnel = this.funnels.get(userId);
    
    // تحديث خطوة التحويل
    const conversionStep = {
      stepName: conversion.goalId,
      timestamp: conversion.timestamp,
      value: conversion.value,
      stepOrder: this.config.funnelSteps.length + 1
    };
    
    funnel.completedSteps.push(conversionStep);
    funnel.lastActivity = conversion.timestamp;
    
    // تحديث أداء القمع
    this.updateFunnelPerformance();
  }
  
  /**
   * تحديث أداء القمع
   */
  updateFunnelPerformance() {
    const stepPerformance = new Map();
    
    for (const step of this.config.funnelSteps) {
      stepPerformance.set(step.name, {
        name: step.name,
        order: step.order,
        usersEntered: 0,
        usersCompleted: 0,
        conversionRate: 0,
        averageTimeToComplete: 0,
        dropOffRate: 0
      });
    }
    
    // حساب الإحصائيات لكل خطوة
    for (const [userId, funnel] of this.funnels.entries()) {
      // تصفية الخطوات المكتملة حسب الترتيب
      const sortedSteps = funnel.completedSteps
        .sort((a, b) => a.stepOrder - b.stepOrder);
      
      // تحليل كل خطوة
      for (const step of this.config.funnelSteps) {
        const stepData = stepPerformance.get(step.name);
        stepData.usersEntered++;
        
        // البحث عن المستخدم الذي أكمل هذه الخطوة
        const userCompletedStep = sortedSteps.find(s => s.stepName === step.name);
        if (userCompletedStep) {
          stepData.usersCompleted++;
        }
      }
      
      // حساب معدلات التحويل
      for (const stepData of stepPerformance.values()) {
        stepData.conversionRate = stepData.usersEntered > 0 
          ? (stepData.usersCompleted / stepData.usersEntered) * 100 
          : 0;
      }
    }
    
    // تحديث أداء القمع في التحليلات
    this.analytics.funnelPerformance = Object.fromEntries(stepPerformance);
  }
  
  /**
   * بدء معالجة البيانات
   */
  startDataProcessing() {
    const processData = () => {
      try {
        // معالجة التحويلات المعلقة
        this.processPendingConversions();
        
        // تحديث التحليلات
        this.updateOverallAnalytics();
        
        // حساب ROAS و LTV
        if (this.config.enableROAS) {
          this.calculateROAS();
        }
        
        if (this.config.enableLTV) {
          this.calculateLTV();
        }
        
        // تحليل المجموعات
        if (this.config.enableCohort) {
          this.performCohortAnalysis();
        }
        
      } catch (error) {
        this.logger.error('Error in data processing', { error: error.message });
      }
    };
    
    // معالجة كل 5 دقائق
    setInterval(processData, 5 * 60 * 1000);
  }
  
  /**
   * معالجة التحويلات المعلقة
   */
  processPendingConversions() {
    const pending = this.conversions.filter(c => !c.processed);
    
    for (const conversion of pending) {
      // تحليل التحويل
      this.analyzeConversion(conversion);
      
      // تحديث حالة المعالجة
      conversion.processed = true;
    }
  }
  
  /**
   * تحليل التحويل
   */
  analyzeConversion(conversion) {
    // تحليل الجغرافيا
    if (conversion.location) {
      this.analyzeGeographicConversion(conversion);
    }
    
    // تحليل الجهاز
    if (conversion.device) {
      this.analyzeDeviceConversion(conversion);
    }
    
    // تحليل الوقت
    this.analyzeTemporalConversion(conversion);
  }
  
  /**
   * تحليل التحويل الجغرافي
   */
  analyzeGeographicConversion(conversion) {
    // يمكن إضافة تحليلات جغرافية مفصلة هنا
    if (conversion.location.country) {
      // تحليل التحويلات حسب البلد
    }
  }
  
  /**
   * تحليل تحويل الجهاز
   */
  analyzeDeviceConversion(conversion) {
    if (conversion.device.type) {
      // تحليل التحويلات حسب نوع الجهاز
    }
  }
  
  /**
   * تحليل التحويل الزمني
   */
  analyzeTemporalConversion(conversion) {
    const hour = new Date(conversion.timestamp).getHours();
    const dayOfWeek = new Date(conversion.timestamp).getDay();
    const month = new Date(conversion.timestamp).getMonth();
    
    // إضافة التحليلات الزمنية
  }
  
  /**
   * حساب ROAS (Return on Ad Spend)
   */
  calculateROAS() {
    let totalRevenue = 0;
    let totalAdSpend = 0;
    
    for (const [campaign, data] of this.analytics.campaignAttribution.entries()) {
      totalRevenue += data.revenue;
      totalAdSpend += data.cost || 0;
    }
    
    this.analytics.ROAS = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;
  }
  
  /**
   * حساب LTV (Lifetime Value)
   */
  calculateLTV() {
    // حساب LTV بناءً على البيانات التاريخية
    const userLifetimeValues = new Map();
    
    for (const [userId, conversions] of this.getUserConversions().entries()) {
      const totalValue = conversions.reduce((sum, conv) => sum + conv.value, 0);
      const averageOrderValue = conversions.length > 0 ? totalValue / conversions.length : 0;
      const purchaseFrequency = conversions.length; // تبسيط
      
      userLifetimeValues.set(userId, averageOrderValue * purchaseFrequency);
    }
    
    // حساب LTV المتوسط
    if (userLifetimeValues.size > 0) {
      const totalLTV = Array.from(userLifetimeValues.values())
        .reduce((sum, ltv) => sum + ltv, 0);
      this.analytics.LTV = totalLTV / userLifetimeValues.size;
    }
  }
  
  /**
   * تحليل المجموعات
   */
  performCohortAnalysis() {
    const cohorts = new Map();
    
    // تجميع المستخدمين حسب تاريخ أول تحويل
    for (const conversion of this.conversions) {
      const firstConversionDate = new Date(
        Math.min(...this.getUserConversions().get(conversion.userId)?.map(c => c.timestamp) || [conversion.timestamp])
      ).toISOString().split('T')[0];
      
      if (!cohorts.has(firstConversionDate)) {
        cohorts.set(firstConversionDate, {
          cohortDate: firstConversionDate,
          users: new Set(),
          conversions: [],
          revenue: 0
        });
      }
      
      const cohort = cohorts.get(firstConversionDate);
      cohort.users.add(conversion.userId);
      cohort.conversions.push(conversion);
      cohort.revenue += conversion.value;
    }
    
    // حساب مقاييس المجموعة
    this.analytics.cohortMetrics = Array.from(cohorts.values())
      .map(cohort => ({
        cohortDate: cohort.cohortDate,
        userCount: cohort.users.size,
        totalConversions: cohort.conversions.length,
        totalRevenue: cohort.revenue,
        averageConversionsPerUser: cohort.users.size > 0 
          ? cohort.conversions.length / cohort.users.size 
          : 0,
        averageRevenuePerUser: cohort.users.size > 0 
          ? cohort.revenue / cohort.users.size 
          : 0
      }))
      .sort((a, b) => new Date(b.cohortDate) - new Date(a.cohortDate));
  }
  
  /**
   * الحصول على تحويلات المستخدم
   */
  getUserConversions() {
    const userConversions = new Map();
    
    for (const conversion of this.conversions) {
      if (!userConversions.has(conversion.userId)) {
        userConversions.set(conversion.userId, []);
      }
      userConversions.get(conversion.userId).push(conversion);
    }
    
    return userConversions;
  }
  
  /**
   * تحديث التحليلات الإجمالية
   */
  updateOverallAnalytics() {
    // تحديث معدل التحويل
    this.analytics.conversionRate = this.calculateConversionRate();
    
    // تحديث متوسط قيمة الطلب
    const totalValue = Array.from(this.analytics.conversionValue.values())
      .reduce((sum, val) => sum + val, 0);
    this.analytics.averageOrderValue = this.analytics.conversionValue.size > 0
      ? totalValue / this.analytics.conversionValue.size
      : 0;
  }
  
  /**
   * الحصول على إجمالي الجلسات
   */
  getTotalSessions() {
    // تبسيط - في التطبيق الحقيقي يجب الحصول على هذه البيانات من نظام تتبع الجلسات
    return this.touchpoints.length;
  }
  
  /**
   * الحصول على إجمالي المستخدمين
   */
  getTotalUsers() {
    return new Set(this.conversions.map(c => c.userId)).size;
  }
  
  /**
   * بدء التنظيف
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
    
    // تنظيف التحويلات القديمة
    this.conversions = this.conversions.filter(c => c.timestamp > cutoffTime);
    
    // تنظيف نقاط الاتصال القديمة
    this.touchpoints = this.touchpoints.filter(tp => tp.timestamp > cutoffTime);
    
    // تنظيف البيانات المحفوظة
    if (this.config.enableDataExport) {
      this.cleanupStoredData(cutoffTime);
    }
    
    this.logger.info('Old conversion data cleaned up', { 
      cutoffDate: new Date(cutoffTime).toISOString() 
    });
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
   * بدء توليد التقارير
   */
  startReportGeneration() {
    setInterval(() => {
      this.generateConversionReport();
    }, this.config.reportInterval);
  }
  
  /**
   * توليد تقرير التحويلات
   */
  generateConversionReport() {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        period: {
          start: new Date(Date.now() - this.config.reportInterval),
          end: new Date()
        },
        summary: {
          totalConversions: this.analytics.totalConversions,
          totalRevenue: this.analytics.totalRevenue,
          conversionRate: this.analytics.conversionRate,
          averageOrderValue: this.analytics.averageOrderValue
        },
        attribution: {
          sourceAttribution: Object.fromEntries(this.analytics.sourceAttribution),
          channelAttribution: Object.fromEntries(this.analytics.channelAttribution),
          campaignAttribution: Object.fromEntries(this.analytics.campaignAttribution)
        },
        performance: {
          funnelPerformance: this.analytics.funnelPerformance,
          ROAS: this.analytics.ROAS,
          LTV: this.analytics.LTV
        },
        cohorts: this.analytics.cohortMetrics,
        goals: this.config.conversionGoals
      };
      
      // حفظ التقرير
      if (this.config.enableDataExport) {
        this.saveConversionReport(report);
      }
      
      // إطلاق حدث التقرير
      this.emit('conversionReportGenerated', report);
      
      this.logger.info('Conversion report generated', {
        totalConversions: report.summary.totalConversions,
        totalRevenue: report.summary.totalRevenue
      });
      
      return report;
      
    } catch (error) {
      this.logger.error('Error generating conversion report', { error: error.message });
      return null;
    }
  }
  
  /**
   * حفظ تقرير التحويلات
   */
  saveConversionReport(report) {
    const timestamp = report.timestamp.replace(/[:.]/g, '-');
    const filename = `conversion_report_${timestamp}`;
    
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
        this.logger.error('Error saving conversion report', { 
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
    
    csv += `Total Conversions,${report.summary.totalConversions}\n`;
    csv += `Total Revenue,${report.summary.totalRevenue}\n`;
    csv += `Conversion Rate,${report.summary.conversionRate.toFixed(2)}%\n`;
    csv += `Average Order Value,${report.summary.averageOrderValue}\n`;
    csv += `ROAS,${report.performance.ROAS.toFixed(2)}\n`;
    csv += `LTV,${report.performance.LTV.toFixed(2)}\n`;
    
    return csv;
  }
  
  /**
   * بدء مراقبة التنبيهات
   */
  startAlertMonitoring() {
    setInterval(() => {
      this.checkConversionAlerts();
    }, 60 * 1000); // كل دقيقة
  }
  
  /**
   * فحص تنبيهات التحويل
   */
  checkConversionAlerts() {
    try {
      // فحص انخفاض معدل التحويل
      this.checkConversionRateAlert();
      
      // فحص هدف ROAS
      this.checkROASAlert();
      
      // فحص هدف LTV
      this.checkLTVAlert();
      
    } catch (error) {
      this.logger.error('Error checking conversion alerts', { error: error.message });
    }
  }
  
  /**
   * فحص تنبيه معدل التحويل
   */
  checkConversionRateAlert() {
    const threshold = this.config.alertThresholds.conversionRateDrop;
    // مقارنة مع معدل التحويل السابق
    // هذه مثال بسيط - في التطبيق الحقيقي يجب مقارنة مع البيانات التاريخية
    if (this.analytics.conversionRate < threshold) {
      this.emit('conversionAlert', {
        type: 'conversion_rate_drop',
        severity: 'warning',
        message: `Conversion rate below ${threshold}%`,
        currentRate: this.analytics.conversionRate,
        threshold: threshold
      });
    }
  }
  
  /**
   * فحص تنبيه ROAS
   */
  checkROASAlert() {
    const target = this.config.alertThresholds.ROASTarget;
    if (this.analytics.ROAS < target) {
      this.emit('conversionAlert', {
        type: 'roas_below_target',
        severity: 'warning',
        message: `ROAS below target of ${target}x`,
        currentROAS: this.analytics.ROAS,
        target: target
      });
    }
  }
  
  /**
   * فحص تنبيه LTV
   */
  checkLTVAlert() {
    const target = this.config.alertThresholds.LTVTarget;
    if (this.analytics.LTV < target) {
      this.emit('conversionAlert', {
        type: 'ltv_below_target',
        severity: 'warning',
        message: `LTV below target of $${target}`,
        currentLTV: this.analytics.LTV,
        target: target
      });
    }
  }
  
  /**
   * تحميل البيانات المحفوظة
   */
  loadStoredData() {
    if (!this.config.enableDataExport) return;
    
    try {
      // تحميل آخر تقرير محفوظ
      const files = fs.readdirSync(this.config.exportPath);
      const reportFiles = files.filter(f => f.startsWith('conversion_report_') && f.endsWith('.json'));
      
      if (reportFiles.length > 0) {
        const latestFile = reportFiles.sort().pop();
        const filepath = path.join(this.config.exportPath, latestFile);
        
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        this.logger.info('Loaded previous conversion data', { file: latestFile });
      }
      
    } catch (error) {
      this.logger.error('Error loading stored conversion data', { error: error.message });
    }
  }
  
  /**
   * الحصول على إحصائيات التحويل الحالية
   */
  getCurrentConversionStats() {
    this.updateOverallAnalytics();
    
    return {
      timestamp: new Date().toISOString(),
      totalConversions: this.analytics.totalConversions,
      totalRevenue: this.analytics.totalRevenue,
      conversionRate: this.analytics.conversionRate,
      averageOrderValue: this.analytics.averageOrderValue,
      ROAS: this.analytics.ROAS,
      LTV: this.analytics.LTV,
      topSources: Array.from(this.analytics.sourceAttribution.entries())
        .sort(([,a], [,b]) => b.conversions - a.conversions)
        .slice(0, 5)
        .map(([source, data]) => ({ source, conversions: data.conversions })),
      topChannels: Array.from(this.analytics.channelAttribution.entries())
        .sort(([,a], [,b]) => b.conversions - a.conversions)
        .slice(0, 5)
        .map(([channel, data]) => ({ channel, conversions: data.conversions }))
    };
  }
  
  /**
   * الحصول على تحليلات مفصلة لهدف معين
   */
  getGoalAnalytics(goalId) {
    const goalConversions = this.conversions.filter(c => c.goalId === goalId);
    
    if (goalConversions.length === 0) {
      return null;
    }
    
    const totalValue = goalConversions.reduce((sum, c) => sum + c.value, 0);
    
    return {
      goalId: goalId,
      totalConversions: goalConversions.length,
      totalRevenue: totalValue,
      averageValue: totalValue / goalConversions.length,
      conversionsBySource: this.groupBySource(goalConversions),
      conversionsByChannel: this.groupByChannel(goalConversions),
      conversionsByDevice: this.groupByDevice(goalConversions),
      timeline: this.generateConversionTimeline(goalConversions)
    };
  }
  
  /**
   * تجميع حسب المصدر
   */
  groupBySource(conversions) {
    const sources = {};
    for (const conversion of conversions) {
      const source = conversion.source?.value || 'direct';
      if (!sources[source]) {
        sources[source] = { count: 0, value: 0 };
      }
      sources[source].count++;
      sources[source].value += conversion.value;
    }
    return sources;
  }
  
  /**
   * تجميع حسب القناة
   */
  groupByChannel(conversions) {
    const channels = {};
    for (const conversion of conversions) {
      const channel = conversion.medium?.value || 'direct';
      if (!channels[channel]) {
        channels[channel] = { count: 0, value: 0 };
      }
      channels[channel].count++;
      channels[channel].value += conversion.value;
    }
    return channels;
  }
  
  /**
   * تجميع حسب الجهاز
   */
  groupByDevice(conversions) {
    const devices = {};
    for (const conversion of conversions) {
      const device = conversion.device?.type || 'unknown';
      if (!devices[device]) {
        devices[device] = { count: 0, value: 0 };
      }
      devices[device].count++;
      devices[device].value += conversion.value;
    }
    return devices;
  }
  
  /**
   * توليد خط زمني للتحويلات
   */
  generateConversionTimeline(conversions) {
    const timeline = {};
    
    for (const conversion of conversions) {
      const date = new Date(conversion.timestamp).toISOString().split('T')[0];
      if (!timeline[date]) {
        timeline[date] = { count: 0, value: 0 };
      }
      timeline[date].count++;
      timeline[date].value += conversion.value;
    }
    
    return Object.entries(timeline)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, data]) => ({ date, ...data }));
  }
}

// تصدير الكلاس
module.exports = ConversionTrackingSystem;

// مثال على الاستخدام
if (require.main === module) {
  const conversionTracker = new ConversionTrackingSystem({
    enableAttribution: true,
    enableMultiTouch: true,
    conversionGoals: [
      {
        id: 'newsletter_signup',
        name: 'Newsletter Signup',
        type: 'lead',
        value: 25,
        category: 'acquisition'
      }
    ],
    funnelSteps: [
      { id: 'landing_page', name: 'Landing Page Visit', order: 1 },
      { id: 'product_view', name: 'Product View', order: 2 },
      { id: 'add_to_cart', name: 'Add to Cart', order: 3 },
      { id: 'checkout', name: 'Checkout', order: 4 },
      { id: 'purchase', name: 'Purchase', order: 5 }
    ]
  });
  
  // تسجيل مستمعي الأحداث
  conversionTracker.on('conversionTracked', (conversion) => {
    console.log('Conversion tracked:', conversion.goalId, conversion.value);
  });
  
  conversionTracker.on('conversionReportGenerated', (report) => {
    console.log('Conversion report generated:', report.summary);
  });
  
  conversionTracker.on('conversionAlert', (alert) => {
    console.log('Conversion alert:', alert.message);
  });
  
  // محاكاة بيانات
  setTimeout(() => {
    // تتبع نقاط اتصال
    conversionTracker.trackTouchpoint({
      userId: 'user123',
      type: 'page_view',
      source: 'google',
      medium: 'organic',
      campaign: 'summer_sale',
      page: 'https://example.com/landing'
    });
    
    conversionTracker.trackTouchpoint({
      userId: 'user123',
      type: 'click',
      source: 'google',
      medium: 'organic',
      campaign: 'summer_sale',
      properties: { button: 'buy_now' }
    });
    
  }, 1000);
  
  setTimeout(() => {
    // تتبع تحويل
    conversionTracker.trackConversion({
      goalId: 'purchase',
      userId: 'user123',
      sessionId: 'session123',
      value: 99.99,
      currency: 'USD',
      items: [
        { id: 'prod1', name: 'Product 1', price: 99.99, quantity: 1 }
      ],
      source: 'google',
      medium: 'organic',
      campaign: 'summer_sale'
    });
    
  }, 3000);
  
  // عرض الإحصائيات
  setInterval(() => {
    const stats = conversionTracker.getCurrentConversionStats();
    console.log('Conversion stats:', JSON.stringify(stats, null, 2));
  }, 10000);
  
  // إيقاف نظيفة
  setTimeout(() => {
    console.log('Shutting down conversion tracker...');
    process.exit(0);
  }, 60000);
}