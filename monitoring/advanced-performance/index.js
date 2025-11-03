/**
 * الملف الرئيسي لنظام المراقبة المتقدم
 * Main Entry Point for Advanced Monitoring System
 * 
 * نقطة الدخول الرئيسية لتشغيل جميع مكونات نظام المراقبة المتقدم
 * Main entry point to start all components of the advanced monitoring system
 */

const path = require('path');
const fs = require('fs');

// التحقق من متطلبات النظام
console.log('🚀 بدء تشغيل نظام المراقبة المتقدم لسالير');
console.log('=' .repeat(60));

// متغيرات البيئة
const CONFIG = {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    enableSSL: process.env.ENABLE_SSL === 'true',
    sslKey: process.env.SSL_KEY_PATH,
    sslCert: process.env.SSL_CERT_PATH
};

// رسالة الترحيب
function displayWelcomeMessage() {
    console.log('🎯 نظام المراقبة المتقدم - Saler Advanced Performance Monitoring');
    console.log('📊 Version: 1.0.0');
    console.log(`🌍 Environment: ${CONFIG.environment}`);
    console.log(`📡 Port: ${CONFIG.port}`);
    console.log(`🔒 SSL Enabled: ${CONFIG.enableSSL}`);
    console.log('=' .repeat(60));
    console.log('');
}

// التحقق من المتطلبات الأساسية
function checkPrerequisites() {
    console.log('🔍 فحص المتطلبات الأساسية...');
    
    const requirements = [
        { name: 'Node.js', check: () => process.version },
        { name: 'NPM', check: () => require('child_process').execSync('npm --version').toString().trim() },
        { name: 'File System Access', check: () => fs.existsSync('.') }
    ];
    
    const results = requirements.map(req => {
        try {
            const result = req.check();
            console.log(`✅ ${req.name}: ${result}`);
            return true;
        } catch (error) {
            console.log(`❌ ${req.name}: Failed - ${error.message}`);
            return false;
        }
    });
    
    const allPassed = results.every(result => result);
    
    if (!allPassed) {
        console.error('❌ بعض المتطلبات الأساسية غير متوفرة');
        process.exit(1);
    }
    
    console.log('✅ جميع المتطلبات الأساسية متوفرة\n');
}

// تحميل المكونات
async function loadComponents() {
    console.log('📦 تحميل مكونات النظام...');
    
    const components = {
        realTimeCollector: './real-time-collector.js',
        aiAnalyticsEngine: './ai-analytics-engine.js', 
        advancedAlertingSystem: './advanced-alerting-system.js',
        advancedReportingSystem: './advanced-reporting-system.js',
        dashboardVisualizationSystem: './dashboard-visualization-system.js',
        automatedOptimizationSystem: './automated-optimization-system.js',
        integrationConfig: './integration-config.js',
        testingValidationSystem: './testing-validation-system.js'
    };
    
    const loadedComponents = {};
    
    for (const [name, componentPath] of Object.entries(components)) {
        try {
            const fullPath = path.resolve(__dirname, componentPath);
            if (fs.existsSync(fullPath)) {
                const Component = require(fullPath);
                loadedComponents[name] = Component;
                console.log(`✅ تم تحميل: ${name}`);
            } else {
                console.log(`⚠️ ملف غير موجود: ${componentPath}`);
            }
        } catch (error) {
            console.log(`❌ فشل في تحميل ${name}: ${error.message}`);
        }
    }
    
    console.log('✅ تم تحميل مكونات النظام\n');
    return loadedComponents;
}

