# 🔄 GitHub Actions CI/CD Pipeline - دليل شامل

مرحباً بك في نظام CI/CD المتقدم لمنصة Saler! هذا الدليل يشرح جميع workflows والعمليات المتاحة.

## 📋 نظرة عامة

يحتوي المشروع على **5 workflows رئيسية** توفر نظام CI/CD شامل ومتطور:

| Workflow | الغرض | التوقيت |
|----------|-------|----------|
| 🚀 **CI Pipeline** | الاختبارات المستمرة | عند كل push/PR |
| 🔒 **Security Pipeline** | فحص الأمان | يومياً + يدوي |
| 🚀 **Deploy Pipeline** | النشر | عند push إلى main |
| ⚡ **Performance Pipeline** | اختبارات الأداء | أسبوعياً + يدوي |
| 📚 **Documentation Pipeline** | بناء التوثيق | عند تغيير الوثائق |

---

## 🚀 CI Pipeline - الاختبارات المستمرة

### الهدف
التأكد من جودة الكود والاختبارات الشاملة

### المكونات
- **Backend Testing**: Python 3.11 مع FastAPI
- **Frontend Testing**: Node.js 18 مع Next.js
- **Database Testing**: PostgreSQL + Redis
- **Integration Testing**: اختبارات شاملة
- **Code Quality**: Linting و Type checking

### التشغيل
```bash
# تشغيل تلقائي
git push origin main

# تشغيل يدوي
gh workflow run ci.yml

# مع معاملات مخصصة
gh workflow run ci.yml -f environment=staging
```

### مخرجات
- ✅ تقارير الاختبارات
- ✅ Coverage reports
- ✅ Code quality metrics
- ✅ Docker image builds

---

## 🔒 Security Pipeline - فحص الأمان

### الهدف
فحص شامل للأمان والثغرات

### المكونات
- **SAST**: تحليل الثغرات في الكود
- **Dependency Scanning**: فحص المكتبات
- **Container Security**: فحص الحاويات
- **Secret Scanning**: البحث عن السرية المكشوفة
- **License Compliance**: فحص التراخيص

### التشغيل
```bash
# فحص كامل
gh workflow run security.yml

# فحص سريع
gh workflow run security.yml -f scan_type=quick

# فحص التبعيات فقط
gh workflow run security.yml -f scan_type=dependencies

# فحص السرية فقط
gh workflow run security.yml -f scan_type=secrets
```

### نتائج الفحص
- 🔒 **CodeQL Analysis**
- 🛡️ **Semgrep Results**
- 📦 **Safety (Python)**
- 🟨 **npm Audit**
- 🔍 **TruffleHog**
- 📜 **License Report**

---

## 🚀 Deploy Pipeline - النشر

### الهدف
نشر آمن ومتدرج للبيئات المختلفة

### البيئات
1. **Development**: للنشر اليومي
2. **Staging**: للاختبار قبل الإنتاج
3. **Production**: للإنتاج الفعلي

### التشغيل
```bash
# نشر إلى Staging
gh workflow run deploy.yml -f environment=staging

# نشر إلى Production (يتطلب tag)
git tag v1.0.0
git push origin v1.0.0

# نشر قسري (غير موصى به)
gh workflow run deploy.yml -f environment=prod -f force_deploy=true
```

### عملية النشر
```
1. ✅ Pre-deployment checks
2. 🏗️ Build Docker images
3. 🗄️ Database migrations
4. ⚡ Deploy Backend
5. 🎨 Deploy Frontend
6. 🌐 Configure Ingress
7. 📊 Setup Monitoring
8. ✅ Post-deployment validation
```

### فحوصات ما بعد النشر
- 🏥 **Health Checks**
- ⚡ **Performance Tests**
- 📊 **Smoke Tests**
- 📈 **Monitoring Validation**

---

## ⚡ Performance Pipeline - اختبارات الأداء

### الهدف
ضمان الأداء الأمثل تحت الحمولة المختلفة

### أنواع الاختبارات
- **Load Testing**: اختبار الحمولة العادية
- **Stress Testing**: اختبار الإجهاد
- **Endurance Testing**: اختبار التحمل الطويل
- **Lighthouse Audits**: فحص أداء الويب

### التشغيل
```bash
# اختبار أداء كامل
gh workflow run performance.yml -f test_type=full

# اختبار حمولة سريع
gh workflow run performance.yml -f test_type=quick

# اختبار إجهاد
gh workflow run performance.yml -f test_type=stress

# اختبار تحمل
gh workflow run performance.yml -f test_type=endurance
```

### المقاييس
- 📊 **Response Time**: < 500ms (95th percentile)
- 📈 **Throughput**: Requests per second
- 🔄 **Error Rate**: < 5%
- 🧠 **Memory Usage**: Monitoring leaks
- 🗄️ **Database Performance**: Query times

---

## 📚 Documentation Pipeline - التوثيق

### الهدف
بناء وتوليد التوثيق تلقائياً

### أنواع التوثيق
- **API Documentation**: توثيق FastAPI
- **Frontend Docs**: React components
- **User Guide**: دليل المستخدم
- **Developer Docs**: وثائق المطور
- **Architecture Docs**: البنية المعمارية

