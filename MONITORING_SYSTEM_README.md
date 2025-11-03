# نظام المراقبة الشامل - Comprehensive Monitoring System

نظام مراقبة متقدم وشامل لمنصة Saler مع تقنيات الذكاء الاصطناعي والتحليل الذكي

## 🌟 الميزات الرئيسية

### 🚨 Sentry Integration
- **Error Tracking**: تتبع شامل للأخطاء مع السياق التفصيلي
- **Performance Monitoring**: مراقبة Web Vitals ووقت الاستجابة  
- **User Context Tracking**: تتبع سلوك المستخدمين
- **Release Tracking**: ربط الأخطاء بإصدارات التطبيق
- **Real-time Alerts**: تنبيهات فورية للمشاكل الحرجة

### 📝 نظام السجلات المتقدم
- **Structured Logging**: سجلات منظمة بتنسيق JSON
- **Log Levels**: debug, info, warn, error, critical
- **Log Categories**: system, security, performance, business, user
- **Auto Rotation**: تدوير تلقائي للأرشفة والضغط
- **Centralized Storage**: تخزين مركزي في قاعدة البيانات

### 🏥 Health Checks الشامل
- **System Monitoring**: مراقبة المعالج والذاكرة والقرص
- **Database Health**: فحص قاعدة البيانات والاتصالات
- **External Services**: مراقبة الخدمات الخارجية
- **Network Monitoring**: فحص الاتصال والشبكة
- **SSL Monitoring**: مراقبة شهادات SSL

### ⚡ Performance Monitoring
- **Response Time Tracking**: متابعة أوقات الاستجابة (P50, P95, P99)
- **Memory & CPU Usage**: مراقبة شاملة لاستخدام الموارد
- **Database Performance**: تحليل أداء قاعدة البيانات
- **Cache Monitoring**: مراقبة ذاكرة التخزين المؤقت
- **AI-Powered Analytics**: تحليلات ذكية باستخدام ML

### 🚀 نظام التنبيهات المتقدم
- **Multi-Channel**: Email, Slack, Discord, Telegram, Webhook
- **Escalation Policies**: سياسات تصعيد ذكية ومرنة
- **Alert Suppression**: قواعد تقييد التنبيهات
- **Auto-Response**: استجابة تلقائية للمشاكل
- **Contact Management**: إدارة جهات الاتصال

## 📦 التثبيت والإعداد

### متطلبات النظام
```bash
# Python 3.8+
# Node.js 16+
# Redis 6+
# PostgreSQL 12+
```

### 1. تثبيت المتطلبات
```bash
cd /workspace/saler/monitoring
pip install -r requirements-monitoring.txt
```

### 2. إعداد متغيرات البيئة
```bash
# ملف .env
SENTRY_DSN=your_sentry_dsn_here
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
TELEGRAM_BOT_TOKEN=your_bot_token
DATABASE_URL=postgresql://user:pass@localhost:5432/saler
REDIS_URL=redis://localhost:6379
```

### 3. إعداد ملف التكوين
```bash
# نسخ وتعديل ملف الإعدادات
cp monitoring-config.yaml.example monitoring-config.yaml

# تحرير الإعدادات
nano monitoring-config.yaml
```

## 🚀 التشغيل السريع

### تشغيل جميع الخدمات
```bash
# تشغيل فحوصات الصحة
python monitoring/advanced-health-check-system.py &

# تشغيل مراقبة الأداء
python monitoring/advanced-performance-monitoring.py &

# تشغيل نظام التنبيهات
python monitoring/advanced-alerting-system.py &
```

### تشغيل خدمة محددة
```bash
# فحوصات الصحة فقط
python monitoring/health-checks.py

# مراجعة الأداء فقط  
python monitoring/performance_dashboard.py

# اختبار التنبيهات
python monitoring/test_alerts.py
```

## 📊 استخدام Dashboard

