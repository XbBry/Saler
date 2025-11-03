# تكامل Meta Ads (Facebook & Instagram)

## نظرة عامة

يُوفر تكامل Meta Ads مع نظام سالير حلاً متكاملاً لإدارة الحملات الإعلانية على منصات Facebook و Instagram، مع تتبع الأداء وتحليل العائد على الاستثمار في الوقت الفعلي. هذا التكامل يتيح لك إدارة حملاتك الإعلانية بكفاءة عالية وتحويل البيانات إلى قرارات تسويقية ذكية.

## الميزات الرئيسية

### إدارة الحملات المتقدمة
- **إنشاء الحملات**: إنشاء وإدارة الحملات الإعلانية برمجياً
- **الاستهداف المتقدم**: استهداف دقيق بناءً على السلوك والاهتمامات
- **التحسين التلقائي**: تحسين الأداء تلقائياً باستخدام الذكاء الاصطناعي
- **اختبار A/B**: تشغيل تجارب متعددة الإصدارات للحملات

### تتبع الأحداث والتحويلات
- **تتبع المبيعات**: ربط المبيعات في سالير بحملات Meta Ads
- **تكلفة الاستحواذ**: حساب تكلفة اكتساب العملاء من كل حملة
- **العائد على الاستثمار**: حساب ROI و ROAS لكل حملة
- **مسار التحويل**: تتبع رحلة العميل من إعلان إلى عملية شراء

### إدارة الميزانيات والعروض
- **إدارة الميزانيات**: توزيع الميزانيات بذكاء بين الحملات
- **استراتيجيات العطاء**: تحسين استراتيجيات العطاء للتكلفة المستهدفة
- **الحدود التلقائية**: تعيين حدود تلقائية للإنفاق اليومي
- **توزيع الميزانية الذكي**: إعادة توزيع الميزانية حسب الأداء

### التحليلات والتقارير المتقدمة
- **تقارير الأداء**: تقارير شاملة عن أداء الحملات
- **تحليل الجمهور**: فهم عميق لسلوك العملاء
- **التوقعات**: توقعات مدعومة بالذكاء الاصطناعي
- **مقارنات الأداء**: مقارنة الحملات والجمهور والإعلانات

## الإعداد والتكوين

### الخطوة 1: إنشاء تطبيق Meta for Developers

```typescript
// إعدادات تطبيق Meta
interface MetaAppConfig {
  appId: string;
  appSecret: string;
  accessToken: string;
  pageId: string;
  adAccountId: string;
  webhookVerifyToken: string;
  permissions: MetaPermission[];
}

class MetaAppSetup {
  async createMetaApp(config: MetaAppConfig): Promise<MetaApplication> {
    // التحقق من الصلاحيات المطلوبة
    this.validateRequiredPermissions(config.permissions);
    
    // إنشاء التطبيق
    const app = await this.metaAPI.createApp({
      app_name: 'Saler Meta Ads Integration',
      app_id: config.appId,
      app_secret: config.appSecret,
      app_type: 'BUSINESS',
      category: 'BUSINESS',
      sub_category: 'Marketing'
    });

    // طلب الصلاحيات المطلوبة
    await this.requestAppPermissions(app.id, config.permissions);
    
    // الحصول على access token
    const accessToken = await this.generateAccessToken(app.id, app.app_secret);
    
    return {
      appId: app.id,
      appName: app.name,
      accessToken: accessToken.token,
      permissions: this.getGrantedPermissions(accessToken),
      verifiedAt: new Date()
    };
  }

  private validateRequiredPermissions(permissions: MetaPermission[]): void {
    const requiredPermissions = [
      'ads_management',
      'ads_read',
      'business_management',
      'pages_manage_ads',
      'pages_read_engagement',
      'instagram_basic',
      'instagram_manage_insights',
      'instagram_content_publish'
    ];

    const missingPermissions = requiredPermissions.filter(
      perm => !permissions.includes(perm)
    );

    if (missingPermissions.length > 0) {
      throw new Error(`صلاحيات مطلوبة مفقودة: ${missingPermissions.join(', ')}`);
    }
  }

  private async requestAppPermissions(appId: string, permissions: MetaPermission[]): Promise<void> {
    for (const permission of permissions) {
      await this.metaAPI.requestPermission(appId, permission, {
        business_use_case: 'ADVERTISING_AND_MARKETING',
        usage_description: 'Required for managing advertising campaigns and tracking conversions'
      });
    }
  }
}
```

### الخطوة 2: تكوين سالير مع Meta Ads

