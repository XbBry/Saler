/**
 * نظام تتبع رحلة المستخدم
 * User Journey Tracking System
 */

const EventEmitter = require('events');
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class UserJourneyTracker extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // إعدادات التتبع
      enableSessionTracking: config.enableSessionTracking !== false,
      enableCrossDeviceTracking: config.enableCrossDeviceTracking !== false,
      enablePathAnalysis: config.enablePathAnalysis !== false,
      enableJourneyOptimization: config.enableJourneyOptimization !== false,
      
      // إعدادات التحليل
      sessionTimeout: config.sessionTimeout || 30 * 60 * 1000, // 30 دقيقة
      journeyTimeout: config.journeyTimeout || 7 * 24 * 60 * 60 * 1000, // 7 أيام
      trackingFrequency: config.trackingFrequency || 2000, // 2 ثانية
      batchSize: config.batchSize || 100,
      
      // إعدادات التقارير
      enableReports: config.enableReports !== false,
      reportInterval: config.reportInterval || 6 * 60 * 60 * 1000, // كل 6 ساعات
      enableDashboards: config.enableDashboards !== false,
      
      // إعدادات التصدير
      enableDataExport: config.enableDataExport !== false,
      exportPath: config.exportPath || './user_journey_data',
      exportFormats: config.exportFormats || ['json', 'csv'],
      retentionDays: config.retentionDays || 90,
      
      // إعدادات التنبيهات
      enableAlerts: config.enableAlerts !== false,
      abandonmentThresholds: config.abandonmentThresholds || {
        cartAbandonment: 70, // 70%
        checkoutAbandonment: 60, // 60%
        signupDropOff: 80 // 80%
      },
      
      // إعدادات التخصيص
      customEvents: config.customEvents || [],
      journeyStages: config.journeyStages || [
        { id: 'awareness', name: 'Awareness', description: 'User becomes aware of product/service' },
        { id: 'consideration', name: 'Consideration', description: 'User evaluates options' },
        { id: 'intent', name: 'Intent', description: 'User shows purchase intent' },
        { id: 'purchase', name: 'Purchase', description: 'User completes purchase' },
        { id: 'retention', name: 'Retention', description: 'User continues engagement' },
        { id: 'advocacy', name: 'Advocacy', description: 'User becomes advocate' }
      ],
      
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
        new winston.transports.File({ filename: 'user_journey.log' }),
        new winston.transports.Console()
      ]
    });
    
    // تخزين البيانات
    this.userJourneys = new Map();
    this.userSessions = new Map();
    this.crossDeviceMappings = new Map();
    this.journeyPaths = new Map();
    this.journeyFunnels = new Map();
    this.journeyEvents = [];
    
    // تحليلات رحلة المستخدم
    this.analytics = {
      totalJourneys: 0,
      completedJourneys: 0,
      abandonedJourneys: 0,
      averageJourneyTime: 0,
      completionRate: 0,
      dropOffPoints: new Map(),
      commonPaths: new Map(),
      stageTransitions: new Map(),
      crossDeviceUsage: new Map(),
      devicePathPatterns: new Map(),
      timeBasedPatterns: new Map(),
      userCohorts: new Map(),
      journeyFunnelPerformance: new Map()
    };
    
    // إنشاء مجلد التصدير
    if (this.config.enableDataExport && !fs.existsSync(this.config.exportPath)) {
      fs.mkdirSync(this.config.exportPath, { recursive: true });
    }
    
    this.initializeJourneyDefinitions();
    this.initializeTracking();
  }
  
  /**
   * تهيئة تعريفات الرحلات
   */
  initializeJourneyDefinitions() {
    const defaultJourneys = [
      {
        id: 'ecommerce_purchase',
        name: 'E-commerce Purchase Journey',
        type: 'conversion',
        description: 'Complete journey from awareness to purchase',
        stages: [
          { stageId: 'landing', name: 'Landing Page', order: 1, required: true },
          { stageId: 'product_browse', name: 'Product Browsing', order: 2, required: false },
          { stageId: 'product_view', name: 'Product View', order: 3, required: false },
          { stageId: 'add_to_cart', name: 'Add to Cart', order: 4, required: true },
          { stageId: 'cart_review', name: 'Cart Review', order: 5, required: false },
          { stageId: 'checkout', name: 'Checkout Process', order: 6, required: true },
          { stageId: 'payment', name: 'Payment', order: 7, required: true },
          { stageId: 'confirmation', name: 'Order Confirmation', order: 8, required: true }
        ],
        goals: ['purchase'],
        tags: ['ecommerce', 'conversion']
      },
      {
        id: 'user_registration',
        name: 'User Registration Journey',
        type: 'acquisition',
        description: 'Journey from first visit to successful registration',
        stages: [
          { stageId: 'landing', name: 'Landing Page', order: 1, required: true },
          { stageId: 'signup_page', name: 'Sign Up Page', order: 2, required: true },
          { stageId: 'form_fill', name: 'Form Filling', order: 3, required: true },
          { stageId: 'email_verification', name: 'Email Verification', order: 4, required: false },
          { stageId: 'profile_setup', name: 'Profile Setup', order: 5, required: false },
          { stageId: 'welcome_completion', name: 'Welcome Completion', order: 6, required: true }
        ],
        goals: ['signup'],
        tags: ['acquisition', 'onboarding']
      },
      {
        id: 'content_consumption',
        name: 'Content Consumption Journey',
        type: 'engagement',
        description: 'Journey through content discovery and consumption',
        stages: [
          { stageId: 'discovery', name: 'Content Discovery', order: 1, required: true },
          { stageId: 'article_read', name: 'Article Reading', order: 2, required: false },
          { stageId: 'engagement', name: 'User Engagement', order: 3, required: false },
          { stageId: 'sharing', name: 'Content Sharing', order: 4, required: false },
          { stageId: 'return_visit', name: 'Return Visit', order: 5, required: false }
        ],
        goals: ['engagement'],
        tags: ['content', 'engagement']
      },
      {
        id: 'customer_support',
        name: 'Customer Support Journey',
        type: 'support',
        description: 'Journey from issue identification to resolution',
        stages: [
          { stageId: 'issue_identification', name: 'Issue Identification', order: 1, required: true },
          { stageId: 'support_contact', name: 'Support Contact', order: 2, required: true },
          { stageId: 'issue_triage', name: 'Issue Triage', order: 3, required: false },
          { stageId: 'resolution', name: 'Issue Resolution', order: 4, required: true },
          { stageId: 'satisfaction_feedback', name: 'Satisfaction Feedback', order: 5, required: false }
        ],
        goals: ['support_resolution'],
        tags: ['support', 'customer_service']
      }
    ];
    
    // دمج الرحلات المخصصة
    const customJourneys = this.config.journeyDefinitions || [];
    this.journeyDefinitions = [
      ...defaultJourneys,
      ...customJourneys.filter(j => !defaultJourneys.find(d => d.id === j.id))
    ];
    
    // إنشاء خرائط للمساعدة
    this.journeyMap = new Map();
    for (const journey of this.journeyDefinitions) {
      this.journeyMap.set(journey.id, journey);
    }
    
    this.logger.info('Journey definitions initialized', {
      journeysCount: this.journeyDefinitions.length
    });
  }
  
  /**
   * تهيئة التتبع
   */
  initializeTracking() {
    this.logger.info('Initializing user journey tracking system');
    
    // بدء معالجة الأحداث
    this.startEventProcessing();
    
    // بدء تنظيف البيانات
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
   * تتبع رحلة جديدة
   */
  trackJourneyStart(journeyData) {
    try {
      const journeyDefinition = this.journeyMap.get(journeyData.journeyId);
      if (!journeyDefinition) {
        this.logger.warn('Unknown journey ID', { journeyId: journeyData.journeyId });
        return null;
      }
      
      const journey = {
        id: uuidv4(),
        journeyId: journeyData.journeyId,
        journeyName: journeyDefinition.name,
        journeyType: journeyDefinition.type,
        
        // معلومات المستخدم
        userId: journeyData.userId,
        sessionId: journeyData.sessionId || uuidv4(),
        deviceId: journeyData.deviceId,
        
        // حالة الرحلة
        status: 'active', // active, completed, abandoned, error
        currentStage: 1,
        completedStages: [],
        startTime: Date.now(),
        lastActivity: Date.now(),
        endTime: null,
        
        // البيانات الإضافية
        metadata: journeyData.metadata || {},
        context: journeyData.context || {},
        
        // تتبع التحويل
        conversions: journeyData.conversions || [],
        revenue: journeyData.revenue || 0,
        
        // معلومات السياق
        entrySource: journeyData.entrySource,
        entryMedium: journeyData.entryMedium,
        entryCampaign: journeyData.entryCampaign,
        
        // الأجهزة المستخدمة
        devices: journeyData.deviceId ? [journeyData.deviceId] : [],
        
        // الخطوات والتفاعلات
        interactions: [],
        stageDurations: new Map(),
        dropOffPoints: [],
        
        processed: false
      };
      
      // حفظ الرحلة
      this.userJourneys.set(journey.id, journey);
      this.analytics.totalJourneys++;
      
      // تحديث خريطة رحلة المستخدم
      this.updateUserJourneyMap(journey);
      
      // تحليل مسار الدخول
      this.analyzeEntryPath(journey);
      
      // إطلاق أحداث
      this.emit('journeyStarted', journey);
      this.emit('journeyByType', journey.journeyType, journey);
      
      this.logger.info('Journey tracking started', {
        journeyId: journey.id,
        journeyType: journey.journeyType,
        userId: journey.userId
      });
      
      return journey.id;
      
    } catch (error) {
      this.logger.error('Error tracking journey start', { 
        error: error.message,
        journeyData 
      });
      return null;
    }
  }
  
  /**
   * تحديث تقدم الرحلة
   */
  trackJourneyProgress(journeyId, progressData) {
    try {
      const journey = this.userJourneys.get(journeyId);
      if (!journey) {
        this.logger.warn('Journey not found', { journeyId });
        return false;
      }
      
      const journeyDefinition = this.journeyMap.get(journey.journeyId);
      if (!journeyDefinition) {
        this.logger.warn('Journey definition not found', { journeyId, journeyJourneyId: journey.journeyId });
        return false;
      }
      
      const interaction = {
        id: uuidv4(),
        timestamp: Date.now(),
        type: progressData.type, // 'stage_complete', 'stage_skip', 'interaction', 'conversion'
        
        // معلومات المرحلة
        stageId: progressData.stageId,
        stageOrder: progressData.stageOrder,
        
        // تفاصيل التفاعل
        action: progressData.action,
        properties: progressData.properties || {},
        duration: progressData.duration || 0,
        
        // السياق
        page: progressData.page,
        referrer: progressData.referrer,
        device: progressData.device,
        
        // النتيجة
        success: progressData.success !== false,
        error: progressData.error || null
      };
      
      // إضافة التفاعل للرحلة
      journey.interactions.push(interaction);
      journey.lastActivity = Date.now();
      
      // تحديث حالة المرحلة
      if (interaction.type === 'stage_complete') {
        this.handleStageCompletion(journey, interaction, journeyDefinition);
      } else if (interaction.type === 'stage_skip') {
        this.handleStageSkip(journey, interaction, journeyDefinition);
      } else if (interaction.type === 'conversion') {
        this.handleJourneyConversion(journey, interaction);
      }
      
      // تحديث الأجهزة المستخدمة
      if (interaction.device && !journey.devices.includes(interaction.device)) {
        journey.devices.push(interaction.device);
      }
      
      // فحص انتهاء الرحلة
      this.checkJourneyCompletion(journey, journeyDefinition);
      
      // إطلاق أحداث
      this.emit('journeyProgress', journey, interaction);
      this.emit('stageProgress', journey.journeyId, interaction.stageId, interaction);
      
      this.logger.debug('Journey progress tracked', {
        journeyId: journey.id,
        stageId: interaction.stageId,
        type: interaction.type
      });
      
      return true;
      
    } catch (error) {
      this.logger.error('Error tracking journey progress', { 
        error: error.message,
        journeyId,
        progressData 
      });
      return false;
    }
  }
  
  /**
   * معالجة إكمال المرحلة
   */
  handleStageCompletion(journey, interaction, journeyDefinition) {
    // تحديث المراحل المكتملة
    const stageInfo = journeyDefinition.stages.find(s => s.stageId === interaction.stageId);
    if (stageInfo) {
      const completedStage = {
        stageId: interaction.stageId,
        stageName: stageInfo.name,
        order: stageInfo.order,
        completedAt: interaction.timestamp,
        duration: interaction.duration,
        success: interaction.success,
        device: interaction.device
      };
      
      journey.completedStages.push(completedStage);
      journey.currentStage = Math.max(journey.currentStage, stageInfo.order + 1);
      
      // تحديث مدة المرحلة
      journey.stageDurations.set(interaction.stageId, interaction.duration);
      
      // تحديث التحليلات
      this.updateStageAnalytics(journey, completedStage);
    }
  }
  
  /**
   * معالجة تخطي المرحلة
   */
  handleStageSkip(journey, interaction, journeyDefinition) {
    const stageInfo = journeyDefinition.stages.find(s => s.stageId === interaction.stageId);
    if (stageInfo) {
      journey.dropOffPoints.push({
        stageId: interaction.stageId,
        stageName: stageInfo.name,
        skippedAt: interaction.timestamp,
        reason: interaction.properties?.skipReason || 'user_choice'
      });
    }
  }
  
  /**
   * معالجة تحويل الرحلة
   */
  handleJourneyConversion(journey, interaction) {
    const conversion = {
      id: interaction.id,
      type: interaction.properties?.conversionType || 'unknown',
      value: interaction.properties?.value || 0,
      timestamp: interaction.timestamp,
      metadata: interaction.properties
    };
    
    journey.conversions.push(conversion);
    journey.revenue += conversion.value;
  }
  
  /**
   * فحص إكمال الرحلة
   */
  checkJourneyCompletion(journey, journeyDefinition) {
    const requiredStages = journeyDefinition.stages.filter(s => s.required);
    const completedRequiredStages = requiredStages.filter(stage => 
      journey.completedStages.some(cs => cs.stageId === stage.stageId)
    );
    
    // فحص إذا تم إكمال جميع المراحل المطلوبة
    if (completedRequiredStages.length === requiredStages.length) {
      this.completeJourney(journey, 'completed');
    }
    
    // فحص المهلة الزمنية
    const inactiveTime = Date.now() - journey.lastActivity;
    if (inactiveTime > this.config.journeyTimeout) {
      this.completeJourney(journey, 'timeout');
    }
  }
  
  /**
   * إكمال الرحلة
   */
  completeJourney(journey, completionType) {
    journey.status = completionType;
    journey.endTime = Date.now();
    
    // حساب المدة الإجمالية
    const totalDuration = journey.endTime - journey.startTime;
    
    // تحديث التحليلات
    this.updateJourneyAnalytics(journey, completionType, totalDuration);
    
    // تحليل مسار الرحلة
    this.analyzeJourneyPath(journey);
    
    // إطلاق أحداث
    this.emit('journeyCompleted', journey, completionType);
    
    this.logger.info('Journey completed', {
      journeyId: journey.id,
      journeyType: journey.journeyType,
      completionType: completionType,
      duration: totalDuration,
      stagesCompleted: journey.completedStages.length
    });
  }
  
  /**
   * تحديث خريطة رحلة المستخدم
   */
  updateUserJourneyMap(journey) {
    const userKey = journey.userId;
    
    if (!this.userJourneys.has(userKey)) {
      this.userJourneys.set(userKey, []);
    }
    
    const userJourneys = this.userJourneys.get(userKey);
    userJourneys.push(journey);
  }
  
  /**
   * تحليل مسار الدخول
   */
  analyzeEntryPath(journey) {
    const entryData = {
      source: journey.entrySource,
      medium: journey.entryMedium,
      campaign: journey.entryCampaign,
      timestamp: journey.startTime,
      device: journey.deviceId
    };
    
    // تحديث إحصائيات المصادر
    this.updateEntrySourceAnalytics(entryData);
  }
  
  /**
   * تحديث إحصائيات المصادر
   */
  updateEntrySourceAnalytics(entryData) {
    // يمكن إضافة تحليلات متقدمة هنا
    // مثل تحليل أفضل مصادر الحركة لكل نوع رحلة
  }
  
  /**
   * تحديث تحليلات المرحلة
   */
  updateStageAnalytics(journey, completedStage) {
    const stageKey = `${journey.journeyId}_${completedStage.stageId}`;
    
    if (!this.analytics.dropOffPoints.has(stageKey)) {
      this.analytics.dropOffPoints.set(stageKey, {
        journeyId: journey.journeyId,
        stageId: completedStage.stageId,
        stageName: completedStage.stageName,
        completions: 0,
        skips: 0,
        averageDuration: 0,
        deviceBreakdown: new Map(),
        successRate: 0
      });
    }
    
    const stageData = this.analytics.dropOffPoints.get(stageKey);
    stageData.completions++;
    
    // تحديث متوسط المدة
    stageData.averageDuration = (
      (stageData.averageDuration * (stageData.completions - 1)) + completedStage.duration
    ) / stageData.completions;
    
    // تحديث تقسيم الأجهزة
    if (completedStage.device) {
      if (!stageData.deviceBreakdown.has(completedStage.device)) {
        stageData.deviceBreakdown.set(completedStage.device, 0);
      }
      stageData.deviceBreakdown.set(
        completedStage.device, 
        stageData.deviceBreakdown.get(completedStage.device) + 1
      );
    }
    
    // تحديث معدل النجاح
    const totalAttempts = stageData.completions + stageData.skips;
    stageData.successRate = totalAttempts > 0 
      ? (stageData.completions / totalAttempts) * 100 
      : 0;
  }
  
  /**
   * تحديث تحليلات الرحلة
   */
  updateJourneyAnalytics(journey, completionType, totalDuration) {
    if (completionType === 'completed') {
      this.analytics.completedJourneys++;
    } else {
      this.analytics.abandonedJourneys++;
    }
    
    // حساب متوسط مدة الرحلة
    const currentAvg = this.analytics.averageJourneyTime;
    const currentCount = this.analytics.completedJourneys + this.analytics.abandonedJourneys;
    
    this.analytics.averageJourneyTime = (
      (currentAvg * (currentCount - 1)) + totalDuration
    ) / currentCount;
    
    // حساب معدل الإكمال
    this.analytics.completionRate = this.analytics.totalJourneys > 0 
      ? (this.analytics.completedJourneys / this.analytics.totalJourneys) * 100 
      : 0;
    
    // تحليل الأجهزة متعددة الاستخدام
    this.analyzeCrossDeviceUsage(journey);
    
    // تحليل الأنماط الزمنية
    this.analyzeTimeBasedPatterns(journey);
  }
  
  /**
   * تحليل استخدام الأجهزة المتعددة
   */
  analyzeCrossDeviceUsage(journey) {
    if (journey.devices.length > 1) {
      const devicePattern = journey.devices.join(' -> ');
      
      if (!this.analytics.crossDeviceUsage.has(devicePattern)) {
        this.analytics.crossDeviceUsage.set(devicePattern, 0);
      }
      
      this.analytics.crossDeviceUsage.set(
        devicePattern, 
        this.analytics.crossDeviceUsage.get(devicePattern) + 1
      );
    }
    
    // تحديث خريطة الأجهزة للمستخدم
    const userDeviceKey = journey.userId;
    if (!this.crossDeviceMappings.has(userDeviceKey)) {
      this.crossDeviceMappings.set(userDeviceKey, new Set());
    }
    
    this.crossDeviceMappings.get(userDeviceKey).add(journey.deviceId);
  }
  
  /**
   * تحليل الأنماط الزمنية
   */
  analyzeTimeBasedPatterns(journey) {
    const startTime = new Date(journey.startTime);
    const hour = startTime.getHours();
    const dayOfWeek = startTime.getDay();
    
    const timePattern = `${dayOfWeek}_${hour}`;
    
    if (!this.analytics.timeBasedPatterns.has(timePattern)) {
      this.analytics.timeBasedPatterns.set(timePattern, {
        hour: hour,
        dayOfWeek: dayOfWeek,
        count: 0,
        completionRate: 0,
        completedCount: 0
      });
    }
    
    const pattern = this.analytics.timeBasedPatterns.get(timePattern);
    pattern.count++;
    
    if (journey.status === 'completed') {
      pattern.completedCount++;
      pattern.completionRate = (pattern.completedCount / pattern.count) * 100;
    }
  }
  
  /**
   * تحليل مسار الرحلة
   */
  analyzeJourneyPath(journey) {
    // إنشاء مسار من المراحل المكتملة
    const path = journey.completedStages
      .sort((a, b) => a.order - b.order)
      .map(stage => stage.stageId)
      .join(' -> ');
    
    if (!this.analytics.commonPaths.has(path)) {
      this.analytics.commonPaths.set(path, {
        path: path,
        count: 0,
        journeyType: journey.journeyType,
        averageDuration: 0,
        totalDuration: 0,
        devices: new Map(),
        successRate: 0
      });
    }
    
    const pathData = this.analytics.commonPaths.get(path);
    pathData.count++;
    pathData.totalDuration += journey.endTime - journey.startTime;
    pathData.averageDuration = pathData.totalDuration / pathData.count;
    
    // تحليل الأجهزة في المسار
    for (const device of journey.devices) {
      if (!pathData.devices.has(device)) {
        pathData.devices.set(device, 0);
      }
      pathData.devices.set(device, pathData.devices.get(device) + 1);
    }
    
    // معدل النجاح
    const successfulJourneys = Array.from(this.analytics.commonPaths.values())
      .filter(p => p.path === path && p.count > 0).length;
    pathData.successRate = pathData.count > 0 
      ? (successfulJourneys / pathData.count) * 100 
      : 0;
    
    // تحديث خريطة مسارات الرحلة
    this.updateJourneyPathMap(journey);
  }
  
  /**
   * تحديث خريطة مسارات الرحلة
   */
  updateJourneyPathMap(journey) {
    const journeyKey = journey.journeyId;
    
    if (!this.journeyPaths.has(journeyKey)) {
      this.journeyPaths.set(journeyKey, new Map());
    }
    
    const paths = this.journeyPaths.get(journeyKey);
    
    // تحديث انتقالات المراحل
    for (let i = 0; i < journey.completedStages.length - 1; i++) {
      const fromStage = journey.completedStages[i].stageId;
      const toStage = journey.completedStages[i + 1].stageId;
      
      const transitionKey = `${fromStage} -> ${toStage}`;
      
      if (!this.analytics.stageTransitions.has(transitionKey)) {
        this.analytics.stageTransitions.set(transitionKey, {
          from: fromStage,
          to: toStage,
          count: 0,
          averageDuration: 0,
          totalDuration: 0,
          successRate: 0
        });
      }
      
      const transition = this.analytics.stageTransitions.get(transitionKey);
      transition.count++;
      transition.totalDuration += journey.completedStages[i + 1].completedAt - journey.completedStages[i].completedAt;
      transition.averageDuration = transition.totalDuration / transition.count;
      
      if (journey.status === 'completed') {
        transition.successRate = (transition.successRate * (transition.count - 1) + 100) / transition.count;
      }
    }
  }
  
  /**
   * بدء معالجة الأحداث
   */
  startEventProcessing() {
    const processEvents = () => {
      try {
        // معالجة الرحلات المعلقة
        this.processPendingJourneys();
        
        // تحديث التحليلات
        this.updateOverallAnalytics();
        
        // تحليل أنماط المستخدمين
        this.analyzeUserPatterns();
        
        // تحليل أداء القمع
        this.analyzeJourneyFunnelPerformance();
        
      } catch (error) {
        this.logger.error('Error in event processing', { error: error.message });
      }
    };
    
    setInterval(processEvents, this.config.trackingFrequency);
  }
  
  /**
   * معالجة الرحلات المعلقة
   */
  processPendingJourneys() {
    const now = Date.now();
    
    for (const [journeyId, journey] of this.userJourneys.entries()) {
      if (journey.processed) continue;
      
      // فحص المهلة الزمنية
      if (now - journey.lastActivity > this.config.journeyTimeout) {
        this.completeJourney(journey, 'timeout');
      }
      
      // فحص مهلة الجلسة للرحلات النشطة
      if (journey.status === 'active' && now - journey.lastActivity > this.config.sessionTimeout) {
        journey.status = 'session_timeout';
        journey.endTime = now;
        this.updateJourneyAnalytics(journey, 'session_timeout', now - journey.startTime);
      }
    }
  }
  
  /**
   * تحديث التحليلات الإجمالية
   */
  updateOverallAnalytics() {
    // تحديث معدل الإكمال
    this.analytics.completionRate = this.analytics.totalJourneys > 0 
      ? (this.analytics.completedJourneys / this.analytics.totalJourneys) * 100 
      : 0;
    
    // تحديث متوسط مدة الرحلة
    const totalJourneys = this.analytics.completedJourneys + this.analytics.abandonedJourneys;
    if (totalJourneys > 0) {
      this.analytics.averageJourneyTime = this.calculateAverageJourneyTime();
    }
  }
  
  /**
   * حساب متوسط مدة الرحلة
   */
  calculateAverageJourneyTime() {
    let totalDuration = 0;
    let validJourneys = 0;
    
    for (const journey of this.userJourneys.values()) {
      if (journey.endTime && journey.startTime) {
        totalDuration += journey.endTime - journey.startTime;
        validJourneys++;
      }
    }
    
    return validJourneys > 0 ? totalDuration / validJourneys : 0;
  }
  
  /**
   * تحليل أنماط المستخدمين
   */
  analyzeUserPatterns() {
    // تحليل المجموعات (Cohorts)
    this.performCohortAnalysis();
    
    // تحليل أنماط الانتقال
    this.analyzeTransitionPatterns();
    
    // تحليل التفضيلات
    this.analyzePreferencePatterns();
  }
  
  /**
   * تحليل المجموعات
   */
  performCohortAnalysis() {
    const cohorts = new Map();
    
    // تجميع المستخدمين حسب تاريخ أول رحلة
    for (const journey of this.userJourneys.values()) {
      const firstJourneyDate = new Date(journey.startTime).toISOString().split('T')[0];
      const cohortWeek = this.getWeekStart(new Date(firstJourneyDate));
      const cohortKey = cohortWeek.toISOString().split('T')[0];
      
      if (!cohorts.has(cohortKey)) {
        cohorts.set(cohortKey, {
          cohortDate: cohortKey,
          users: new Set(),
          journeys: [],
          completionRate: 0,
          averageJourneyTime: 0,
          retentionRate: 0
        });
      }
      
      const cohort = cohorts.get(cohortKey);
      cohort.users.add(journey.userId);
      cohort.journeys.push(journey);
    }
    
    // حساب مقاييس المجموعة
    for (const cohort of cohorts.values()) {
      // معدل الإكمال
      const completedJourneys = cohort.journeys.filter(j => j.status === 'completed');
      cohort.completionRate = cohort.journeys.length > 0 
        ? (completedJourneys.length / cohort.journeys.length) * 100 
        : 0;
      
      // متوسط مدة الرحلة
      const totalDuration = completedJourneys.reduce((sum, j) => 
        sum + (j.endTime - j.startTime), 0);
      cohort.averageJourneyTime = completedJourneys.length > 0 
        ? totalDuration / completedJourneys.length 
        : 0;
      
      // معدل الاحتفاظ (المستخدمون الذين قاموا برحلات متعددة)
      const multiJourneyUsers = Array.from(cohort.users).filter(userId => {
        const userJourneys = cohort.journeys.filter(j => j.userId === userId);
        return userJourneys.length > 1;
      });
      
      cohort.retentionRate = cohort.users.size > 0 
        ? (multiJourneyUsers.length / cohort.users.size) * 100 
        : 0;
    }
    
    this.analytics.userCohorts = cohorts;
  }
  
  /**
   * الحصول على بداية الأسبوع
   */
  getWeekStart(date) {
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
  }
  
  /**
   * تحليل أنماط الانتقال
   */
  analyzeTransitionPatterns() {
    // يمكن إضافة تحليلات متقدمة لأنماط الانتقال
    // مثل أكثر الانتقالات شيوعاً، الانتقالات الأسرع، إلخ
  }
  
  /**
   * تحليل أنماط التفضيل
   */
  analyzePreferencePatterns() {
    // تحليل تفضيلات الأجهزة، المصادر، الأوقات، إلخ
  }
  
  /**
   * تحليل أداء قمع الرحلة
   */
  analyzeJourneyFunnelPerformance() {
    this.analytics.journeyFunnelPerformance.clear();
    
    for (const journeyDefinition of this.journeyDefinitions) {
      const funnelData = this.calculateFunnelData(journeyDefinition);
      this.analytics.journeyFunnelPerformance.set(journeyDefinition.id, funnelData);
    }
  }
  
  /**
   * حساب بيانات القمع
   */
  calculateFunnelData(journeyDefinition) {
    const journeys = Array.from(this.userJourneys.values())
      .filter(j => j.journeyId === journeyDefinition.id);
    
    if (journeys.length === 0) {
      return {
        journeyId: journeyDefinition.id,
        totalUsers: 0,
        funnelStages: [],
        conversionRate: 0
      };
    }
    
    const funnelStages = journeyDefinition.stages.map(stage => {
      const usersAtStage = journeys.filter(j => 
        j.completedStages.some(cs => cs.stageId === stage.stageId) ||
        j.currentStage > stage.order
      ).length;
      
      const dropOffUsers = journeys.length - usersAtStage;
      const stageConversionRate = journeys.length > 0 
        ? (usersAtStage / journeys.length) * 100 
        : 0;
      
      return {
        stageId: stage.stageId,
        stageName: stage.name,
        required: stage.required,
        order: stage.order,
        usersAtStage: usersAtStage,
        dropOffUsers: dropOffUsers,
        conversionRate: stageConversionRate
      };
    });
    
    const completedUsers = journeys.filter(j => j.status === 'completed').length;
    const conversionRate = journeys.length > 0 
      ? (completedUsers / journeys.length) * 100 
      : 0;
    
    return {
      journeyId: journeyDefinition.id,
      totalUsers: journeys.length,
      funnelStages: funnelStages,
      conversionRate: conversionRate
    };
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
    
    // تنظيف الرحلات القديمة
    for (const [journeyId, journey] of this.userJourneys.entries()) {
      if (journey.endTime && journey.endTime < cutoffTime) {
        this.userJourneys.delete(journeyId);
      }
    }
    
    // تنظيف بيانات الأحداث القديمة
    this.journeyEvents = this.journeyEvents.filter(e => e.timestamp > cutoffTime);
    
    // تنظيف البيانات المحفوظة
    if (this.config.enableDataExport) {
      this.cleanupStoredData(cutoffTime);
    }
    
    this.logger.info('Old journey data cleaned up', { 
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
      this.generateJourneyReport();
    }, this.config.reportInterval);
  }
  
  /**
   * توليد تقرير الرحلة
   */
  generateJourneyReport() {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        period: {
          start: new Date(Date.now() - this.config.reportInterval),
          end: new Date()
        },
        summary: {
          totalJourneys: this.analytics.totalJourneys,
          completedJourneys: this.analytics.completedJourneys,
          abandonedJourneys: this.analytics.abandonedJourneys,
          completionRate: this.analytics.completionRate,
          averageJourneyTime: this.analytics.averageJourneyTime
        },
        journeyPerformance: Object.fromEntries(this.analytics.journeyFunnelPerformance),
        commonPaths: this.getTopPaths(),
        dropOffPoints: this.getTopDropOffPoints(),
        crossDeviceUsage: Object.fromEntries(this.analytics.crossDeviceUsage),
        timePatterns: Object.fromEntries(this.analytics.timeBasedPatterns),
        cohortAnalysis: Array.from(this.analytics.userCohorts.values()),
        devicePatterns: Object.fromEntries(this.analytics.devicePathPatterns),
        recommendations: this.generateOptimizationRecommendations()
      };
      
      // حفظ التقرير
      if (this.config.enableDataExport) {
        this.saveJourneyReport(report);
      }
      
      // إطلاق أحداث
      this.emit('journeyReportGenerated', report);
      
      this.logger.info('Journey report generated', {
        totalJourneys: report.summary.totalJourneys,
        completionRate: report.summary.completionRate
      });
      
      return report;
      
    } catch (error) {
      this.logger.error('Error generating journey report', { error: error.message });
      return null;
    }
  }
  
  /**
   * الحصول على أفضل المسارات
   */
  getTopPaths() {
    return Array.from(this.analytics.commonPaths.entries())
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10)
      .map(([path, data]) => ({
        path: path,
        count: data.count,
        journeyType: data.journeyType,
        averageDuration: data.averageDuration,
        successRate: data.successRate
      }));
  }
  
  /**
   * الحصول على أفضل نقاط التسرب
   */
  getTopDropOffPoints() {
    return Array.from(this.analytics.dropOffPoints.entries())
      .sort(([,a], [,b]) => b.skips - a.skips)
      .slice(0, 10)
      .map(([key, data]) => ({
        stageId: data.stageId,
        stageName: data.stageName,
        skips: data.skips,
        completionRate: 100 - (data.skips / (data.completions + data.skips)) * 100,
        averageDuration: data.averageDuration
      }));
  }
  
  /**
   * توليد توصيات التحسين
   */
  generateOptimizationRecommendations() {
    const recommendations = [];
    
    // توصيات تحسين نقاط التسرب
    for (const [stageId, stageData] of this.analytics.dropOffPoints.entries()) {
      const skipRate = stageData.skips / (stageData.completions + stageData.skips);
      
      if (skipRate > 0.5) { // أكثر من 50% تخطي
        recommendations.push({
          type: 'high_drop_off',
          stageId: stageData.stageId,
          stageName: stageData.stageName,
          priority: 'high',
          message: `High drop-off rate at ${stageData.stageName}. Consider simplifying this step.`,
          metric: skipRate * 100,
          action: 'optimize_stage'
        });
      }
    }
    
    // توصيات تحسين الأجهزة
    const devicePatterns = Array.from(this.analytics.crossDeviceUsage.entries())
      .sort(([,a], [,b]) => b - a);
    
    if (devicePatterns.length > 0 && devicePatterns[0][1] > 10) {
      recommendations.push({
        type: 'cross_device_pattern',
        priority: 'medium',
        message: `Strong cross-device usage pattern detected. Consider improving cross-device continuity.`,
        pattern: devicePatterns[0][0],
        action: 'improve_cross_device'
      });
    }
    
    // توصيات تحسين التوقيت
    const timePatterns = Array.from(this.analytics.timeBasedPatterns.entries())
      .filter(([, data]) => data.completionRate < 30);
    
    if (timePatterns.length > 0) {
      recommendations.push({
        type: 'timing_optimization',
        priority: 'medium',
        message: 'Low completion rates at specific times. Consider optimizing user experience during these periods.',
        affectedTimes: timePatterns.slice(0, 3).map(([key, data]) => data),
        action: 'optimize_timing'
      });
    }
    
    return recommendations;
  }
  
  /**
   * حفظ تقرير الرحلة
   */
  saveJourneyReport(report) {
    const timestamp = report.timestamp.replace(/[:.]/g, '-');
    const filename = `journey_report_${timestamp}`;
    
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
        this.logger.error('Error saving journey report', { 
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
    
    csv += `Total Journeys,${report.summary.totalJourneys}\n`;
    csv += `Completed Journeys,${report.summary.completedJourneys}\n`;
    csv += `Abandoned Journeys,${report.summary.abandonedJourneys}\n`;
    csv += `Completion Rate,${report.summary.completionRate.toFixed(2)}%\n`;
    csv += `Average Journey Time,${(report.summary.averageJourneyTime / 1000 / 60).toFixed(2)} minutes\n`;
    
    return csv;
  }
  
  /**
   * بدء مراقبة التنبيهات
   */
  startAlertMonitoring() {
    setInterval(() => {
      this.checkJourneyAlerts();
    }, 5 * 60 * 1000); // كل 5 دقائق
  }
  
  /**
   * فحص تنبيهات الرحلة
   */
  checkJourneyAlerts() {
    try {
      // فحص معدلات التسرب العالية
      this.checkAbandonmentAlerts();
      
      // فحص انخفاض معدلات الإكمال
      this.checkCompletionRateAlerts();
      
      // فحص مشاكل الأداء
      this.checkPerformanceAlerts();
      
    } catch (error) {
      this.logger.error('Error checking journey alerts', { error: error.message });
    }
  }
  
  /**
   * فحص تنبيهات التسرب
   */
  checkAbandonmentAlerts() {
    for (const [journeyId, funnelData] of this.analytics.journeyFunnelPerformance.entries()) {
      for (const stage of funnelData.funnelStages) {
        const dropOffRate = (stage.dropOffUsers / funnelData.totalUsers) * 100;
        
        // فحص عتبات التسرب المحددة
        if (stage.stageId === 'add_to_cart' && dropOffRate > this.config.abandonmentThresholds.cartAbandonment) {
          this.emit('journeyAlert', {
            type: 'cart_abandonment',
            severity: 'warning',
            journeyId: journeyId,
            stage: stage.stageName,
            message: `High cart abandonment: ${dropOffRate.toFixed(1)}%`,
            metric: dropOffRate
          });
        }
        
        if (stage.stageId === 'checkout' && dropOffRate > this.config.abandonmentThresholds.checkoutAbandonment) {
          this.emit('journeyAlert', {
            type: 'checkout_abandonment',
            severity: 'critical',
            journeyId: journeyId,
            stage: stage.stageName,
            message: `High checkout abandonment: ${dropOffRate.toFixed(1)}%`,
            metric: dropOffRate
          });
        }
      }
    }
  }
  
  /**
   * فحص تنبيهات معدل الإكمال
   */
  checkCompletionRateAlerts() {
    for (const [journeyId, funnelData] of this.analytics.journeyFunnelPerformance.entries()) {
      if (funnelData.conversionRate < 20) { // أقل من 20% إكمال
        this.emit('journeyAlert', {
          type: 'low_completion_rate',
          severity: 'warning',
          journeyId: journeyId,
          message: `Low completion rate: ${funnelData.conversionRate.toFixed(1)}%`,
          metric: funnelData.conversionRate
        });
      }
    }
  }
  
  /**
   * فحص تنبيهات الأداء
   */
  checkPerformanceAlerts() {
    // فحص الرحلات البطيئة
    const slowJourneys = Array.from(this.userJourneys.values())
      .filter(j => j.status === 'active' && (Date.now() - j.lastActivity) > this.config.journeyTimeout / 2);
    
    if (slowJourneys.length > 0) {
      this.emit('journeyAlert', {
        type: 'slow_journeys',
        severity: 'info',
        message: `${slowJourneys.length} journeys taking unusually long time`,
        count: slowJourneys.length
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
      const reportFiles = files.filter(f => f.startsWith('journey_report_') && f.endsWith('.json'));
      
      if (reportFiles.length > 0) {
        const latestFile = reportFiles.sort().pop();
        const filepath = path.join(this.config.exportPath, latestFile);
        
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        this.logger.info('Loaded previous journey data', { file: latestFile });
      }
      
    } catch (error) {
      this.logger.error('Error loading stored journey data', { error: error.message });
    }
  }
  
  /**
   * الحصول على إحصائيات رحلة المستخدم الحالية
   */
  getCurrentJourneyStats() {
    this.updateOverallAnalytics();
    
    return {
      timestamp: new Date().toISOString(),
      activeJourneys: Array.from(this.userJourneys.values()).filter(j => j.status === 'active').length,
      totalJourneys: this.analytics.totalJourneys,
      completedJourneys: this.analytics.completedJourneys,
      abandonedJourneys: this.analytics.abandonedJourneys,
      completionRate: this.analytics.completionRate,
      averageJourneyTime: this.analytics.averageJourneyTime,
      topPaths: this.getTopPaths().slice(0, 5),
      dropOffPoints: this.getTopDropOffPoints().slice(0, 5),
      crossDevicePatterns: Object.entries(this.analytics.crossDeviceUsage)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
    };
  }
  
  /**
   * الحصول على تحليلات مفصلة لرحلة معينة
   */
  getJourneyAnalytics(journeyId) {
    const journeyDefinition = this.journeyMap.get(journeyId);
    if (!journeyDefinition) {
      return null;
    }
    
    const journeys = Array.from(this.userJourneys.values())
      .filter(j => j.journeyId === journeyId);
    
    if (journeys.length === 0) {
      return {
        journey: journeyDefinition,
        journeys: [],
        metrics: {
          totalJourneys: 0,
          completionRate: 0,
          averageJourneyTime: 0
        }
      };
    }
    
    const completedJourneys = journeys.filter(j => j.status === 'completed');
    const totalDuration = completedJourneys.reduce((sum, j) => 
      sum + (j.endTime - j.startTime), 0);
    
    return {
      journey: journeyDefinition,
      journeys: journeys.map(j => ({
        id: j.id,
        userId: j.userId,
        status: j.status,
        startTime: j.startTime,
        endTime: j.endTime,
        duration: j.endTime ? j.endTime - j.startTime : null,
        completedStages: j.completedStages.length,
        devices: j.devices,
        revenue: j.revenue
      })),
      metrics: {
        totalJourneys: journeys.length,
        completedJourneys: completedJourneys.length,
        completionRate: (completedJourneys.length / journeys.length) * 100,
        averageJourneyTime: completedJourneys.length > 0 
          ? totalDuration / completedJourneys.length 
          : 0,
        averageRevenue: journeys.length > 0 
          ? journeys.reduce((sum, j) => sum + j.revenue, 0) / journeys.length 
          : 0,
        crossDeviceUsage: journeys.filter(j => j.devices.length > 1).length
      },
      funnelData: this.analytics.journeyFunnelPerformance.get(journeyId),
      commonPaths: Array.from(this.analytics.commonPaths.entries())
        .filter(([, data]) => data.journeyType === journeyDefinition.type)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 5)
    };
  }
}

// تصدير الكلاس
module.exports = UserJourneyTracker;

// مثال على الاستخدام
if (require.main === module) {
  const journeyTracker = new UserJourneyTracker({
    enableCrossDeviceTracking: true,
    enablePathAnalysis: true,
    enableJourneyOptimization: true
  });
  
  // تسجيل مستمعي الأحداث
  journeyTracker.on('journeyStarted', (journey) => {
    console.log('Journey started:', journey.journeyType, journey.id);
  });
  
  journeyTracker.on('journeyCompleted', (journey, completionType) => {
    console.log('Journey completed:', journey.journeyType, completionType);
  });
  
  journeyTracker.on('journeyProgress', (journey, interaction) => {
    console.log('Journey progress:', interaction.stageId, interaction.type);
  });
  
  journeyTracker.on('journeyReportGenerated', (report) => {
    console.log('Journey report:', report.summary);
  });
  
  journeyTracker.on('journeyAlert', (alert) => {
    console.log('Journey alert:', alert.message);
  });
  
  // محاكاة رحلة المستخدم
  setTimeout(() => {
    // بدء رحلة شراء إلكترونية
    const journeyId = journeyTracker.trackJourneyStart({
      journeyId: 'ecommerce_purchase',
      userId: 'user123',
      sessionId: 'session123',
      deviceId: 'desktop_1',
      entrySource: 'google',
      entryMedium: 'organic',
      entryCampaign: 'summer_sale',
      context: {
        product: 'laptop',
        priceRange: '$500-1000'
      }
    });
    
    console.log('Journey ID:', journeyId);
    
  }, 1000);
  
  setTimeout(() => {
    // تتبع تقدم الرحلة
    journeyTracker.trackJourneyProgress('journey_id_here', {
      type: 'stage_complete',
      stageId: 'product_browse',
      stageOrder: 2,
      action: 'browse_products',
      duration: 30000,
      success: true,
      page: '/products',
      device: 'desktop_1'
    });
    
    journeyTracker.trackJourneyProgress('journey_id_here', {
      type: 'stage_complete',
      stageId: 'product_view',
      stageOrder: 3,
      action: 'view_product',
      duration: 15000,
      success: true,
      page: '/products/laptop-123',
      device: 'desktop_1'
    });
    
  }, 2000);
  
  setTimeout(() => {
    // إضافة إلى السلة
    journeyTracker.trackJourneyProgress('journey_id_here', {
      type: 'stage_complete',
      stageId: 'add_to_cart',
      stageOrder: 4,
      action: 'add_to_cart',
      duration: 5000,
      success: true,
      page: '/cart',
      device: 'desktop_1',
      properties: {
        productId: 'laptop-123',
        quantity: 1,
        price: 899.99
      }
    });
    
  }, 3000);
  
  // عرض الإحصائيات
  setInterval(() => {
    const stats = journeyTracker.getCurrentJourneyStats();
    console.log('Journey stats:', JSON.stringify(stats, null, 2));
  }, 15000);
  
  // إيقاف نظيفة
  setTimeout(() => {
    console.log('Shutting down journey tracker...');
    process.exit(0);
  }, 60000);
}