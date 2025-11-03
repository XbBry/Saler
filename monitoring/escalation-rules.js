/**
 * نظام قواعد التصعيد - Escalation Rules System
 * Manages alert escalation policies and rules
 * إدارة سياسات وقواعد تصعيد التنبيهات
 */

const fs = require('fs').promises;
const path = require('path');

class EscalationRules {
    constructor() {
        this.rules = new Map();
        this.activeEscalations = new Map();
        this.escalationHistory = [];
        this.defaultSettings = {
            maxEscalationLevels: 5,
            baseDelayMinutes: 5,
            escalationMultiplier: 2,
            workingHoursOnly: false,
            workDaysOnly: true,
            autoResolveExpired: true,
            enableEscalation: true
        };
        this.loadRules();
    }

    /**
     * تحميل قواعد التصعيد
     */
    async loadRules() {
        try {
            // تحميل قواعد افتراضية
            this.createDefaultRules();
            
            // محاولة تحميل قواعد مخصصة
            const rulesPath = path.join(__dirname, 'escalation-rules.json');
            try {
                const customRulesData = await fs.readFile(rulesPath, 'utf8');
                const customRules = JSON.parse(customRulesData);
                this.mergeRules(customRules);
            } catch (error) {
                console.log('📝 إنشاء قواعد تصعيد افتراضية');
            }
            
            console.log(`✅ تم تحميل ${this.rules.size} قاعدة تصعيد`);
        } catch (error) {
            console.error('❌ خطأ في تحميل قواعد التصعيد:', error);
        }
    }

    /**
     * إنشاء قواعد افتراضية
     */
    createDefaultRules() {
        // قاعدة التصعيد الحرج
        this.addRule({
            id: 'critical-escalation',
            name: 'التصعيد الحرج',
            description: 'قاعدة تصعيد للتنبيهات الحرجة',
            enabled: true,
            priority: 1,
            conditions: {
                severity: ['critical'],
                status: ['open', 'acknowledged'],
                duration_minutes: 5
            },
            actions: [
                {
                    delay_minutes: 5,
                    channels: ['email-primary', 'slack-critical'],
                    escalation_level: 1,
                    notify_managers: true
                },
                {
                    delay_minutes: 10,
                    channels: ['email-secondary', 'sms-oncall', 'pagerduty-critical'],
                    escalation_level: 2,
                    notify_managers: true,
                    create_incident: true
                },
                {
                    delay_minutes: 20,
                    channels: ['email-managers', 'sms-escalation', 'pagerduty-escalation'],
                    escalation_level: 3,
                    notify_executives: true,
                    create_major_incident: true
                }
            ],
            working_hours: {
                enabled: false,
                hours: { start: 9, end: 17 },
                timezone: 'Asia/Riyadh'
            },
            termination_conditions: [
                'status:resolved',
                'status:acknowledged_and_resolved'
            ]
        });

        // قاعدة التصعيد للخدمات المهمة
        this.addRule({
            id: 'important-services-escalation',
            name: 'تصعيد الخدمات المهمة',
            description: 'تصعيد للتنبهات في الخدمات الحرجة',
            enabled: true,
            priority: 2,
            conditions: {
                service_types: ['payment', 'authentication', 'api-gateway'],
                status: ['open'],
                duration_minutes: 10
            },
            actions: [
                {
                    delay_minutes: 10,
                    channels: ['email-oncall', 'slack-important'],
                    escalation_level: 1,
                    notify_oncall: true
                },
                {
                    delay_minutes: 20,
                    channels: ['email-team-lead', 'pagerduty-important'],
                    escalation_level: 2,
                    create_incident: true
                }
            ]
        });

        // قاعدة التصعيد العام
        this.addRule({
            id: 'general-escalation',
            name: 'التصعيد العام',
            description: 'قاعدة تصعيد عامة للتنبيهات الأخرى',
            enabled: true,
            priority: 3,
            conditions: {
                severity: ['warning'],
                status: ['open'],
                duration_minutes: 30
            },
            actions: [
                {
                    delay_minutes: 30,
                    channels: ['email-team', 'slack-general'],
                    escalation_level: 1,
                    notify_team: true
                },
                {
                    delay_minutes: 60,
                    channels: ['email-managers'],
                    escalation_level: 2,
                    create_incident: true
                }
            ],
            max_escalations: 2
        });

        // قاعدة التصعيد خارج ساعات العمل
        this.addRule({
            id: 'after-hours-escalation',
            name: 'تصعيد خارج ساعات العمل',
            description: 'تصعيد محسن للتنبيهات خارج ساعات العمل',
            enabled: true,
            priority: 1,
            conditions: {
                outside_working_hours: true,
                severity: ['critical', 'warning'],
                status: ['open']
            },
            actions: [
                {
                    delay_minutes: 15,
                    channels: ['pagerduty-critical', 'sms-oncall'],
                    escalation_level: 1,
                    notify_oncall: true
                },
                {
                    delay_minutes: 30,
                    channels: ['sms-escalation', 'email-managers'],
                    escalation_level: 2,
                    notify_managers: true
                }
            ],
            working_hours: {
                enabled: true,
                hours: { start: 8, end: 18 },
                timezone: 'Asia/Riyadh',
                work_days: [1, 2, 3, 4, 5] // الأحد إلى الخميس
            }
        });
    }