```typescript
// إعدادات تكامل Meta Ads في سالير
interface SalerMetaAdsIntegration {
  meta: {
    appId: string;
    appSecret: string;
    accessToken: string;
    adAccountId: string;
    pageId: string;
    webhookVerifyToken: string;
    apiVersion: string; // افتراضي: v18.0
  };
  tracking: {
    pixelId: string;    // معرف Facebook Pixel
    conversionEvents: string[]; // أحداث التحويل المراد تتبعها
    attributionModel: string; // نموذج الإسناد
    lookbackWindow: number; // نافذة البحث (بالأيام)
  };
  automation: {
    autoOptimization: boolean;
    autoBudgetOptimization: boolean;
    autoScaling: boolean;
    budgetAllocationStrategy: string;
    performanceThresholds: PerformanceThreshold[];
  };
  notifications: {
    campaignAlerts: boolean;
    budgetAlerts: boolean;
    performanceAlerts: boolean;
    thresholdAlerts: boolean;
  };
}

class MetaAdsIntegrationManager {
  private config: SalerMetaAdsIntegration;
  private metaAPI: MetaAdsAPI;
  private eventTracker: ConversionEventTracker;
  private campaignManager: CampaignManager;

  constructor(config: SalerMetaAdsIntegration) {
    this.config = config;
    this.metaAPI = new MetaAdsAPI(config.meta);
    this.eventTracker = new ConversionEventTracker(config.tracking);
    this.campaignManager = new CampaignManager(this.metaAPI);
  }

  async initializeIntegration(): Promise<IntegrationStatus> {
    try {
      // التحقق من صحة اتصال API
      await this.validateAPIConnection();
      
      // التحقق من صحة الحساب الإعلاني
      await this.validateAdAccount();
      
      // إعداد Facebook Pixel
      await this.setupFacebookPixel();
      
      // تكوين Webhooks
      await this.setupMetaWebhooks();
      
      // بدء تتبع الأحداث
      await this.startEventTracking();

      return {
        status: 'active',
        connection: 'healthy',
        pixelId: this.config.tracking.pixelId,
        adAccountId: this.config.meta.adAccountId,
        activeCampaigns: await this.getActiveCampaignsCount()
      };
    } catch (error) {
      return {
        status: 'error',
        connection: 'failed',
        error: error.message,
        activeCampaigns: 0
      };
    }
  }

  private async validateAPIConnection(): Promise<void> {
    try {
      // اختبار الاتصال بـ Meta Marketing API
      const accountInfo = await this.metaAPI.getAdAccount(this.config.meta.adAccountId);
      
      if (!accountInfo) {
        throw new Error('فشل في جلب معلومات الحساب الإعلاني');
      }

      // التحقق من الصلاحيات
      const permissions = await this.metaAPI.getAppPermissions();
      const requiredPermissions = [
        'ads_management',
        'ads_read',
        'business_management'
      ];

      const hasRequiredPermissions = requiredPermissions.every(perm =>
        permissions.includes(perm)
      );

      if (!hasRequiredPermissions) {
        throw new Error('الصلاحيات المطلوبة غير متوفرة');
      }

    } catch (error) {
      throw new Error(`فشل في التحقق من اتصال API: ${error.message}`);
    }
  }

  private async setupFacebookPixel(): Promise<void> {
    const pixelCode = `
      <!-- Facebook Pixel Code -->
      <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${this.config.tracking.pixelId}');
        fbq('track', 'PageView');
      </script>
      <noscript>
        <img height="1" width="1" style="display:none"
             src="https://www.facebook.com/tr?id=${this.config.tracking.pixelId}&ev=PageView&noscript=1"/>
      </noscript>
      <!-- End Facebook Pixel Code -->
    `;

    await this.injectPixelCode(pixelCode);
    
    // إعداد أحداث التحويل المخصصة
    await this.setupConversionEvents();
  }
}
```

## إدارة الحملات الإعلانية

### إنشاء الحملات

