/**
 * نظام قنوات الإشعارات - Notification Channels System
 * manages all notification channels for alerts
 * إدارة جميع قنوات الإشعارات للتنبيهات
 */

const axios = require('axios');
const nodemailer = require('nodemailer');
const { WebhookClient } = require('discord.js');
const twilio = require('twilio');

class NotificationChannels {
    constructor() {
        this.channels = new Map();
        this.templates = new Map();
        this.rateLimiters = new Map();
        this.loadConfiguration();
        this.initializeTemplates();
    }

    /**
     * تحميل تكوين قنوات الإشعارات
     */
    loadConfiguration() {
        const config = {
            email: {
                host: process.env.SMTP_HOST || 'localhost',
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                from: process.env.SMTP_FROM || 'monitoring@saler.com'
            },
            slack: {
                webhook: process.env.SLACK_WEBHOOK_URL,
                token: process.env.SLACK_BOT_TOKEN,
                channel: process.env.SLACK_CHANNEL || '#alerts'
            },
            discord: {
                webhook: process.env.DISCORD_WEBHOOK_URL,
                botToken: process.env.DISCORD_BOT_TOKEN,
                channelId: process.env.DISCORD_CHANNEL_ID
            },
            sms: {
                accountSid: process.env.TWILIO_ACCOUNT_SID,
                authToken: process.env.TWILIO_AUTH_TOKEN,
                from: process.env.TWILIO_PHONE_NUMBER
            },
            webhook: {
                timeout: 30000,
                retries: 3
            },
            teams: {
                webhook: process.env.TEAMS_WEBHOOK_URL,
                tenantId: process.env.TEAMS_TENANT_ID,
                clientId: process.env.TEAMS_CLIENT_ID,
                clientSecret: process.env.TEAMS_CLIENT_SECRET
            },
            pagerduty: {
                integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
                serviceKey: process.env.PAGERDUTY_SERVICE_KEY,
                apiToken: process.env.PAGERDUTY_API_TOKEN
            }
        };

        this.config = config;
        this.initializeClients();
    }

    /**
     * تهيئة عملاء القنوات
     */
    initializeClients() {
        // البريد الإلكتروني
        this.emailClient = nodemailer.createTransporter({
            host: this.config.email.host,
            port: this.config.email.port,
            secure: this.config.email.secure,
            auth: {
                user: this.config.email.auth.user,
                pass: this.config.email.auth.pass
            }
        });

        // Discord
        if (this.config.discord.webhook) {
            this.discordClient = new WebhookClient({ 
                url: this.config.discord.webhook 
            });
        }

        // Twilio
        if (this.config.sms.accountSid && this.config.sms.authToken) {
            this.twilioClient = twilio(
                this.config.sms.accountSid,
                this.config.sms.authToken
            );
        }
    }