    /**
     * دمج قواعد مخصصة
     */
    mergeRules(customRules) {
        if (customRules.rules) {
            customRules.rules.forEach(rule => {
                this.addRule(rule);
            });
        }
    }

    /**
     * إضافة قاعدة تصعيد جديدة
     */
    addRule(rule) {
        // التحقق من صحة القاعدة
        this.validateRule(rule);
        
        const ruleWithDefaults = {
            ...this.defaultSettings,
            ...rule,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            executions: 0,
            success_rate: 0
        };

        this.rules.set(rule.id, ruleWithDefaults);
        console.log(`✅ تم إضافة قاعدة تصعيد: ${rule.name}`);
    }

    /**
     * التحقق من صحة قاعدة التصعيد
     */
    validateRule(rule) {
        const requiredFields = ['id', 'name', 'conditions', 'actions'];
        
        for (const field of requiredFields) {
            if (!rule[field]) {
                throw new Error(`حقل مطلوب مفقود: ${field}`);
            }
        }

        // التحقق من الشروط
        const validSeverities = ['critical', 'warning', 'info'];
        if (rule.conditions.severity) {
            const invalid = rule.conditions.severity.filter(s => !validSeverities.includes(s));
            if (invalid.length > 0) {
                throw new Error(`مستويات شدة غير صالحة: ${invalid.join(', ')}`);
            }
        }

        // التحقق من الإجراءات
        if (!Array.isArray(rule.actions) || rule.actions.length === 0) {
            throw new Error('يجب أن تحتوي القاعدة على إجراءات على الأقل');
        }

        for (let i = 0; i < rule.actions.length; i++) {
            const action = rule.actions[i];
            if (!action.delay_minutes || action.delay_minutes < 1) {
                throw new Error(`الإجراء ${i + 1}: يجب أن يكون التأخير بالدقائق أكثر من 0`);
            }
            if (!action.channels || action.channels.length === 0) {
                throw new Error(`الإجراء ${i + 1}: يجب تحديد قنوات إشعار`);
            }
        }
    }