```typescript
class CampaignManagementService {
  async createCampaign(campaignData: CampaignData): Promise<MetaCampaign> {
    // تجهيز بيانات الحملة
    const campaign = await this.prepareCampaignData(campaignData);
    
    // إنشاء الحملة في Meta
    const createdCampaign = await this.metaAPI.createCampaign({
      name: campaign.name,
      objective: campaign.objective,
      status: campaign.status,
      buying_type: campaign.buyingType,
      special_ad_categories: campaign.specialAdCategories || [],
      daily_budget: campaign.dailyBudget,
      budget_optimization: campaign.budgetOptimization,
      learning_stage: campaign.learningStage,
      adset_delivery_optimization: campaign.deliveryOptimization
    });

    // إنشاء مجموعات الإعلانات
    const adSets = await this.createAdSets(createdCampaign.id, campaign.adSets);
    
    // إنشاء الإعلانات
    const ads = await this.createAds(adSets, campaign.ads);
    
    return {
      ...createdCampaign,
      adSets: adSets,
      ads: ads,
      trackingId: this.generateTrackingId(),
      createdAt: new Date()
    };
  }

  private async prepareCampaignData(campaignData: CampaignData): Promise<PreparedCampaignData> {
    return {
      name: this.generateCampaignName(campaignData),
      objective: this.mapObjective(campaignData.goal),
      status: 'PAUSED', // البدء في وضع الإيقاف للمراجعة
      buyingType: campaignData.bidType || 'AUCTION',
      dailyBudget: this.calculateDailyBudget(campaignData.totalBudget),
      budgetOptimization: campaignData.autoOptimizeBudget,
      deliveryOptimization: this.determineDeliveryOptimization(campaignData.goal),
      learningStage: this.determineLearningStage(campaignData),
      specialAdCategories: this.getSpecialAdCategories(campaignData.category)
    };
  }

  async createAdSets(campaignId: string, adSetConfigs: AdSetConfig[]): Promise<MetaAdSet[]> {
    const adSets: MetaAdSet[] = [];

    for (const config of adSetConfigs) {
      const adSet = await this.metaAPI.createAdSet({
        campaign_id: campaignId,
        name: config.name,
        billing_event: config.billingEvent,
        optimization_goal: config.optimizationGoal,
        bid_strategy: config.bidStrategy,
        daily_budget: config.dailyBudget,
        total_budget: config.totalBudget,
        bid_amount: config.bidAmount,
        optimization_subevent: config.optimizationSubevent,
        attribution_spec: config.attributionSpec,
        start_time: config.startTime,
        end_time: config.endTime,
        lifetime_budget: config.lifetimeBudget,
        pacing_type: config.pacingType,
        learning_stage: config.learningStage,
        // استهداف الجمهور
        targeting: await this.buildTargetingSpec(config.targeting),
        // وضع التسليم
        delivery_type: config.deliveryType || 'STANDARD',
        frequency_cap: config.frequencyCap,
        frequency_cap_reset_period: config.frequencyCapResetPeriod,
        // الشبكات والمنصات
        facebook_positions: config.facebookPositions,
        instagram_positions: config.instagramPositions
      });

      adSets.push(adSet);
    }

    return adSets;
  }

  private async buildTargetingSpec(targeting: TargetingConfig): Promise<TargetingSpec> {
    return {
      geo_locations: targeting.geoLocations,
      age_min: targeting.ageMin,
      age_max: targeting.ageMax,
      genders: targeting.genders,
      // استهداف الاهتمامات
      interests: targeting.interests,
      // استهداف السلوكيات
      behaviors: targeting.behaviors,
      // استبعاد الجمهور
      excluded_connections: targeting.excludedConnections,
      // الجمهور المخصص
      custom_audiences: targeting.customAudiences,
      // الجمهور المشابه
      lookalike_audiences: targeting.lookalikeAudiences,
      // إعدادات متقدمة
      device_platforms: targeting.devicePlatforms,
      connection_type: targeting.connectionTypes,
      // توقيت النشر
      time_windows: targeting.timeWindows,
      // الحد الأدنى والعمر
      user_os: targeting.userOS,
      user_device: targeting.userDevice
    };
  }
}
```

### إدارة جمهور مخصص

```typescript
class CustomAudienceService {
  async createCustomAudience(audienceData: CustomAudienceData): Promise<CustomAudience> {
    const audience = await this.metaAPI.createCustomAudience({
      name: audienceData.name,
      description: audienceData.description,
      subtype: 'CUSTOM',
      customer_file_source: audienceData.dataSource,
      // بيانات العملاء
      email: audienceData.emails,
      phone: audienceData.phoneNumbers,
      external_id: audienceData.externalIds,
      // معلومات إضافية
      data_source: {
        type: audienceData.dataSource,
        hash_method: 'sha256',
        is_raw: false
      }
    });

    return {
      id: audience.id,
      name: audience.name,
      subtype: audience.subtype,
      approximate_count_lower_bound: audience.approximate_count_lower_bound,
      approximate_count_upper_bound: audience.approximate_count_upper_bound,
      data_source_types: audience.data_source_types,
      createdAt: new Date()
    };
  }

  async createLookalikeAudience(sourceAudienceId: string, config: LookalikeConfig): Promise<LookalikeAudience> {
    const lookalike = await this.metaAPI.createLookalikeAudience({
      name: config.name,
      origin_audience_id: sourceAudienceId,
      subtype: 'LOOKALIKE',
      country: config.country,
      ratio: config.ratio,
      size: config.size,
      // إعدادات الجودة
      similarity_distribution: config.similarityDistribution,
      origin_counts: config.originCounts,
      // قيود إضافية
      min_distance: config.minDistance,
      max_distance: config.maxDistance
    });

    return {
      id: lookalike.id,
      name: lookalike.name,
      status: lookalike.status,
      approximate_count: lookalike.approximate_count,
      ratio: lookalike.ratio,
      origin_audience_id: sourceAudienceId,
      createdAt: new Date()
    };
  }

  async updateAudienceWithCustomers(audienceId: string, customers: Customer[]): Promise<void> {
    // تجهيز بيانات العملاء للتحديث
    const customerData = customers.map(customer => ({
      email: customer.email ? this.hashEmail(customer.email) : null,
      phone: customer.phone ? this.hashPhone(customer.phone) : null,
      external_id: customer.externalId,
      first_name: customer.firstName,
      last_name: customer.lastName
    })).filter(data => data.email || data.phone || data.external_id);

    if (customerData.length > 0) {
      await this.metaAPI.addUsersToAudience(audienceId, {
        users: customerData,
        schema: ['EMAIL', 'PHONE', 'EXTERNAL_ID', 'FIRST_NAME', 'LAST_NAME'],
        hash_method: 'sha256'
      });
    }
  }

  async syncCustomerSegment(audienceName: string, segmentType: CustomerSegment): Promise<void> {
    let audience: CustomAudience;
    
    // البحث عن الجمهور أو إنشاؤه
    const existingAudience = await this.findAudienceByName(audienceName);
    
    if (existingAudience) {
      audience = existingAudience;
    } else {
      audience = await this.createCustomAudience({
        name: audienceName,
        description: `جمهور مخصص من سالير - ${segmentType}`,
        dataSource: 'CUSTOMER_LIST',
        emails: [],
        phoneNumbers: [],
        externalIds: []
      });
    }

    // جلب العملاء حسب النوع
    const customers = await this.getCustomersBySegment(segmentType);
    
    // تحديث الجمهور
    await this.updateAudienceWithCustomers(audience.id, customers);
    
    // تحديث إحصائيات الجمهور
    await this.refreshAudienceStatistics(audience.id);
  }

  private async getCustomersBySegment(segmentType: CustomerSegment): Promise<Customer[]> {
    switch (segmentType) {
      case 'high_value':
        return this.customerService.getHighValueCustomers({
          minLifetimeValue: 1000,
          lastOrderDays: 90
        });
        
      case 'frequent_buyers':
        return this.customerService.getFrequentBuyers({
          minOrders: 3,
          daysWindow: 180
        });
        
      case 'recent_customers':
        return this.customerService.getRecentCustomers({
          daysSinceLastOrder: 30,
          minOrders: 1
        });
        
      case 'abandoned_cart':
        return this.orderService.getAbandonedCarts({
          daysSinceAbandoned: 7,
          minCartValue: 100
        });
        
      default:
        return [];
    }
  }
}
```

