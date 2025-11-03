/**
 * ملف تكوين التكامل المتقدم
 * Advanced Integration Configuration
 * 
 * تكوين التكامل مع الخدمات الخارجية (PagerDuty, Slack, Discord, Webhooks)
 * Configuration for external service integration (PagerDuty, Slack, Discord, Webhooks)
 */

const EventEmitter = require('events');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class AdvancedIntegrationConfig extends EventEmitter {
    constructor(options = {}) {
        super();
        this.configPath = options.configPath || './integration_config.json';
        this.environment = options.environment || 'production';
        this.timeout = options.timeout || 10000;
        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000;

        this.integrations = {};
        this.webhooks = new Map();
        this.routingRules = new Map();
        this.fallbackChains = new Map();
        this.rateLimits = new Map();

        this.loadConfiguration();
        this.initializeIntegrations();
        this.setupRoutingRules();
        this.startPeriodicCleanup();

        console.log('✅ ملف تكوين التكامل متقدم تم تهيئته بنجاح');
    }

    loadConfiguration() {
        try {
            if (fs.existsSync(this.configPath)) {
                const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                this.integrations = config.integrations || {};
                this.webhooks = new Map(config.webhooks || []);
                this.routingRules = new Map(config.routingRules || []);
                this.fallbackChains = new Map(config.fallbackChains || []);
                console.log('📋 تم تحميل تكوين التكامل من الملف');
            } else {
                this.createDefaultConfiguration();
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل تكوين التكامل:', error);
            this.createDefaultConfiguration();
        }
    }

    createDefaultConfiguration() {
        const defaultConfig = {
            integrations: {
                slack: {
                    enabled: false,
                    webhookUrl: '',
                    botToken: '',
                    defaultChannel: '#monitoring',
                    channels: {
                        critical: '#alerts-critical',
                        warning: '#alerts-warning', 
                        info: '#alerts-info',
                        performance: '#performance',
                        database: '#database'
                    },
                    settings: {
                        mentionUsers: ['@devops', '@engineering'],
                        includeTimestamp: true,
                        includeSeverity: true,
                        includeMetrics: true
                    }
                },
                discord: {
                    enabled: false,
                    webhookUrl: '',
                    botToken: '',
                    defaultChannel: 'monitoring',
                    channels: {
                        critical: 'critical-alerts',
                        warning: 'warnings',
                        info: 'info',
                        performance: 'performance'
                    },
                    settings: {
                        embedColor: {
                            critical: 0xFF0000,
                            warning: 0xFFA500,
                            info: 0x00BFFF,
                            success: 0x00FF00
                        },
                        mentionRoles: ['@here', '@everyone']
                    }
                },
                pagerduty: {
                    enabled: false,
                    apiKey: '',
                    integrationKey: '',
                    serviceId: '',
                    escalationPolicyId: '',
                    defaultSeverity: 'warning',
                    settings: {
                        autoResolve: true,
                        includeDescription: true,
                        includeDetails: true,
                        customFields: {
                            environment: this.environment,
                            source: 'saler-monitoring-system'
                        }
                    }
                },
                email: {
                    enabled: true,
                    smtp: {
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: false,
                        auth: {
                            user: '',
                            pass: ''
                        }
                    },
                    recipients: {
                        critical: ['admin@saler.com', 'devops@saler.com'],
                        warning: ['team@saler.com'],
                        info: ['info@saler.com']
                    },
                    settings: {
                        from: 'monitoring@saler.com',
                        replyTo: 'alerts@saler.com',
                        includeAttachments: true,
                        htmlTemplate: true
                    }
                },
                sms: {
                    enabled: false,
                    provider: 'twilio',
                    accountSid: '',
                    authToken: '',
                    fromNumber: '',
                    recipients: {
                        critical: ['+1234567890'],
                        warning: ['+1234567891']
                    },
                    settings: {
                        maxLength: 160,
                        includeUrl: true
                    }
                },
                webhook: {
                    enabled: false,
                    endpoints: [
                        {
                            name: 'custom-alert-endpoint',
                            url: '',
                            method: 'POST',
                            headers: {},
                            auth: {
                                type: 'bearer',
                                token: ''
                            },
                            retryOnFailure: true,
                            timeout: 5000
                        }
                    ]
                }
            },
            routingRules: [
                {
                    name: 'critical_alerts',
                    condition: 'severity == "critical"',
                    actions: ['pagerduty', 'slack', 'email']
                },
                {
                    name: 'performance_degradation',
                    condition: 'type == "performance" && severity >= "warning"',
                    actions: ['slack', 'webhook']
                },
                {
                    name: 'database_issues',
                    condition: 'type == "database"',
                    actions: ['slack', 'pagerduty', 'email']
                },
                {
                    name: 'security_alerts',
                    condition: 'type == "security"',
                    actions: ['pagerduty', 'discord', 'email']
                },
                {
                    name: 'info_messages',
                    condition: 'severity == "info"',
                    actions: ['slack']
                }
            ],
            fallbackChains: {
                'pagerduty': ['email', 'slack'],
                'slack': ['discord', 'email'],
                'email': ['slack'],
                'webhook': ['slack', 'email']
            },
            webhooks: [],
            rateLimits: {
                'slack': { requests: 100, window: 60000 },
                'pagerduty': { requests: 100, window: 60000 },
                'discord': { requests: 50, window: 60000 }
            }
        };

        this.integrations = defaultConfig.integrations;
        this.routingRules = new Map(defaultConfig.routingRules.map(rule => [rule.name, rule]));
        this.fallbackChains = new Map(Object.entries(defaultConfig.fallbackChains));
        this.webhooks = new Map(defaultConfig.webhooks);
        this.rateLimits = new Map(Object.entries(defaultConfig.rateLimits));

        this.saveConfiguration();
        console.log('📝 تم إنشاء تكوين التكامل الافتراضي');
    }

    saveConfiguration() {
        try {
            const config = {
                integrations: this.integrations,
                routingRules: Array.from(this.routingRules.entries()),
                fallbackChains: Object.fromEntries(this.fallbackChains),
                webhooks: Array.from(this.webhooks.entries()),
                rateLimits: Object.fromEntries(this.rateLimits.entries()),
                lastUpdated: new Date()
            };

            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
            console.log('💾 تم حفظ تكوين التكامل');
        } catch (error) {
            console.error('❌ خطأ في حفظ تكوين التكامل:', error);
        }
    }

    initializeIntegrations() {
        // Initialize Slack integration
        if (this.integrations.slack.enabled) {
            this.slackIntegration = new SlackIntegration(this.integrations.slack, this);
        }

        // Initialize Discord integration
        if (this.integrations.discord.enabled) {
            this.discordIntegration = new DiscordIntegration(this.integrations.discord, this);
        }

        // Initialize PagerDuty integration
        if (this.integrations.pagerduty.enabled) {
            this.pagerdutyIntegration = new PagerDutyIntegration(this.integrations.pagerduty, this);
        }

        // Initialize Email integration
        if (this.integrations.email.enabled) {
            this.emailIntegration = new EmailIntegration(this.integrations.email, this);
        }

        // Initialize SMS integration
        if (this.integrations.sms.enabled) {
            this.smsIntegration = new SMSIntegration(this.integrations.sms, this);
        }

        // Initialize Webhook integrations
        if (this.integrations.webhook.enabled) {
            this.webhookIntegration = new WebhookIntegration(this.integrations.webhook, this);
        }
    }

    setupRoutingRules() {
        // Additional routing rules can be added here
        console.log('🔀 تم إعداد قواعد التوجيه');
    }

    async sendAlert(alert) {
        try {
            console.log(`📨 إرسال التنبيه: ${alert.title} (${alert.severity})`);
            
            // Determine routing based on alert properties
            const routes = this.determineRoutes(alert);
            
            // Send to each route with fallback
            const results = [];
            for (const route of routes) {
                try {
                    const result = await this.sendToRoute(route, alert);
                    results.push({ route, result: 'success', data: result });
                } catch (error) {
                    console.error(`❌ فشل في إرسال التنبيه عبر ${route}:`, error.message);
                    results.push({ route, result: 'failed', error: error.message });
                    
                    // Try fallback chain
                    await this.tryFallbackChain(route, alert, error);
                }
            }

            this.emit('alert_sent', { alert, results });
            return results;

        } catch (error) {
            console.error('❌ خطأ في إرسال التنبيه:', error);
            this.emit('alert_failed', { alert, error });
            throw error;
        }
    }

    determineRoutes(alert) {
        const routes = [];
        
        // Check each routing rule
        for (const [ruleName, rule] of this.routingRules) {
            if (this.evaluateCondition(rule.condition, alert)) {
                routes.push(...rule.actions);
            }
        }

        // Remove duplicates and return
        return [...new Set(routes)];
    }

    evaluateCondition(condition, alert) {
        try {
            // Simple condition evaluation
            // In production, you'd want a proper expression parser
            const context = {
                severity: alert.severity,
                type: alert.type || 'general',
                title: alert.title || '',
                description: alert.description || '',
                ...alert
            };

            // Basic condition parsing
            if (condition.includes('==')) {
                const [left, right] = condition.split('==').map(s => s.trim());
                return context[left.replace(/['"]/g, '')] === right.replace(/['"]/g, '');
            }
            
            if (condition.includes('>=')) {
                const [left, right] = condition.split('>=').map(s => s.trim());
                const leftValue = parseFloat(context[left.replace(/['"]/g, '')]);
                const rightValue = parseFloat(right.replace(/['"]/g, ''));
                return leftValue >= rightValue;
            }

            if (condition.includes('&&')) {
                const conditions = condition.split('&&').map(s => s.trim());
                return conditions.every(cond => this.evaluateCondition(cond, alert));
            }

            return false;
        } catch (error) {
            console.error('خطأ في تقييم الشرط:', error);
            return false;
        }
    }

    async sendToRoute(route, alert) {
        const integration = this.getIntegration(route);
        if (!integration) {
            throw new Error(`Integration not found: ${route}`);
        }

        // Check rate limits
        if (!this.checkRateLimit(route)) {
            throw new Error(`Rate limit exceeded for ${route}`);
        }

        // Format alert for specific integration
        const formattedAlert = this.formatAlertForIntegration(route, alert);
        
        // Send the alert
        const result = await integration.send(formattedAlert);
        
        // Update rate limit
        this.updateRateLimit(route);
        
        return result;
    }

    async tryFallbackChain(primaryRoute, alert, error) {
        const fallbackChain = this.fallbackChains.get(primaryRoute);
        if (!fallbackChain) {
            console.log(`⚠️ لا توجد سلسلة احتياطية لـ ${primaryRoute}`);
            return;
        }

        console.log(`🔄 محاولة السلسلة الاحتياطية لـ ${primaryRoute}`);
        
        for (const fallbackRoute of fallbackChain) {
            try {
                await this.sendToRoute(fallbackRoute, alert);
                console.log(`✅ نجح في السلسلة الاحتياطية عبر ${fallbackRoute}`);
                return;
            } catch (fallbackError) {
                console.error(`❌ فشل في السلسلة الاحتياطية عبر ${fallbackRoute}:`, fallbackError.message);
            }
        }

        console.log(`❌ فشلت جميع محاولات السلسلة الاحتياطية لـ ${primaryRoute}`);
    }

    formatAlertForIntegration(route, alert) {
        const baseFormat = {
            title: alert.title,
            description: alert.description,
            severity: alert.severity,
            timestamp: new Date(),
            source: 'saler-monitoring-system',
            environment: this.environment
        };

        switch (route) {
            case 'slack':
                return this.formatForSlack(alert, baseFormat);
            case 'discord':
                return this.formatForDiscord(alert, baseFormat);
            case 'pagerduty':
                return this.formatForPagerDuty(alert, baseFormat);
            case 'email':
                return this.formatForEmail(alert, baseFormat);
            case 'sms':
                return this.formatForSMS(alert, baseFormat);
            case 'webhook':
                return this.formatForWebhook(alert, baseFormat);
            default:
                return baseFormat;
        }
    }

    formatForSlack(alert, baseFormat) {
        const slackConfig = this.integrations.slack;
        const color = {
            'critical': '#FF0000',
            'warning': '#FFA500',
            'info': '#00BFFF',
            'success': '#00FF00'
        }[alert.severity] || '#808080';

        return {
            channel: this.selectSlackChannel(alert),
            username: 'Saler Monitoring',
            icon_emoji: ':warning:',
            attachments: [
                {
                    color: color,
                    title: alert.title,
                    text: alert.description,
                    fields: alert.metrics ? Object.entries(alert.metrics).map(([key, value]) => ({
                        title: key,
                        value: value.toString(),
                        short: true
                    })) : [],
                    footer: 'Saler Monitoring System',
                    ts: Math.floor(Date.now() / 1000)
                }
            ]
        };
    }

    selectSlackChannel(alert) {
        const slackConfig = this.integrations.slack;
        const channelMap = slackConfig.channels || {};
        
        if (alert.type && channelMap[alert.type]) {
            return channelMap[alert.type];
        }
        
        return slackConfig.defaultChannel || '#monitoring';
    }

    formatForDiscord(alert, baseFormat) {
        const discordConfig = this.integrations.discord;
        const color = discordConfig.settings.embedColor[alert.severity] || 0x808080;

        return {
            channel: this.selectDiscordChannel(alert),
            content: discordConfig.settings.mentionRoles.join(' '),
            embeds: [
                {
                    title: alert.title,
                    description: alert.description,
                    color: color,
                    fields: alert.metrics ? Object.entries(alert.metrics).map(([key, value]) => ({
                        name: key,
                        value: value.toString(),
                        inline: true
                    })) : [],
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: 'Saler Monitoring System'
                    }
                }
            ]
        };
    }

    selectDiscordChannel(alert) {
        const discordConfig = this.integrations.discord;
        const channelMap = discordConfig.channels || {};
        
        if (alert.type && channelMap[alert.type]) {
            return channelMap[alert.type];
        }
        
        return discordConfig.defaultChannel || 'monitoring';
    }

    formatForPagerDuty(alert, baseFormat) {
        const pagerdutyConfig = this.integrations.pagerduty;
        
        return {
            routing_key: pagerdutyConfig.integrationKey,
            event_action: alert.status === 'resolved' ? 'resolve' : 'trigger',
            dedup_key: alert.id || `alert_${Date.now()}`,
            payload: {
                summary: alert.title,
                source: alert.source || 'saler-monitoring-system',
                severity: this.mapSeverityToPagerDuty(alert.severity),
                component: alert.component || 'monitoring-system',
                group: alert.group || 'infrastructure',
                class: alert.class || 'performance',
                custom_details: {
                    description: alert.description,
                    environment: this.environment,
                    timestamp: new Date().toISOString(),
                    ...alert.metrics
                }
            }
        };
    }

    mapSeverityToPagerDuty(severity) {
        const mapping = {
            'critical': 'critical',
            'warning': 'warning',
            'info': 'info',
            'success': 'info'
        };
        return mapping[severity] || 'warning';
    }

    formatForEmail(alert, baseFormat) {
        const emailConfig = this.integrations.email;
        const recipients = emailConfig.recipients[alert.severity] || emailConfig.recipients.info;
        
        return {
            from: emailConfig.settings.from,
            to: recipients.join(', '),
            subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
            html: this.generateEmailHTML(alert),
            text: this.generateEmailText(alert),
            attachments: alert.attachments || []
        };
    }

    generateEmailHTML(alert) {
        const severityColors = {
            'critical': '#FF0000',
            'warning': '#FFA500',
            'info': '#00BFFF',
            'success': '#00FF00'
        };
        
        const color = severityColors[alert.severity] || '#808080';
        
        return `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; direction: rtl; }
                .header { background: ${color}; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .metric { background: white; padding: 10px; margin: 5px 0; border-radius: 5px; }
                .footer { background: #333; color: white; padding: 15px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${alert.title}</h1>
                <p>شدة التنبيه: ${alert.severity}</p>
                <p>الوقت: ${new Date().toLocaleString('ar-SA')}</p>
            </div>
            <div class="content">
                <h2>الوصف</h2>
                <p>${alert.description}</p>
                ${alert.metrics ? `
                <h2>المقاييس</h2>
                ${Object.entries(alert.metrics).map(([key, value]) => 
                    `<div class="metric"><strong>${key}:</strong> ${value}</div>`
                ).join('')}` : ''}
            </div>
            <div class="footer">
                <p>نظام مراقبة سالير - Saler Monitoring System</p>
            </div>
        </body>
        </html>
        `;
    }

    generateEmailText(alert) {
        let text = `تنبيه: ${alert.title}\n\n`;
        text += `الوصف: ${alert.description}\n\n`;
        text += `الشدة: ${alert.severity}\n`;
        text += `الوقت: ${new Date().toLocaleString('ar-SA')}\n\n`;
        
        if (alert.metrics) {
            text += 'المقاييس:\n';
            Object.entries(alert.metrics).forEach(([key, value]) => {
                text += `  ${key}: ${value}\n`;
            });
        }
        
        return text;
    }

    formatForSMS(alert, baseFormat) {
        const smsConfig = this.integrations.sms;
        const recipients = smsConfig.recipients[alert.severity] || smsConfig.recipients.warning;
        
        let message = `[${alert.severity.toUpperCase()}] ${alert.title}\n`;
        message += `${alert.description}\n`;
        message += `الوقت: ${new Date().toLocaleTimeString('ar-SA')}\n`;
        
        if (smsConfig.settings.includeUrl && alert.url) {
            message += `التفاصيل: ${alert.url}\n`;
        }
        
        return {
            to: recipients,
            body: message.substring(0, smsConfig.settings.maxLength || 160)
        };
    }

    formatForWebhook(alert, baseFormat) {
        return {
            url: this.integrations.webhook.endpoints[0].url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Saler-Monitoring/1.0'
            },
            data: {
                ...baseFormat,
                id: alert.id || `alert_${Date.now()}`,
                status: alert.status || 'triggered',
                alert_id: alert.id,
                triggered_at: new Date().toISOString(),
                ...alert
            }
        };
    }

    getIntegration(route) {
        const integrationMap = {
            'slack': this.slackIntegration,
            'discord': this.discordIntegration,
            'pagerduty': this.pagerdutyIntegration,
            'email': this.emailIntegration,
            'sms': this.smsIntegration,
            'webhook': this.webhookIntegration
        };
        
        return integrationMap[route];
    }

    checkRateLimit(route) {
        const limit = this.rateLimits.get(route);
        if (!limit) return true;
        
        const now = Date.now();
        const windowStart = now - limit.window;
        
        // Simple rate limiting implementation
        // In production, you'd want more sophisticated rate limiting
        return true; // Simplified for demo
    }

    updateRateLimit(route) {
        const limit = this.rateLimits.get(route);
        if (!limit) return;
        
        // Update rate limit tracking
        // This is a simplified implementation
        console.log(`📊 تم تحديث rate limit لـ ${route}`);
    }

    startPeriodicCleanup() {
        // Clean up old rate limit entries every hour
        setInterval(() => {
            this.cleanupRateLimits();
        }, 3600000);
    }

    cleanupRateLimits() {
        // Implementation for cleaning up old rate limit data
        console.log('🧹 تم تنظيف rate limits القديمة');
    }

    // Configuration management methods
    updateIntegrationConfig(integrationName, config) {
        if (!this.integrations[integrationName]) {
            throw new Error(`Integration not found: ${integrationName}`);
        }
        
        this.integrations[integrationName] = { ...this.integrations[integrationName], ...config };
        this.saveConfiguration();
        
        // Reinitialize integration if needed
        this.initializeIntegrations();
        
        console.log(`✅ تم تحديث تكوين ${integrationName}`);
    }

    addRoutingRule(name, condition, actions) {
        this.routingRules.set(name, {
            name,
            condition,
            actions,
            created: new Date()
        });
        this.saveConfiguration();
        console.log(`✅ تم إضافة قاعدة توجيه جديدة: ${name}`);
    }

    removeRoutingRule(name) {
        const deleted = this.routingRules.delete(name);
        if (deleted) {
            this.saveConfiguration();
            console.log(`✅ تم حذف قاعدة التوجيه: ${name}`);
        }
    }

    getConfiguration() {
        return {
            integrations: this.integrations,
            routingRules: Array.from(this.routingRules.entries()),
            fallbackChains: Object.fromEntries(this.fallbackChains),
            rateLimits: Object.fromEntries(this.rateLimits.entries()),
            environment: this.environment
        };
    }
}

// Integration Classes
class SlackIntegration {
    constructor(config, parent) {
        this.config = config;
        this.parent = parent;
        this.rateLimitDelay = 1000; // 1 second between messages
    }

    async send(alertData) {
        if (!this.config.webhookUrl) {
            throw new Error('Slack webhook URL not configured');
        }

        try {
            const response = await axios.post(this.config.webhookUrl, alertData, {
                timeout: this.parent.timeout,
                headers: { 'Content-Type': 'application/json' }
            });

            console.log(`✅ تم إرسال تنبيه Slack بنجاح`);
            return response.data;

        } catch (error) {
            console.error('❌ فشل في إرسال تنبيه Slack:', error.message);
            throw error;
        }
    }
}

class DiscordIntegration {
    constructor(config, parent) {
        this.config = config;
        this.parent = parent;
    }

    async send(alertData) {
        if (!this.config.webhookUrl) {
            throw new Error('Discord webhook URL not configured');
        }

        try {
            const response = await axios.post(this.config.webhookUrl, alertData, {
                timeout: this.parent.timeout,
                headers: { 'Content-Type': 'application/json' }
            });

            console.log(`✅ تم إرسال تنبيه Discord بنجاح`);
            return response.data;

        } catch (error) {
            console.error('❌ فشل في إرسال تنبيه Discord:', error.message);
            throw error;
        }
    }
}

class PagerDutyIntegration {
    constructor(config, parent) {
        this.config = config;
        this.parent = parent;
    }

    async send(alertData) {
        if (!this.config.integrationKey) {
            throw new Error('PagerDuty integration key not configured');
        }

        try {
            const response = await axios.post('https://events.pagerduty.com/v2/enqueue', alertData, {
                timeout: this.parent.timeout,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Token token=${this.config.apiKey}`
                }
            });

            console.log(`✅ تم إرسال تنبيه PagerDuty بنجاح`);
            return response.data;

        } catch (error) {
            console.error('❌ فشل في إرسال تنبيه PagerDuty:', error.message);
            throw error;
        }
    }
}

class EmailIntegration {
    constructor(config, parent) {
        this.config = config;
        this.parent = parent;
        this.nodeMailer = require('nodemailer');
        this.transporter = this.nodeMailer.createTransporter(this.config.smtp);
    }

    async send(alertData) {
        try {
            const info = await this.transporter.sendMail(alertData);
            console.log(`✅ تم إرسال بريد إلكتروني بنجاح: ${info.messageId}`);
            return info;

        } catch (error) {
            console.error('❌ فشل في إرسال البريد الإلكتروني:', error.message);
            throw error;
        }
    }
}

class SMSIntegration {
    constructor(config, parent) {
        this.config = config;
        this.parent = parent;
        this.twilio = require('twilio');
        this.client = config.accountSid && config.authToken ? 
            this.twilio(config.accountSid, config.authToken) : null;
    }

    async send(alertData) {
        if (!this.client) {
            throw new Error('Twilio credentials not configured');
        }

        try {
            const results = [];
            for (const recipient of alertData.to) {
                const message = await this.client.messages.create({
                    body: alertData.body,
                    from: this.config.fromNumber,
                    to: recipient
                });
                results.push(message.sid);
            }

            console.log(`✅ تم إرسال ${results.length} رسالة SMS بنجاح`);
            return results;

        } catch (error) {
            console.error('❌ فشل في إرسال الرسائل SMS:', error.message);
            throw error;
        }
    }
}

class WebhookIntegration {
    constructor(config, parent) {
        this.config = config;
        this.parent = parent;
    }

    async send(alertData) {
        const endpoint = this.config.endpoints[0];
        if (!endpoint) {
            throw new Error('No webhook endpoints configured');
        }

        try {
            const headers = { ...endpoint.headers };
            if (endpoint.auth && endpoint.auth.type === 'bearer') {
                headers['Authorization'] = `Bearer ${endpoint.auth.token}`;
            }

            const response = await axios({
                method: endpoint.method || 'POST',
                url: endpoint.url,
                data: alertData.data,
                headers,
                timeout: endpoint.timeout || this.parent.timeout
            });

            console.log(`✅ تم إرسال webhook بنجاح`);
            return response.data;

        } catch (error) {
            console.error('❌ فشل في إرسال webhook:', error.message);
            throw error;
        }
    }
}

module.exports = AdvancedIntegrationConfig;

// Example usage
if (require.main === module) {
    const integration = new AdvancedIntegrationConfig({
        configPath: './integration_config.json',
        environment: 'production'
    });

    console.log('🚀 نظام تكامل الخدمات الخارجية بدأ العمل');
    
    // Example alert
    const sampleAlert = {
        id: 'alert_123',
        title: 'ارتفاع استخدام المعالج',
        description: 'استخدام المعالج وصل إلى 85%',
        severity: 'warning',
        type: 'performance',
        metrics: {
            'CPU Usage': '85%',
            'Load Average': '2.1',
            'Memory Usage': '70%'
        },
        timestamp: new Date(),
        source: 'monitoring-system'
    };

    // Simulate sending alert
    setTimeout(async () => {
        try {
            const results = await integration.sendAlert(sampleAlert);
            console.log('📊 نتائج إرسال التنبيه:', results);
        } catch (error) {
            console.error('❌ خطأ في إرسال التنبيه:', error);
        }
    }, 5000);
}