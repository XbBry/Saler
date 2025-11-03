/**
 * Error Notification System
 * نظام إشعارات الأخطاء

يدعم قنوات إشعار متعددة وتنبيهات ذكية
 */

class ErrorNotifications {
    constructor(config = {}) {
        this.config = {
            channels: config.channels || this.getDefaultChannels(),
            rules: config.rules || this.getDefaultRules(),
            batching: config.batching || {
                enabled: true,
                maxDelay: 30000, // 30 seconds
                maxCount: 5
            },
            throttling: config.throttling || {
                enabled: true,
                maxPerHour: 10,
                maxPerDay: 50
            },
            priority: {
                critical: ['slack', 'email', 'sms'],
                high: ['slack', 'email'],
                medium: ['email', 'webhook'],
                low: ['webhook']
            },
            templates: config.templates || this.getDefaultTemplates(),
            escalation: config.escalation || {
                enabled: true,
                rules: [
                    { delay: 15 * 60 * 1000, channel: 'sms' }, // 15 minutes
                    { delay: 30 * 60 * 1000, channel: 'call' }, // 30 minutes
                ]
            },
            filters: config.filters || {
                ignorePatterns: [/Script error\./, /Non-Error promise rejection/],
                severityThreshold: 'low'
            },
            ...config
        };
        
        this.notificationHistory = [];
        this.pendingNotifications = new Map();
        this.batches = new Map();
        this.escalationTimers = new Map();
        
        this.init();
    }
    
    init() {
        console.log('[ErrorNotifications] تم تهيئة نظام إشعارات الأخطاء');
        
        // إعداد القنوات
        this.setupChannels();
        
        // إعداد المعالجة الدورية
        this.startPeriodicProcessing();
        
        // إعداد تنظيف البيانات
        this.startCleanupTask();
    }
    
    /**
     * الحصول على القنوات الافتراضية
     */
    getDefaultChannels() {
        return {
            email: {
                enabled: false,
                smtpConfig: {
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                },
                recipients: ['admin@saler.com', 'dev@saler.com'],
                from: 'alerts@saler.com'
            },
            slack: {
                enabled: false,
                webhookUrl: process.env.SLACK_WEBHOOK_URL,
                channel: '#alerts',
                username: 'ErrorBot',
                icon: ':warning:'
            },
            webhook: {
                enabled: true,
                url: '/api/error-notifications',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            },
            sms: {
                enabled: false,
                provider: 'twilio', // twilio, aws-sns
                config: {
                    accountSid: process.env.TWILIO_ACCOUNT_SID,
                    authToken: process.env.TWILIO_AUTH_TOKEN,
                    from: process.env.TWILIO_PHONE,
                    to: process.env.EMERGENCY_PHONE
                }
            },
            discord: {
                enabled: false,
                webhookUrl: process.env.DISCORD_WEBHOOK_URL
            },
            teams: {
                enabled: false,
                webhookUrl: process.env.TEAMS_WEBHOOK_URL
            }
        };
    }
    
    /**
     * الحصول على القواعد الافتراضية
     */
    getDefaultRules() {
        return [
            // قواعد حرجة
            {
                name: 'critical_database_error',
                match: {
                    severity: 'critical',
                    tags: ['database_errors']
                },
                channels: ['slack', 'email', 'webhook'],
                immediate: true,
                template: 'critical_error'
            },
            
            // قواعد عالية
            {
                name: 'high_security_error',
                match: {
                    severity: 'high',
                    tags: ['security_errors']
                },
                channels: ['slack', 'email'],
                immediate: true,
                template: 'security_error'
            },
            
            // قواعد متوسطة
            {
                name: 'medium_performance_error',
                match: {
                    severity: 'medium',
                    tags: ['performance_errors']
                },
                channels: ['email', 'webhook'],
                immediate: false,
                template: 'performance_error',
                batchable: true
            },
            
            // قواعد منخفضة
            {
                name: 'low_warning',
                match: {
                    severity: 'low'
                },
                channels: ['webhook'],
                immediate: false,
                batchable: true,
                template: 'warning'
            }
        ];
    }
    