## تتبع التحويلات والأحداث

### نظام تتبع التحويلات

```typescript
class ConversionTrackingService {
  async trackPurchaseEvent(orderData: Order): Promise<void> {
    const eventData = {
      event_name: 'Purchase',
      event_time: Math.floor(orderData.createdAt.getTime() / 1000),
      action_source: 'website',
      event_source_url: orderData.source || '',
      event_id: this.generateEventId(),
      // بيانات المستخدم
      user_data: {
        em: this.hashEmail(orderData.customerEmail),
        client_ip_address: orderData.clientIP,
        client_user_agent: orderData.userAgent,
        fbc: this.getFacebookClickId(),
        fbp: this.getFacebookPixelId()
      },
      // بيانات الحدث المخصصة
      custom_data: {
        currency: orderData.currency,
        value: orderData.total,
        content_ids: orderData.items.map(item => `product_${item.productId}`),
        content_type: 'product',
        contents: orderData.items.map(item => ({
          id: item.productId,
          quantity: item.quantity,
          item_price: item.price
        }))
      },
      // بيانات المتجر
      data_processing_options: ['LDU'],
      data_processing_options_country: 0,
      data_processing_options_state: 0
    };

    await this.sendConversionEvent(eventData);
  }

  async trackAddToCartEvent(cartData: CartData): Promise<void> {
    const eventData = {
      event_name: 'AddToCart',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: cartData.pageUrl,
      event_id: this.generateEventId(),
      
      user_data: {
        em: cartData.userEmail ? this.hashEmail(cartData.userEmail) : undefined,
        client_ip_address: cartData.clientIP,
        client_user_agent: cartData.userAgent,
        fbc: this.getFacebookClickId(),
        fbp: this.getFacebookPixelId()
      },
      
      custom_data: {
        currency: cartData.currency,
        value: cartData.total,
        content_ids: cartData.items.map(item => `product_${item.productId}`),
        content_type: 'product',
        contents: cartData.items.map(item => ({
          id: item.productId,
          quantity: item.quantity,
          item_price: item.price
        }))
      }
    };

    await this.sendConversionEvent(eventData);
  }

  async trackLeadEvent(leadData: LeadData): Promise<void> {
    const eventData = {
      event_name: 'Lead',
      event_time: Math.floor(leadData.timestamp.getTime() / 1000),
      action_source: 'website',
      event_source_url: leadData.pageUrl,
      event_id: this.generateEventId(),
      
      user_data: {
        em: leadData.email ? this.hashEmail(leadData.email) : undefined,
        phone: leadData.phone ? this.hashPhone(leadData.phone) : undefined,
        client_ip_address: leadData.clientIP,
        client_user_agent: leadData.userAgent,
        fbc: this.getFacebookClickId(),
        fbp: this.getFacebookPixelId()
      },
      
      custom_data: {
        content_name: leadData.formName,
        content_category: leadData.category,
        value: leadData.estimatedValue
      }
    };

    await this.sendConversionEvent(eventData);
  }

  private async sendConversionEvent(eventData: ConversionEventData): Promise<void> {
    try {
      // إرسال الحدث إلى Meta
      await this.metaAPI.sendEvent(eventData);
      
      // حفظ نسخة محلية للتتبع
      await this.saveConversionEvent({
        ...eventData,
        sentAt: new Date(),
        status: 'sent'
      });
      
      // تحديث تحليلات الأداء
      await this.updateConversionAnalytics(eventData);
      
    } catch (error) {
      // حفظ للذاكرة المؤقتة لإعادة الإرسال
      await this.cacheFailedEvent(eventData);
      
      throw error;
    }
  }
}
```