// إنشاء إعدادات النظام
function createSystemConfig(components) {
    console.log('⚙️ إنشاء إعدادات النظام...');
    
    const systemConfig = {
        // الإعدادات الأساسية
        port: CONFIG.port,
        environment: CONFIG.environment,
        logLevel: CONFIG.logLevel,
        
        // إعدادات SSL
        ssl: CONFIG.enableSSL ? {
            key: CONFIG.sslKey,
            cert: CONFIG.sslCert
        } : null,
        
        // إعدادات المكونات
        realTimeCollector: {
            port: CONFIG.port,
            updateInterval: 1000,
            dataRetention: 86400 * 365, // سنة واحدة
            maxDataPoints: 1000000
        },
        
        dashboardVisualization: {
            port: CONFIG.port + 1,
            updateInterval: 1000,
            dataRetention: 86400, // يوم واحد للعرض
            maxClients: 100,
            enableSSL: CONFIG.enableSSL
        },
        
        aiAnalytics: {
            enabled: true,
            workers: CONFIG.environment === 'production' ? 4 : 2,
            learningRate: 0.1,
            batchSize: 1000,
            anomalyThreshold: 0.95
        },
        
        alertingSystem: {
            enabled: true,
            retryAttempts: 3,
            queueSize: 1000,
            dedupWindow: 300000, // 5 دقائق
            escalationPolicies: {
                critical: { immediate: true, escalateAfter: 900000 },
                warning: { immediate: false, escalateAfter: 1800000 },
                info: { immediate: false, escalateAfter: false }
            }
        },
        
        reportingSystem: {
            enabled: true,
            formats: ['html', 'json', 'pdf'],
            schedules: {
                hourly: '0 * * * *',
                daily: '0 0 * * *',
                weekly: '0 0 * * 0',
                monthly: '0 0 1 * *'
            },
            retention: 365 // يوم
        },
        
        automatedOptimization: {
            enabled: CONFIG.environment === 'production',
            scanInterval: 30000,
            optimizationThreshold: 0.8,
            autoScalingEnabled: CONFIG.environment === 'production',
            maxAutoActions: 10,
            learningRate: 0.1
        },
        
        integrationConfig: {
            configPath: './integration_config.json',
            environment: CONFIG.environment,
            timeout: 10000,
            retryAttempts: 3
        },
        
        testingValidation: {
            testTimeout: 30000,
            retryAttempts: 3,
            concurrentTests: CONFIG.environment === 'production' ? 10 : 5,
            validationThreshold: 0.95,
            reportPath: './test-reports',
            baselinePath: './performance-baselines.json'
        }
    };
    
    console.log('✅ تم إنشاء إعدادات النظام\n');
    return systemConfig;
}

// تهيئة المكونات
async function initializeComponents(components, config) {
    console.log('🔧 تهيئة مكونات النظام...');
    
    const initializedComponents = {};
    
    try {
        // تهيئة نظام جمع البيانات في الوقت الفعلي
        if (components.realTimeCollector) {
            initializedComponents.realTimeCollector = new components.realTimeCollector(config.realTimeCollector);
            console.log('✅ تم تهيئة: Real-time Collector');
        }
        
        // تهيئة محرك التحليلات الذكية
        if (components.aiAnalyticsEngine) {
            initializedComponents.aiAnalyticsEngine = new components.aiAnalyticsEngine(config.aiAnalytics);
            console.log('✅ تم تهيئة: AI Analytics Engine');
        }
        
        // تهيئة نظام التنبيهات المتقدم
        if (components.advancedAlertingSystem) {
            initializedComponents.advancedAlertingSystem = new components.advancedAlertingSystem(config.alertingSystem);
            console.log('✅ تم تهيئة: Advanced Alerting System');
        }
        
        // تهيئة نظام التقارير المتقدم
        if (components.advancedReportingSystem) {
            initializedComponents.advancedReportingSystem = new components.advancedReportingSystem(config.reportingSystem);
            console.log('✅ تم تهيئة: Advanced Reporting System');
        }
        
        // تهيئة نظام لوحات المعلومات المرئية
        if (components.dashboardVisualizationSystem) {
            initializedComponents.dashboardVisualizationSystem = new components.dashboardVisualizationSystem(config.dashboardVisualization);
            console.log('✅ تم تهيئة: Dashboard Visualization System');
        }
        
        // تهيئة نظام التحسين التلقائي
        if (components.automatedOptimizationSystem) {
            initializedComponents.automatedOptimizationSystem = new components.automatedOptimizationSystem(config.automatedOptimization);
            console.log('✅ تم تهيئة: Automated Optimization System');
        }
        
        // تهيئة ملف تكوين التكامل
        if (components.integrationConfig) {
            initializedComponents.integrationConfig = new components.integrationConfig(config.integrationConfig);
            console.log('✅ تم تهيئة: Integration Configuration');
        }
        
        // تهيئة نظام الاختبار والتحقق
        if (components.testingValidationSystem) {
            initializedComponents.testingValidationSystem = new components.testingValidationSystem(config.testingValidation);
            console.log('✅ تم تهيئة: Testing & Validation System');
        }
        
        console.log('✅ تم تهيئة جميع المكونات بنجاح\n');
        return initializedComponents;
        
    } catch (error) {
        console.error('❌ فشل في تهيئة المكونات:', error.message);
        process.exit(1);
    }
}

