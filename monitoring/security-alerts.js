/**
 * نظام تنبيهات الأمان
 * Security Alerts System
 */

const EventEmitter = require('events');
const winston = require('winston');
const nodemailer = require('nodemailer');
const axios = require('axios');
const Slack = require('@slack/web-api');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityAlertSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // إعدادات التنبيهات
      alertChannels: config.alertChannels || ['console', 'log'],
      email: config.email || {},
      slack: config.slack || {},
      webhook: config.webhook || {},
      sms: config.sms || {},
      
      // إعدادات التصفية
      severityLevels: config.severityLevels || ['low', 'medium', 'high', 'critical'],
      alertTypes: config.alertTypes || [
        'intrusion_attempt', 'malware_detected', 'data_breach', 
        'privilege_escalation', 'network_attack', 'authentication_failure'
      ],
      
      // إعدادات التجميع
      enableGrouping: config.enableGrouping !== false,
      groupingWindow: config.groupingWindow || 300, // 5 minutes
      maxAlertsPerGroup: config.maxAlertsPerGroup || 10,
      
      // إعدادات التقييد
      rateLimit: config.rateLimit || {
        enabled: true,
        maxAlerts: 100,
        timeWindow: 3600 // 1 hour
      },
      
      // إعدادات التخصيص
      customFilters: config.customFilters || [],
      alertTemplates: config.alertTemplates || {},
      
      // إعدادات التصدير
      enableExport: config.enableExport !== false,
      exportPath: config.exportPath || './alerts',
      exportFormats: config.exportFormats || ['json', 'csv'],
      
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
        new winston.transports.File({ filename: 'security_alerts.log' }),
        new winston.transports.Console()
      ]
    });
    
    // إعدادات التنبيهات
    this.alertChannels = this.initializeAlertChannels();
    this.alertQueue = [];
    this.processedAlerts = new Map();
    this.alertGroups = new Map();
    
    // إحصائيات التنبيهات
    this.stats = {
      totalAlerts: 0,
      alertsBySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      alertsByType: {},
      alertsBySource: {},
      responseTimes: [],
      startTime: Date.now()
    };
    
    // إنشاء مجلد التصدير
    if (this.config.enableExport && !fs.existsSync(this.config.exportPath)) {
      fs.mkdirSync(this.config.exportPath, { recursive: true });
    }
    
    // بدء معالجة التنبيهات
    this.startAlertProcessing();
    this.startMaintenance();
  }
  
  /**
   * تهيئة قنوات التنبيه
   */
  initializeAlertChannels() {
    const channels = {};
    
    // قناة الكونسول
    if (this.config.alertChannels.includes('console')) {
      channels.console = {
        send: async (alert) => {
          console.log('🚨 SECURITY ALERT:', JSON.stringify(alert, null, 2));
          return true;
        }
      };
    }
    
    // قناة السجلات
    if (this.config.alertChannels.includes('log')) {
      channels.log = {
        send: async (alert) => {
          const level = this.getLogLevel(alert.severity);
          this.logger.log(level, 'Security alert', alert);
          return true;
        }
      };
    }
    
    // قناة البريد الإلكتروني
    if (this.config.alertChannels.includes('email') && this.config.email.enabled) {
      channels.email = this.initializeEmailChannel();
    }
    
    // قناة Slack
    if (this.config.alertChannels.includes('slack') && this.config.slack.enabled) {
      channels.slack = this.initializeSlackChannel();
    }
    
    // قناة Webhook
    if (this.config.alertChannels.includes('webhook') && this.config.webhook.enabled) {
      channels.webhook = this.initializeWebhookChannel();
    }
    
    // قناة SMS
    if (this.config.alertChannels.includes('sms') && this.config.sms.enabled) {
      channels.sms = this.initializeSMSChannel();
    }
    
    return channels;
  }
  
  /**
   * تهيئة قناة البريد الإلكتروني
   */
  initializeEmailChannel() {
    const transporter = nodemailer.createTransporter({
      host: this.config.email.host,
      port: this.config.email.port || 587,
      secure: this.config.email.secure || false,
      auth: this.config.email.auth ? {
        user: this.config.email.auth.user,
        pass: this.config.email.auth.pass
      } : undefined
    });
    
    return {
      send: async (alert) => {
        try {
          const mailOptions = {
            from: this.config.email.from,
            to: this.getEmailRecipients(alert),
            subject: this.formatEmailSubject(alert),
            html: this.formatEmailBody(alert),
            attachments: this.getAlertAttachments(alert)
          };
          
          await transporter.sendMail(mailOptions);
          
          this.logger.info('Alert sent via email', { 
            alertId: alert.id, 
            severity: alert.severity,
            recipients: mailOptions.to
          });
          
          return true;
        } catch (error) {
          this.logger.error('Failed to send email alert', { 
            alertId: alert.id, 
            error: error.message 
          });
          return false;
        }
      }
    };
  }
  
  /**
   * تهيئة قناة Slack
   */
  initializeSlackChannel() {
    const slack = new Slack(this.config.slack.token);
    
    return {
      send: async (alert) => {
        try {
          const blocks = this.formatSlackMessage(alert);
          
          const result = await slack.chat.postMessage({
            channel: this.getSlackChannel(alert),
            text: `🚨 Security Alert: ${alert.title}`,
            blocks: blocks,
            attachments: this.getSlackAttachments(alert)
          });
          
          this.logger.info('Alert sent via Slack', { 
            alertId: alert.id, 
            channel: this.getSlackChannel(alert),
            ts: result.ts
          });
          
          return true;
        } catch (error) {
          this.logger.error('Failed to send Slack alert', { 
            alertId: alert.id, 
            error: error.message 
          });
          return false;
        }
      }
    };
  }
  
  /**
   * تهيئة قناة Webhook
   */
  initializeWebhookChannel() {
    return {
      send: async (alert) => {
        try {
          const payload = this.formatWebhookPayload(alert);
          
          const response = await axios.post(this.config.webhook.url, payload, {
            headers: {
              'Content-Type': 'application/json',
              ...this.config.webhook.headers
            },
            timeout: this.config.webhook.timeout || 10000,
            auth: this.config.webhook.auth
          });
          
          this.logger.info('Alert sent via webhook', { 
            alertId: alert.id, 
            status: response.status,
            url: this.config.webhook.url
          });
          
          return true;
        } catch (error) {
          this.logger.error('Failed to send webhook alert', { 
            alertId: alert.id, 
            error: error.message,
            url: this.config.webhook.url
          });
          return false;
        }
      }
    };
  }
  
  /**
   * تهيئة قناة SMS
   */
  initializeSMSChannel() {
    // تنفيذ بسيط للـ SMS (يمكن استخدام خدمات مثل Twilio)
    return {
      send: async (alert) => {
        try {
          // هنا يتم تطبيق منطق إرسال SMS
          const message = this.formatSMSMessage(alert);
          
          this.logger.info('Alert sent via SMS', { 
            alertId: alert.id, 
            message: message.substring(0, 50) + '...'
          });
          
          return true;
        } catch (error) {
          this.logger.error('Failed to send SMS alert', { 
            alertId: alert.id, 
            error: error.message 
          });
          return false;
        }
      }
    };
  }
  
  /**
   * إرسال تنبيه
   */
  async sendAlert(alert) {
    const startTime = Date.now();
    
    try {
      // إضافة معرف التنبيه
      alert.id = alert.id || this.generateAlertId();
      alert.timestamp = alert.timestamp || new Date().toISOString();
      alert.status = alert.status || 'pending';
      
      // فحص المرشحات المخصصة
      if (!this.passesCustomFilters(alert)) {
        this.logger.debug('Alert filtered out by custom filters', { alertId: alert.id });
        return false;
      }
      
      // فحص التقييد
      if (!this.checkRateLimit()) {
        this.logger.warn('Alert rate limit exceeded', { alertId: alert.id });
        return false;
      }
      
      // تجميع التنبيهات إذا كانت مفعلة
      if (this.config.enableGrouping && this.shouldGroupAlert(alert)) {
        await this.groupAlert(alert);
        return true;
      }
      
      // إضافة إلى قائمة الانتظار
      this.alertQueue.push({
        alert,
        priority: this.getAlertPriority(alert),
        timestamp: Date.now()
      });
      
      // معالجة فورية للتنبيهات الحرجة
      if (alert.severity === 'critical') {
        await this.processCriticalAlert(alert);
      }
      
      this.updateStats(alert);
      
      // إطلاق حدث
      this.emit('alertSent', alert);
      
      return true;
      
    } catch (error) {
      this.logger.error('Error sending alert', { 
        alertId: alert.id, 
        error: error.message 
      });
      return false;
    } finally {
      const responseTime = Date.now() - startTime;
      this.stats.responseTimes.push(responseTime);
    }
  }
  
  /**
   * معالجة تنبيه حرج
   */
  async processCriticalAlert(alert) {
    this.logger.error('Processing critical alert immediately', { 
      alertId: alert.id, 
      type: alert.type,
      title: alert.title
    });
    
    // إرسال فوري عبر جميع القنوات
    const channels = Object.keys(this.alertChannels);
    
    for (const channelName of channels) {
      try {
        await this.alertChannels[channelName].send(alert);
      } catch (error) {
        this.logger.error(`Failed to send critical alert via ${channelName}`, {
          alertId: alert.id,
          error: error.message
        });
      }
    }
  }
  
  /**
   * تجميع التنبيه
   */
  async groupAlert(alert) {
    const groupKey = this.generateGroupKey(alert);
    
    if (!this.alertGroups.has(groupKey)) {
      this.alertGroups.set(groupKey, {
        alerts: [],
        firstAlert: alert,
        lastAlert: alert,
        count: 0
      });
    }
    
    const group = this.alertGroups.get(groupKey);
    group.alerts.push(alert);
    group.lastAlert = alert;
    group.count++;
    
    // إرسال مجموعة إذا وصلت للحد الأقصى
    if (group.count >= this.config.maxAlertsPerGroup) {
      await this.sendAlertGroup(group);
      this.alertGroups.delete(groupKey);
    }
  }
  
  /**
   * إرسال مجموعة تنبيهات
   */
  async sendAlertGroup(group) {
    const aggregatedAlert = {
      id: this.generateAlertId(),
      type: 'alert_group',
      severity: this.getHighestSeverity(group.alerts),
      title: `${group.count} similar alerts`,
      description: this.formatGroupDescription(group),
      details: {
        groupKey: this.generateGroupKey(group.firstAlert),
        alertCount: group.count,
        timeRange: {
          first: group.firstAlert.timestamp,
          last: group.lastAlert.timestamp
        },
        samples: group.alerts.slice(0, 5) // أول 5 تنبيهات كمثال
      },
      timestamp: new Date().toISOString(),
      aggregated: true
    };
    
    // معالجة المجموعة كتنبيه عادي
    await this.sendAlert(aggregatedAlert);
  }
  
  /**
   * بدء معالجة التنبيهات
   */
  startAlertProcessing() {
    const processAlerts = async () => {
      try {
        if (this.alertQueue.length === 0) {
          return;
        }
        
        // ترتيب التنبيهات حسب الأولوية
        this.alertQueue.sort((a, b) => b.priority - a.priority);
        
        const batch = this.alertQueue.splice(0, 10); // معالجة 10 تنبيهات في المرة
        
        const promises = batch.map(async ({ alert }) => {
          return this.processAlert(alert);
        });
        
        await Promise.allSettled(promises);
        
      } catch (error) {
        this.logger.error('Error processing alert queue', { error: error.message });
      }
    };
    
    // معالجة دورية
    setInterval(processAlerts, 1000); // كل ثانية
    
    this.logger.info('Alert processing started');
  }
  
  /**
   * معالجة تنبيه واحد
   */
  async processAlert(alert) {
    const startTime = Date.now();
    
    try {
      alert.status = 'processing';
      
      // إرسال عبر جميع القنوات
      const channelPromises = Object.entries(this.alertChannels).map(async ([channelName, channel]) => {
        try {
          const success = await channel.send(alert);
          if (success) {
            this.logger.debug(`Alert sent via ${channelName}`, { alertId: alert.id });
          }
          return { channel: channelName, success };
        } catch (error) {
          this.logger.error(`Failed to send alert via ${channelName}`, {
            alertId: alert.id,
            error: error.message
          });
          return { channel: channelName, success: false, error: error.message };
        }
      });
      
      const results = await Promise.allSettled(channelPromises);
      
      // تحديث حالة التنبيه
      alert.status = 'sent';
      alert.processingTime = Date.now() - startTime;
      alert.channels = results.map(r => r.value || { channel: 'unknown', success: false });
      
      // حفظ في الذاكرة
      this.processedAlerts.set(alert.id, alert);
      
      // تصدير إذا كانت مفعلة
      if (this.config.enableExport) {
        await this.exportAlert(alert);
      }
      
      // إطلاق حدث
      this.emit('alertProcessed', alert);
      
      this.logger.info('Alert processed successfully', { 
        alertId: alert.id, 
        severity: alert.severity,
        processingTime: alert.processingTime
      });
      
    } catch (error) {
      alert.status = 'failed';
      alert.error = error.message;
      
      this.logger.error('Alert processing failed', { 
        alertId: alert.id, 
        error: error.message 
      });
      
      this.emit('alertFailed', alert);
    }
  }
  
  /**
   * تصدير التنبيه
   */
  async exportAlert(alert) {
    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = `alert_${alert.id}_${timestamp}`;
    
    for (const format of this.config.exportFormats) {
      try {
        const filename = path.join(this.config.exportPath, `${baseFilename}.${format}`);
        
        let content;
        if (format === 'json') {
          content = JSON.stringify(alert, null, 2);
        } else if (format === 'csv') {
          content = this.convertToCSV([alert]);
        }
        
        fs.writeFileSync(filename, content);
        
      } catch (error) {
        this.logger.error('Failed to export alert', {
          alertId: alert.id,
          format,
          error: error.message
        });
      }
    }
  }
  
  /**
   * تحويل إلى CSV
   */
  convertToCSV(alerts) {
    if (alerts.length === 0) return '';
    
    const headers = [
      'id', 'timestamp', 'type', 'severity', 'title', 'description',
      'source', 'status', 'processingTime'
    ];
    
    const rows = alerts.map(alert => [
      alert.id,
      alert.timestamp,
      alert.type,
      alert.severity,
      alert.title?.replace(/,/g, ';') || '',
      alert.description?.replace(/,/g, ';') || '',
      alert.source || '',
      alert.status,
      alert.processingTime || 0
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  /**
   * فحص المرشحات المخصصة
   */
  passesCustomFilters(alert) {
    for (const filter of this.config.customFilters) {
      try {
        if (filter.field && filter.operator && filter.value) {
          const fieldValue = this.getNestedValue(alert, filter.field);
          
          if (!this.evaluateFilter(fieldValue, filter.operator, filter.value)) {
            return false;
          }
        }
      } catch (error) {
        this.logger.error('Error evaluating custom filter', { filter, error: error.message });
      }
    }
    
    return true;
  }
  
  /**
   * تقييم مرشح
   */
  evaluateFilter(fieldValue, operator, filterValue) {
    switch (operator) {
      case 'equals':
        return fieldValue === filterValue;
      case 'not_equals':
        return fieldValue !== filterValue;
      case 'contains':
        return String(fieldValue).includes(filterValue);
      case 'not_contains':
        return !String(fieldValue).includes(filterValue);
      case 'greater_than':
        return Number(fieldValue) > Number(filterValue);
      case 'less_than':
        return Number(fieldValue) < Number(filterValue);
      case 'in':
        return Array.isArray(filterValue) && filterValue.includes(fieldValue);
      case 'regex':
        return new RegExp(filterValue).test(String(fieldValue));
      default:
        return true;
    }
  }
  
  /**
   * الحصول على قيمة متداخلة
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  /**
   * فحص التقييد
   */
  checkRateLimit() {
    if (!this.config.rateLimit.enabled) {
      return true;
    }
    
    const now = Date.now();
    const windowStart = now - (this.config.rateLimit.timeWindow * 1000);
    
    // إزالة التنبيهات القديمة
    this.stats.responseTimes = this.stats.responseTimes.filter(time => time > windowStart);
    
    return this.stats.responseTimes.length < this.config.rateLimit.maxAlerts;
  }
  
  /**
   * فحص التجميع
   */
  shouldGroupAlert(alert) {
    // قواعد التجميع بسيطة - يمكن توسيعها
    return alert.severity === 'low' || alert.type === 'monitoring';
  }
  
  /**
   * توليد معرف التنبيه
   */
  generateAlertId() {
    return `alert_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  /**
   * توليد مفتاح التجميع
   */
  generateGroupKey(alert) {
    return `${alert.type}_${alert.source || 'unknown'}_${alert.severity}`;
  }
  
  /**
   * الحصول على أولوية التنبيه
   */
  getAlertPriority(alert) {
    const priorities = {
      'critical': 100,
      'high': 75,
      'medium': 50,
      'low': 25
    };
    
    return priorities[alert.severity] || 0;
  }
  
  /**
   * الحصول على أعلى خطورة في المجموعة
   */
  getHighestSeverity(alerts) {
    const severityOrder = ['critical', 'high', 'medium', 'low'];
    
    for (const severity of severityOrder) {
      if (alerts.some(alert => alert.severity === severity)) {
        return severity;
      }
    }
    
    return 'low';
  }
  
  /**
   * تنسيق وصف المجموعة
   */
  formatGroupDescription(group) {
    return `${group.count} similar security alerts detected between ${group.firstAlert.timestamp} and ${group.lastAlert.timestamp}`;
  }
  
  /**
   * تحديث الإحصائيات
   */
  updateStats(alert) {
    this.stats.totalAlerts++;
    this.stats.alertsBySeverity[alert.severity]++;
    
    if (!this.stats.alertsByType[alert.type]) {
      this.stats.alertsByType[alert.type] = 0;
    }
    this.stats.alertsByType[alert.type]++;
    
    if (alert.source) {
      if (!this.stats.alertsBySource[alert.source]) {
        this.stats.alertsBySource[alert.source] = 0;
      }
      this.stats.alertsBySource[alert.source]++;
    }
  }
  
  /**
   * الحصول على مستوى السجل
   */
  getLogLevel(severity) {
    const levels = {
      'critical': 'error',
      'high': 'warn',
      'medium': 'warn',
      'low': 'info'
    };
    
    return levels[severity] || 'info';
  }
  
  /**
   * تنسيق عنوان البريد الإلكتروني
   */
  formatEmailSubject(alert) {
    const templates = this.config.alertTemplates.email || {};
    const template = templates[alert.severity] || templates.default || 
      '[{severity}] {title} - {type}';
    
    return template
      .replace('{severity}', alert.severity.toUpperCase())
      .replace('{title}', alert.title || 'Security Alert')
      .replace('{type}', alert.type || 'Security');
  }
  
  /**
   * تنسيق نص البريد الإلكتروني
   */
  formatEmailBody(alert) {
    return `
      <h2>Security Alert</h2>
      <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
      <p><strong>Type:</strong> ${alert.type}</p>
      <p><strong>Title:</strong> ${alert.title}</p>
      <p><strong>Description:</strong> ${alert.description || 'No description'}</p>
      <p><strong>Timestamp:</strong> ${alert.timestamp}</p>
      ${alert.source ? `<p><strong>Source:</strong> ${alert.source}</p>` : ''}
      ${alert.details ? `<pre>${JSON.stringify(alert.details, null, 2)}</pre>` : ''}
    `;
  }
  
  /**
   * تنسيق رسالة Slack
   */
  formatSlackMessage(alert) {
    const color = this.getSlackColor(alert.severity);
    
    return [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚨 Security Alert: ${alert.title}`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Severity:*\n${alert.severity.toUpperCase()}`
          },
          {
            type: 'mrkdwn',
            text: `*Type:*\n${alert.type}`
          },
          {
            type: 'mrkdwn',
            text: `*Timestamp:*\n${alert.timestamp}`
          },
          {
            type: 'mrkdwn',
            text: `*Source:*\n${alert.source || 'Unknown'}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description:*\n${alert.description || 'No description available'}`
        }
      }
    ];
  }
  
  /**
   * الحصول على لون Slack
   */
  getSlackColor(severity) {
    const colors = {
      'critical': 'danger',
      'high': 'warning',
      'medium': '#ff9900',
      'low': 'good'
    };
    
    return colors[severity] || '#36a64f';
  }
  
  /**
   * تنسيق webhook payload
   */
  formatWebhookPayload(alert) {
    return {
      id: alert.id,
      timestamp: alert.timestamp,
      severity: alert.severity,
      type: alert.type,
      title: alert.title,
      description: alert.description,
      source: alert.source,
      details: alert.details
    };
  }
  
  /**
   * الحصول على المستلمين حسب البريد الإلكتروني
   */
  getEmailRecipients(alert) {
    const recipients = this.config.email.recipients || {};
    
    return recipients[alert.severity] || recipients.all || [];
  }
  
  /**
   * الحصول على قناة Slack
   */
  getSlackChannel(alert) {
    const channels = this.config.slack.channels || {};
    
    return channels[alert.severity] || channels.all || this.config.slack.channel || '#security';
  }
  
  /**
   * الحصول على مرفقات البريد الإلكتروني
   */
  getAlertAttachments(alert) {
    // يمكن إضافة ملفات مرفقة مثل logs أو screenshots
    return [];
  }
  
  /**
   * الحصول على مرفقات Slack
   */
  getSlackAttachments(alert) {
    return [
      {
        color: this.getSlackColor(alert.severity),
        fields: alert.details ? [
          {
            title: 'Alert Details',
            value: '```' + JSON.stringify(alert.details, null, 2) + '```',
            short: false
          }
        ] : []
      }
    ];
  }
  
  /**
   * تنسيق رسالة SMS
   */
  formatSMSMessage(alert) {
    return `SECURITY ALERT [${alert.severity.toUpperCase()}]: ${alert.title} - ${alert.description?.substring(0, 100) || 'No description'}`;
  }
  
  /**
   * بدء الصيانة
   */
  startMaintenance() {
    const performMaintenance = () => {
      try {
        // تنظيف الذاكرة
        this.cleanupProcessedAlerts();
        
        // إرسال المجموعات المعلقة
        this.processPendingGroups();
        
        // تحديث الإحصائيات
        this.updateStatistics();
        
      } catch (error) {
        this.logger.error('Error during maintenance', { error: error.message });
      }
    };
    
    // كل 5 دقائق
    setInterval(performMaintenance, 5 * 60 * 1000);
    
    this.logger.info('Maintenance started');
  }
  
  /**
   * تنظيف التنبيهات المعالجة
   */
  cleanupProcessedAlerts() {
    const maxAge = 24 * 60 * 60 * 1000; // 24 ساعة
    const cutoffTime = Date.now() - maxAge;
    
    for (const [alertId, alert] of this.processedAlerts.entries()) {
      const alertTime = new Date(alert.timestamp).getTime();
      
      if (alertTime < cutoffTime) {
        this.processedAlerts.delete(alertId);
      }
    }
  }
  
  /**
   * معالجة المجموعات المعلقة
   */
  processPendingGroups() {
    for (const [groupKey, group] of this.alertGroups.entries()) {
      if (Date.now() - new Date(group.lastAlert.timestamp).getTime() > this.config.groupingWindow * 1000) {
        this.sendAlertGroup(group);
        this.alertGroups.delete(groupKey);
      }
    }
  }
  
  /**
   * تحديث الإحصائيات
   */
  updateStatistics() {
    this.stats.uptime = Date.now() - this.stats.startTime;
    this.stats.queueLength = this.alertQueue.length;
    this.stats.groupedAlerts = this.alertGroups.size;
    
    // حساب متوسط وقت الاستجابة
    if (this.stats.responseTimes.length > 0) {
      this.stats.averageResponseTime = this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length;
    }
  }
  
  /**
   * الحصول على إحصائيات النظام
   */
  getSystemStatistics() {
    this.updateStatistics();
    
    return {
      ...this.stats,
      alertChannels: Object.keys(this.alertChannels),
      recentAlerts: Array.from(this.processedAlerts.values())
        .slice(-10)
        .map(alert => ({
          id: alert.id,
          severity: alert.severity,
          type: alert.type,
          title: alert.title,
          timestamp: alert.timestamp,
          status: alert.status
        }))
    };
  }
  
  /**
   * إرسال تنبيه تجريبي
   */
  async sendTestAlert(severity = 'medium') {
    const testAlert = {
      type: 'test',
      severity: severity,
      title: `Test Alert - ${severity}`,
      description: 'This is a test security alert from the alert system',
      source: 'test_system',
      details: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };
    
    return await this.sendAlert(testAlert);
  }
}

// تصدير الكلاس
module.exports = SecurityAlertSystem;

// مثال على الاستخدام
if (require.main === module) {
  const alertSystem = new SecurityAlertSystem({
    alertChannels: ['console', 'log'],
    email: {
      enabled: false
    },
    slack: {
      enabled: false
    },
    webhook: {
      enabled: false
    },
    enableGrouping: true,
    groupingWindow: 60,
    maxAlertsPerGroup: 5,
    rateLimit: {
      enabled: true,
      maxAlerts: 50,
      timeWindow: 3600
    }
  });
  
  // تسجيل مستمعي الأحداث
  alertSystem.on('alertSent', (alert) => {
    console.log('Alert sent:', alert.id);
  });
  
  alertSystem.on('alertProcessed', (alert) => {
    console.log('Alert processed:', alert.id, 'in', alert.processingTime + 'ms');
  });
  
  // إرسال تنبيهات تجريبية
  setTimeout(() => {
    alertSystem.sendTestAlert('low');
  }, 1000);
  
  setTimeout(() => {
    alertSystem.sendTestAlert('medium');
  }, 2000);
  
  setTimeout(() => {
    alertSystem.sendTestAlert('high');
  }, 3000);
  
  setTimeout(() => {
    alertSystem.sendTestAlert('critical');
  }, 4000);
  
  // عرض الإحصائيات كل 10 ثوان
  setInterval(() => {
    const stats = alertSystem.getSystemStatistics();
    console.log('Alert System Stats:', JSON.stringify(stats, null, 2));
  }, 10000);
}