### ربط المبيعات بالحملات

```typescript
class SalesCampaignAttributionService {
  async attributeSaleToCampaign(order: Order): Promise<AttributionResult> {
    // استخراج معلومات الإسناد من الطلب
    const attributionData = this.extractAttributionData(order);
    
    // البحث عن الحملة المرتبطة
    const campaign = await this.findAttributedCampaign(attributionData);
    
    if (!campaign) {
      return {
        orderId: order.id,
        attribution: 'direct',
        campaignId: null,
        attributionTime: new Date()
      };
    }

    // حساب قيمة التحويل المعزوة
    const attributedValue = this.calculateAttributedValue(order, attributionData);
    
    // تحديث إحصائيات الحملة
    await this.updateCampaignAttributionStats(campaign.id, {
      orderId: order.id,
      attributedValue: attributedValue,
      attributionTime: new Date(),
      attributionModel: attributionData.model
    });

    return {
      orderId: order.id,
      attribution: 'campaign',
      campaignId: campaign.id,
      attributedValue: attributedValue,
      attributionTime: new Date(),
      attributionModel: attributionData.model
    };
  }

  private extractAttributionData(order: Order): AttributionData {
    return {
      // استخراج معرفات UTM
      utm_source: order.metadata?.utm_source,
      utm_medium: order.metadata?.utm_medium,
      utm_campaign: order.metadata?.utm_campaign,
      utm_content: order.metadata?.utm_content,
      utm_term: order.metadata?.utm_term,
      
      // معرفات Facebook
      fbclid: order.metadata?.fbclid,
      fbc: order.metadata?.fbc,
      fbp: order.metadata?.fbp,
      
      // معلومات الجلسة
      referrer: order.metadata?.referrer,
      landingPage: order.metadata?.landing_page,
      sessionDuration: order.metadata?.session_duration,
      
      // نموذج الإسناد
      model: this.determineAttributionModel(order)
    };
  }

  private async findAttributedCampaign(attributionData: AttributionData): Promise<MetaCampaign | null> {
    // البحث باستخدام UTM parameters
    if (attributionData.utm_campaign) {
      return await this.findCampaignByUtmCampaign(attributionData.utm_campaign);
    }
    
    // البحث باستخدام Facebook Click ID
    if (attributionData.fbc) {
      return await this.findCampaignByClickId(attributionData.fbc);
    }
    
    // البحث في آخر الحملات النشطة
    return await this.findRecentActiveCampaign(attributionData);
  }

  private async updateCampaignAttributionStats(campaignId: string, stats: CampaignAttributionStats): Promise<void> {
    // تحديث في Meta Ads
    await this.metaAPI.updateCampaignConversionStats(campaignId, {
      conversions: 1,
      conversion_value: stats.attributedValue,
      cost_per_conversion: stats.attributedValue // سيتم حسابها لاحقاً
    });
    
    // تحديث في سالير
    await this.campaignAnalyticsService.recordAttribution(campaignId, stats);
    
    // تحديث ROI calculations
    await this.updateCampaignROI(campaignId);
  }

  async generateAttributionReport(dateRange: DateRange): Promise<AttributionReport> {
    const campaigns = await this.getActiveCampaigns(dateRange);
    const attributionData = await this.getAttributionData(dateRange);
    
    const report = {
      period: dateRange,
      generatedAt: new Date(),
      campaigns: campaigns.map(campaign => ({
        ...campaign,
        attribution: this.calculateCampaignAttribution(campaign, attributionData),
        roi: this.calculateCampaignROI(campaign, attributionData),
        conversionRate: this.calculateConversionRate(campaign, attributionData),
        costPerConversion: this.calculateCostPerConversion(campaign, attributionData)
      })),
      totalAttributedRevenue: this.calculateTotalAttributedRevenue(attributionData),
      overallAttributionRate: this.calculateOverallAttributionRate(attributionData)
    };
    
    return report;
  }
}
```

## تحليلات وتقارير الأداء

### لوحة تحكم شاملة