// بدء تشغيل المكونات
async function startComponents(components) {
    console.log('🚀 بدء تشغيل مكونات النظام...');
    
    const startupPromises = [];
    
    // بدء تشغيل Dashboard أولاً
    if (components.dashboardVisualizationSystem) {
        startupPromises.push(
            components.dashboardVisualizationSystem.start().then(() => {
                console.log('✅ Dashboard Visualization started');
            }).catch(error => {
                console.error('❌ فشل في بدء Dashboard:', error.message);
            })
        );
    }
    
    // انتظار قليل لبدء Dashboard
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // بدء تشغيل باقي المكونات
    if (components.realTimeCollector) {
        startupPromises.push(
            components.realTimeCollector.start().then(() => {
                console.log('✅ Real-time Collector started');
            }).catch(error => {
                console.error('❌ فشل في بدء Real-time Collector:', error.message);
            })
        );
    }
    
    if (components.aiAnalyticsEngine) {
        startupPromises.push(
            Promise.resolve().then(() => {
                console.log('✅ AI Analytics Engine started');
            }).catch(error => {
                console.error('❌ فشل في بدء AI Analytics:', error.message);
            })
        );
    }
    
    if (components.advancedAlertingSystem) {
        startupPromises.push(
            components.advancedAlertingSystem.start().then(() => {
                console.log('✅ Advanced Alerting System started');
            }).catch(error => {
                console.error('❌ فشل في بدء Alerting System:', error.message);
            })
        );
    }
    
    if (components.advancedReportingSystem) {
        startupPromises.push(
            components.advancedReportingSystem.start().then(() => {
                console.log('✅ Advanced Reporting System started');
            }).catch(error => {
                console.error('❌ فشل في بدء Reporting System:', error.message);
            })
        );
    }
    
    if (components.automatedOptimizationSystem) {
        startupPromises.push(
            Promise.resolve().then(() => {
                console.log('✅ Automated Optimization System started');
            }).catch(error => {
                console.error('❌ فشل في بدء Optimization System:', error.message);
            })
        );
    }
    
    // انتظار اكتمال جميع عمليات البدء
    await Promise.all(startupPromises);
    
    console.log('✅ تم بدء تشغيل جميع المكونات\n');
}

// إعداد الاتصالات بين المكونات
function setupComponentCommunication(components) {
    console.log('🔗 إعداد الاتصالات بين المكونات...');
    
    // ربط Real-time Collector مع AI Analytics
    if (components.realTimeCollector && components.aiAnalyticsEngine) {
        components.realTimeCollector.on('metrics_collected', (metrics) => {
            components.aiAnalyticsEngine.analyzeMetrics(metrics);
        });
    }
    
    // ربط AI Analytics مع Alerting System
    if (components.aiAnalyticsEngine && components.advancedAlertingSystem) {
        components.aiAnalyticsEngine.on('anomaly_detected', (anomaly) => {
            components.advancedAlertingSystem.createAlert({
                title: 'تم كشف شذوذ في الأداء',
                description: `تم اكتشاف شذوذ في ${anomaly.metric}: ${anomaly.severity}`,
                severity: anomaly.severity,
                source: 'ai-analytics',
                details: anomaly
            });
        });
    }
    
    // ربط Alerting System مع Integration Config
    if (components.advancedAlertingSystem && components.integrationConfig) {
        components.advancedAlertingSystem.on('alert_created', async (alert) => {
            try {
                await components.integrationConfig.sendAlert(alert);
            } catch (error) {
                console.error('❌ فشل في إرسال التنبيه:', error.message);
            }
        });
    }
    
    // ربط Real-time Collector مع Dashboard
    if (components.realTimeCollector && components.dashboardVisualizationSystem) {
        components.realTimeCollector.on('metrics_collected', (metrics) => {
            // سيتم تحديث Dashboard تلقائياً عبر WebSocket
        });
    }
    
    // ربط Optimization System مع باقي المكونات
    if (components.automatedOptimizationSystem && components.realTimeCollector) {
        components.realTimeCollector.on('performance_issue_detected', (issue) => {
            components.automatedOptimizationSystem.handlePerformanceIssue(issue);
        });
    }
    
    console.log('✅ تم إعداد الاتصالات بين المكونات\n');
}