    /**
     * الحصول على القوالب الافتراضية
     */
    getDefaultTemplates() {
        return {
            critical_error: {
                subject: '🚨 خطأ حرج في النظام',
                format: 'rich',
                fields: [
                    { name: 'النوع', key: 'error_type' },
                    { name: 'الرسالة', key: 'message' },
                    { name: 'الحالة', key: 'severity' },
                    { name: 'المصدر', key: 'source' },
                    { name: 'الوقت', key: 'timestamp' },
                    { name: 'الرابط', key: 'url' }
                ],
                actions: [
                    { text: 'مراجعة الأخطاء', url: '/admin/errors' },
                    { text: 'عرض التفاصيل', url: '/admin/errors/{error_id}' }
                ]
            },
            
            security_error: {
                subject: '🔒 تحذير أمني',
                format: 'rich',
                fields: [
                    { name: 'النوع', key: 'error_type' },
                    { name: 'الرسالة', key: 'message' },
                    { name: 'المصدر', key: 'source' },
                    { name: 'الوقت', key: 'timestamp' },
                    { name: 'الرابط', key: 'url' }
                ],
                actions: [
                    { text: 'مراجعة الأمان', url: '/admin/security' }
                ]
            },
            
            performance_error: {
                subject: '⚡ مشكلة أداء',
                format: 'rich',
                fields: [
                    { name: 'النوع', key: 'error_type' },
                    { name: 'الرسالة', key: 'message' },
                    { name: 'الحالة', key: 'severity' },
                    { name: 'الوقت', key: 'timestamp' }
                ],
                actions: [
                    { text: 'مراجعة الأداء', url: '/admin/performance' }
                ]
            },
            
            warning: {
                subject: '⚠️ تحذير',
                format: 'simple',
                fields: [
                    { name: 'الرسالة', key: 'message' },
                    { name: 'الوقت', key: 'timestamp' }
                ]
            },
            
            error_summary: {
                subject: 'ملخص الأخطاء - {date}',
                format: 'summary',
                fields: [
                    { name: 'إجمالي الأخطاء', key: 'total_errors' },
                    { name: 'أخطاء حرجة', key: 'critical_errors' },
                    { name: 'أخطاء عالية', key: 'high_errors' },
                    { name: 'أخطاء متوسطة', key: 'medium_errors' },
                    { name: 'تحذيرات', key: 'warning_count' }
                ]
            }
        };
    }
    
    /**
     * إعداد القنوات
     */
    setupChannels() {
        // إعداد قناة البريد الإلكتروني
        if (this.config.channels.email.enabled) {
            this.setupEmailChannel();
        }
        
        // إعداد قناة Slack
        if (this.config.channels.slack.enabled) {
            this.setupSlackChannel();
        }
        
        // إعداد قناة Webhook
        if (this.config.channels.webhook.enabled) {
            this.setupWebhookChannel();
        }
        
        // إعداد قناة SMS
        if (this.config.channels.sms.enabled) {
            this.setupSMSChannel();
        }
        
        // إعداد قناة Discord
        if (this.config.channels.discord.enabled) {
            this.setupDiscordChannel();
        }
        
        // إعداد قناة Teams
        if (this.config.channels.teams.enabled) {
            this.setupTeamsChannel();
        }
    }
    
    /**
     * إعداد قناة البريد الإلكتروني
     */
    setupEmailChannel() {
        this.emailChannel = {
            send: async (notification) => {
                try {
                    // هنا يمكن استخدام nodemailer أو خدمة أخرى
                    const emailData = {
                        to: this.config.channels.email.recipients,
                        from: this.config.channels.email.from,
                        subject: notification.subject,
                        html: this.generateEmailHTML(notification),
                        text: this.generateEmailText(notification)
                    };
                    
                    console.log('تم إرسال إشعار بريد إلكتروني:', notification.subject);
                    return { success: true, messageId: 'mock-message-id' };
                } catch (error) {
                    console.error('خطأ في إرسال البريد الإلكتروني:', error);
                    return { success: false, error: error.message };
                }
            }
        };
    }
    