```typescript
class MetaAdsAnalyticsDashboard {
  async generatePerformanceDashboard(dateRange: DateRange): Promise<MetaAdsDashboard> {
    const [
      campaignMetrics,
      audienceMetrics,
      creativeMetrics,
      costAnalysis
    ] = await Promise.all([
      this.getCampaignPerformanceMetrics(dateRange),
      this.getAudienceInsights(dateRange),
      this.getCreativePerformanceMetrics(dateRange),
      this.getCostAnalysis(dateRange)
    ]);

    return {
      period: dateRange,
      generatedAt: new Date(),
      overview: {
        totalSpend: campaignMetrics.totalSpend,
        totalImpressions: campaignMetrics.totalImpressions,
        totalClicks: campaignMetrics.totalClicks,
        totalConversions: campaignMetrics.totalConversions,
        averageCTR: campaignMetrics.averageCTR,
        averageCPC: campaignMetrics.averageCPC,
        averageCPM: campaignMetrics.averageCPM,
        overallROAS: campaignMetrics.overallROAS
      },
      campaigns: campaignMetrics,
      audiences: audienceMetrics,
      creatives: creativeMetrics,
      costAnalysis: costAnalysis,
      insights: await this.generatePerformanceInsights({
        campaigns: campaignMetrics,
        audiences: audienceMetrics,
        costAnalysis: costAnalysis
      }),
      recommendations: await this.generateOptimizationRecommendations({
        campaigns: campaignMetrics,
        audienceMetrics: audienceMetrics
      })
    };
  }

  private async getCampaignPerformanceMetrics(dateRange: DateRange): Promise<CampaignPerformanceMetrics> {
    const campaigns = await this.metaAPI.getCampaigns({
      date_preset: this.dateRangeToPreset(dateRange),
      level: 'campaign',
      breakdowns: ['campaign_id', 'campaign_name']
    });

    return {
      campaigns: campaigns.data.map(campaign => ({
        id: campaign.campaign_id,
        name: campaign.campaign_name,
        spend: parseFloat(campaign.spend),
        impressions: parseInt(campaign.impressions),
        clicks: parseInt(campaign.clicks),
        conversions: parseInt(campaign.conversions),
        conversionValue: parseFloat(campaign.conversion_values),
        ctr: parseFloat(campaign.ctr),
        cpc: parseFloat(campaign.cpc),
        cpm: parseFloat(campaign.cpm),
        roas: campaign.conversion_values > 0 
          ? parseFloat(campaign.conversion_values) / parseFloat(campaign.spend)
          : 0,
        frequency: parseFloat(campaign.frequency)
      })),
      totalSpend: campaigns.data.reduce((sum, c) => sum + parseFloat(c.spend), 0),
      totalImpressions: campaigns.data.reduce((sum, c) => sum + parseInt(c.impressions), 0),
      totalClicks: campaigns.data.reduce((sum, c) => sum + parseInt(campaign.clicks || '0'), 0),
      totalConversions: campaigns.data.reduce((sum, c) => sum + parseInt(c.conversions || '0'), 0),
      averageCTR: campaigns.data.length > 0 
        ? campaigns.data.reduce((sum, c) => sum + parseFloat(c.ctr), 0) / campaigns.data.length
        : 0,
      averageCPC: campaigns.data.length > 0
        ? campaigns.data.reduce((sum, c) => sum + parseFloat(c.cpc), 0) / campaigns.data.length
        : 0,
      averageCPM: campaigns.data.length > 0
        ? campaigns.data.reduce((sum, c) => sum + parseFloat(c.cpm), 0) / campaigns.data.length
        : 0,
      overallROAS: this.calculateOverallROAS(campaigns.data)
    };
  }

  private async getAudienceInsights(dateRange: DateRange): Promise<AudienceInsights> {
    const insights = await this.metaAPI.getInsights({
      date_preset: this.dateRangeToPreset(dateRange),
      level: 'adset',
      breakdowns: ['age', 'gender', 'country', 'region', 'device_platform']
    });

    return {
      demographics: this.analyzeDemographics(insights.data),
      geographic: this.analyzeGeographicDistribution(insights.data),
      deviceUsage: this.analyzeDeviceUsage(insights.data),
      audienceSegments: await this.analyzeAudienceSegments(dateRange)
    };
  }

  private analyzeDemographics(data: MetaInsights[]): DemographicAnalysis {
    const ageGroups = new Map<string, { impressions: number; clicks: number; conversions: number }>();
    const genders = new Map<string, { impressions: number; clicks: number; conversions: number }>();

    data.forEach(item => {
      // تحليل الفئات العمرية
      if (item.age) {
        const current = ageGroups.get(item.age) || { impressions: 0, clicks: 0, conversions: 0 };
        ageGroups.set(item.age, {
          impressions: current.impressions + parseInt(item.impressions || '0'),
          clicks: current.clicks + parseInt(item.clicks || '0'),
          conversions: current.conversions + parseInt(item.conversions || '0')
        });
      }

      // تحليل النوع الاجتماعي
      if (item.gender) {
        const current = genders.get(item.gender) || { impressions: 0, clicks: 0, conversions: 0 };
        genders.set(item.gender, {
          impressions: current.impressions + parseInt(item.impressions || '0'),
          clicks: current.clicks + parseInt(item.clicks || '0'),
          conversions: current.conversions + parseInt(item.conversions || '0')
        });
      }
    });

    return {
      ageDistribution: Array.from(ageGroups.entries()).map(([age, data]) => ({
        age,
        impressions: data.impressions,
        clicks: data.clicks,
        conversions: data.conversions,
        conversionRate: data.impressions > 0 ? (data.conversions / data.impressions) * 100 : 0
      })),
      genderDistribution: Array.from(genders.entries()).map(([gender, data]) => ({
        gender,
        impressions: data.impressions,
        clicks: data.clicks,
        conversions: data.conversions,
        conversionRate: data.impressions > 0 ? (data.conversions / data.impressions) * 100 : 0
      }))
    };
  }
}
```

