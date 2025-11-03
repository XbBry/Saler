/**
 * نظام تتبع استخدام المميزات
 * Feature Usage Tracking System
 */

const EventEmitter = require('events');
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class FeatureUsageTracker extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // إعدادات التتبع
      enableRealTimeTracking: config.enableRealTimeTracking !== false,
      enableUserSegments: config.enableUserSegments !== false,
      enableFeatureFunnels: config.enableFeatureFunnels !== false,
      enableA_B_Testing: config.enableA_B_Testing !== false,
      
      // إعدادات التحليل
      trackingFrequency: config.trackingFrequency || 1000, // milliseconds
      batchSize: config.batchSize || 50,
      analysisInterval: config.analysisInterval || 5 * 60 * 1000, // 5 minutes
      
      // إعدادات التقارير
      enableReports: config.enableReports !== false,
      reportInterval: config.reportInterval || 60 * 60 * 1000, // hourly
      enableDashboards: config.enableDashboards !== false,
      
      // إعدادات التصدير
      enableDataExport: config.enableDataExport !== false,
      exportPath: config.exportPath || './feature_usage_data',
      exportFormats: config.exportFormats || ['json', 'csv'],
      retentionDays: config.retentionDays || 60,
      
      // إعدادات التنبيهات
      enableAlerts: config.enableAlerts !== false,
      usageThresholds: config.usageThresholds || {
        featureAdoptionRate: 0.1, // 10%
        featureAbandonmentRate: 0.8, // 80%
        usageDropRate: 0.3 // 30%
      },
      
      // إعدادات التخصيص
      customAttributes: config.customAttributes || [],
      
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
        new winston.transports.File({ filename: 'feature_usage.log' }),
        new winston.transports.Console()
      ]
    });
    
    // تخزين البيانات
    this.featureUsageEvents = [];
    this.featureSessions = new Map();
    this.userFeatureProfiles = new Map();
    this.featureDefinitions = new Map();
    this.abTestAssignments = new Map();
    this.featureFunnels = new Map();
    
    // تحليلات استخدام المميزات
    this.analytics = {
      totalFeatureEvents: 0,
      uniqueFeatures: 0,
      userAdoption: new Map(),
      featureMetrics: new Map(),
      usagePatterns: new Map(),
      abTestResults: new Map(),
      featureFunnelPerformance: new Map(),
      userSegments: new Map(),
      featureTrends: new Map()
    };
    
    // إنشاء مجلد التصدير
    if (this.config.enableDataExport && !fs.existsSync(this.config.exportPath)) {
      fs.mkdirSync(this.config.exportPath, { recursive: true });
    }
    
    this.initializeFeatureDefinitions();
    this.initializeTracking();
  }
  
  /**
   * تهيئة تعريفات المميزات
   */
  initializeFeatureDefinitions() {
    const defaultFeatures = [
      {
        id: 'search',
        name: 'Search Functionality',
        category: 'core',
        description: 'Search across content and products',
        isCore: true,
        dependencies: [],
        tags: ['search', 'discovery']
      },
      {
        id: 'filter',
        name: 'Advanced Filtering',
        category: 'enhancement',
        description: 'Filter results by multiple criteria',
        isCore: false,
        dependencies: ['search'],
        tags: ['filter', 'search']
      },
      {
        id: 'wishlist',
        name: 'Wishlist/Favorites',
        category: 'engagement',
        description: 'Save items for later',
        isCore: false,
        dependencies: [],
        tags: ['save', 'favorites']
      },
      {
        id: 'cart',
        name: 'Shopping Cart',
        category: 'commerce',
        description: 'Add items to cart for purchase',
        isCore: true,
        dependencies: [],
        tags: ['cart', 'commerce']
      },
      {
        id: 'checkout',
        name: 'Checkout Process',
        category: 'commerce',
        description: 'Complete purchase process',
        isCore: true,
        dependencies: ['cart'],
        tags: ['checkout', 'purchase']
      },
      {
        id: 'social_share',
        name: 'Social Media Sharing',
        category: 'social',
        description: 'Share content on social platforms',
        isCore: false,
        dependencies: [],
        tags: ['share', 'social']
      },
      {
        id: 'reviews',
        name: 'User Reviews',
        category: 'engagement',
        description: 'Read and write product reviews',
        isCore: false,
        dependencies: [],
        tags: ['reviews', 'feedback']
      },
      {
        id: 'recommendations',
        name: 'Product Recommendations',
        category: 'enhancement',
        description: 'Personalized product suggestions',
        isCore: false,
        dependencies: [],
        tags: ['recommend', 'personalization']
      }
    ];
    
    // دمج التعريفات المخصصة
    const customFeatures = this.config.featureDefinitions || [];
    const allFeatures = [
      ...defaultFeatures,
      ...customFeatures.filter(f => !defaultFeatures.find(d => d.id === f.id))
    ];
    
    for (const feature of allFeatures) {
      this.featureDefinitions.set(feature.id, feature);
    }
    
    this.analytics.uniqueFeatures = this.featureDefinitions.size;
    
    this.logger.info('Feature definitions initialized', {
      featuresCount: this.featureDefinitions.size
    });
  }
  
  /**
   * تهيئة التتبع
   */
  initializeTracking() {
    this.logger.info('Initializing feature usage tracking system');
    
    // بدء معالجة الأحداث
    if (this.config.enableRealTimeTracking) {
      this.startEventProcessing();
    }
    
    // بدء تحليل البيانات
    this.startDataAnalysis();
    
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
   * تتبع استخدام ميزة
   */
  trackFeatureUsage(usageData) {
    try {
      const feature = this.featureDefinitions.get(usageData.featureId);
      if (!feature) {
        this.logger.warn('Unknown feature referenced', { featureId: usageData.featureId });
        return null;
      }
      
      const usageEvent = {
        id: uuidv4(),
        timestamp: Date.now(),
        
        // معلومات الميزة
        featureId: usageData.featureId,
        featureName: feature.name,
        category: feature.category,
        
        // معلومات المستخدم
        userId: usageData.userId,
        sessionId: usageData.sessionId,
        
        // تفاصيل الاستخدام
        action: usageData.action, // 'view', 'click', 'use', 'complete', 'abandon'
        duration: usageData.duration || 0,
        context: usageData.context || {},
        
        // بيانات إضافية
        properties: usageData.properties || {},
        value: usageData.value || 0,
        
        // معلومات السياق
        page: usageData.page,
        referrer: usageData.referrer,
        device: usageData.device,
        location: usageData.location,
        
        // معرف A/B Test
        abTestGroup: usageData.abTestGroup || this.getABTestGroup(usageData.userId, usageData.featureId),
        
        // حالة المهمة
        completed: usageData.completed || false,
        success: usageData.success !== false,
        error: usageData.error || null,
        
        processed: false
      };
      
      // التحقق من صحة البيانات
      if (!this.validateUsageData(usageEvent)) {
        this.logger.warn('Invalid feature usage data', { usageData });
        return null;
      }
      
      // حفظ الحدث
      this.featureUsageEvents.push(usageEvent);
      this.analytics.totalFeatureEvents++;
      
      // تحديث ملف المستخدم للمميزة
      this.updateUserFeatureProfile(usageEvent);
      
      // تحديث جلسة المميزة
      this.updateFeatureSession(usageEvent);
      
      // تحليل A/B Test
      if (this.config.enableA_B_Testing && usageEvent.abTestGroup) {
        this.processABTestEvent(usageEvent);
      }
      
      // تحليل القمع
      if (this.config.enableFeatureFunnels) {
        this.updateFeatureFunnelAnalysis(usageEvent);
      }
      
      // إطلاق أحداث
      this.emit('featureUsageTracked', usageEvent);
      this.emit('featureUsed', usageEvent.featureId, usageEvent);
      
      this.logger.debug('Feature usage tracked', {
        featureId: usageEvent.featureId,
        action: usageEvent.action,
        userId: usageEvent.userId
      });
      
      return usageEvent.id;
      
    } catch (error) {
      this.logger.error('Error tracking feature usage', { 
        error: error.message,
        usageData 
      });
      return null;
    }
  }
  
  /**
   * تتبع مهمة كاملة (Feature Task)
   */
  trackFeatureTask(taskData) {
    try {
      const task = {
        id: uuidv4(),
        timestamp: Date.now(),
        
        // معلومات المهمة
        taskId: taskData.taskId,
        taskType: taskData.taskType, // 'onboarding', 'product_purchase', 'profile_setup', etc.
        userId: taskData.userId,
        sessionId: taskData.sessionId,
        
        // المميزات المطلوبة
        requiredFeatures: taskData.requiredFeatures || [],
        optionalFeatures: taskData.optionalFeatures || [],
        
        // حالة التقدم
        started: false,
        completed: false,
        abandoned: false,
        currentStep: 0,
        totalSteps: taskData.totalSteps || 0,
        
        // تفاصيل التقدم
        steps: [],
        completionTime: null,
        abandonmentReason: null,
        
        // السياق
        context: taskData.context || {},
        properties: taskData.properties || {}
      };
      
      // إضافة المهمة إلى تتبع المهام
      const taskKey = `${taskData.userId}_${taskData.taskId}`;
      this.featureSessions.set(taskKey, task);
      
      this.emit('featureTaskStarted', task);
      
      this.logger.info('Feature task tracking started', {
        taskId: task.taskId,
        taskType: task.taskType,
        userId: task.userId
      });
      
      return task.id;
      
    } catch (error) {
      this.logger.error('Error tracking feature task', { 
        error: error.message,
        taskData 
      });
      return null;
    }
  }
  
  /**
   * تحديث خطوة في المهمة
   */
  updateFeatureTaskStep(userId, taskId, stepData) {
    const taskKey = `${userId}_${taskId}`;
    const task = this.featureSessions.get(taskKey);
    
    if (!task) {
      this.logger.warn('Feature task not found', { userId, taskId });
      return false;
    }
    
    try {
      const step = {
        stepNumber: stepData.stepNumber,
        stepName: stepData.stepName,
        featureId: stepData.featureId,
        timestamp: Date.now(),
        duration: stepData.duration || 0,
        success: stepData.success !== false,
        error: stepData.error || null,
        context: stepData.context || {}
      };
      
      // تتبع استخدام المميزة
      if (stepData.featureId) {
        this.trackFeatureUsage({
          featureId: stepData.featureId,
          userId: userId,
          sessionId: task.sessionId,
          action: step.success ? 'step_complete' : 'step_failed',
          duration: step.duration,
          context: {
            taskId: taskId,
            stepNumber: step.stepNumber,
            stepName: step.stepName
          },
          success: step.success,
          error: step.error
        });
      }
      
      // إضافة الخطوة للمهمة
      task.steps.push(step);
      task.currentStep = Math.max(task.currentStep, step.stepNumber);
      
      // تحديث حالة المهمة
      if (step.success) {
        if (task.currentStep >= task.totalSteps) {
          task.completed = true;
          task.completionTime = Date.now();
          this.emit('featureTaskCompleted', task);
          
          this.logger.info('Feature task completed', {
            taskId: task.taskId,
            userId: userId,
            totalSteps: task.totalSteps
          });
        } else {
          task.started = true;
        }
      } else {
        task.abandoned = true;
        task.abandonmentReason = step.error || 'step_failed';
        this.emit('featureTaskAbandoned', task);
        
        this.logger.warn('Feature task abandoned', {
          taskId: task.taskId,
          userId: userId,
          step: step.stepNumber,
          reason: task.abandonmentReason
        });
      }
      
      return true;
      
    } catch (error) {
      this.logger.error('Error updating feature task step', { 
        error: error.message,
        userId,
        taskId,
        stepData 
      });
      return false;
    }
  }
  
  /**
   * التحقق من صحة بيانات الاستخدام
   */
  validateUsageData(usageEvent) {
    if (!usageEvent.featureId) {
      this.logger.warn('Usage event missing featureId');
      return false;
    }
    
    if (!usageEvent.userId) {
      this.logger.warn('Usage event missing userId');
      return false;
    }
    
    if (!usageEvent.action) {
      this.logger.warn('Usage event missing action');
      return false;
    }
    
    return true;
  }
  
  /**
   * تحديث ملف المستخدم للمميزة
   */
  updateUserFeatureProfile(usageEvent) {
    const profileKey = `${usageEvent.userId}_${usageEvent.featureId}`;
    
    if (!this.userFeatureProfiles.has(profileKey)) {
      this.userFeatureProfiles.set(profileKey, {
        userId: usageEvent.userId,
        featureId: usageEvent.featureId,
        firstUsed: usageEvent.timestamp,
        lastUsed: usageEvent.timestamp,
        totalUsage: 0,
        successfulUsage: 0,
        failedUsage: 0,
        totalDuration: 0,
        averageDuration: 0,
        actions: new Map(),
        contexts: new Map(),
        lastAction: null,
        adoptionStage: 'none' // none, aware, tried, adopted, expert
      });
    }
    
    const profile = this.userFeatureProfiles.get(profileKey);
    
    // تحديث الإحصائيات
    profile.lastUsed = usageEvent.timestamp;
    profile.totalUsage++;
    
    if (usageEvent.success) {
      profile.successfulUsage++;
    } else {
      profile.failedUsage++;
    }
    
    profile.totalDuration += usageEvent.duration;
    profile.averageDuration = profile.totalDuration / profile.totalUsage;
    
    // تحديث الإجراءات
    if (!profile.actions.has(usageEvent.action)) {
      profile.actions.set(usageEvent.action, 0);
    }
    profile.actions.set(usageEvent.action, profile.actions.get(usageEvent.action) + 1);
    
    // تحديث السياقات
    if (usageEvent.context) {
      const contextKey = JSON.stringify(usageEvent.context);
      if (!profile.contexts.has(contextKey)) {
        profile.contexts.set(contextKey, 0);
      }
      profile.contexts.set(contextKey, profile.contexts.get(contextKey) + 1);
    }
    
    profile.lastAction = usageEvent.action;
    
    // تحديث مرحلة التبني
    this.updateAdoptionStage(profile);
    
    // تحديث إحصائيات المميزة
    this.updateFeatureAnalytics(usageEvent);
  }
  
  /**
   * تحديث مرحلة تبني المميزة
   */
  updateAdoptionStage(profile) {
    const usageCount = profile.totalUsage;
    
    if (usageCount === 0) {
      profile.adoptionStage = 'none';
    } else if (usageCount === 1) {
      profile.adoptionStage = 'tried';
    } else if (usageCount < 5) {
      profile.adoptionStage = 'aware';
    } else if (usageCount < 20) {
      profile.adoptionStage = 'adopted';
    } else {
      profile.adoptionStage = 'expert';
    }
  }
  
  /**
   * تحديث جلسة المميزة
   */
  updateFeatureSession(usageEvent) {
    const sessionKey = `${usageEvent.userId}_${usageEvent.featureId}_session`;
    
    // إنشاء جلسة جديدة أو تحديث الموجودة
    if (!this.featureSessions.has(sessionKey)) {
      this.featureSessions.set(sessionKey, {
        id: uuidv4(),
        userId: usageEvent.userId,
        featureId: usageEvent.featureId,
        sessionStart: usageEvent.timestamp,
        lastActivity: usageEvent.timestamp,
        eventCount: 0,
        totalDuration: 0,
        actions: [],
        abandoned: false
      });
    }
    
    const session = this.featureSessions.get(sessionKey);
    
    session.lastActivity = usageEvent.timestamp;
    session.eventCount++;
    session.totalDuration = usageEvent.timestamp - session.sessionStart;
    session.actions.push({
      action: usageEvent.action,
      timestamp: usageEvent.timestamp,
      success: usageEvent.success,
      duration: usageEvent.duration
    });
    
    // تحديد الجلسة كمهجورة إذا لم تكن هناك نشاط لفترة طويلة
    const inactiveTime = Date.now() - session.lastActivity;
    const sessionTimeout = 30 * 60 * 1000; // 30 دقيقة
    
    if (inactiveTime > sessionTimeout) {
      session.abandoned = true;
      this.emit('featureSessionAbandoned', session);
    }
  }
  
  /**
   * تحديث تحليلات المميزة
   */
  updateFeatureAnalytics(usageEvent) {
    const featureId = usageEvent.featureId;
    
    if (!this.analytics.featureMetrics.has(featureId)) {
      this.analytics.featureMetrics.set(featureId, {
        featureId: featureId,
        totalUsers: 0,
        totalSessions: 0,
        totalUsage: 0,
        successfulUsage: 0,
        failedUsage: 0,
        averageDuration: 0,
        adoptionRate: 0,
        abandonmentRate: 0,
        dailyUsage: new Map(),
        userRetention: new Map(),
        contextUsage: new Map(),
        actionDistribution: new Map()
      });
    }
    
    const metrics = this.analytics.featureMetrics.get(featureId);
    
    // تحديث الإحصائيات
    metrics.totalUsage++;
    
    if (usageEvent.success) {
      metrics.successfulUsage++;
    } else {
      metrics.failedUsage++;
    }
    
    metrics.averageDuration = (
      (metrics.averageDuration * (metrics.totalUsage - 1)) + usageEvent.duration
    ) / metrics.totalUsage;
    
    // تحديث الاستخدام اليومي
    const date = new Date(usageEvent.timestamp).toISOString().split('T')[0];
    if (!metrics.dailyUsage.has(date)) {
      metrics.dailyUsage.set(date, 0);
    }
    metrics.dailyUsage.set(date, metrics.dailyUsage.get(date) + 1);
    
    // تحديث توزيع الإجراءات
    if (!metrics.actionDistribution.has(usageEvent.action)) {
      metrics.actionDistribution.set(usageEvent.action, 0);
    }
    metrics.actionDistribution.set(
      usageEvent.action, 
      metrics.actionDistribution.get(usageEvent.action) + 1
    );
    
    // تحديث إحصائيات المستخدم
    if (!this.analytics.userAdoption.has(featureId)) {
      this.analytics.userAdoption.set(featureId, new Set());
    }
    this.analytics.userAdoption.get(featureId).add(usageEvent.userId);
    
    // تحديث معدلات التبني والهجر
    this.updateAdoptionRates(featureId);
  }
  
  /**
   * تحديث معدلات التبني والهجر
   */
  updateAdoptionRates(featureId) {
    const metrics = this.analytics.featureMetrics.get(featureId);
    const totalUsers = this.analytics.userAdoption.get(featureId)?.size || 0;
    
    if (totalUsers > 0) {
      // حساب معدل التبني
      const adoptedUsers = Array.from(this.userFeatureProfiles.values())
        .filter(p => p.featureId === featureId && p.adoptionStage === 'adopted')
        .length;
      
      metrics.adoptionRate = (adoptedUsers / totalUsers) * 100;
      
      // حساب معدل الهجر
      const abandonedUsers = Array.from(this.userFeatureProfiles.values())
        .filter(p => p.featureId === featureId && p.adoptionStage === 'tried')
        .length;
      
      const totalUsersWhoTried = adoptedUsers + abandonedUsers;
      metrics.abandonmentRate = totalUsersWhoTried > 0 
        ? (abandonedUsers / totalUsersWhoTried) * 100 
        : 0;
    }
  }
  
  /**
   * الحصول على مجموعة A/B Test
   */
  getABTestGroup(userId, featureId) {
    const testKey = `${userId}_${featureId}`;
    
    if (!this.abTestAssignments.has(testKey)) {
      // تعيين عشوائي للمجموعات
      const groups = ['control', 'variant_a', 'variant_b'];
      const randomGroup = groups[Math.floor(Math.random() * groups.length)];
      this.abTestAssignments.set(testKey, randomGroup);
    }
    
    return this.abTestAssignments.get(testKey);
  }
  
  /**
   * معالجة حدث A/B Test
   */
  processABTestEvent(usageEvent) {
    const testKey = `${usageEvent.featureId}_${usageEvent.abTestGroup}`;
    
    if (!this.analytics.abTestResults.has(testKey)) {
      this.analytics.abTestResults.set(testKey, {
        featureId: usageEvent.featureId,
        group: usageEvent.abTestGroup,
        users: 0,
        totalEvents: 0,
        successfulEvents: 0,
        averageDuration: 0,
        conversionRate: 0
      });
    }
    
    const testResult = this.analytics.abTestResults.get(testKey);
    
    testResult.totalEvents++;
    if (usageEvent.success) {
      testResult.successfulEvents++;
    }
    
    // تحديث متوسط المدة
    testResult.averageDuration = (
      (testResult.averageDuration * (testResult.totalEvents - 1)) + usageEvent.duration
    ) / testResult.totalEvents;
    
    // تحديث معدل التحويل
    testResult.conversionRate = testResult.totalEvents > 0 
      ? (testResult.successfulEvents / testResult.totalEvents) * 100 
      : 0;
  }
  
  /**
   * تحديث تحليل القمع للمميزة
   */
  updateFeatureFunnelAnalysis(usageEvent) {
    const funnelKey = `${usageEvent.featureId}_funnel`;
    
    if (!this.featureFunnels.has(funnelKey)) {
      this.featureFunnels.set(funnelKey, {
        featureId: usageEvent.featureId,
        steps: new Map(),
        totalUsers: 0,
        completedUsers: 0,
        averageCompletionTime: 0
      });
    }
    
    const funnel = this.featureFunnels.get(funnelKey);
    
    // تتبع تقدم المستخدم في القمع
    const userFunnelKey = `${usageEvent.userId}_${funnelKey}`;
    if (!funnel.steps.has(userFunnelKey)) {
      funnel.steps.set(userFunnelKey, {
        userId: usageEvent.userId,
        currentStep: 0,
        completedSteps: [],
        startTime: usageEvent.timestamp,
        completed: false
      });
    }
    
    const userFunnel = funnel.steps.get(userFunnelKey);
    
    // تحديث خطوة المستخدم
    if (usageEvent.action === 'step_complete') {
      userFunnel.completedSteps.push(usageEvent.timestamp);
      userFunnel.currentStep++;
      
      // فحص إذا تم إكمال القمع
      if (userFunnel.currentStep >= this.getFeatureStepCount(usageEvent.featureId)) {
        userFunnel.completed = true;
        funnel.completedUsers++;
        
        const completionTime = usageEvent.timestamp - userFunnel.startTime;
        funnel.averageCompletionTime = (
          (funnel.averageCompletionTime * (funnel.completedUsers - 1)) + completionTime
        ) / funnel.completedUsers;
      }
    }
    
    // تحديث أداء القمع الإجمالي
    this.updateFunnelPerformance(funnel);
  }
  
  /**
   * الحصول على عدد خطوات المميزة
   */
  getFeatureStepCount(featureId) {
    // مثال بسيط - في التطبيق الحقيقي يجب تعريف خطوات كل مميزة
    const stepCounts = {
      'cart': 3, // view, add_item, checkout
      'checkout': 4, // shipping, payment, review, confirm
      'onboarding': 5 // profile, preferences, tutorial, first_action, completion
    };
    
    return stepCounts[featureId] || 2; // افتراضي: عرض وإجراء
  }
  
  /**
   * تحديث أداء القمع
   */
  updateFunnelPerformance(funnel) {
    funnel.totalUsers = funnel.steps.size;
    
    if (funnel.totalUsers > 0) {
      // حساب معدل إكمال القمع
      const completionRate = (funnel.completedUsers / funnel.totalUsers) * 100;
      
      // حساب معدل الهجر
      const abandonedUsers = Array.from(funnel.steps.values())
        .filter(uf => !uf.completed && uf.currentStep > 0).length;
      const abandonmentRate = (abandonedUsers / funnel.totalUsers) * 100;
      
      // تحديث تحليلات الأداء
      this.analytics.featureFunnelPerformance.set(funnel.featureId, {
        totalUsers: funnel.totalUsers,
        completedUsers: funnel.completedUsers,
        completionRate: completionRate,
        abandonmentRate: abandonmentRate,
        averageCompletionTime: funnel.averageCompletionTime
      });
    }
  }
  
  /**
   * تحليل أنماط الاستخدام
   */
  analyzeUsagePatterns() {
    this.analytics.usagePatterns.clear();
    
    // تحليل أنماط الاستخدام حسب الوقت
    const timePatterns = this.analyzeTimePatterns();
    this.analytics.usagePatterns.set('time', timePatterns);
    
    // تحليل أنماط الاستخدام حسب الجهاز
    const devicePatterns = this.analyzeDevicePatterns();
    this.analytics.usagePatterns.set('device', devicePatterns);
    
    // تحليل أنماط الاستخدام حسب الموقع الجغرافي
    const locationPatterns = this.analyzeLocationPatterns();
    this.analytics.usagePatterns.set('location', locationPatterns);
    
    // تحليل أنماط الاستخدام حسب السياق
    const contextPatterns = this.analyzeContextPatterns();
    this.analytics.usagePatterns.set('context', contextPatterns);
  }
  
  /**
   * تحليل أنماط الوقت
   */
  analyzeTimePatterns() {
    const patterns = {
      hourly: new Array(24).fill(0),
      daily: new Array(7).fill(0),
      monthly: new Array(12).fill(0)
    };
    
    for (const event of this.featureUsageEvents) {
      const date = new Date(event.timestamp);
      
      patterns.hourly[date.getHours()]++;
      patterns.daily[date.getDay()]++;
      patterns.monthly[date.getMonth()]++;
    }
    
    return patterns;
  }
  
  /**
   * تحليل أنماط الجهاز
   */
  analyzeDevicePatterns() {
    const patterns = new Map();
    
    for (const event of this.featureUsageEvents) {
      const device = event.device?.type || 'unknown';
      
      if (!patterns.has(device)) {
        patterns.set(device, {
          totalUsage: 0,
          successfulUsage: 0,
          averageDuration: 0
        });
      }
      
      const deviceData = patterns.get(device);
      deviceData.totalUsage++;
      
      if (event.success) {
        deviceData.successfulUsage++;
      }
      
      deviceData.averageDuration = (
        (deviceData.averageDuration * (deviceData.totalUsage - 1)) + event.duration
      ) / deviceData.totalUsage;
    }
    
    return Object.fromEntries(patterns);
  }
  
  /**
   * تحليل أنماط الموقع
   */
  analyzeLocationPatterns() {
    const patterns = new Map();
    
    for (const event of this.featureUsageEvents) {
      const country = event.location?.country || 'unknown';
      
      if (!patterns.has(country)) {
        patterns.set(country, {
          totalUsage: 0,
          uniqueFeatures: 0,
          featureSet: new Set()
        });
      }
      
      const locationData = patterns.get(country);
      locationData.totalUsage++;
      locationData.featureSet.add(event.featureId);
      locationData.uniqueFeatures = locationData.featureSet.size;
    }
    
    // تحويل إلى object
    const result = {};
    for (const [country, data] of patterns.entries()) {
      result[country] = {
        ...data,
        featureSet: Array.from(data.featureSet)
      };
    }
    
    return result;
  }
  
  /**
   * تحليل أنماط السياق
   */
  analyzeContextPatterns() {
    const patterns = new Map();
    
    for (const event of this.featureUsageEvents) {
      const contextKey = JSON.stringify(event.context || {});
      
      if (!patterns.has(contextKey)) {
        patterns.set(contextKey, {
          context: event.context,
          totalUsage: 0,
          features: new Set(),
          successRate: 0,
          averageDuration: 0
        });
      }
      
      const contextData = patterns.get(contextKey);
      contextData.totalUsage++;
      contextData.features.add(event.featureId);
      
      if (event.success) {
        contextData.successRate = (
          (contextData.successRate * (contextData.totalUsage - 1)) + 100
        ) / contextData.totalUsage;
      } else {
        contextData.successRate = (
          (contextData.successRate * (contextData.totalUsage - 1)) + 0
        ) / contextData.totalUsage;
      }
      
      contextData.averageDuration = (
        (contextData.averageDuration * (contextData.totalUsage - 1)) + event.duration
      ) / contextData.totalUsage;
    }
    
    // تحويل إلى array ومن ثم إلى object
    return Array.from(patterns.values()).slice(0, 10); // أفضل 10 سياقات
  }
  
  /**
   * تحليل اتجاهات الاستخدام
   */
  analyzeUsageTrends() {
    this.analytics.featureTrends.clear();
    
    const features = Array.from(this.featureDefinitions.keys());
    
    for (const featureId of features) {
      const trends = this.calculateFeatureTrends(featureId);
      this.analytics.featureTrends.set(featureId, trends);
    }
  }
  
  /**
   * حساب اتجاهات المميزة
   */
  calculateFeatureTrends(featureId) {
    const featureEvents = this.featureUsageEvents.filter(e => e.featureId === featureId);
    
    if (featureEvents.length === 0) {
      return {
        trend: 'no_data',
        changeRate: 0,
        growthRate: 0,
        seasonality: null
      };
    }
    
    // تقسيم البيانات حسب الأسابيع
    const weeklyData = new Map();
    
    for (const event of featureEvents) {
      const weekStart = this.getWeekStart(event.timestamp);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, 0);
      }
      weeklyData.set(weekKey, weeklyData.get(weekKey) + 1);
    }
    
    const weeklyArray = Array.from(weeklyData.entries())
      .sort(([a], [b]) => new Date(a) - new Date(b));
    
    // حساب معدل التغيير
    let changeRate = 0;
    if (weeklyArray.length >= 2) {
      const recent = weeklyArray.slice(-4); // آخر 4 أسابيع
      const previous = weeklyArray.slice(-8, -4); // 4 أسابيع السابقة
      
      const recentSum = recent.reduce((sum, [, count]) => sum + count, 0);
      const previousSum = previous.reduce((sum, [, count]) => sum + count, 0);
      
      if (previousSum > 0) {
        changeRate = ((recentSum - previousSum) / previousSum) * 100;
      }
    }
    
    // تحديد الاتجاه
    let trend = 'stable';
    if (changeRate > 10) {
      trend = 'growing';
    } else if (changeRate < -10) {
      trend = 'declining';
    }
    
    return {
      trend: trend,
      changeRate: changeRate,
      growthRate: this.calculateGrowthRate(weeklyArray),
      seasonality: this.detectSeasonality(weeklyArray),
      weeklyData: weeklyArray
    };
  }
  
  /**
   * الحصول على بداية الأسبوع
   */
  getWeekStart(timestamp) {
    const date = new Date(timestamp);
    const day = date.getDay();
    const diff = date.getDate() - day; // Sunday = 0
    return new Date(date.setDate(diff));
  }
  
  /**
   * حساب معدل النمو
   */
  calculateGrowthRate(weeklyData) {
    if (weeklyData.length < 2) return 0;
    
    const firstWeek = weeklyData[0][1];
    const lastWeek = weeklyData[weeklyData.length - 1][1];
    
    if (firstWeek === 0) return 0;
    
    return ((lastWeek - firstWeek) / firstWeek) * 100;
  }
  
  /**
   * كشف الموسمية
   */
  detectSeasonality(weeklyData) {
    if (weeklyData.length < 8) return null; // نحتاج على الأقل 8 أسابيع
    
    // تحليل بسيط للموسمية بناءً على التباين
    const values = weeklyData.map(([, count]) => count);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    
    if (coefficientOfVariation > 0.3) {
      return 'seasonal';
    } else if (coefficientOfVariation > 0.1) {
      return 'moderate';
    } else {
      return 'stable';
    }
  }
  
  /**
   * بدء معالجة الأحداث
   */
  startEventProcessing() {
    const processEvents = () => {
      try {
        if (this.featureUsageEvents.length === 0) return;
        
        // معالجة دفعة من الأحداث
        const batch = this.featureUsageEvents
          .filter(event => !event.processed)
          .slice(0, this.config.batchSize);
        
        // تحليل الأحداث
        for (const event of batch) {
          this.analyzeFeatureEvent(event);
          event.processed = true;
        }
        
        this.logger.debug('Processed feature events batch', { count: batch.length });
        
      } catch (error) {
        this.logger.error('Error processing feature events', { error: error.message });
      }
    };
    
    setInterval(processEvents, this.config.trackingFrequency);
  }
  
  /**
   * تحليل حدث المميزة
   */
  analyzeFeatureEvent(event) {
    // تحليل السياق
    this.analyzeEventContext(event);
    
    // تحليل الأداء
    this.analyzeEventPerformance(event);
    
    // تحليل تجربة المستخدم
    this.analyzeUserExperience(event);
  }
  
  /**
   * تحليل سياق الحدث
   */
  analyzeEventContext(event) {
    // يمكن إضافة تحليلات متقدمة للسياق هنا
    if (event.context && event.context.source) {
      // تحليل مصادر الحركة للمميزة
    }
  }
  
  /**
   * تحليل أداء الحدث
   */
  analyzeEventPerformance(event) {
    // تحليل الأداء بناء على مدة الاستخدام
    const featureMetrics = this.analytics.featureMetrics.get(event.featureId);
    if (featureMetrics && event.duration > featureMetrics.averageDuration * 2) {
      this.emit('performanceAlert', {
        type: 'slow_feature_usage',
        featureId: event.featureId,
        userId: event.userId,
        duration: event.duration,
        averageDuration: featureMetrics.averageDuration
      });
    }
  }
  
  /**
   * تحليل تجربة المستخدم
   */
  analyzeUserExperience(event) {
    // تحليل معدلات الفشل
    const featureMetrics = this.analytics.featureMetrics.get(event.featureId);
    if (featureMetrics) {
      const failureRate = featureMetrics.failedUsage / featureMetrics.totalUsage;
      
      if (failureRate > 0.3) { // أكثر من 30% فشل
        this.emit('userExperienceAlert', {
          type: 'high_failure_rate',
          featureId: event.featureId,
          failureRate: failureRate * 100,
          message: `High failure rate for feature ${event.featureId}: ${(failureRate * 100).toFixed(1)}%`
        });
      }
    }
  }
  
  /**
   * بدء تحليل البيانات
   */
  startDataAnalysis() {
    setInterval(() => {
      try {
        // تحليل أنماط الاستخدام
        this.analyzeUsagePatterns();
        
        // تحليل اتجاهات الاستخدام
        this.analyzeUsageTrends();
        
        // تحليل سلوك المستخدم
        this.analyzeUserBehavior();
        
        // تحديث المقاييس الإجمالية
        this.updateOverallMetrics();
        
      } catch (error) {
        this.logger.error('Error in data analysis', { error: error.message });
      }
    }, this.config.analysisInterval);
  }
  
  /**
   * تحليل سلوك المستخدم
   */
  analyzeUserBehavior() {
    // تحليل أنماط الاستخدام للمستخدمين المميزين
    const userBehavior = new Map();
    
    for (const [profileKey, profile] of this.userFeatureProfiles.entries()) {
      const userId = profile.userId;
      
      if (!userBehavior.has(userId)) {
        userBehavior.set(userId, {
          totalFeaturesUsed: new Set(),
          favoriteFeatures: new Map(),
          usageFrequency: 0,
          adoptionStages: new Map(),
          lastSeen: profile.lastUsed
        });
      }
      
      const behavior = userBehavior.get(userId);
      behavior.totalFeaturesUsed.add(profile.featureId);
      behavior.usageFrequency++;
      
      if (!behavior.adoptionStages.has(profile.adoptionStage)) {
        behavior.adoptionStages.set(profile.adoptionStage, 0);
      }
      behavior.adoptionStages.set(
        profile.adoptionStage, 
        behavior.adoptionStages.get(profile.adoptionStage) + 1
      );
    }
    
    this.analytics.userSegments = userBehavior;
  }
  
  /**
   * تحديث المقاييس الإجمالية
   */
  updateOverallMetrics() {
    // تحديث معدل التبني العام
    let totalAdoptedUsers = 0;
    let totalUsersWhoTried = 0;
    
    for (const profile of this.userFeatureProfiles.values()) {
      if (['adopted', 'expert'].includes(profile.adoptionStage)) {
        totalAdoptedUsers++;
      }
      if (profile.totalUsage > 0) {
        totalUsersWhoTried++;
      }
    }
    
    // تحديث معدلات التبني لكل مميزة
    for (const [featureId, metrics] of this.analytics.featureMetrics.entries()) {
      const uniqueUsers = this.analytics.userAdoption.get(featureId)?.size || 0;
      if (uniqueUsers > 0) {
        const adoptedUsers = Array.from(this.userFeatureProfiles.values())
          .filter(p => p.featureId === featureId && ['adopted', 'expert'].includes(p.adoptionStage))
          .length;
        
        metrics.adoptionRate = (adoptedUsers / uniqueUsers) * 100;
      }
    }
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
    
    // تنظيف الأحداث القديمة
    this.featureUsageEvents = this.featureUsageEvents.filter(e => e.timestamp > cutoffTime);
    
    // تنظيف الجلسات القديمة
    for (const [key, session] of this.featureSessions.entries()) {
      if (session.lastActivity < cutoffTime) {
        this.featureSessions.delete(key);
      }
    }
    
    // تنظيف الملفات القديمة
    for (const [key, profile] of this.userFeatureProfiles.entries()) {
      if (profile.lastUsed < cutoffTime) {
        this.userFeatureProfiles.delete(key);
      }
    }
    
    // تنظيف البيانات المحفوظة
    if (this.config.enableDataExport) {
      this.cleanupStoredData(cutoffTime);
    }
    
    this.logger.info('Old feature usage data cleaned up', { 
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
      this.generateFeatureUsageReport();
    }, this.config.reportInterval);
  }
  
  /**
   * توليد تقرير استخدام المميزات
   */
  generateFeatureUsageReport() {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        period: {
          start: new Date(Date.now() - this.config.reportInterval),
          end: new Date()
        },
        summary: {
          totalFeatureEvents: this.analytics.totalFeatureEvents,
          uniqueFeatures: this.analytics.uniqueFeatures,
          totalUsers: this.analytics.userSegments.size,
          activeFeatures: Array.from(this.analytics.featureMetrics.keys()).length
        },
        featureMetrics: Object.fromEntries(this.analytics.featureMetrics),
        adoptionRates: this.calculateAdoptionRates(),
        usageTrends: Object.fromEntries(this.analytics.featureTrends),
        userSegments: this.analyzeUserSegments(),
        abTestResults: Object.fromEntries(this.analytics.abTestResults),
        funnelPerformance: Object.fromEntries(this.analytics.featureFunnelPerformance),
        topFeatures: this.getTopFeatures(),
        performanceAlerts: this.getPerformanceAlerts()
      };
      
      // حفظ التقرير
      if (this.config.enableDataExport) {
        this.saveFeatureUsageReport(report);
      }
      
      // إطلاق حدث التقرير
      this.emit('featureUsageReportGenerated', report);
      
      this.logger.info('Feature usage report generated', {
        totalEvents: report.summary.totalFeatureEvents,
        uniqueFeatures: report.summary.uniqueFeatures
      });
      
      return report;
      
    } catch (error) {
      this.logger.error('Error generating feature usage report', { error: error.message });
      return null;
    }
  }
  
  /**
   * حساب معدلات التبني
   */
  calculateAdoptionRates() {
    const adoptionRates = {};
    
    for (const [featureId, metrics] of this.analytics.featureMetrics.entries()) {
      adoptionRates[featureId] = {
        adoptionRate: metrics.adoptionRate,
        abandonmentRate: metrics.abandonmentRate,
        totalUsers: metrics.totalUsers
      };
    }
    
    return adoptionRates;
  }
  
  /**
   * تحليل مقاطع المستخدمين
   */
  analyzeUserSegments() {
    const segments = {
      power_users: [], // مستخدمون يستخدمون أكثر من 5 مميزات
      core_users: [], // مستخدمون يستخدمون 2-5 مميزات
      casual_users: [], // مستخدمون يستخدمون مميزة واحدة فقط
      inactive_users: [] // مستخدمون غير نشطين
    };
    
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // أسبوع واحد
    
    for (const [userId, behavior] of this.analytics.userSegments.entries()) {
      const featureCount = behavior.totalFeaturesUsed.size;
      const lastSeen = behavior.lastSeen;
      
      if (lastSeen < cutoffTime) {
        segments.inactive_users.push(userId);
      } else if (featureCount >= 5) {
        segments.power_users.push(userId);
      } else if (featureCount >= 2) {
        segments.core_users.push(userId);
      } else {
        segments.casual_users.push(userId);
      }
    }
    
    return {
      power_users: segments.power_users.length,
      core_users: segments.core_users.length,
      casual_users: segments.casual_users.length,
      inactive_users: segments.inactive_users.length
    };
  }
  
  /**
   * الحصول على أفضل المميزات
   */
  getTopFeatures() {
    const features = Array.from(this.analytics.featureMetrics.entries())
      .sort(([,a], [,b]) => b.totalUsage - a.totalUsage)
      .slice(0, 10)
      .map(([featureId, metrics]) => ({
        featureId: featureId,
        featureName: this.featureDefinitions.get(featureId)?.name || featureId,
        totalUsage: metrics.totalUsage,
        adoptionRate: metrics.adoptionRate,
        abandonmentRate: metrics.abandonmentRate,
        averageDuration: metrics.averageDuration
      }));
    
    return features;
  }
  
  /**
   * الحصول على تنبيهات الأداء
   */
  getPerformanceAlerts() {
    const alerts = [];
    
    for (const [featureId, metrics] of this.analytics.featureMetrics.entries()) {
      // تنبيه معدل تبني منخفض
      if (metrics.adoptionRate < this.config.usageThresholds.featureAdoptionRate * 100) {
        alerts.push({
          type: 'low_adoption_rate',
          featureId: featureId,
          severity: 'warning',
          message: `Low adoption rate for ${featureId}: ${metrics.adoptionRate.toFixed(1)}%`,
          metric: metrics.adoptionRate,
          threshold: this.config.usageThresholds.featureAdoptionRate * 100
        });
      }
      
      // تنبيه معدل هجر عالي
      if (metrics.abandonmentRate > this.config.usageThresholds.featureAbandonmentRate * 100) {
        alerts.push({
          type: 'high_abandonment_rate',
          featureId: featureId,
          severity: 'critical',
          message: `High abandonment rate for ${featureId}: ${metrics.abandonmentRate.toFixed(1)}%`,
          metric: metrics.abandonmentRate,
          threshold: this.config.usageThresholds.featureAbandonmentRate * 100
        });
      }
    }
    
    return alerts;
  }
  
  /**
   * حفظ تقرير استخدام المميزات
   */
  saveFeatureUsageReport(report) {
    const timestamp = report.timestamp.replace(/[:.]/g, '-');
    const filename = `feature_usage_report_${timestamp}`;
    
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
        this.logger.error('Error saving feature usage report', { 
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
    
    csv += `Total Feature Events,${report.summary.totalFeatureEvents}\n`;
    csv += `Unique Features,${report.summary.uniqueFeatures}\n`;
    csv += `Total Users,${report.summary.totalUsers}\n`;
    csv += `Active Features,${report.summary.activeFeatures}\n`;
    
    return csv;
  }
  
  /**
   * بدء مراقبة التنبيهات
   */
  startAlertMonitoring() {
    setInterval(() => {
      this.checkFeatureUsageAlerts();
    }, 5 * 60 * 1000); // كل 5 دقائق
  }
  
  /**
   * فحص تنبيهات استخدام المميزات
   */
  checkFeatureUsageAlerts() {
    try {
      // فحص تنبيهات الأداء
      const performanceAlerts = this.getPerformanceAlerts();
      
      for (const alert of performanceAlerts) {
        this.emit('featureUsageAlert', alert);
        
        this.logger.warn('Feature usage alert', alert);
      }
      
      // فحص اتجاهات الاستخدام
      this.checkUsageTrendAlerts();
      
    } catch (error) {
      this.logger.error('Error checking feature usage alerts', { error: error.message });
    }
  }
  
  /**
   * فحص تنبيهات اتجاهات الاستخدام
   */
  checkUsageTrendAlerts() {
    for (const [featureId, trends] of this.analytics.featureTrends.entries()) {
      if (trends.trend === 'declining' && trends.changeRate < -20) {
        this.emit('featureUsageAlert', {
          type: 'usage_decline',
          featureId: featureId,
          severity: 'warning',
          message: `Significant usage decline for ${featureId}: ${trends.changeRate.toFixed(1)}%`,
          changeRate: trends.changeRate
        });
      }
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
      const reportFiles = files.filter(f => f.startsWith('feature_usage_report_') && f.endsWith('.json'));
      
      if (reportFiles.length > 0) {
        const latestFile = reportFiles.sort().pop();
        const filepath = path.join(this.config.exportPath, latestFile);
        
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        this.logger.info('Loaded previous feature usage data', { file: latestFile });
      }
      
    } catch (error) {
      this.logger.error('Error loading stored feature usage data', { error: error.message });
    }
  }
  
  /**
   * الحصول على إحصائيات استخدام المميزات الحالية
   */
  getCurrentFeatureUsageStats() {
    return {
      timestamp: new Date().toISOString(),
      totalEvents: this.analytics.totalFeatureEvents,
      uniqueFeatures: this.analytics.uniqueFeatures,
      activeUsers: this.analytics.userSegments.size,
      topFeatures: this.getTopFeatures().slice(0, 5),
      adoptionRates: this.calculateAdoptionRates(),
      userSegments: this.analyzeUserSegments(),
      performanceAlerts: this.getPerformanceAlerts()
    };
  }
  
  /**
   * الحصول على تحليلات مفصلة لمميزة معينة
   */
  getFeatureAnalytics(featureId) {
    const feature = this.featureDefinitions.get(featureId);
    if (!feature) {
      return null;
    }
    
    const metrics = this.analytics.featureMetrics.get(featureId);
    const trends = this.analytics.featureTrends.get(featureId);
    const funnel = this.analytics.featureFunnelPerformance.get(featureId);
    
    return {
      feature: feature,
      metrics: metrics,
      trends: trends,
      funnel: funnel,
      userProfiles: this.getFeatureUserProfiles(featureId),
      usagePatterns: this.getFeatureUsagePatterns(featureId)
    };
  }
  
  /**
   * الحصول على ملفات المستخدمين للمميزة
   */
  getFeatureUserProfiles(featureId) {
    return Array.from(this.userFeatureProfiles.values())
      .filter(profile => profile.featureId === featureId)
      .map(profile => ({
        userId: profile.userId,
        adoptionStage: profile.adoptionStage,
        totalUsage: profile.totalUsage,
        successRate: profile.totalUsage > 0 
          ? (profile.successfulUsage / profile.totalUsage) * 100 
          : 0,
        averageDuration: profile.averageDuration,
        lastUsed: profile.lastUsed
      }));
  }
  
  /**
   * الحصول على أنماط استخدام المميزة
   */
  getFeatureUsagePatterns(featureId) {
    const featureEvents = this.featureUsageEvents.filter(e => e.featureId === featureId);
    
    return {
      actionDistribution: this.calculateActionDistribution(featureEvents),
      contextDistribution: this.calculateContextDistribution(featureEvents),
      deviceDistribution: this.calculateDeviceDistribution(featureEvents),
      timeDistribution: this.calculateTimeDistribution(featureEvents)
    };
  }
  
  /**
   * حساب توزيع الإجراءات
   */
  calculateActionDistribution(events) {
    const distribution = new Map();
    
    for (const event of events) {
      if (!distribution.has(event.action)) {
        distribution.set(event.action, 0);
      }
      distribution.set(event.action, distribution.get(event.action) + 1);
    }
    
    return Object.fromEntries(distribution);
  }
  
  /**
   * حساب توزيع السياق
   */
  calculateContextDistribution(events) {
    const distribution = new Map();
    
    for (const event of events) {
      const contextKey = JSON.stringify(event.context || {});
      if (!distribution.has(contextKey)) {
        distribution.set(contextKey, 0);
      }
      distribution.set(contextKey, distribution.get(contextKey) + 1);
    }
    
    return Object.fromEntries(distribution);
  }
  
  /**
   * حساب توزيع الجهاز
   */
  calculateDeviceDistribution(events) {
    const distribution = new Map();
    
    for (const event of events) {
      const device = event.device?.type || 'unknown';
      if (!distribution.has(device)) {
        distribution.set(device, 0);
      }
      distribution.set(device, distribution.get(device) + 1);
    }
    
    return Object.fromEntries(distribution);
  }
  
  /**
   * حساب توزيع الوقت
   */
  calculateTimeDistribution(events) {
    const hourly = new Array(24).fill(0);
    const daily = new Array(7).fill(0);
    
    for (const event of events) {
      const date = new Date(event.timestamp);
      hourly[date.getHours()]++;
      daily[date.getDay()]++;
    }
    
    return {
      hourly: hourly,
      daily: daily
    };
  }
}

// تصدير الكلاس
module.exports = FeatureUsageTracker;

// مثال على الاستخدام
if (require.main === module) {
  const featureTracker = new FeatureUsageTracker({
    enableRealTimeTracking: true,
    enableA_B_Testing: true,
    enableFeatureFunnels: true,
    featureDefinitions: [
      {
        id: 'ai_chat',
        name: 'AI Chat Assistant',
        category: 'enhancement',
        description: 'AI-powered chat assistance',
        isCore: false,
        dependencies: ['search'],
        tags: ['ai', 'chat', 'assistance']
      }
    ]
  });
  
  // تسجيل مستمعي الأحداث
  featureTracker.on('featureUsageTracked', (event) => {
    console.log('Feature used:', event.featureId, event.action);
  });
  
  featureTracker.on('featureUsageReportGenerated', (report) => {
    console.log('Feature usage report:', report.summary);
  });
  
  featureTracker.on('featureUsageAlert', (alert) => {
    console.log('Feature usage alert:', alert.message);
  });
  
  // محاكاة استخدام المميزات
  setTimeout(() => {
    // تتبع استخدام البحث
    featureTracker.trackFeatureUsage({
      featureId: 'search',
      userId: 'user123',
      sessionId: 'session123',
      action: 'use',
      duration: 2500,
      context: {
        query: 'laptop',
        results: 25
      }
    });
    
    // تتبع استخدام الفلترة
    featureTracker.trackFeatureUsage({
      featureId: 'filter',
      userId: 'user123',
      sessionId: 'session123',
      action: 'use',
      duration: 1500,
      context: {
        filterType: 'price_range',
        minPrice: 500,
        maxPrice: 1000
      }
    });
    
  }, 1000);
  
  setTimeout(() => {
    // تتبع مهمة الميزة (عملية شراء)
    featureTracker.trackFeatureTask({
      taskId: 'product_purchase',
      taskType: 'ecommerce_flow',
      userId: 'user123',
      sessionId: 'session123',
      requiredFeatures: ['cart', 'checkout'],
      totalSteps: 4
    });
    
    // تحديث خطوات المهمة
    featureTracker.updateFeatureTaskStep('user123', 'product_purchase', {
      stepNumber: 1,
      stepName: 'Add to Cart',
      featureId: 'cart',
      duration: 3000,
      success: true
    });
    
    featureTracker.updateFeatureTaskStep('user123', 'product_purchase', {
      stepNumber: 2,
      stepName: 'Shipping Info',
      featureId: 'checkout',
      duration: 5000,
      success: true
    });
    
  }, 2000);
  
  // عرض الإحصائيات
  setInterval(() => {
    const stats = featureTracker.getCurrentFeatureUsageStats();
    console.log('Feature usage stats:', JSON.stringify(stats, null, 2));
  }, 10000);
  
  // إيقاف نظيفة
  setTimeout(() => {
    console.log('Shutting down feature tracker...');
    process.exit(0);
  }, 60000);
}