    /**
     * تهيئة قوالب الإشعارات
     */
    initializeTemplates() {
        // قالب البريد الإلكتروني
        this.templates.set('email-html', `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .severity-critical { border-left: 5px solid #dc3545; }
                    .severity-warning { border-left: 5px solid #ffc107; }
                    .severity-info { border-left: 5px solid #17a2b8; }
                    .metric { background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 4px; }
                    .footer { background: #343a40; color: white; padding: 15px; text-align: center; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>{{ALERT_TITLE}}</h1>
                        <p>نظام مراقبة سالير - Saler Monitoring System</p>
                    </div>
                    <div class="content severity-{{SEVERITY}}">
                        <h2>تفاصيل التنبيه</h2>
                        <p><strong>الوقت:</strong> {{TIMESTAMP}}</p>
                        <p><strong>الشدة:</strong> {{SEVERITY_AR}}</p>
                        <p><strong>الخدمة:</strong> {{SERVICE_NAME}}</p>
                        <p><strong>المكون:</strong> {{COMPONENT}}</p>
                        <div class="metric">
                            <h3>المقاييس</h3>
                            {{METRICS_HTML}}
                        </div>
                        <div class="metric">
                            <h3>الوصف</h3>
                            <p>{{DESCRIPTION}}</p>
                        </div>
                        <div class="metric">
                            <h3>إجراءات مقترحة</h3>
                            <p>{{ACTION_SUGGESTIONS}}</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>تم إنشاء هذا التنبيه بواسطة نظام مراقبة سالير</p>
                    </div>
                </div>
            </body>
            </html>
        `);

        // قالب Slack
        this.templates.set('slack', {
            text: ':warning: **{{ALERT_TITLE}}**',
            attachments: [
                {
                    color: '{{SLACK_COLOR}}',
                    fields: [
                        {
                            title: 'الشدة',
                            value: '{{SEVERITY_AR}}',
                            short: true
                        },
                        {
                            title: 'الوقت',
                            value: '{{TIMESTAMP}}',
                            short: true
                        },
                        {
                            title: 'الخدمة',
                            value: '{{SERVICE_NAME}}',
                            short: true
                        },
                        {
                            title: 'المكون',
                            value: '{{COMPONENT}}',
                            short: true
                        }
                    ],
                    footer: 'نظام مراقبة سالير',
                    ts: {{TIMESTAMP_UNIX}}
                }
            ]
        });

        // قالب Discord
        this.templates.set('discord', {
            embeds: [
                {
                    title: ':warning: {{ALERT_TITLE}}',
                    color: {{DISCORD_COLOR}},
                    fields: [
                        {
                            name: 'الشدة',
                            value: '{{SEVERITY_AR}}',
                            inline: true
                        },
                        {
                            name: 'الوقت',
                            value: '{{TIMESTAMP}}',
                            inline: true
                        },
                        {
                            name: 'الخدمة',
                            value: '{{SERVICE_NAME}}',
                            inline: true
                        },
                        {
                            name: 'المكون',
                            value: '{{COMPONENT}}',
                            inline: true
                        }
                    ],
                    description: '{{DESCRIPTION}}',
                    footer: {
                        text: 'نظام مراقبة سالير'
                    },
                    timestamp: '{{TIMESTAMP_ISO}}'
                }
            ]
        });

        // قالب SMS
        this.templates.set('sms', '⚠️ {{ALERT_TITLE}}\nالشدة: {{SEVERITY_AR}}\nالخدمة: {{SERVICE_NAME}}\nالوقت: {{TIMESTAMP}}\nتفاصيل: {{DESCRIPTION}}');

        // قالب Teams
        this.templates.set('teams', {
            "@type": "MessageCard",
            "@context": "https://schema.org/extensions",
            "themeColor": "{{TEAMS_COLOR}}",
            "summary": "{{ALERT_TITLE}}",
            "title": "⚠️ {{ALERT_TITLE}}",
            "sections": [
                {
                    "activityTitle": "تفاصيل التنبيه",
                    "activitySubtitle": "نظام مراقبة سالير",
                    "facts": [
                        {
                            "name": "الشدة",
                            "value": "{{SEVERITY_AR}}"
                        },
                        {
                            "name": "الوقت",
                            "value": "{{TIMESTAMP}}"
                        },
                        {
                            "name": "الخدمة",
                            "value": "{{SERVICE_NAME}}"
                        },
                        {
                            "name": "المكون",
                            "value": "{{COMPONENT}}"
                        }
                    ],
                    "markdown": true
                },
                {
                    "text": "{{DESCRIPTION}}"
                }
            ],
            "potentialAction": [
                {
                    "@type": "OpenUri",
                    "name": "عرض لوحة المراقبة",
                    "targets": [
                        {
                            "os": "default",
                            "uri": "{{GRAFANA_URL}}"
                        }
                    ]
                }
            ]
        });

        // قالبPagerDuty
        this.templates.set('pagerduty', {
            routing_key: this.config.pagerduty.integrationKey,
            event_action: "trigger",
            dedup_key: "{{ALERT_ID}}",
            payload: {
                summary: "{{ALERT_TITLE}}",
                severity: "{{PAGERDUTY_SEVERITY}}",
                source: "{{SERVICE_NAME}}",
                component: "{{COMPONENT}}",
                group: "saler-monitoring",
                class: "system-alert",
                custom_details: {
                    timestamp: "{{TIMESTAMP}}",
                    description: "{{DESCRIPTION}}",
                    metrics: {{METRICS_JSON}}
                }
            }
        });
    }