### تحسين الأداء التلقائي

```typescript
class AutoOptimizationService {
  async optimizeCampaigns(optimizationCriteria: OptimizationCriteria): Promise<OptimizationResults[]> {
    const campaigns = await this.getUnderperformingCampaigns(optimizationCriteria);
    const results: OptimizationResults[] = [];

    for (const campaign of campaigns) {
      try {
        // تحليل سبب ضعف الأداء
        const analysis = await this.analyzeCampaignPerformance(campaign);
        
        // تطبيق تحسينات مناسبة
        const optimizations = await this.applyOptimizations(campaign, analysis);
        
        // مراقبة النتائج
        const result = await this.monitorOptimizationResults(optimizations);
        
        results.push({
          campaignId: campaign.id,
          optimizations: optimizations,
          result: result,
          successRate: result.successfulOptimizations / optimizations.length
        });
        
      } catch (error) {
        results.push({
          campaignId: campaign.id,
          optimizations: [],
          result: { success: false, error: error.message },
          successRate: 0
        });
      }
    }

    return results;
  }

  private async analyzeCampaignPerformance(campaign: MetaCampaign): Promise<CampaignAnalysis> {
    const [performance, audience, creative, bidding] = await Promise.all([
      this.getDetailedPerformance(campaign.id),
      this.getAudienceAnalysis(campaign.id),
      this.getCreativeAnalysis(campaign.id),
      this.getBiddingAnalysis(campaign.id)
    ]);

    return {
      performance: {
        spend: performance.spend,
        impressions: performance.impressions,
        clicks: performance.clicks,
        conversions: performance.conversions,
        ctr: performance.ctr,
        cpc: performance.cpc,
        conversionRate: performance.conversionRate,
        frequency: performance.frequency,
        wearOut: performance.frequency > 3 // ترهل بعد التكرار أكثر من 3 مرات
      },
      audience: {
        reach: audience.totalReach,
        relevanceScore: audience.averageRelevanceScore,
        saturation: audience.saturationLevel,
        lookalikePerformance: audience.lookalikePerformance
      },
      creative: {
        creativeVariants: creative.variants,
        topPerformingCreative: creative.topPerforming,
        fatigueScore: creative.fatigueScore,
        ctrByCreative: creative.ctrByCreative
      },
      bidding: {
        currentBid: bidding.averageBid,
        suggestedBid: bidding.suggestedBid,
        competitiveness: bidding.competitiveness,
        efficiency: bidding.efficiency
      }
    };
  }

  private async applyOptimizations(campaign: MetaCampaign, analysis: CampaignAnalysis): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];

    // تحسين الميزانية
    if (analysis.performance.conversionRate < 0.5 && analysis.performance.spend < campaign.dailyBudget * 0.8) {
      optimizations.push({
        type: 'budget_increase',
        parameter: 'daily_budget',
        currentValue: campaign.dailyBudget,
        suggestedValue: campaign.dailyBudget * 1.2,
        reasoning: 'زيادة الميزانية لتحسين الوصول'
      });
    }

    // تحسين الاستهداف
    if (analysis.audience.relevanceScore < 6) {
      const newTargeting = await this.suggestBetterTargeting(campaign, analysis);
      optimizations.push({
        type: 'targeting_update',
        parameter: 'targeting',
        currentValue: campaign.targeting,
        suggestedValue: newTargeting,
        reasoning: 'تحسين الاستهداف لزيادة ملاءمة الجمهور'
      });
    }

    // تحديث الإعلانات
    if (analysis.creative.fatigueScore > 0.7) {
      const newCreatives = await this.suggestNewCreatives(campaign);
      optimizations.push({
        type: 'creative_refresh',
        parameter: 'ads',
        currentValue: campaign.ads,
        suggestedValue: newCreatives,
        reasoning: 'تحديث الإعلانات للحد من إرهاق الجمهور'
      });
    }

    // تعديل استراتيجية العطاء
    if (analysis.bidding.competitiveness === 'low' && analysis.performance.cpc < campaign.targetCpc) {
      optimizations.push({
        type: 'bid_strategy',
        parameter: 'bid_strategy',
        currentValue: campaign.bidStrategy,
        suggestedValue: 'LOWEST_COST_WITHOUT_CAP',
        reasoning: 'تحسين استراتيجية العطاء لزيادة الكفاءة'
      });
    }

    return optimizations;
  }

  async implementAutoScaling(): Promise<void> {
    const campaigns = await this.getSuccessfulCampaigns();
    
    for (const campaign of campaigns) {
      try {
        // تحليل إمكانية التوسع
        const scalability = await this.analyzeScalability(campaign);
        
        if (scalability.canScale) {
          // زيادة الميزانية تدريجياً
          const scaleFactor = this.calculateScaleFactor(scalability);
          const newBudget = campaign.dailyBudget * (1 + scaleFactor);
          
          // تطبيق الزيادة
          await this.metaAPI.updateCampaign(campaign.id, {
            daily_budget: newBudget
          });
          
          // تسجيل عملية التوسع
          await this.logScalingActivity(campaign.id, {
            oldBudget: campaign.dailyBudget,
            newBudget: newBudget,
            scaleFactor: scaleFactor,
            reasoning: scalability.reasoning,
            timestamp: new Date()
          });
          
          // مراقبة الأداء بعد التوسع
          await this.monitorScalingResults(campaign.id, newBudget);
        }
        
      } catch (error) {
        await this.logScalingError(campaign.id, error);
      }
    }
  }
}
```