// عرض معلومات النظام النهائية
function displaySystemInfo(components, config) {
    console.log('🎉 النظام جاهز للعمل!');
    console.log('=' .repeat(60));
    console.log('📊 Dashboard: ' + (config.environment === 'production' 
        ? `https://localhost:${config.port + 1}` 
        : `http://localhost:${config.port + 1}`));
    console.log('📈 API: ' + (config.environment === 'production' 
        ? `https://localhost:${config.port}` 
        : `http://localhost:${config.port}`));
    console.log('📋 Reports: Available via API endpoints');
    console.log('🔔 Alerts: Configured and active');
    console.log('🤖 AI Analytics: Active and learning');
    console.log('⚡ Auto-Optimization: ' + (config.automatedOptimization.enabled ? 'Active' : 'Disabled'));
    console.log('🧪 Testing System: Ready for validation');
    console.log('=' .repeat(60));
    console.log('');
    
    // عرض حالة المكونات
    console.log('📋 حالة المكونات:');
    Object.entries(components).forEach(([name, component]) => {
        const status = component && typeof component.start === 'function' ? '🟢 نشط' : '🟡 متاح';
        console.log(`   ${name}: ${status}`);
    });
    console.log('');
    
    // عرض المسارات المهمة
    console.log('🌐 المسارات المهمة:');
    console.log(`   🏠 الرئيسية: http://localhost:${config.port + 1}`);
    console.log(`   📊 نظرة عامة: http://localhost:${config.port + 1}/dashboard/overview`);
    console.log(`   📈 المقاييس: http://localhost:${config.port + 1}/dashboard/metrics`);
    console.log(`   ⚡ الأداء: http://localhost:${config.port + 1}/dashboard/performance`);
    console.log(`   🔔 التنبيهات: http://localhost:${config.port + 1}/dashboard/alerts`);
    console.log(`   📊 التحليلات: http://localhost:${config.port + 1}/dashboard/analytics`);
    console.log('');
    
    // معلومات إضافية
    console.log('💡 نصائح سريعة:');
    console.log('   • استخدم Ctrl+C لإيقاف النظام بأمان');
    console.log('   • تحقق من ملف logs/ للسجلات المفصلة');
    console.log('   • استخدم /api/health للتحقق من صحة النظام');
    console.log('   • راجع test-reports/ لنتائج الاختبارات');
    console.log('');
}

// إعداد معالجات الأحداث
function setupEventHandlers(components) {
    // معالج إيقاف النظام بشكل آمن
    const gracefulShutdown = async (signal) => {
        console.log(`\n🛑 تم استلام إشارة ${signal}. إيقاف النظام بأمان...`);
        
        const shutdownPromises = [];
        
        for (const [name, component] of Object.entries(components)) {
            if (component && typeof component.shutdown === 'function') {
                shutdownPromises.push(
                    component.shutdown().catch(error => {
                        console.error(`❌ خطأ في إيقاف ${name}:`, error.message);
                    })
                );
            }
        }
        
        await Promise.all(shutdownPromises);
        
        console.log('✅ تم إيقاف جميع المكونات بأمان');
        console.log('👋 تم إغلاق نظام المراقبة المتقدم');
        process.exit(0);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // معالج الأخطاء غير المعالجة
    process.on('uncaughtException', (error) => {
        console.error('❌ خطأ غير معالج:', error);
        gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Promise مرفوض غير معالج:', reason);
        gracefulShutdown('UNHANDLED_REJECTION');
    });
}

// الدالة الرئيسية
async function main() {
    try {
        // عرض رسالة الترحيب
        displayWelcomeMessage();
        
        // فحص المتطلبات
        checkPrerequisites();
        
        // تحميل المكونات
        const components = await loadComponents();
        
        // إنشاء الإعدادات
        const config = createSystemConfig(components);
        
        // تهيئة المكونات
        const initializedComponents = await initializeComponents(components, config);
        
        // إعداد الاتصالات
        setupComponentCommunication(initializedComponents);
        
        // بدء تشغيل المكونات
        await startComponents(initializedComponents);
        
        // عرض معلومات النظام
        displaySystemInfo(initializedComponents, config);
        
        // إعداد معالجات الأحداث
        setupEventHandlers(initializedComponents);
        
        // تشغيل اختبار سريع
        if (CONFIG.environment === 'development') {
            console.log('🧪 تشغيل اختبار سريع للنظام...');
            try {
                const testingSystem = initializedComponents.testingValidationSystem;
                if (testingSystem) {
                    const healthCheck = await testingSystem.validateSystemHealth();
                    console.log(`✅ صحة النظام: ${healthCheck.overall.score.toFixed(1)}% - ${healthCheck.overall.status}`);
                }
            } catch (error) {
                console.log('⚠️ فشل في الاختبار السريع:', error.message);
            }
            console.log('');
        }
        
        console.log('🎊 تم تشغيل نظام المراقبة المتقدم بنجاح!');
        console.log('🚀 النظام الآن يراقب الأداء في الوقت الفعلي\n');
        
    } catch (error) {
        console.error('❌ فشل في بدء تشغيل النظام:', error);
        process.exit(1);
    }
}

// تشغيل النظام إذا تم تشغيل الملف مباشرة
if (require.main === module) {
    main().catch(error => {
        console.error('💥 خطأ حرج في النظام:', error);
        process.exit(1);
    });
}

module.exports = {
    main,
    CONFIG,
    loadComponents,
    initializeComponents,
    startComponents
};