    /**
     * تسجيل قناة إشعار جديدة
     */
    async registerChannel(channelId, config) {
        try {
            const channel = {
                id: channelId,
                type: config.type,
                name: config.name || channelId,
                enabled: config.enabled !== false,
                priority: config.priority || 1,
                settings: config.settings || {},
                rateLimit: config.rateLimit || { max: 100, window: 60000 },
                escalation: config.escalation || false,
                testMode: config.testMode || false
            };

            // التحقق من صحة التكوين
            await this.validateChannelConfig(channel);

            this.channels.set(channelId, channel);
            
            // تهيئة محدد السرعة
            this.rateLimiters.set(channelId, {
                requests: [],
                max: channel.rateLimit.max,
                window: channel.rateLimit.window
            });

            console.log(`✅ تم تسجيل قناة الإشعار: ${channelId}`);
            return true;
        } catch (error) {
            console.error(`❌ خطأ في تسجيل قناة الإشعار ${channelId}:`, error);
            return false;
        }
    }

    /**
     * التحقق من صحة تكوين القناة
     */
    async validateChannelConfig(channel) {
        const { type, settings } = channel;

        switch (type) {
            case 'email':
                if (!settings.to || !settings.subject) {
                    throw new Error('Email requires "to" and "subject" settings');
                }
                break;
            case 'slack':
                if (!this.config.slack.webhook) {
                    throw new Error('Slack webhook not configured');
                }
                break;
            case 'discord':
                if (!this.config.discord.webhook) {
                    throw new Error('Discord webhook not configured');
                }
                break;
            case 'sms':
                if (!settings.to || !this.twilioClient) {
                    throw new Error('SMS requires "to" number and Twilio configuration');
                }
                break;
            case 'webhook':
                if (!settings.url) {
                    throw new Error('Webhook requires "url" setting');
                }
                break;
            case 'teams':
                if (!this.config.teams.webhook) {
                    throw new Error('Teams webhook not configured');
                }
                break;
            case 'pagerduty':
                if (!this.config.pagerduty.integrationKey) {
                    throw new Error('PagerDuty integration key not configured');
                }
                break;
            default:
                throw new Error(`Unknown channel type: ${type}`);
        }
    }

    /**
     * إرسال إشعار عبر قناة محددة
     */
    async sendNotification(channelId, alert) {
        try {
            const channel = this.channels.get(channelId);
            if (!channel) {
                throw new Error(`Channel not found: ${channelId}`);
            }

            if (!channel.enabled) {
                console.log(`⚠️ القناة معطلة: ${channelId}`);
                return false;
            }

            // فحص محدد السرعة
            if (!this.checkRateLimit(channelId)) {
                console.log(`🚫 تم تجاوز محدد السرعة للقناة: ${channelId}`);
                return false;
            }

            // إضافة طلب إلى محدد السرعة
            this.addToRateLimit(channelId);

            // تحديث حالة الإشعار
            alert.channels = alert.channels || [];
            if (!alert.channels.includes(channelId)) {
                alert.channels.push(channelId);
            }

            // إرسال الإشعار
            await this.deliverNotification(channel, alert);

            console.log(`✅ تم إرسال الإشعار عبر القناة: ${channelId}`);
            return true;
        } catch (error) {
            console.error(`❌ خطأ في إرسال الإشعار عبر ${channelId}:`, error);
            return false;
        }
    }

    /**
     * إرسال الإشعار للقناة
     */
    async deliverNotification(channel, alert) {
        const template = this.templates.get(channel.type);
        const context = this.buildTemplateContext(alert);

        switch (channel.type) {
            case 'email':
                await this.sendEmail(channel, template, context, alert);
                break;
            case 'slack':
                await this.sendSlack(channel, template, context, alert);
                break;
            case 'discord':
                await this.sendDiscord(channel, template, context, alert);
                break;
            case 'sms':
                await this.sendSMS(channel, template, context, alert);
                break;
            case 'webhook':
                await this.sendWebhook(channel, template, context, alert);
                break;
            case 'teams':
                await this.sendTeams(channel, template, context, alert);
                break;
            case 'pagerduty':
                await this.sendPagerDuty(channel, template, context, alert);
                break;
            default:
                throw new Error(`Unsupported channel type: ${channel.type}`);
        }
    }