    /**
     * إعداد قناة Slack
     */
    setupSlackChannel() {
        this.slackChannel = {
            send: async (notification) => {
                try {
                    const slackPayload = {
                        channel: this.config.channels.slack.channel,
                        username: this.config.channels.slack.username,
                        icon_emoji: this.config.channels.slack.icon,
                        attachments: [this.generateSlackAttachment(notification)]
                    };
                    
                    // إرسال إلى Slack webhook
                    await fetch(this.config.channels.slack.webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(slackPayload)
                    });
                    
                    console.log('تم إرسال إشعار Slack:', notification.subject);
                    return { success: true };
                } catch (error) {
                    console.error('خطأ في إرسال Slack:', error);
                    return { success: false, error: error.message };
                }
            }
        };
    }
    
    /**
     * إعداد قناة Webhook
     */
    setupWebhookChannel() {
        this.webhookChannel = {
            send: async (notification) => {
                try {
                    const response = await fetch(this.config.channels.webhook.url, {
                        method: this.config.channels.webhook.method,
                        headers: this.config.channels.webhook.headers,
                        body: JSON.stringify(notification)
                    });
                    
                    const result = await response.json();
                    
                    console.log('تم إرسال إشعار webhook:', notification.subject);
                    return { success: response.ok, result };
                } catch (error) {
                    console.error('خطأ في إرسال webhook:', error);
                    return { success: false, error: error.message };
                }
            }
        };
    }
    
    /**
     * إعداد قناة SMS
     */
    setupSMSChannel() {
        this.smsChannel = {
            send: async (notification) => {
                try {
                    // هنا يمكن استخدام Twilio أو خدمة SMS أخرى
                    const smsData = {
                        to: this.config.channels.sms.config.to,
                        from: this.config.channels.sms.config.from,
                        body: this.generateSMSMessage(notification)
                    };
                    
                    console.log('تم إرسال إشعار SMS:', notification.subject);
                    return { success: true, messageId: 'mock-sms-id' };
                } catch (error) {
                    console.error('خطأ في إرسال SMS:', error);
                    return { success: false, error: error.message };
                }
            }
        };
    }
    
    /**
     * إعداد قناة Discord
     */
    setupDiscordChannel() {
        this.discordChannel = {
            send: async (notification) => {
                try {
                    const discordPayload = {
                        embeds: [this.generateDiscordEmbed(notification)]
                    };
                    
                    await fetch(this.config.channels.discord.webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(discordPayload)
                    });
                    
                    console.log('تم إرسال إشعار Discord:', notification.subject);
                    return { success: true };
                } catch (error) {
                    console.error('خطأ في إرسال Discord:', error);
                    return { success: false, error: error.message };
                }
            }
        };
    }
    
    /**
     * إعداد قناة Teams
     */
    setupTeamsChannel() {
        this.teamsChannel = {
            send: async (notification) => {
                try {
                    const teamsPayload = {
                        '@type': 'MessageCard',
                        '@context': 'https://schema.org/extensions',
                        'summary': notification.subject,
                        'sections': [{
                            'activityTitle': '🚨 إشعار خطأ',
                            'text': this.generateTeamsText(notification),
                            'facts': this.generateTeamsFacts(notification)
                        }],
                        'potentialAction': this.generateTeamsActions(notification)
                    };
                    
                    await fetch(this.config.channels.teams.webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(teamsPayload)
                    });
                    
                    console.log('تم إرسال إشعار Teams:', notification.subject);
                    return { success: true };
                } catch (error) {
                    console.error('خطأ في إرسال Teams:', error);
                    return { success: false, error: error.message };
                }
            }
        };
    }
    
    /**
     * إرسال إشعار خطأ
     */
    async sendErrorNotification(errorData) {
        // التحقق من الفلاتر
        if (this.shouldFilterNotification(errorData)) {
            return { success: true, filtered: true };
        }
        
        // العثور على القواعد المطابقة
        const matchingRules = this.findMatchingRules(errorData);
        
        if (matchingRules.length === 0) {
            return { success: true, noRules: true };
        }
        
        const notification = this.createNotification(errorData, matchingRules[0]);
        
        // التحقق من التقييد
        if (this.shouldThrottle(notification)) {
            console.log('تم تقييد الإشعار:', notification.subject);
            return { success: true, throttled: true };
        }
        
        // إضافة إلى السجل
        this.addToHistory(notification);
        
        // إرسال الإشعار
        return await this.processNotification(notification);
    }
    
    /**
     * إنشاء إشعار
     */
    createNotification(errorData, rule) {
        const template = this.config.templates[rule.template] || this.config.templates.warning;
        
        // إنشاء بيانات الإشعار
        const notification = {
            id: this.generateNotificationId(),
            timestamp: new Date().toISOString(),
            subject: this.interpolateTemplate(template.subject, errorData),
            errorData: errorData,
            rule: rule,
            template: template,
            channels: rule.channels,
            immediate: rule.immediate,
            batchable: rule.batchable,
            retryCount: 0,
            maxRetries: 3,
            escalationLevel: 0
        };
        
        return notification;
    }
    
    /**
     * معالجة الإشعار
     */
    async processNotification(notification) {
        // التحقق من التجميع
        if (this.config.batching.enabled && notification.batchable && !notification.immediate) {
            return await this.addToBatch(notification);
        }
        
        // إرسال فوري
        return await this.sendToChannels(notification);
    }
    
    /**
     * إضافة إلى دفعة
     */
    async addToBatch(notification) {
        const batchKey = `${notification.rule.name}_${notification.channels.join('_')}`;
        
        if (!this.batches.has(batchKey)) {
            this.batches.set(batchKey, {
                notifications: [],
                timer: null,
                channels: notification.channels
            });
        }
        
        const batch = this.batches.get(batchKey);
        batch.notifications.push(notification);
        
        // إعداد مؤقت للإرسال
        if (!batch.timer) {
            batch.timer = setTimeout(() => {
                this.sendBatch(batchKey);
            }, this.config.batching.maxDelay);
        }
        
        // التحقق من الحد الأقصى للدفعة
        if (batch.notifications.length >= this.config.batching.maxCount) {
            clearTimeout(batch.timer);
            await this.sendBatch(batchKey);
        }
        
        return { success: true, batched: true };
    }
    
    /**
     * إرسال الدفعة
     */
    async sendBatch(batchKey) {
        const batch = this.batches.get(batchKey);
        if (!batch || batch.notifications.length === 0) {
            return { success: true };
        }
        
        // دمج الإشعارات في ملخص
        const batchNotification = this.createBatchNotification(batch.notifications);
        
        // إرسال إلى القنوات
        const result = await this.sendToChannels(batchNotification);
        
        // مسح الدفعة
        this.batches.delete(batchKey);
        
        return result;
    }
    
    /**
     * إنشاء إشعار ملخص للدفعة
     */
    createBatchNotification(notifications) {
        const batchNotification = {
            id: this.generateNotificationId(),
            timestamp: new Date().toISOString(),
            subject: `ملخص الأخطاء - ${new Date().toLocaleDateString('ar')}`,
            errorData: {
                total_errors: notifications.length,
                critical_errors: notifications.filter(n => n.errorData.severity === 'critical').length,
                high_errors: notifications.filter(n => n.errorData.severity === 'high').length,
                medium_errors: notifications.filter(n => n.errorData.severity === 'medium').length,
                warning_count: notifications.filter(n => n.errorData.severity === 'low').length,
                date: new Date().toISOString().split('T')[0]
            },
            template: this.config.templates.error_summary,
            channels: notifications[0].channels,
            immediate: false,
            batchable: false
        };
        
        return batchNotification;
    }
    
    /**
     * إرسال إلى القنوات
     */
    async sendToChannels(notification) {
        const results = [];
        
        for (const channelName of notification.channels) {
            const channel = this.getChannel(channelName);
            if (!channel) {
                console.warn(`القناة غير مدعومة: ${channelName}`);
                results.push({ channel: channelName, success: false, error: 'Unsupported channel' });
                continue;
            }
            
            try {
                const result = await channel.send(notification);
                results.push({ channel: channelName, success: true, result });
                
                // إعداد التصعيد إذا فشل الإرسال
                if (!result.success && notification.errorData.severity === 'critical') {
                    this.setupEscalation(notification);
                }
                
            } catch (error) {
                console.error(`خطأ في إرسال الإشعار عبر ${channelName}:`, error);
                results.push({ channel: channelName, success: false, error: error.message });
            }
        }
        
        return {
            success: results.every(r => r.success),
            results: results
        };
    }
    
    /**
     * الحصول على قناة
     */
    getChannel(name) {
        switch (name) {
            case 'email':
                return this.emailChannel;
            case 'slack':
                return this.slackChannel;
            case 'webhook':
                return this.webhookChannel;
            case 'sms':
                return this.smsChannel;
            case 'discord':
                return this.discordChannel;
            case 'teams':
                return this.teamsChannel;
            default:
                return null;
        }
    }
    
    /**
     * العثور على القواعد المطابقة
     */
    findMatchingRules(errorData) {
        return this.config.rules.filter(rule => {
            return this.matchesRule(errorData, rule.match);
        });
    }
    
    /**
     * التحقق من مطابقة القاعدة
     */
    matchesRule(errorData, matchCriteria) {
        for (const [key, value] of Object.entries(matchCriteria)) {
            const actualValue = errorData[key];
            
            if (Array.isArray(value)) {
                if (!value.some(v => this.matchesValue(actualValue, v))) {
                    return false;
                }
            } else if (!this.matchesValue(actualValue, value)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * التحقق من مطابقة القيمة
     */
    matchesValue(actual, expected) {
        if (expected instanceof RegExp) {
            return expected.test(actual);
        } else if (Array.isArray(expected)) {
            return expected.includes(actual);
        } else {
            return actual === expected;
        }
    }
    
    /**
     * التحقق من ضرورة تصفية الإشعار
     */
    shouldFilterNotification(errorData) {
        // فحص أنماط التجاهل
        for (const pattern of this.config.filters.ignorePatterns) {
            if (pattern.test(errorData.message)) {
                return true;
            }
        }
        
        // فحص حد الخطورة
        const severityOrder = ['low', 'medium', 'high', 'critical'];
        const errorSeverityIndex = severityOrder.indexOf(errorData.severity);
        const thresholdSeverityIndex = severityOrder.indexOf(this.config.filters.severityThreshold);
        
        return errorSeverityIndex < thresholdSeverityIndex;
    }
    
    /**
     * التحقق من التقييد
     */
    shouldThrottle(notification) {
        if (!this.config.throttling.enabled) {
            return false;
        }
        
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        
        // تصفية الإشعارات القديمة
        this.notificationHistory = this.notificationHistory.filter(
            n => new Date(n.timestamp).getTime() > oneDayAgo
        );
        
        // عدد الإشعارات في الساعة الأخيرة
        const recentNotifications = this.notificationHistory.filter(
            n => new Date(n.timestamp).getTime() > oneHourAgo &&
                 n.errorData.severity === notification.errorData.severity
        );
        
        if (recentNotifications.length >= this.config.throttling.maxPerHour) {
            return true;
        }
        
        // عدد الإشعارات في اليوم الأخير
        const dailyNotifications = this.notificationHistory.filter(
            n => n.errorData.severity === notification.errorData.severity
        );
        
        if (dailyNotifications.length >= this.config.throttling.maxPerDay) {
            return true;
        }
        
        return false;
    }
    
    /**
     * إعداد التصعيد
     */
    setupEscalation(notification) {
        if (!this.config.escalation.enabled) {
            return;
        }
        
        for (const escalationRule of this.config.escalation.rules) {
            const timer = setTimeout(() => {
                this.sendEscalatedNotification(notification, escalationRule);
            }, escalationRule.delay);
            
            this.escalationTimers.set(notification.id, timer);
        }
    }
    
    /**
     * إرسال إشعار مصعد
     */
    async sendEscalatedNotification(notification, escalationRule) {
        const escalatedNotification = {
            ...notification,
            id: this.generateNotificationId(),
            subject: `[تصعيد] ${notification.subject}`,
            channels: [escalationRule.channel],
            escalationLevel: notification.escalationLevel + 1
        };
        
        await this.sendToChannels(escalatedNotification);
    }
    
    /**
     * إضافة إلى السجل
     */
    addToHistory(notification) {
        this.notificationHistory.push(notification);
        
        // الاحتفاظ بآخر 1000 إشعار فقط
        if (this.notificationHistory.length > 1000) {
            this.notificationHistory.shift();
        }
    }
    
    /**
     * توليد HTML للبريد الإلكتروني
     */
    generateEmailHTML(notification) {
        let html = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${notification.subject}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .severity-critical { border-left: 4px solid #dc3545; }
                .severity-high { border-left: 4px solid #fd7e14; }
                .severity-medium { border-left: 4px solid #ffc107; }
                .severity-low { border-left: 4px solid #28a745; }
                .field { margin-bottom: 10px; }
                .field-name { font-weight: bold; color: #666; }
                .field-value { color: #333; }
                .actions { margin-top: 20px; }
                .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-left: 10px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header severity-${notification.errorData.severity}">
                    <h1>${notification.subject}</h1>
                    <p>تم إرسال هذا الإشعار في: ${new Date().toLocaleString('ar')}</p>
                </div>
        `;
        
        // إضافة الحقول
        for (const field of notification.template.fields) {
            const value = this.getNestedValue(notification.errorData, field.key);
            if (value) {
                html += `
                <div class="field">
                    <div class="field-name">${field.name}:</div>
                    <div class="field-value">${value}</div>
                </div>
                `;
            }
        }
        
        // إضافة الإجراءات
        if (notification.template.actions) {
            html += '<div class="actions">';
            for (const action of notification.template.actions) {
                const url = this.interpolateTemplate(action.url, notification.errorData);
                html += `<a href="${url}" class="btn">${action.text}</a>`;
            }
            html += '</div>';
        }
        
        html += `
                <div class="footer">
                    <p>هذا الإشعار تم إرساله بواسطة نظام مراقبة الأخطاء</p>
                </div>
            </div>
        </body>
        </html>
        `;
        
        return html;
    }
    
    /**
     * توليد نص للبريد الإلكتروني
     */
    generateEmailText(notification) {
        let text = `${notification.subject}\n\n`;
        
        for (const field of notification.template.fields) {
            const value = this.getNestedValue(notification.errorData, field.key);
            if (value) {
                text += `${field.name}: ${value}\n`;
            }
        }
        
        if (notification.template.actions) {
            text += '\nالإجراءات:\n';
            for (const action of notification.template.actions) {
                const url = this.interpolateTemplate(action.url, notification.errorData);
                text += `- ${action.text}: ${url}\n`;
            }
        }
        
        text += `\n\nتم الإرسال في: ${new Date().toLocaleString('ar')}`;
        
        return text;
    }
    
    /**
     * توليد رسالة Slack
     */
    generateSlackAttachment(notification) {
        const severityColors = {
            critical: '#dc3545',
            high: '#fd7e14',
            medium: '#ffc107',
            low: '#28a745'
        };
        
        return {
            color: severityColors[notification.errorData.severity] || '#6c757d',
            title: notification.subject,
            text: notification.errorData.message,
            fields: notification.template.fields.map(field => {
                const value = this.getNestedValue(notification.errorData, field.key);
                return {
                    title: field.name,
                    value: value || 'غير متوفر',
                    short: true
                };
            }),
            ts: Math.floor(Date.now() / 1000),
            footer: 'نظام مراقبة الأخطاء',
            footer_icon: 'https://assets.example.com/error-icon.png'
        };
    }
    
    /**
     * توليد رسالة SMS
     */
    generateSMSMessage(notification) {
        const maxLength = 160; // حد SMS
        
        let message = `خطأ ${notification.errorData.severity}: ${notification.errorData.message}`;
        
        if (message.length > maxLength) {
            message = message.substring(0, maxLength - 3) + '...';
        }
        
        return message;
    }
    
    /**
     * توليد Discord embed
     */
    generateDiscordEmbed(notification) {
        const severityColors = {
            critical: 0xdc3545,
            high: 0xfd7e14,
            medium: 0xffc107,
            low: 0x28a745
        };
        
        return {
            title: notification.subject,
            description: notification.errorData.message,
            color: severityColors[notification.errorData.severity] || 0x6c757d,
            timestamp: notification.timestamp,
            fields: notification.template.fields.map(field => {
                const value = this.getNestedValue(notification.errorData, field.key);
                return {
                    name: field.name,
                    value: value || 'غير متوفر',
                    inline: true
                };
            })
        };
    }
    
    /**
     * توليد نص Teams
     */
    generateTeamsText(notification) {
        return notification.errorData.message;
    }
    
    /**
     * توليد حقائق Teams
     */
    generateTeamsFacts(notification) {
        return notification.template.fields.map(field => {
            const value = this.getNestedValue(notification.errorData, field.key);
            return {
                name: field.name,
                value: value || 'غير متوفر'
            };
        });
    }
    
    /**
     * توليد إجراءات Teams
     */
    generateTeamsActions(notification) {
        if (!notification.template.actions) {
            return [];
        }
        
        return notification.template.actions.map(action => {
            const url = this.interpolateTemplate(action.url, notification.errorData);
            return {
                '@type': 'OpenUri',
                name: action.text,
                targets: [
                    {
                        'os': 'default',
                        'uri': url
                    }
                ]
            };
        });
    }
    
    /**
     * الحصول على قيمة متداخلة
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    /**
     * استبدال القوالب
     */
    interpolateTemplate(template, data) {
        return template.replace(/\{([^}]+)\}/g, (match, key) => {
            const value = this.getNestedValue(data, key);
            return value || match;
        });
    }
    
    /**
     * توليد معرف إشعار
     */
    generateNotificationId() {
        return 'notif_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    /**
     * بدء المعالجة الدورية
     */
    startPeriodicProcessing() {
        setInterval(() => {
            this.processPendingNotifications();
            this.sendDueBatches();
        }, 30000); // كل 30 ثانية
    }
    
    /**
     * معالجة الإشعارات المعلقة
     */
    async processPendingNotifications() {
        const now = Date.now();
        
        for (const [id, notification] of this.pendingNotifications.entries()) {
            if (now - notification.createdAt > 5 * 60 * 1000) { // 5 دقائق
                // إعادة المحاولة
                notification.retryCount++;
                if (notification.retryCount <= notification.maxRetries) {
                    await this.sendToChannels(notification);
                } else {
                    this.pendingNotifications.delete(id);
                }
            }
        }
    }
    
    /**
     * إرسال الدفعات المستحقة
     */
    sendDueBatches() {
        for (const [batchKey] of this.batches.entries()) {
            this.sendBatch(batchKey);
        }
    }
    
    /**
     * بدء مهمة التنظيف
     */
    startCleanupTask() {
        setInterval(() => {
            this.cleanupOldData();
        }, 60 * 60 * 1000); // كل ساعة
    }
    
    /**
     * تنظيف البيانات القديمة
     */
    cleanupOldData() {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        // تنظيف تاريخ الإشعارات
        this.notificationHistory = this.notificationHistory.filter(
            n => new Date(n.timestamp).getTime() > oneDayAgo
        );
        
        // تنظيف المؤقتات
        for (const [id, timer] of this.escalationTimers.entries()) {
            clearTimeout(timer);
            this.escalationTimers.delete(id);
        }
    }
    
    /**
     * الحصول على إحصائيات الإشعارات
     */
    getNotificationStats() {
        const stats = {
            total: this.notificationHistory.length,
            bySeverity: {},
            byChannel: {},
            recent: this.notificationHistory.slice(-10)
        };
        
        // إحصائيات حسب الخطورة
        this.notificationHistory.forEach(notification => {
            const severity = notification.errorData.severity;
            stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
            
            // إحصائيات حسب القناة
            notification.channels.forEach(channel => {
                stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
            });
        });
        
        return stats;
    }
    
    /**
     * مسح سجل الإشعارات
     */
    clearHistory() {
        this.notificationHistory = [];
        this.pendingNotifications.clear();
        this.batches.clear();
    }
}

// إنشاء instance عام
const errorNotifications = new ErrorNotifications();

// تصدير للاستخدام مع وحدات
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorNotifications, errorNotifications };
}