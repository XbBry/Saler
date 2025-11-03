/**
 * نظام التنبيهات المتقدم مع التصعيد الذكي
 * Advanced Alerting System with Smart Escalation
 * 
 * نظام تنبيهات متطور مع تصعيد ذكي وتكامل متعدد القنوات
 * Advanced alerting system with intelligent escalation and multi-channel integration
 */

const EventEmitter = require('events');
const axios = require('axios');
const WebSocket = require('ws');
const winston = require('winston');
const { performance } = require('perf_hooks');
const nodemailer = require('nodemailer');

class AdvancedAlertingSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // إعدادات التنبيهات
            alertProcessingInterval: config.alertProcessingInterval || 5000, // 5 ثواني
            alertRetentionTime: config.alertRetentionTime || 7 * 24 * 60 * 60 * 1000, // 7 أيام
            maxRetries: config.maxRetries || 3,
            
            // إعدادات التصعيد
            escalation: {
                enabled: config.enableEscalation !== false,
                criticalImmediate: config.escalation?.criticalImmediate || ['slack', 'pagerduty', 'sms'],
                highDelay: config.escalation?.highDelay || 300000, // 5 دقائق
                mediumDelay: config.escalation?.mediumDelay || 900000, // 15 دقيقة
                lowDelay: config.escalation?.lowDelay || 1800000, // 30 دقيقة
                ...config.escalation
            },
            
            // قنوات الإشعارات
            channels: {
                slack: {
                    enabled: config.slack?.enabled || false,
                    webhookUrl: config.slack?.webhookUrl || '',
                    channel: config.slack?.channel || '#alerts',
                    mentionAdmins: config.slack?.mentionAdmins || true,
                    ...config.slack
                },
                pagerduty: {
                    enabled: config.pagerduty?.enabled || false,
                    integrationKey: config.pagerduty?.integrationKey || '',
                    serviceKey: config.pagerduty?.serviceKey || '',
                    ...config.pagerduty
                },
                email: {
                    enabled: config.email?.enabled || false,
                    smtpConfig: config.email?.smtpConfig || {
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: false,
                        auth: {
                            user: '',
                            pass: ''
                        }
                    },
                    recipients: {
                        critical: config.email?.recipients?.critical || [],
                        high: config.email?.recipients?.high || [],
                        medium: config.email?.recipients?.medium || [],
                        low: config.email?.recipients?.low || []
                    },
                    ...config.email
                },
                sms: {
                    enabled: config.sms?.enabled || false,
                    provider: config.sms?.provider || 'twilio',
                    accountSid: config.sms?.accountSid || '',
                    authToken: config.sms?.authToken || '',
                    from: config.sms?.from || '',
                    recipients: {
                        critical: config.sms?.recipients?.critical || [],
                        high: config.sms?.recipients?.high || [],
                        ...config.sms?.recipients
                    },
                    ...config.sms
                },
                webhook: {
                    enabled: config.webhook?.enabled || false,
                    urls: config.webhook?.urls || [],
                    ...config.webhook
                },
                webSocket: {
                    enabled: config.webSocket?.enabled !== false,
                    port: config.webSocket?.port || 8081,
                    ...config.webSocket
                }
            },
            
            // قواعد التنبيهات
            alertRules: {
                responseTime: {
                    critical: config.alertRules?.responseTime?.critical || 5000,
                    high: config.alertRules?.responseTime?.high || 3000,
                    medium: config.alertRules?.responseTime?.medium || 2000,
                    low: config.alertRules?.responseTime?.low || 1000
                },
                errorRate: {
                    critical: config.alertRules?.errorRate?.critical || 20,
                    high: config.alertRules?.errorRate?.high || 10,
                    medium: config.alertRules?.errorRate?.medium || 5,
                    low: config.alertRules?.errorRate?.low || 2
                },
                cpuUsage: {
                    critical: config.alertRules?.cpuUsage?.critical || 95,
                    high: config.alertRules?.cpuUsage?.high || 85,
                    medium: config.alertRules?.cpuUsage?.medium || 75,
                    low: config.alertRules?.cpuUsage?.low || 65
                },
                memoryUsage: {
                    critical: config.alertRules?.memoryUsage?.critical || 95,
                    high: config.alertRules?.memoryUsage?.high || 85,
                    medium: config.alertRules?.memoryUsage?.medium || 75,
                    low: config.alertRules?.memoryUsage?.low || 65
                },
                databaseConnections: {
                    critical: config.alertRules?.databaseConnections?.critical || 90,
                    high: config.alertRules?.databaseConnections?.high || 80,
                    medium: config.alertRules?.databaseConnections?.medium || 70,
                    low: config.alertRules?.databaseConnections?.low || 60
                },
                cacheHitRate: {
                    critical: config.alertRules?.cacheHitRate?.critical || 70,
                    high: config.alertRules?.cacheHitRate?.high || 80,
                    medium: config.alertRules?.cacheHitRate?.medium || 85,
                    low: config.alertRules?.cacheHitRate?.low || 90
                },
                ...config.alertRules
            },
            
            // التنبيهات المخصصة
            customAlerts: config.customAlerts || {},
            
            // إعداداتSuppress Noise
            noiseReduction: {
                enabled: config.noiseReduction?.enabled !== false,
                suppressionWindow: config.noiseReduction?.suppressionWindow || 300000, // 5 دقائق
                similarAlertThreshold: config.noiseReduction?.similarAlertThreshold || 0.8,
                ...config.noiseReduction
            },
            
            ...config
        };
        
        this.logger = this._setupLogging();
        
        // تخزين البيانات
        this.activeAlerts = new Map();
        this.alertHistory = [];
        this.suppressedAlerts = new Set();
        this.alertPatterns = new Map();
        
        // إحصائيات الأداء
        this.performanceStats = {
            totalAlerts: 0,
            alertsSent: 0,
            alertsRetried: 0,
            alertsSuppressed: 0,
            escalationsTriggered: 0,
            averageResponseTime: 0,
            lastAlertTime: null,
            channelStats: {}
        };
        
        // إعدادات البريد الإلكتروني
        if (this.config.channels.email.enabled) {
            this._setupEmailTransport();
        }
        
        // إعدادات WebSocket
        if (this.config.channels.webSocket.enabled) {
            this._setupWebSocketServer();
        }
        
        // بدء المعالج
        this.isProcessing = false;
        this.processingInterval = null;
        
        this.logger.info('Advanced Alerting System initialized', {
            channels: Object.keys(this.config.channels).filter(key => this.config.channels[key].enabled),
            escalationEnabled: this.config.escalation.enabled,
            noiseReductionEnabled: this.config.noiseReduction.enabled
        });
    }
    
    /**
     * إعداد نظام السجلات
     */
    _setupLogging() {
        return winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ 
                    filename: 'advanced-alerting.log',
                    maxsize: 10485760, // 10MB
                    maxFiles: 5
                }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }
    
    /**
     * إعداد إرسال البريد الإلكتروني
     */
    _setupEmailTransport() {
        try {
            this.emailTransport = nodemailer.createTransport(this.config.channels.email.smtpConfig);
            this.logger.info('Email transport initialized');
        } catch (error) {
            this.logger.error('Failed to setup email transport', { error: error.message });
        }
    }
    
    /**
     * إعداد خادم WebSocket
     */
    _setupWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.config.channels.webSocket.port });
        
        this.wss.on('connection', (ws) => {
            this.logger.info('Alert WebSocket client connected');
            
            // إرسال التنبيهات النشطة
            ws.send(JSON.stringify({
                type: 'active_alerts',
                data: Array.from(this.activeAlerts.values()),
                timestamp: Date.now()
            }));
            
            ws.on('close', () => {
                this.logger.info('Alert WebSocket client disconnected');
            });
            
            ws.on('error', (error) => {
                this.logger.error('WebSocket error', { error: error.message });
            });
        });
        
        this.logger.info(`Alert WebSocket server started on port ${this.config.channels.webSocket.port}`);
    }
    
    /**
     * بدء المعالج
     */
    start() {
        if (this.isProcessing) {
            this.logger.warn('Alert processing already running');
            return;
        }
        
        this.isProcessing = true;
        this.logger.info('Starting Advanced Alerting System');
        
        // بدء معالجة التنبيهات
        this._startAlertProcessing();
        
        // بدء مراقبة انتهاء التنبيهات
        this._startAlertExpirationMonitoring();
        
        // بدء التصعيد التلقائي
        if (this.config.escalation.enabled) {
            this._startAutomaticEscalation();
        }
        
        // بدء تنظيف البيانات القديمة
        this._startDataCleanup();
        
        this.logger.info('Advanced Alerting System started successfully');
    }
    
    /**
     * إيقاف المعالج
     */
    async stop() {
        this.logger.info('Stopping Advanced Alerting System');
        
        this.isProcessing = false;
        
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
        
        // إغلاق WebSocket
        if (this.wss) {
            this.wss.close();
        }
        
        this.logger.info('Advanced Alerting System stopped');
    }
    
    /**
     * إضافة تنبيه
     */
    async addAlert(alert) {
        const startTime = performance.now();
        
        try {
            // التحقق من صحة التنبيه
            const validatedAlert = this._validateAlert(alert);
            
            // التحقق من كتم التنبيه
            if (await this._shouldSuppressAlert(validatedAlert)) {
                this.performanceStats.alertsSuppressed++;
                this.logger.info('Alert suppressed', { alertId: validatedAlert.id, type: validatedAlert.type });
                return { status: 'suppressed', alert: validatedAlert };
            }
            
            // تحديد الخطورة
            const severity = this._determineSeverity(validatedAlert);
            validatedAlert.severity = severity;
            
            // إضافة طوابع زمنية
            validatedAlert.created_at = Date.now();
            validatedAlert.updated_at = Date.now();
            validatedAlert.status = 'active';
            validatedAlert.retry_count = 0;
            validatedAlert.escalation_level = 0;
            
            // إضافة إلى التنبيهات النشطة
            this.activeAlerts.set(validatedAlert.id, validatedAlert);
            
            // إرسال التنبيه
            const sendResult = await this._sendAlert(validatedAlert);
            
            if (sendResult.success) {
                this.performanceStats.alertsSent++;
                
                // تسجيل نمط التنبيه
                this._recordAlertPattern(validatedAlert);
                
                // إرسال حدث
                this.emit('alertSent', validatedAlert);
                
                // إذا كان حرجاً، ابدأ التصعيد فوراً
                if (severity === 'critical') {
                    this._triggerImmediateEscalation(validatedAlert);
                }
                
            } else {
                this.logger.error('Failed to send alert', { 
                    alertId: validatedAlert.id, 
                    error: sendResult.error 
                });
                validatedAlert.status = 'failed';
                validatedAlert.last_error = sendResult.error;
            }
            
            // تحديث الإحصائيات
            const processingTime = performance.now() - startTime;
            this._updatePerformanceStats(processingTime);
            
            this.performanceStats.totalAlerts++;
            this.performanceStats.lastAlertTime = Date.now();
            
            this.logger.info('Alert processed', { 
                alertId: validatedAlert.id, 
                severity, 
                processingTime: processingTime.toFixed(2) 
            });
            
            return { 
                status: 'processed', 
                alert: validatedAlert, 
                processingTime,
                suppressed: false
            };
            
        } catch (error) {
            this.logger.error('Alert processing failed', { error: error.message, alertId: alert.id });
            return { status: 'error', error: error.message };
        }
    }
    
    /**
     * التحقق من صحة التنبيه
     */
    _validateAlert(alert) {
        const requiredFields = ['id', 'type', 'source', 'message'];
        
        for (const field of requiredFields) {
            if (!alert[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // التحقق من نوع البيانات
        if (typeof alert.id !== 'string') {
            throw new Error('Alert ID must be a string');
        }
        
        if (!['critical', 'high', 'medium', 'low', 'info'].includes(alert.severity || 'medium')) {
            alert.severity = 'medium';
        }
        
        if (typeof alert.message !== 'string') {
            alert.message = String(alert.message);
        }
        
        return alert;
    }
    
    /**
     * التحقق من كتم التنبيه
     */
    async _shouldSuppressAlert(alert) {
        if (!this.config.noiseReduction.enabled) {
            return false;
        }
        
        // التحقق من التنبيهات المتشابهة الحديثة
        const recentAlerts = this.alertHistory.filter(
            a => Date.now() - a.created_at < this.config.noiseReduction.suppressionWindow &&
                 a.type === alert.type &&
                 a.source === alert.source
        );
        
        if (recentAlerts.length > 0) {
            // حساب التشابه
            const similarity = this._calculateAlertSimilarity(recentAlerts[recentAlerts.length - 1], alert);
            
            if (similarity > this.config.noiseReduction.similarAlertThreshold) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * حساب تشابه التنبيهات
     */
    _calculateAlertSimilarity(alert1, alert2) {
        let similarity = 0;
        let factors = 0;
        
        // تشابه النوع
        if (alert1.type === alert2.type) {
            similarity += 0.3;
        }
        factors += 0.3;
        
        // تشابه المصدر
        if (alert1.source === alert2.source) {
            similarity += 0.2;
        }
        factors += 0.2;
        
        // تشابه الرسالة
        const messageSimilarity = this._calculateTextSimilarity(alert1.message, alert2.message);
        similarity += messageSimilarity * 0.5;
        factors += 0.5;
        
        return similarity / factors;
    }
    
    /**
     * حساب تشابه النص
     */
    _calculateTextSimilarity(text1, text2) {
        const words1 = text1.toLowerCase().split(/\s+/);
        const words2 = text2.toLowerCase().split(/\s+/);
        
        const commonWords = words1.filter(word => words2.includes(word));
        const totalWords = new Set([...words1, ...words2]).size;
        
        return totalWords > 0 ? commonWords.length / totalWords : 0;
    }
    
    /**
     * تحديد خطورة التنبيه
     */
    _determineSeverity(alert) {
        // إذا تم تحديد الخطورة مسبقاً، استخدمها
        if (alert.severity) {
            return alert.severity;
        }
        
        // تحديد الخطورة بناءً على قواعد التنبيهات
        switch (alert.type) {
            case 'response_time':
                if (alert.metrics?.value > this.config.alertRules.responseTime.critical) {
                    return 'critical';
                } else if (alert.metrics?.value > this.config.alertRules.responseTime.high) {
                    return 'high';
                } else if (alert.metrics?.value > this.config.alertRules.responseTime.medium) {
                    return 'medium';
                }
                return 'low';
                
            case 'error_rate':
                if (alert.metrics?.value > this.config.alertRules.errorRate.critical) {
                    return 'critical';
                } else if (alert.metrics?.value > this.config.alertRules.errorRate.high) {
                    return 'high';
                } else if (alert.metrics?.value > this.config.alertRules.errorRate.medium) {
                    return 'medium';
                }
                return 'low';
                
            case 'cpu_usage':
                if (alert.metrics?.value > this.config.alertRules.cpuUsage.critical) {
                    return 'critical';
                } else if (alert.metrics?.value > this.config.alertRules.cpuUsage.high) {
                    return 'high';
                } else if (alert.metrics?.value > this.config.alertRules.cpuUsage.medium) {
                    return 'medium';
                }
                return 'low';
                
            case 'memory_usage':
                if (alert.metrics?.value > this.config.alertRules.memoryUsage.critical) {
                    return 'critical';
                } else if (alert.metrics?.value > this.config.alertRules.memoryUsage.high) {
                    return 'high';
                } else if (alert.metrics?.value > this.config.alertRules.memoryUsage.medium) {
                    return 'medium';
                }
                return 'low';
                
            default:
                return 'medium';
        }
    }
    
    /**
     * إرسال التنبيه
     */
    async _sendAlert(alert) {
        const startTime = performance.now();
        const results = {};
        
        try {
            // إرسال عبر جميع القنوات المفعلة
            const channels = Object.keys(this.config.channels).filter(
                key => this.config.channels[key].enabled
            );
            
            for (const channel of channels) {
                try {
                    const result = await this._sendToChannel(channel, alert);
                    results[channel] = result;
                    
                    if (!result.success) {
                        this.logger.warn(`Failed to send alert via ${channel}`, { 
                            alertId: alert.id, 
                            error: result.error 
                        });
                    }
                    
                } catch (error) {
                    results[channel] = { success: false, error: error.message };
                    this.logger.error(`Channel ${channel} failed`, { 
                        alertId: alert.id, 
                        error: error.message 
                    });
                }
            }
            
            const success = Object.values(results).some(result => result.success);
            const responseTime = performance.now() - startTime;
            
            this.logger.info('Alert sent', { 
                alertId: alert.id, 
                channels: Object.keys(results).length,
                success,
                responseTime: responseTime.toFixed(2)
            });
            
            return { success, results, responseTime };
            
        } catch (error) {
            this.logger.error('Alert sending failed', { alertId: alert.id, error: error.message });
            return { success: false, error: error.message };
        }
    }
    
    /**
     * إرسال إلى قناة محددة
     */
    async _sendToChannel(channel, alert) {
        switch (channel) {
            case 'slack':
                return await this._sendToSlack(alert);
            case 'pagerduty':
                return await this._sendToPagerDuty(alert);
            case 'email':
                return await this._sendToEmail(alert);
            case 'sms':
                return await this._sendToSMS(alert);
            case 'webhook':
                return await this._sendToWebhook(alert);
            case 'webSocket':
                return await this._sendToWebSocket(alert);
            default:
                return { success: false, error: `Unknown channel: ${channel}` };
        }
    }
    
    /**
     * إرسال إلى Slack
     */
    async _sendToSlack(alert) {
        const config = this.config.channels.slack;
        
        const message = this._formatSlackMessage(alert);
        
        try {
            const response = await axios.post(config.webhookUrl, message, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            
            return { success: response.status === 200, statusCode: response.status };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * تنسيق رسالة Slack
     */
    _formatSlackMessage(alert) {
        const emoji = this._getAlertEmoji(alert.severity);
        const color = this._getAlertColor(alert.severity);
        
        return {
            channel: this.config.channels.slack.channel,
            username: 'Performance Monitor',
            icon_emoji: ':warning:',
            attachments: [
                {
                    color: color,
                    title: `${emoji} Performance Alert - ${alert.severity.toUpperCase()}`,
                    text: alert.message,
                    fields: [
                        {
                            title: 'Source',
                            value: alert.source,
                            short: true
                        },
                        {
                            title: 'Type',
                            value: alert.type,
                            short: true
                        },
                        {
                            title: 'Timestamp',
                            value: new Date(alert.created_at).toISOString(),
                            short: true
                        },
                        {
                            title: 'Alert ID',
                            value: alert.id,
                            short: true
                        }
                    ],
                    footer: 'Advanced Alerting System',
                    ts: Math.floor(alert.created_at / 1000)
                }
            ]
        };
    }
    
    /**
     * إرسال إلى PagerDuty
     */
    async _sendToPagerDuty(alert) {
        const config = this.config.channels.pagerduty;
        
        const payload = {
            routing_key: config.integrationKey,
            event_action: 'trigger',
            dedup_key: alert.id,
            payload: {
                summary: alert.message,
                source: alert.source,
                severity: this._mapSeverityToPagerDuty(alert.severity),
                component: alert.component || 'unknown',
                group: alert.group || 'performance',
                class: alert.class || 'system',
                custom_details: alert.metrics || {}
            }
        };
        
        try {
            const response = await axios.post('https://events.pagerduty.com/v2/enqueue', payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            
            return { success: response.status === 202, statusCode: response.status };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * إرسال إلى البريد الإلكتروني
     */
    async _sendToEmail(alert) {
        if (!this.emailTransport) {
            return { success: false, error: 'Email transport not configured' };
        }
        
        const config = this.config.channels.email;
        const severityRecipients = config.recipients[alert.severity] || [];
        
        if (severityRecipients.length === 0) {
            return { success: false, error: 'No recipients configured for severity' };
        }
        
        const mailOptions = {
            from: config.smtpConfig.auth.user,
            to: severityRecipients.join(', '),
            subject: `[${alert.severity.toUpperCase()}] Performance Alert - ${alert.source}`,
            html: this._formatEmailContent(alert),
            text: this._formatEmailText(alert)
        };
        
        try {
            const result = await this.emailTransport.sendMail(mailOptions);
            return { success: true, messageId: result.messageId };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * تنسيق محتوى البريد الإلكتروني
     */
    _formatEmailContent(alert) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .header { background-color: ${this._getAlertColor(alert.severity)}; color: white; padding: 20px; }
                .content { padding: 20px; }
                .metric { background-color: #f5f5f5; padding: 10px; margin: 5px 0; }
                .footer { margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>${this._getAlertEmoji(alert.severity)} Performance Alert - ${alert.severity.toUpperCase()}</h2>
            </div>
            <div class="content">
                <h3>Alert Details</h3>
                <p><strong>Message:</strong> ${alert.message}</p>
                <p><strong>Source:</strong> ${alert.source}</p>
                <p><strong>Type:</strong> ${alert.type}</p>
                <p><strong>Timestamp:</strong> ${new Date(alert.created_at).toISOString()}</p>
                <p><strong>Alert ID:</strong> ${alert.id}</p>
                
                ${alert.metrics ? `
                    <h3>Metrics</h3>
                    ${Object.entries(alert.metrics).map(([key, value]) => 
                        `<div class="metric"><strong>${key}:</strong> ${value}</div>`
                    ).join('')}
                ` : ''}
                
                ${alert.recommendation ? `
                    <h3>Recommendation</h3>
                    <p>${alert.recommendation}</p>
                ` : ''}
            </div>
            <div class="footer">
                <p>This alert was generated by the Advanced Performance Monitoring System.</p>
                <p>Alert ID: ${alert.id} | Created: ${new Date(alert.created_at).toISOString()}</p>
            </div>
        </body>
        </html>
        `;
    }
    
    /**
     * تنسيق نص البريد الإلكتروني
     */
    _formatEmailText(alert) {
        return `
Performance Alert - ${alert.severity.toUpperCase()}

Alert Details:
- Message: ${alert.message}
- Source: ${alert.source}
- Type: ${alert.type}
- Timestamp: ${new Date(alert.created_at).toISOString()}
- Alert ID: ${alert.id}

${alert.metrics ? `Metrics:
${Object.entries(alert.metrics).map(([key, value]) => `- ${key}: ${value}`).join('\n')}` : ''}

${alert.recommendation ? `Recommendation: ${alert.recommendation}` : ''}

This alert was generated by the Advanced Performance Monitoring System.
Alert ID: ${alert.id} | Created: ${new Date(alert.created_at).toISOString()}
        `;
    }
    
    /**
     * إرسال إلى SMS
     */
    async _sendToSMS(alert) {
        // تنفيذ SMS باستخدام Twilio أو مزود آخر
        // هذا مثال أساسي، يجب تنفيذ المنطق الفعلي حسب المزود المختار
        this.logger.info('SMS sending not implemented', { alertId: alert.id });
        return { success: false, error: 'SMS not implemented' };
    }
    
    /**
     * إرسال إلى Webhook
     */
    async _sendToWebhook(alert) {
        const config = this.config.channels.webhook;
        const payload = {
            id: alert.id,
            severity: alert.severity,
            type: alert.type,
            source: alert.source,
            message: alert.message,
            metrics: alert.metrics,
            created_at: alert.created_at,
            timestamp: Date.now()
        };
        
        const results = [];
        
        for (const url of config.urls) {
            try {
                const response = await axios.post(url, payload, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000
                });
                
                results.push({ url, success: response.status === 200, statusCode: response.status });
                
            } catch (error) {
                results.push({ url, success: false, error: error.message });
            }
        }
        
        const success = results.some(result => result.success);
        return { success, results };
    }
    
    /**
     * إرسال إلى WebSocket
     */
    async _sendToWebSocket(alert) {
        if (!this.wss) {
            return { success: false, error: 'WebSocket server not configured' };
        }
        
        const message = JSON.stringify({
            type: 'new_alert',
            alert: alert,
            timestamp: Date.now()
        });
        
        let successCount = 0;
        let totalClients = this.wss.clients.size;
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
                successCount++;
            }
        });
        
        return { 
            success: successCount > 0, 
            successCount, 
            totalClients 
        };
    }
    
    /**
     * بدء معالجة التنبيهات
     */
    _startAlertProcessing() {
        this.processingInterval = setInterval(async () => {
            if (!this.isProcessing) return;
            
            try {
                await this._processActiveAlerts();
            } catch (error) {
                this.logger.error('Alert processing error', { error: error.message });
            }
        }, this.config.alertProcessingInterval);
    }
    
    /**
     * معالجة التنبيهات النشطة
     */
    async _processActiveAlerts() {
        const alertsToProcess = Array.from(this.activeAlerts.values())
            .filter(alert => alert.status === 'active');
        
        for (const alert of alertsToProcess) {
            // فحص انتهاء الصلاحية
            if (this._isAlertExpired(alert)) {
                await this._expireAlert(alert);
                continue;
            }
            
            // فحص الحاجة لإعادة الإرسال
            if (alert.retry_count < this.config.maxRetries) {
                await this._checkAndResendAlert(alert);
            }
        }
    }
    
    /**
     * فحص انتهاء صلاحية التنبيه
     */
    _isAlertExpired(alert) {
        const now = Date.now();
        const expirationTime = alert.expires_at || (alert.created_at + 24 * 60 * 60 * 1000); // 24 ساعة افتراضي
        
        return now > expirationTime;
    }
    
    /**
     * انتهاء صلاحية التنبيه
     */
    async _expireAlert(alert) {
        alert.status = 'expired';
        alert.updated_at = Date.now();
        alert.resolved_at = Date.now();
        
        // إرسال تنبيه الحل
        await this._sendResolutionAlert(alert);
        
        // نقل إلى التاريخ
        this.alertHistory.push(alert);
        this.activeAlerts.delete(alert.id);
        
        this.logger.info('Alert expired', { alertId: alert.id });
    }
    
    /**
     * فحص وإعادة إرسال التنبيه
     */
    async _checkAndResendAlert(alert) {
        const now = Date.now();
        const lastAttempt = alert.last_attempt || alert.created_at;
        const retryInterval = this._getRetryInterval(alert);
        
        if (now - lastAttempt >= retryInterval) {
            alert.last_attempt = now;
            alert.retry_count++;
            
            const result = await this._sendAlert(alert);
            
            if (!result.success && alert.retry_count >= this.config.maxRetries) {
                alert.status = 'failed';
                this.logger.error('Alert failed after max retries', { alertId: alert.id });
            }
        }
    }
    
    /**
     * الحصول على فترة إعادة المحاولة
     */
    _getRetryInterval(alert) {
        const baseIntervals = {
            critical: 60000, // 1 دقيقة
            high: 300000, // 5 دقائق
            medium: 900000, // 15 دقيقة
            low: 1800000, // 30 دقيقة
            info: 3600000 // 1 ساعة
        };
        
        const baseInterval = baseIntervals[alert.severity] || baseIntervals.medium;
        return baseInterval * Math.pow(2, alert.retry_count); // exponential backoff
    }
    
    /**
     * بدء مراقبة انتهاء التنبيهات
     */
    _startAlertExpirationMonitoring() {
        setInterval(() => {
            const now = Date.now();
            const alertsToExpire = Array.from(this.activeAlerts.values())
                .filter(alert => {
                    const expirationTime = alert.expires_at || (alert.created_at + 24 * 60 * 60 * 1000);
                    return now > expirationTime;
                });
            
            for (const alert of alertsToExpire) {
                this._expireAlert(alert);
            }
        }, 60000); // فحص كل دقيقة
    }
    
    /**
     * بدء التصعيد التلقائي
     */
    _startAutomaticEscalation() {
        setInterval(() => {
            if (!this.config.escalation.enabled) return;
            
            const now = Date.now();
            
            for (const alert of this.activeAlerts.values()) {
                if (alert.status !== 'active' || alert.severity === 'info') {
                    continue;
                }
                
                const escalationTime = this._getEscalationTime(alert);
                const alertAge = now - alert.created_at;
                
                if (alertAge >= escalationTime && alert.escalation_level === 0) {
                    this._triggerEscalation(alert);
                }
            }
        }, 60000); // فحص كل دقيقة
    }
    
    /**
     * الحصول على وقت التصعيد
     */
    _getEscalationTime(alert) {
        switch (alert.severity) {
            case 'critical':
                return 0; // فوري
            case 'high':
                return this.config.escalation.highDelay;
            case 'medium':
                return this.config.escalation.mediumDelay;
            case 'low':
                return this.config.escalation.lowDelay;
            default:
                return this.config.escalation.mediumDelay;
        }
    }
    
    /**
     * بدء التصعيد الفوري
     */
    _triggerImmediateEscalation(alert) {
        // إضافة تأخير قصير للتصعيد الفوري
        setTimeout(() => {
            this._triggerEscalation(alert);
        }, 5000); // 5 ثواني
    }
    
    /**
     * تنفيذ التصعيد
     */
    _triggerEscalation(alert) {
        if (alert.escalation_level >= 2) {
            return; // لا تصعيد أكثر من مستويين
        }
        
        alert.escalation_level++;
        alert.last_escalation = Date.now();
        alert.escalated = true;
        
        // إرسال تنبيه التصعيد
        this._sendEscalationAlert(alert);
        
        this.performanceStats.escalationsTriggered++;
        
        this.logger.info('Alert escalated', { 
            alertId: alert.id, 
            level: alert.escalation_level,
            severity: alert.severity
        });
    }
    
    /**
     * إرسال تنبيه التصعيد
     */
    async _sendEscalationAlert(alert) {
        const escalationAlert = {
            ...alert,
            id: `${alert.id}_escalation_${alert.escalation_level}`,
            type: 'escalation',
            message: `[ESCALATION ${alert.escalation_level}] ${alert.message}`,
            severity: this._escalateSeverity(alert.severity),
            original_alert_id: alert.id,
            escalation_time: Date.now()
        };
        
        await this.addAlert(escalationAlert);
    }
    
    /**
     * تصعيد مستوى الخطورة
     */
    _escalateSeverity(severity) {
        const escalationMap = {
            'info': 'low',
            'low': 'medium',
            'medium': 'high',
            'high': 'critical',
            'critical': 'critical'
        };
        
        return escalationMap[severity] || severity;
    }
    
    /**
     * إرسال تنبيه الحل
     */
    async _sendResolutionAlert(alert) {
        const resolutionAlert = {
            ...alert,
            id: `${alert.id}_resolved`,
            type: 'resolution',
            message: `[RESOLVED] ${alert.message}`,
            severity: 'info',
            resolved_alert_id: alert.id,
            resolution_time: Date.now()
        };
        
        await this.addAlert(resolutionAlert);
    }
    
    /**
     * تسجيل نمط التنبيه
     */
    _recordAlertPattern(alert) {
        const patternKey = `${alert.type}_${alert.source}`;
        
        if (!this.alertPatterns.has(patternKey)) {
            this.alertPatterns.set(patternKey, {
                count: 0,
                lastAlert: null,
                severity: alert.severity,
                trends: []
            });
        }
        
        const pattern = this.alertPatterns.get(patternKey);
        pattern.count++;
        pattern.lastAlert = alert;
        pattern.trends.push({
            timestamp: alert.created_at,
            severity: alert.severity,
            metrics: alert.metrics
        });
        
        // الاحتفاظ بآخر 100趋势 فقط
        if (pattern.trends.length > 100) {
            pattern.trends.shift();
        }
    }
    
    /**
     * بدء تنظيف البيانات القديمة
     */
    _startDataCleanup() {
        setInterval(() => {
            this._cleanupOldData();
        }, 60 * 60 * 1000); // كل ساعة
    }
    
    /**
     * تنظيف البيانات القديمة
     */
    _cleanupOldData() {
        const now = Date.now();
        const cutoffTime = now - this.config.alertRetentionTime;
        
        // تنظيف التنبيهات القديمة
        this.alertHistory = this.alertHistory.filter(
            alert => alert.created_at > cutoffTime
        );
        
        // تنظيف الأنماط القديمة
        for (const [key, pattern] of this.alertPatterns.entries()) {
            pattern.trends = pattern.trends.filter(
                trend => trend.timestamp > cutoffTime
            );
            
            if (pattern.trends.length === 0) {
                this.alertPatterns.delete(key);
            }
        }
        
        this.logger.info('Old data cleaned up', {
            alertsRemaining: this.alertHistory.length,
            patternsRemaining: this.alertPatterns.size
        });
    }
    
    /**
     * تحديث إحصائيات الأداء
     */
    _updatePerformanceStats(processingTime) {
        const currentAvg = this.performanceStats.averageResponseTime;
        const totalAlerts = this.performanceStats.totalAlerts;
        
        // حساب المتوسط المتحرك
        this.performanceStats.averageResponseTime = 
            ((currentAvg * (totalAlerts - 1)) + processingTime) / totalAlerts;
    }
    
    /**
     * الحصول على التنبيهات النشطة
     */
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values());
    }
    
    /**
     * الحصول على تاريخ التنبيهات
     */
    getAlertHistory(limit = 100) {
        return this.alertHistory.slice(-limit);
    }
    
    /**
     * الحصول على أنماط التنبيهات
     */
    getAlertPatterns() {
        return Object.fromEntries(this.alertPatterns);
    }
    
    /**
     * الحصول على إحصائيات الأداء
     */
    getPerformanceStats() {
        return {
            ...this.performanceStats,
            activeAlerts: this.activeAlerts.size,
            totalPatterns: this.alertPatterns.size,
            uptime: Date.now() - (this.startTime || Date.now())
        };
    }
    
    /**
     * الحصول على emoji للتنبيه
     */
    _getAlertEmoji(severity) {
        const emojis = {
            critical: '🚨',
            high: '⚠️',
            medium: '⚡',
            low: 'ℹ️',
            info: '📋'
        };
        return emojis[severity] || emojis.medium;
    }
    
    /**
     * الحصول على لون التنبيه
     */
    _getAlertColor(severity) {
        const colors = {
            critical: 'danger',
            high: 'warning',
            medium: '#f0ad4e',
            low: 'info',
            info: '#5bc0de'
        };
        return colors[severity] || colors.medium;
    }
    
    /**
     * تحويل مستوى الخطورة إلى PagerDuty
     */
    _mapSeverityToPagerDuty(severity) {
        const mapping = {
            critical: 'critical',
            high: 'error',
            medium: 'warning',
            low: 'info',
            info: 'info'
        };
        return mapping[severity] || 'warning';
    }
    
    /**
     * Acnowledge تنبيه
     */
    acknowledgeAlert(alertId, user, comment = '') {
        const alert = this.activeAlerts.get(alertId);
        if (!alert) {
            return { success: false, error: 'Alert not found' };
        }
        
        alert.acknowledged = true;
        alert.acknowledged_by = user;
        alert.acknowledged_at = Date.now();
        alert.acknowledge_comment = comment;
        alert.updated_at = Date.now();
        
        this.logger.info('Alert acknowledged', { alertId, user, comment });
        
        return { success: true, alert };
    }
    
    /**
     * حل تنبيه
     */
    resolveAlert(alertId, user, comment = '') {
        const alert = this.activeAlerts.get(alertId);
        if (!alert) {
            return { success: false, error: 'Alert not found' };
        }
        
        alert.status = 'resolved';
        alert.resolved_by = user;
        alert.resolved_at = Date.now();
        alert.resolve_comment = comment;
        alert.updated_at = Date.now();
        
        // نقل إلى التاريخ
        this.alertHistory.push(alert);
        this.activeAlerts.delete(alertId);
        
        this.logger.info('Alert resolved', { alertId, user, comment });
        
        return { success: true, alert };
    }
    
    /**
     * إنشاء تنبيه مخصص
     */
    createCustomAlert(alertConfig) {
        const alert = {
            id: alertConfig.id || `custom_${Date.now()}`,
            type: 'custom',
            severity: alertConfig.severity || 'medium',
            source: alertConfig.source || 'custom',
            message: alertConfig.message,
            metrics: alertConfig.metrics || {},
            recommendation: alertConfig.recommendation,
            expires_at: alertConfig.expires_at,
            ...alertConfig
        };
        
        return this.addAlert(alert);
    }
}

// تصدير الكلاس
module.exports = AdvancedAlertingSystem;

// مثال على الاستخدام
if (require.main === module) {
    const alerting = new AdvancedAlertingSystem({
        channels: {
            slack: {
                enabled: true,
                webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
                channel: '#alerts'
            },
            email: {
                enabled: true,
                smtpConfig: {
                    host: process.env.SMTP_HOST || 'smtp.gmail.com',
                    port: parseInt(process.env.SMTP_PORT) || 587,
                    secure: false,
                    auth: {
                        user: process.env.SMTP_USER || '',
                        pass: process.env.SMTP_PASS || ''
                    }
                },
                recipients: {
                    critical: ['admin@company.com'],
                    high: ['team@company.com'],
                    medium: ['devops@company.com']
                }
            },
            webSocket: {
                enabled: true,
                port: 8081
            }
        },
        escalation: {
            enabled: true,
            criticalImmediate: ['slack', 'pagerduty', 'sms']
        }
    });
    
    // تسجيل مستمعي الأحداث
    alerting.on('alertSent', (alert) => {
        console.log('Alert sent:', alert.id, alert.severity, alert.message);
    });
    
    // بدء النظام
    alerting.start().then(() => {
        console.log('Advanced Alerting System started');
        
        // اختبار التنبيهات
        setTimeout(async () => {
            // تنبيه اختبار
            await alerting.addAlert({
                id: 'test_001',
                type: 'response_time',
                source: 'api',
                message: 'High response time detected',
                metrics: { value: 2500, threshold: 2000 },
                recommendation: 'Check database performance'
            });
            
            // تنبيه حرج
            await alerting.addAlert({
                id: 'critical_001',
                type: 'cpu_usage',
                source: 'server1',
                message: 'Critical CPU usage detected',
                metrics: { value: 98, threshold: 95 },
                recommendation: 'Scale resources immediately'
            });
            
        }, 2000);
        
        // عرض الإحصائيات
        setInterval(() => {
            const stats = alerting.getPerformanceStats();
            console.log('Alerting stats:', JSON.stringify(stats, null, 2));
        }, 30000);
        
    }).catch(error => {
        console.error('Failed to start Alerting System:', error);
    });
    
    // إيقاف نظيف
    process.on('SIGINT', async () => {
        console.log('Shutting down...');
        await alerting.stop();
        process.exit(0);
    });
}