    /**
     * بناء سياق القالب
     */
    buildTemplateContext(alert) {
        const severityMap = {
            'critical': { ar: 'حرج', slack: '#dc3545', discord: 0xFF0000, teams: 'FF0000' },
            'warning': { ar: 'تحذير', slack: '#ffc107', discord: 0xFFFF00, teams: 'FFFF00' },
            'info': { ar: 'معلومات', slack: '#17a2b8', discord: 0x00FFFF, teams: '00FFFF' }
        };

        const pagerDutySeverityMap = {
            'critical': 'critical',
            'warning': 'warning',
            'info': 'info'
        };

        const now = new Date();
        const timestamp = now.toLocaleString('ar-SA');
        const timestampUnix = Math.floor(now.getTime() / 1000);
        const timestampISO = now.toISOString();

        return {
            ...alert,
            TIMESTAMP: timestamp,
            TIMESTAMP_UNIX: timestampUnix,
            TIMESTAMP_ISO: timestampISO,
            SEVERITY_AR: severityMap[alert.severity]?.ar || alert.severity,
            SLACK_COLOR: severityMap[alert.severity]?.slack || '#17a2b8',
            DISCORD_COLOR: severityMap[alert.severity]?.discord || 0x00FFFF,
            TEAMS_COLOR: severityMap[alert.severity]?.teams || '00FFFF',
            PAGERDUTY_SEVERITY: pagerDutySeverityMap[alert.severity] || alert.severity,
            METRICS_HTML: this.formatMetricsAsHTML(alert.metrics || {}),
            METRICS_JSON: JSON.stringify(alert.metrics || {}),
            ALERT_TITLE: alert.title || `${alert.severity.toUpperCase()} Alert`,
            DESCRIPTION: alert.description || 'No description provided',
            ACTION_SUGGESTIONS: alert.actionSuggestions || 'Check system logs and metrics',
            SERVICE_NAME: alert.service || 'Unknown Service',
            COMPONENT: alert.component || 'Unknown Component',
            GRAFANA_URL: process.env.GRAFANA_URL || 'http://localhost:3000'
        };
    }

    /**
     * تنسيق المقاييس كـ HTML
     */
    formatMetricsAsHTML(metrics) {
        return Object.entries(metrics)
            .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
            .join('');
    }

    /**
     * إرسال البريد الإلكتروني
     */
    async sendEmail(channel, template, context, alert) {
        const { settings } = channel;
        
        const mailOptions = {
            from: this.config.email.from,
            to: settings.to,
            subject: this.interpolateTemplate(template.subject || 'Alert: {{ALERT_TITLE}}', context),
            html: this.interpolateTemplate(template, context),
            text: this.generateTextVersion(context)
        };

        if (settings.cc) {
            mailOptions.cc = settings.cc;
        }

        await this.emailClient.sendMail(mailOptions);
    }