### بدء لوحة المراقبة
```bash
# تشغيل dashboard تفاعلي
streamlit run monitoring/dashboard.py

# أو تشغيل dashboard الويب
python monitoring/web_dashboard.py
```

### الميزات المتاحة
- **📈 Real-time Metrics**: مقاييس في الوقت الفعلي
- **🚨 Active Alerts**: التنبيهات النشطة والمعلقة
- **📋 Performance Charts**: مخططات الأداء والاتجاهات
- **🔧 System Health**: صحة النظام العامة
- **⚡ Quick Actions**: إجراءات سريعة للاستجابة

## 🔧 التكامل مع التطبيق

### تكامل Sentry في Frontend
```javascript
// في ملف main.js
import { SentryConfig } from './monitoring/sentry-config';

// إعداد Sentry
const sentry = new SentryConfig({
    dsn: process.env.VITE_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    enablePerformance: true,
    enableUserTracking: true,
    enableRealTimeAlerts: true
});

// تسجيل الأخطاء
try {
    // كود التطبيق
} catch (error) {
    sentry.captureException(error, {
        context: 'user_action',
        user_id: currentUser.id
    });
}
```

### تكامل مع Backend
```python
# في ملف main.py
from monitoring.sentry_integration import setup_sentry
from monitoring.health_checks import HealthChecker
from monitoring.performance_monitor import PerformanceMonitor

# إعداد Sentry
setup_sentry()

# إعداد المراقبة
health_checker = HealthChecker()
performance_monitor = PerformanceMonitor()

@app.get("/health")
async def health_check():
    return await health_checker.check_all()

@app.middleware("http")
async def performance_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    
    # تسجيل أداء الطلب
    performance_monitor.record_request(
        endpoint=request.url.path,
        method=request.method,
        response_time=time.time() - start_time,
        status_code=response.status_code
    )
    
    return response
```

## 📈 المقاييس والمراقبة

### مقاييس النظام
- `system_cpu_usage_percent` - استخدام المعالج
- `system_memory_usage_percent` - استخدام الذاكرة
- `system_disk_usage_percent` - استخدام القرص
- `system_network_io_bytes_sec` - حركة الشبكة

### مقاييس التطبيق
- `app_response_time_seconds` - زمن الاستجابة
- `app_throughput_requests_sec` - معدل النقل
- `app_error_rate_percent` - معدل الأخطاء
- `database_connections_active` - اتصالات قاعدة البيانات

### مقاييس الأعمال
- `user_registrations_total` - تسجيلات المستخدمين
- `conversion_rate_percent` - معدل التحويل
- `revenue_per_hour` - الإيرادات في الساعة
- `active_sessions_count` - الجلسات النشطة

## 🔔 التنبيهات والقواعد

### إعداد قواعد التنبيه
```yaml
# في ملف alert-rules.yml
rules:
  - name: HighCPUUsage
    condition: "system.cpu_usage > 80"
    duration: 300  # 5 minutes
    severity: "warning"
    channels: ["email", "slack"]
    
  - name: DatabaseDown
    condition: "database.status == 'down'"
    duration: 30   # 30 seconds  
    severity: "critical"
    channels: ["email", "slack", "sms"]
```

### تخصيص التنبيهات
```python
# إنشاء تنبيه مخصص
alert_id = notification_manager.create_alert(
    title="خطأ في نظام الدفع",
    message="فشل في معالجة الدفع",
    severity=AlertSeverity.CRITICAL,
    category="payment",
    source="payment_service",
    metadata={
        "transaction_id": "txn_123456",
        "amount": 99.99,
        "user_id": "user_789"
    }
)
```

## 🛠️ استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### 1. فشل إرسال التنبيهات
```bash
# فحص اتصال SMTP
telnet smtp.gmail.com 587

# فحص Webhook URLs
curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# فحص سجلات التنبيهات
tail -f logs/alerts.log
```

#### 2. مشاكل المقاييس
```bash
# فحص Prometheus metrics
curl http://localhost:8001/metrics

# فحص اتصال Redis
redis-cli ping

# فحص قاعدة البيانات
psql -h localhost -U postgres -d saler -c "SELECT 1;"
```