## إدارة الميزانيات

```typescript
class BudgetManagementService {
  async optimizeBudgetAllocation(dateRange: DateRange): Promise<BudgetAllocationPlan> {
    // جلب أداء جميع الحملات
    const campaigns = await this.getCampaignPerformance(dateRange);
    
    // تحليل أداء كل حملة
    const performanceAnalysis = campaigns.map(campaign => ({
      campaign: campaign,
      efficiency: this.calculateEfficiencyScore(campaign),
      profitability: this.calculateProfitabilityScore(campaign),
      scalability: this.assessScalability(campaign),
      riskLevel: this.assessRiskLevel(campaign)
    }));

    // تصنيف الحملات
    const categories = this.categorizeCampaigns(performanceAnalysis);
    
    // إنشاء خطة توزيع الميزانية
    const allocationPlan = await this.createBudgetAllocationPlan(categories, dateRange);
    
    // تطبيق التوزيع
    await this.implementBudgetAllocation(allocationPlan);
    
    return allocationPlan;
  }

  private calculateEfficiencyScore(campaign: CampaignPerformance): number {
    const weights = {
      roas: 0.3,
      conversionRate: 0.25,
      ctr: 0.2,
      frequency: 0.15,
      relevanceScore: 0.1
    };

    const normalizedScores = {
      roas: this.normalizeROAS(campaign.roas),
      conversionRate: this.normalizeConversionRate(campaign.conversionRate),
      ctr: this.normalizeCTR(campaign.ctr),
      frequency: this.normalizeFrequency(campaign.frequency),
      relevanceScore: this.normalizeRelevanceScore(campaign.relevanceScore)
    };

    return Object.entries(weights).reduce((score, [metric, weight]) => {
      return score + (normalizedScores[metric] * weight);
    }, 0);
  }

  private categorizeCampaigns(analysis: PerformanceAnalysis[]): CampaignCategories {
    return {
      topPerformers: analysis.filter(c => c.efficiency > 0.8 && c.profitability > 0.7),
      goodPerformers: analysis.filter(c => c.efficiency > 0.6 && c.profitability > 0.5),
      averagePerformers: analysis.filter(c => c.efficiency > 0.4 && c.profitability > 0.3),
      poorPerformers: analysis.filter(c => c.efficiency <= 0.4 || c.profitability <= 0.3)
    };
  }

  private async createBudgetAllocationPlan(categories: CampaignCategories, dateRange: DateRange): Promise<BudgetAllocationPlan> {
    const totalBudget = await this.getTotalBudget(dateRange);
    
    return {
      planId: generateUniqueId(),
      period: dateRange,
      totalBudget: totalBudget,
      allocations: {
        topPerformers: {
          percentage: 50,
          amount: totalBudget * 0.5,
          campaigns: categories.topPerformers.map(c => ({
            campaignId: c.campaign.id,
            allocatedAmount: (totalBudget * 0.5) / categories.topPerformers.length,
            reasoning: 'أداء ممتاز - زيادة الاستثمار'
          }))
        },
        goodPerformers: {
          percentage: 30,
          amount: totalBudget * 0.3,
          campaigns: categories.goodPerformers.map(c => ({
            campaignId: c.campaign.id,
            allocatedAmount: (totalBudget * 0.3) / categories.goodPerformers.length,
            reasoning: 'أداء جيد - استثمار مستقر'
          }))
        },
        averagePerformers: {
          percentage: 15,
          amount: totalBudget * 0.15,
          campaigns: categories.averagePerformers.map(c => ({
            campaignId: c.campaign.id,
            allocatedAmount: (totalBudget * 0.15) / categories.averagePerformers.length,
            reasoning: 'أداء متوسط - مراقبة وتحسين'
          }))
        },
        poorPerformers: {
          percentage: 5,
          amount: totalBudget * 0.05,
          campaigns: categories.poorPerformers.map(c => ({
            campaignId: c.campaign.id,
            allocatedAmount: (totalBudget * 0.05) / categories.poorPerformers.length,
            reasoning: 'أداء ضعيف - ميزانية محدودة للاختبار'
          }))
        }
      },
      constraints: {
        minBudgetPerCampaign: 10,
        maxBudgetIncrease: 2.0, // 200% maximum increase
        maxBudgetDecrease: 0.5, // 50% maximum decrease
        scalingThreshold: 0.8
      },
      createdAt: new Date()
    };
  }
}
```

هذا المستند يقدم دليلاً شاملاً لتكامل Meta Ads مع نظام سالير، يغطي جميع الجوانب من الإعداد الأولي إلى إدارة الحملات المتقدمة وتحليل الأداء.