    /**
     * تقييم التنبيه مقابل قواعد التصعيد
     */
    evaluateAlert(alert) {
        const matches = [];

        for (const [ruleId, rule] of this.rules) {
            if (!rule.enabled) continue;

            try {
                const result = this.matchesRule(rule, alert);
                if (result.matches) {
                    matches.push({
                        ruleId,
                        rule,
                        priority: rule.priority,
                        matchedConditions: result.matchedConditions,
                        score: this.calculateMatchScore(rule, result.matchedConditions)
                    });
                }
            } catch (error) {
                console.error(`خطأ في تقييم القاعدة ${ruleId}:`, error);
            }
        }

        // ترتيب المطابقات حسب الأولوية والنقاط
        matches.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return b.score - a.score;
        });

        return matches;
    }

    /**
     * التحقق من مطابقة القاعدة
     */
    matchesRule(rule, alert) {
        const matchedConditions = [];
        const conditions = rule.conditions;

        // التحقق من الشدة
        if (conditions.severity) {
            const severityMatch = conditions.severity.includes(alert.severity);
            if (severityMatch) {
                matchedConditions.push({ type: 'severity', value: alert.severity });
            }
        }

        // التحقق من نوع الخدمة
        if (conditions.service_types) {
            const serviceMatch = conditions.service_types.includes(alert.service_type);
            if (serviceMatch) {
                matchedConditions.push({ type: 'service_type', value: alert.service_type });
            }
        }

        // التحقق من المكون
        if (conditions.component) {
            const componentMatch = conditions.component === alert.component;
            if (componentMatch) {
                matchedConditions.push({ type: 'component', value: alert.component });
            }
        }

        // التحقق من مدة التنبيه
        if (conditions.duration_minutes) {
            const alertAge = Math.floor((Date.now() - new Date(alert.created_at).getTime()) / (1000 * 60));
            const durationMatch = alertAge >= conditions.duration_minutes;
            if (durationMatch) {
                matchedConditions.push({ type: 'duration', value: alertAge });
            }
        }

        // التحقق من الحالة
        if (conditions.status) {
            const statusMatch = conditions.status.includes(alert.status);
            if (statusMatch) {
                matchedConditions.push({ type: 'status', value: alert.status });
            }
        }

        // التحقق من ساعات العمل
        if (conditions.outside_working_hours !== undefined) {
            const isOutsideHours = this.isOutsideWorkingHours(rule.working_hours);
            if (conditions.outside_working_hours === isOutsideHours) {
                matchedConditions.push({ type: 'working_hours', value: isOutsideHours });
            }
        }

        // التحقق من أيام العمل
        if (conditions.work_days_only !== undefined) {
            const isWorkDay = this.isWorkDay(rule.working_hours);
            if (conditions.work_days_only === isWorkDay) {
                matchedConditions.push({ type: 'work_days', value: isWorkDay });
            }
        }

        // قاعدة التطابق: يجب تطابق جميع الشروط المعرفة
        const requiredConditions = Object.keys(conditions).filter(key => 
            !['termination_conditions', 'working_hours'].includes(key)
        );
        
        const matchedConditionTypes = matchedConditions.map(c => c.type);
        const allRequiredMatched = requiredConditions.every(type => 
            matchedConditionTypes.includes(type)
        );

        return {
            matches: allRequiredMatched,
            matchedConditions
        };
    }

    /**
     * حساب نقاط المطابقة
     */
    calculateMatchScore(rule, matchedConditions) {
        let score = 0;
        
        // نقاط الأولوية
        score += (4 - rule.priority) * 10;
        
        // نقاط عدد الشروط المطابقة
        score += matchedConditions.length * 5;
        
        // نقاط إضافية للشروط المهمة
        for (const condition of matchedConditions) {
            switch (condition.type) {
                case 'severity':
                    score += 20;
                    break;
                case 'service_type':
                    score += 15;
                    break;
                case 'duration':
                    score += 10;
                    break;
                case 'working_hours':
                    score += 8;
                    break;
                default:
                    score += 3;
            }
        }
        
        return score;
    }

    /**
     * التحقق من كون الوقت خارج ساعات العمل
     */
    isOutsideWorkingHours(workingHoursConfig) {
        if (!workingHoursConfig?.enabled) return false;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;

        const startTime = workingHoursConfig.hours.start * 60;
        const endTime = workingHoursConfig.hours.end * 60;

        return currentTime < startTime || currentTime > endTime;
    }

    /**
     * التحقق من كون اليوم يوم عمل
     */
    isWorkDay(workingHoursConfig) {
        if (!workingHoursConfig?.enabled || !workingHoursConfig.work_days) {
            return true; // افتراضياً جميع الأيام أيام عمل
        }

        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = الأحد
        const workDays = workingHoursConfig.work_days.map(d => (d === 7 ? 0 : d));
        
        return workDays.includes(dayOfWeek);
    }

    /**
     * بدء التصعيد للتنبيه
     */
    async startEscalation(alert, rules) {
        if (!this.defaultSettings.enableEscalation) {
            return { success: false, reason: 'Escalation disabled' };
        }

        const escalationId = `${alert.id}-${Date.now()}`;
        const escalation = {
            id: escalationId,
            alert_id: alert.id,
            alert,
            rules: rules.map(r => r.rule),
            current_level: 0,
            scheduled_actions: [],
            status: 'active',
            started_at: new Date().toISOString(),
            last_escalation_at: new Date().toISOString()
        };

        // جدولة الإجراءات
        await this.scheduleActions(escalation);

        this.activeEscalations.set(escalationId, escalation);
        this.escalationHistory.push({
            escalation_id: escalationId,
            action: 'started',
            timestamp: new Date().toISOString(),
            alert_id: alert.id,
            rule_count: rules.length
        });

        console.log(`🔄 تم بدء التصعيد للتنبيه ${alert.id}: ${rules.length} قاعدة`);
        return { success: true, escalation_id: escalationId };
    }

    /**
     * جدولة إجراءات التصعيد
     */
    async scheduleActions(escalation) {
        const { rules, alert } = escalation;
        const now = Date.now();

        for (const rule of rules) {
            for (let i = 0; i < rule.actions.length; i++) {
                const action = rule.actions[i];
                const delayMs = action.delay_minutes * 60 * 1000;
                const scheduledTime = new Date(now + delayMs);

                const actionItem = {
                    id: `${escalation.id}-${rule.id}-${i}`,
                    rule_id: rule.id,
                    action_index: i,
                    scheduled_time: scheduledTime.toISOString(),
                    channels: action.channels,
                    escalation_level: action.escalation_level,
                    executed: false,
                    condition: {
                        alert_age_minutes: action.delay_minutes,
                        alert_status: alert.status,
                        ...action
                    }
                };

                escalation.scheduled_actions.push(actionItem);
            }
        }

        // ترتيب الإجراءات حسب الوقت
        escalation.scheduled_actions.sort((a, b) => 
            new Date(a.scheduled_time) - new Date(b.scheduled_time)
        );
    }

    /**
     * تنفيذ التصعيد التالي
     */
    async processNextEscalation(escalationId) {
        const escalation = this.activeEscalations.get(escalationId);
        if (!escalation) {
            throw new Error(`التصعيد غير موجود: ${escalationId}`);
        }

        // البحث عن الإجراءات المعلقة
        const now = new Date();
        const pendingActions = escalation.scheduled_actions.filter(action => 
            !action.executed && new Date(action.scheduled_time) <= now
        );

        for (const action of pendingActions) {
            try {
                await this.executeEscalationAction(escalation, action);
                action.executed = true;
                escalation.last_escalation_at = new Date().toISOString();

                // تحديث إحصائيات القاعدة
                const rule = escalation.rules.find(r => r.id === action.rule_id);
                if (rule) {
                    rule.executions = (rule.executions || 0) + 1;
                }

                console.log(`✅ تم تنفيذ إجراء تصعيد: ${action.id}`);
            } catch (error) {
                console.error(`❌ خطأ في تنفيذ إجراء التصعيد ${action.id}:`, error);
                action.error = error.message;
            }
        }

        // التحقق من اكتمال التصعيد
        await this.checkEscalationCompletion(escalation);

        return { success: true, executed_count: pendingActions.length };
    }

    /**
     * تنفيذ إجراء تصعيد
     */
    async executeEscalationAction(escalation, action) {
        // التحقق من شروط التنفيذ
        if (!this.shouldExecuteAction(escalation, action)) {
            console.log(`⏩ تم تخطي إجراء التصعيد: ${action.id} - شروط غير مستوفاة`);
            return;
        }

        // تنفيذ الإشعار
        const notificationRequest = {
            alert: escalation.alert,
            escalation_level: action.escalation_level,
            channels: action.channels,
            rule_id: action.rule_id,
            action_id: action.id
        };

        // إرسال الإشعارات عبر نظام القنوات
        const notificationChannels = require('./notification-channels');
        const channels = new notificationChannels();

        for (const channelId of action.channels) {
            await channels.sendNotification(channelId, escalation.alert);
        }

        // تنفيذ إجراءات إضافية
        if (action.create_incident) {
            await this.createIncident(escalation.alert, action);
        }

        if (action.create_major_incident) {
            await this.createMajorIncident(escalation.alert, action);
        }

        if (action.notify_managers) {
            await this.notifyManagers(escalation.alert, action);
        }

        if (action.notify_executives) {
            await this.notifyExecutives(escalation.alert, action);
        }

        // تسجيل في التاريخ
        this.escalationHistory.push({
            escalation_id: escalation.id,
            action: 'executed',
            action_id: action.id,
            channels: action.channels,
            timestamp: new Date().toISOString(),
            escalation_level: action.escalation_level
        });
    }

    /**
     * التحقق من شروط تنفيذ الإجراء
     */
    shouldExecuteAction(escalation, action) {
        const alert = escalation.alert;
        
        // التحقق من حالة التنبيه
        if (escalation.rules.some(rule => rule.termination_conditions)) {
            for (const rule of escalation.rules) {
                if (rule.termination_conditions) {
                    for (const condition of rule.termination_conditions) {
                        if (this.matchesTerminationCondition(alert, condition)) {
                            console.log(`🛑 تم إنهاء التصعيد بسبب: ${condition}`);
                            escalation.status = 'terminated';
                            return false;
                        }
                    }
                }
            }
        }

        // التحقق من حد التصعيد الأقصى
        const maxEscalations = action.max_escalations || this.defaultSettings.maxEscalationLevels;
        if (escalation.current_level >= maxEscalations) {
            console.log(`🚫 تم الوصول للحد الأقصى للتصعيد: ${maxEscalations}`);
            escalation.status = 'max_level_reached';
            return false;
        }

        return true;
    }

    /**
     * التحقق من شروط الإنهاء
     */
    matchesTerminationCondition(alert, condition) {
        const [field, expectedValue] = condition.split(':');
        return alert[field] === expectedValue;
    }

    /**
     * إنشاء حادث
     */
    async createIncident(alert, action) {
        console.log(`📋 إنشاء حادث للتنبيه: ${alert.id}`);
        // تنفيذ منطق إنشاء الحادث
    }

    /**
     * إنشاء حادث كبير
     */
    async createMajorIncident(alert, action) {
        console.log(`🚨 إنشاء حادث كبير للتنبيه: ${alert.id}`);
        // تنفيذ منطق إنشاء الحادث الكبير
    }

    /**
     * إشعار المديرين
     */
    async notifyManagers(alert, action) {
        console.log(`👔 إشعار المديرين للتنبيه: ${alert.id}`);
        // تنفيذ منطق إشعار المديرين
    }

    /**
     * إشعار التنفيذيين
     */
    async notifyExecutives(alert, action) {
        console.log(`🎖️ إشعار التنفيذيين للتنبيه: ${alert.id}`);
        // تنفيذ منطق إشعار التنفيذيين
    }

    /**
     * التحقق من اكتمال التصعيد
     */
    async checkEscalationCompletion(escalation) {
        const { scheduled_actions } = escalation;
        
        // التحقق من اكتمال جميع الإجراءات
        const allActionsCompleted = scheduled_actions.every(action => 
            action.executed || action.error
        );

        if (allActionsCompleted) {
            escalation.status = 'completed';
            escalation.completed_at = new Date().toISOString();
            
            console.log(`✅ اكتمل التصعيد: ${escalation.id}`);
            
            // نقل للتصعيدات المكتملة
            this.escalationHistory.push({
                escalation_id: escalation.id,
                action: 'completed',
                timestamp: escalation.completed_at
            });
        }
    }

    /**
     * إيقاف التصعيد
     */
    stopEscalation(escalationId, reason = 'manual') {
        const escalation = this.activeEscalations.get(escalationId);
        if (escalation) {
            escalation.status = 'stopped';
            escalation.stopped_at = new Date().toISOString();
            escalation.stop_reason = reason;

            this.escalationHistory.push({
                escalation_id: escalationId,
                action: 'stopped',
                reason,
                timestamp: escalation.stopped_at
            });

            console.log(`🛑 تم إيقاف التصعيد: ${escalationId} - السبب: ${reason}`);
            return true;
        }
        return false;
    }

    /**
     * الحصول على إحصائيات التصعيد
     */
    getEscalationStats() {
        const totalEscalations = this.escalationHistory.length;
        const activeEscalations = Array.from(this.activeEscalations.values())
            .filter(e => e.status === 'active').length;
        
        const completedEscalations = Array.from(this.activeEscalations.values())
            .filter(e => e.status === 'completed').length;

        const ruleStats = {};
        for (const [ruleId, rule] of this.rules) {
            ruleStats[ruleId] = {
                name: rule.name,
                executions: rule.executions || 0,
                enabled: rule.enabled,
                priority: rule.priority
            };
        }

        return {
            total: totalEscalations,
            active: activeEscalations,
            completed: completedEscalations,
            rules: ruleStats,
            last_updated: new Date().toISOString()
        };
    }

    /**
     * تحديث قاعدة تصعيد
     */
    updateRule(ruleId, updates) {
        const existingRule = this.rules.get(ruleId);
        if (!existingRule) {
            throw new Error(`قاعدة غير موجودة: ${ruleId}`);
        }

        const updatedRule = {
            ...existingRule,
            ...updates,
            updated_at: new Date().toISOString()
        };

        this.validateRule(updatedRule);
        this.rules.set(ruleId, updatedRule);
        
        console.log(`✅ تم تحديث قاعدة التصعيد: ${ruleId}`);
        return updatedRule;
    }

    /**
     * حذف قاعدة تصعيد
     */
    deleteRule(ruleId) {
        const deleted = this.rules.delete(ruleId);
        if (deleted) {
            console.log(`🗑️ تم حذف قاعدة التصعيد: ${ruleId}`);
        }
        return deleted;
    }

    /**
     * الحصول على جميع القواعد
     */
    getAllRules() {
        return Array.from(this.rules.entries()).map(([id, rule]) => ({
            id,
            ...rule
        }));
    }

    /**
     * الحصول على التصعيدات النشطة
     */
    getActiveEscalations() {
        return Array.from(this.activeEscalations.values())
            .filter(e => e.status === 'active');
    }

    /**
     * الحصول على تاريخ التصعيد
     */
    getEscalationHistory(filters = {}) {
        let history = this.escalationHistory;

        if (filters.alert_id) {
            history = history.filter(h => h.alert_id === filters.alert_id);
        }

        if (filters.escalation_id) {
            history = history.filter(h => h.escalation_id === filters.escalation_id);
        }

        if (filters.action) {
            history = history.filter(h => h.action === filters.action);
        }

        if (filters.date_from) {
            const fromDate = new Date(filters.date_from);
            history = history.filter(h => new Date(h.timestamp) >= fromDate);
        }

        if (filters.date_to) {
            const toDate = new Date(filters.date_to);
            history = history.filter(h => new Date(h.timestamp) <= toDate);
        }

        return history.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
    }
}

module.exports = EscalationRules;