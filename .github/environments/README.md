# GitHub Environments Configuration

يحتوي هذا المجلد على ملفات تكوين البيئات المختلفة للنشر.

## البيئات المتاحة

### 🏗️ Development Environment
- **الهدف**: الاختبار اليومي والتطوير
- **الحماية**: محدودة
- **المتغيرات**: Development-specific settings
- **النشر**: تلقائي من أي branch

### 🧪 Staging Environment  
- **الهدف**: اختبار ما قبل الإنتاج
- **الحماية**: مراجعة مطلوبة
- **المتغيرات**: Production-like settings
- **النشر**: من main branch فقط

### 🚀 Production Environment
- **الهدف**: الإنتاج
- **الحماية**: مراجعة متعددة مطلوبة
- **المتغيرات**: Production settings
- **النشر**: من tagged releases فقط

## متغيرات البيئة المطلوبة

لكل بيئة، يجب تكوين المتغيرات التالية في GitHub:

### Database URLs
```bash
DEV_DATABASE_URL=postgresql://user:pass@dev-host:5432/saler_dev
STAGING_DATABASE_URL=postgresql://user:pass@staging-host:5432/saler_staging
PROD_DATABASE_URL=postgresql://user:pass@prod-host:5432/saler_prod
```

### Redis URLs
```bash
DEV_REDIS_URL=redis://dev-host:6379/0
STAGING_REDIS_URL=redis://staging-host:6379/0
PROD_REDIS_URL=redis://prod-host:6379/0
```

### Service URLs
```bash
DEV_BACKEND_SERVICE_URL=https://dev-api.saler.example.com
STAGING_BACKEND_SERVICE_URL=https://staging-api.saler.example.com
PROD_BACKEND_SERVICE_URL=https://api.saler.example.com

DEV_FRONTEND_SERVICE_URL=https://dev.saler.example.com
STAGING_FRONTEND_SERVICE_URL=https://staging.saler.example.com
PROD_FRONTEND_SERVICE_URL=https://saler.example.com
```

### Kubernetes Configuration
```bash
KUBECONFIG_DATA=<base64-encoded kubeconfig>
```

### Notification Settings
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
EMAIL_USERNAME=notifications@saler.example.com
EMAIL_PASSWORD=app-specific-password
NOTIFICATION_EMAIL=team@saler.example.com
```

### Security & Monitoring
```bash
SONAR_TOKEN=sonarqube-token
SNYK_TOKEN=snyk-token
SEMGREP_APP_TOKEN=semgrep-token
GITLEAKS_LICENSE=gitleaks-license
```

### External Services
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
OPENAI_API_KEY=sk-...
```

## إعداد البيئات في GitHub

### 1. إنشاء Environment في GitHub
```bash
1. اذهب إلى Settings > Environments
2. أنشئ environment جديد: dev, staging, prod
3. أضف المتغيرات والأسرار المطلوبة
4. اضبط protection rules
```

### 2. تكوين Protection Rules
- **Required reviewers**: للبيئات الحساسة
- **Wait timer**: للتأكد من الاستقرار
- **Branch filters**: تحديد الفروع المسموحة

### 3. Environment-specific Secrets
```yaml
# Example secrets structure
DEV_:
  - DATABASE_URL
  - REDIS_URL
  - API_KEYS
  
STAGING_:
  - DATABASE_URL
  - REDIS_URL
  - API_KEYS
  
PROD_:
  - DATABASE_URL
  - REDIS_URL
  - API_KEYS
  - STRIPE_KEYS
```

## استخدام البيئات في Workflows

```yaml
environment:
  name: ${{ github.event.inputs.environment || 'prod' }}
```

## المراجعة والموافقة

### Development
- ✅ نشر تلقائي
- ✅ مراجعة اختيارية
- ✅ موافقة فورية

### Staging  
- ✅ مراجعة مطلوبة (1 موافق)
- ✅ انتظار 5 دقائق
- ✅ اختبار تلقائي بعد النشر

### Production
- ✅ مراجعة مطلوبة (2 موافق)
- ✅ انتظار 10 دقائق
- ✅ اختبار شامل بعد النشر
- ✅ موافقة على إيقاف التشغيل الطارئ

## التنبيهات والإشعارات

### Slack Integration
- قناة `#deployments`: إشعارات النشر
- قناة `#security`: إشعارات الأمان
- قناة `#performance`: إشعارات الأداء

### Email Notifications
- فريق التطوير: إشعارات عامة
- فريق العمليات: إشعارات التشغيل
- الإدارة: تقارير دورية

---

**ملاحظة**: تأكد من تحديث المتغيرات والأسرار بانتظام والحفاظ على أمانها.