    /**
     * إرسال Slack
     */
    async sendSlack(channel, template, context, alert) {
        const payload = this.interpolateTemplate(JSON.stringify(template), context);
        
        await axios.post(this.config.slack.webhook, JSON.parse(payload), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * إرسال Discord
     */
    async sendDiscord(channel, template, context, alert) {
        const payload = this.interpolateTemplate(JSON.stringify(template), context);
        
        await axios.post(this.config.discord.webhook, JSON.parse(payload), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * إرسال SMS
     */
    async sendSMS(channel, template, context, alert) {
        const { settings } = channel;
        const message = this.interpolateTemplate(template, context);
        
        await this.twilioClient.messages.create({
            body: message,
            from: this.config.sms.from,
            to: settings.to
        });
    }

    /**
     * إرسال Webhook
     */
    async sendWebhook(channel, template, context, alert) {
        const { settings } = channel;
        
        const payload = {
            alert,
            context,
            timestamp: new Date().toISOString(),
            channel: channel.id
        };

        await axios.post(settings.url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Saler-Monitoring/1.0',
                ...settings.headers
            },
            timeout: this.config.webhook.timeout
        });
    }

    /**
     * إرسال Teams
     */
    async sendTeams(channel, template, context, alert) {
        const payload = this.interpolateTemplate(JSON.stringify(template), context);
        
        await axios.post(this.config.teams.webhook, JSON.parse(payload), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * إرسال PagerDuty
     */
    async sendPagerDuty(channel, template, context, alert) {
        const payload = this.interpolateTemplate(JSON.stringify(template), context);
        
        await axios.post('https://events.pagerduty.com/v2/enqueue', JSON.parse(payload), {
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.pagerduty+json;version=2'
            }
        });
    }

    /**
     * استبدال القيم في القالب
     */
    interpolateTemplate(template, context) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return context[key] !== undefined ? context[key] : match;
        });
    }

    /**
     * إنشاء نسخة نصية للإشعار
     */
    generateTextVersion(context) {
        return `
تنبيه نظام مراقبة سالير

العنوان: ${context.ALERT_TITLE}
الوقت: ${context.TIMESTAMP}
الشدة: ${context.SEVERITY_AR}
الخدمة: ${context.SERVICE_NAME}
المكون: ${context.COMPONENT}

الوصف:
${context.DESCRIPTION}

مقاييس:
${Object.entries(context.METRICS_JSON ? JSON.parse(context.METRICS_JSON) : {})
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n')}

إجراءات مقترحة:
${context.ACTION_SUGGESTIONS}
        `;
    }

    /**
     * فحص محدد السرعة
     */
    checkRateLimit(channelId) {
        const limiter = this.rateLimiters.get(channelId);
        if (!limiter) return true;

        const now = Date.now();
        limiter.requests = limiter.requests.filter(time => now - time < limiter.window);
        
        return limiter.requests.length < limiter.max;
    }

    /**
     * إضافة طلب لمحدد السرعة
     */
    addToRateLimit(channelId) {
        const limiter = this.rateLimiters.get(channelId);
        if (limiter) {
            limiter.requests.push(Date.now());
        }
    }

    /**
     * إرسال إشعارات متعددة القنوات
     */
    async sendToMultipleChannels(channelIds, alert, options = {}) {
        const results = {};
        
        for (const channelId of channelIds) {
            try {
                if (options.parallel) {
                    // إرسال متوازي
                    results[channelId] = this.sendNotification(channelId, alert);
                } else {
                    // إرسال متتالي
                    results[channelId] = await this.sendNotification(channelId, alert);
                }
            } catch (error) {
                results[channelId] = { success: false, error: error.message };
            }
        }

        if (options.parallel) {
            const settled = await Promise.allSettled(Object.values(results));
            Object.keys(results).forEach((key, index) => {
                results[key] = settled[index].status === 'fulfilled';
            });
        }

        return results;
    }

    /**
     * الحصول على إحصائيات القنوات
     */
    getChannelStats() {
        const stats = {};
        
        for (const [channelId, channel] of this.channels) {
            const limiter = this.rateLimiters.get(channelId);
            stats[channelId] = {
                ...channel,
                rateLimitUsage: limiter ? limiter.requests.length : 0,
                rateLimitMax: limiter ? limiter.max : 0
            };
        }

        return stats;
    }

    /**
     * تعطيل/تفعيل قناة
     */
    toggleChannel(channelId, enabled) {
        const channel = this.channels.get(channelId);
        if (channel) {
            channel.enabled = enabled;
            console.log(` القناة ${channelId}: ${enabled ? 'مفعلة' : 'معطلة'}`);
            return true;
        }
        return false;
    }

    /**
     * حذف قناة
     */
    removeChannel(channelId) {
        const deleted = this.channels.delete(channelId);
        if (deleted) {
            this.rateLimiters.delete(channelId);
            console.log(`🗑️ تم حذف القناة: ${channelId}`);
        }
        return deleted;
    }
}

module.exports = NotificationChannels;