#### 3. مشاكل الأداء
```bash
# فحص استخدام الموارد
top
htop
iostat

# فحص الشبكة
netstat -tuln
ss -tuln

# فحص logs النظام
journalctl -u saler
```

## 🔒 الأمان والحماية

### حماية البيانات
- تشفير البيانات الحساسة في السجلات
- إخفاء معلومات المستخدم الشخصية
- آليات التدقيق والتتبع

### مراقبة الأمان
- كشف محاولات التسلل
- مراقبة تسجيل الدخول الفاشل
- تنبيهات الأنشطة المشبوهة

### النسخ الاحتياطي
```bash
# نسخ احتياطية تلقائية
crontab -e
0 2 * * * /usr/local/bin/backup-monitoring.sh

# استعادة البيانات
./scripts/restore_monitoring.sh backup_20240101.tar.gz
```

## 📚 الوثائق والمراجع

### ملفات الوثائق
- `COMPREHENSIVE_MONITORING_SYSTEM_REPORT.md` - التقرير الشامل
- `monitoring-config.yaml` - ملف الإعدادات التفصيلي
- `alert-rules.yml` - قواعد التنبيهات
- `requirements-monitoring.txt` - المتطلبات

### مراجع خارجية
- [Sentry Documentation](https://docs.sentry.io/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Redis Documentation](https://redis.io/documentation)

## 🆘 الدعم والمساعدة

### فريق الدعم
- **DevOps Team**: الصيانة والتشغيل
- **Backend Team**: تطوير التكامل
- **Frontend Team**: واجهة المستخدم
- **Security Team**: الأمان والحماية

### قنوات الدعم
- **Email**: monitoring-support@saler.com
- **Slack**: #monitoring-support
- **Jira**: MNT project
- **Documentation**: Internal wiki

### إبلاغ المشاكل
```bash
# إنشاء تقرير مشكلة
./scripts/generate_issue_report.sh

# جمع معلومات النظام
./scripts/collect_system_info.sh

# إرسال logs التشخيص
./scripts/send_diagnostic_logs.sh
```

## 🔄 التحديثات والصيانة

### جدولة الصيانة
- **يومي**: مراجعة التنبيهات والنشاط
- **أسبوعي**: تحليل الاتجاهات
- **شهري**: تحديث القواعد
- **فصلي**: مراجعة شاملة

### تحديث النظام
```bash
# تحديث المتطلبات
pip install -r requirements-monitoring.txt --upgrade

# تحديث الإعدادات
./scripts/backup_config.sh
./scripts/update_config.sh

# اختبار التحديث
./scripts/test_monitoring_system.sh
```

## 🎯 أفضل الممارسات

### نصائح للتشغيل الأمثل
1. **مراقبة دورية**: مراجعة يومية للتنبيهات والنشاط
2. **تحديث القواعد**: مراجعة شهرية لقواعد التنبيه
3. **النسخ الاحتياطية**: نسخ احتياطية منتظمة للبيانات
4. **اختبار التنبيهات**: اختبار شهري لقنوات الإشعار
5. **تحسين الأداء**: تحليل دوري للاتجاهات

### تجنب الأخطاء الشائعة
- عدم مراقبة حدود الموارد
- إهمال تحديث قواعد التنبيه
- عدم اختبار قنوات الإشعار
- تجاهل البيانات القديمة
- عدم وجود خطة طوارئ

---

## 📞 معلومات الاتصال

- **النظام**: نظام المراقبة الشامل
- **الإصدار**: v2.0.0
- **تاريخ الإنشاء**: ${new Date().toLocaleDateString('ar')}
- **الفريق**: فريق DevOps
- **الترخيص**: Proprietary

---

*تم تطوير هذا النظام بواسطة فريق Saler DevOps مع أحدث التقنيات والمعايير الصناعية*