### التشغيل
```bash
# بناء كل التوثيق
gh workflow run documentation.yml -f build_type=all

# توثيق API فقط
gh workflow run documentation.yml -f build_type=api-only

# دليل المستخدم فقط
gh workflow run documentation.yml -f build_type=user-guide

# وثائق المطور فقط
gh workflow run documentation.yml -f build_type=developer-docs
```

### المخرجات
- 📖 **MkDocs Site**
- 📡 **OpenAPI Spec**
- 📦 **Postman Collection**
- 📋 **TypeScript Docs**
- 🎨 **Component Library**

---

## 🔄 Workflow Dispatch - التشغيل اليدوي

### الاستخدام

```bash
# عرض workflows المتاحة
gh workflow list

# تشغيل CI
gh workflow run ci.yml

# تشغيل Security Scan
gh workflow run security.yml

# تشغيل Deploy
gh workflow run deploy.yml -f environment=staging

# تشغيل Performance Tests
gh workflow run performance.yml -f test_type=full

# تشغيل Documentation Build
gh workflow run documentation.yml -f build_type=all
```

### المعاملات المتاحة

#### Deploy Pipeline
```yaml
environment: [dev, staging, prod]
force_deploy: [true, false]
```

#### Security Pipeline
```yaml
scan_type: [full, quick, dependencies, secrets]
```

#### Performance Pipeline
```yaml
test_type: [quick, full, load, stress, endurance]
environment: [staging, production]
```

#### Documentation Pipeline
```yaml
build_type: [api-only, user-guide, developer-docs, all]
```

---

## 📊 المراقبة والتنبيهات

### Slack Integration
- `#deployments`: إشعارات النشر
- `#security`: تنبيهات الأمان
- `#performance`: تقارير الأداء

### Email Notifications
- إشعارات عامة
- تقارير دورية
- تنبيهات الطوارئ

### Dashboard Links
- **GitHub Actions**: Repository Actions tab
- **Performance Metrics**: Grafana dashboard
- **Security Scan**: Security tab
- **Deployment Status**: Environments page

---

## 🛠️ المتطلبات والإعداد

### Repository Secrets
```bash
# Database
DEV_DATABASE_URL=postgresql://...
STAGING_DATABASE_URL=postgresql://...
PROD_DATABASE_URL=postgresql://...

# Services
DEV_REDIS_URL=redis://...
STAGING_REDIS_URL=redis://...
PROD_REDIS_URL=redis://...

# Kubernetes
KUBECONFIG_DATA=<base64-encoded>

# Monitoring
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
EMAIL_USERNAME=notifications@...
EMAIL_PASSWORD=app-password

# Security
SONAR_TOKEN=...
SNYK_TOKEN=...
SEMGREP_APP_TOKEN=...
```

### Environment Variables
```yaml
# GitHub Environments
- development
- staging  
- production
```

---

## 🎯 أفضل الممارسات

### للتطوير
1. **استخدم feature branches** للتطوير
2. **شغل CI محلياً** قبل push
3. **راجع الكود** قبل merge
4. **اختبر في Staging** قبل Production

### للأمان
1. **شغل security scan** بانتظام
2. **راجع الثغرات** المكتشفة فوراً
3. **حدث المكتبات** بانتظام
4. **استخدم secret scanning**

### للنشر
1. **اختبر في Staging** أولاً
2. **احتفظ بنسخة احتياطية** قبل النشر
3. **راقب الأداء** بعد النشر
4. **تابع التقارير** والتنبيهات

### للأداء
1. **شغل performance tests** أسبوعياً
2. **راقب المقاييس** باستمرار
3. **حسن البطء** المكتشف
4. **استخدم caching** بذكاء

---

## 🆘 استكشاف الأخطاء

### مشاكل شائعة

#### CI يفشل
```bash
# فحص logs
gh run list
gh run view <run-id>

# تشغيل محلي للاختبار
cd backend && pytest
cd frontend && npm test
```

#### Security scan يفشل
```bash
# فحص التبعيات
cd backend && safety check
cd frontend && npm audit

# تحديث المكتبات
pip install --upgrade -r requirements.txt
npm update
```

#### Deploy يفشل
```bash
# فحص البيئة
kubectl get nodes
kubectl get pods -n <namespace>

# فحص الحاويات
docker ps
docker logs <container-id>
```

### الحصول على المساعدة
- 📧 **Email**: devops@company.com
- 💬 **Slack**: #devops-support
- 📚 **Documentation**: هذا الدليل
- 🐛 **Issues**: GitHub Issues

---

## 📈 التحسين المستمر

### المقاييس المستهدفة
- **Deployment Success Rate**: > 99%
- **Mean Time to Recovery**: < 30 minutes
- **Test Coverage**: > 80%
- **Performance Score**: > 90

### التحسينات المخططة
- [ ] **Blue-Green Deployment**
- [ ] **Canary Releases**
- [ ] **Auto-scaling**
- [ ] **Chaos Engineering**

---

**🚀 Happy Deploying!**

*للمزيد من المعلومات، راجع وثائق كل workflow أو تواصل مع فريق DevOps.*