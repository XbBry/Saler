# 🚀 دليل البدء السريع - Saler Development Environment

## نظرة عامة

هذا الدليل سيساعدك على إعداد بيئة تطوير Saler في أقل من 15 دقيقة.

## المتطلبات الأساسية

### البرامج المطلوبة
- **Docker** (20.10+)
- **Docker Compose** (2.0+)
- **Python** (3.11+)
- **Node.js** (18+) و **npm**
- **Git**

### البرامج المُوصى بها
- **VS Code** (مع الإضافات المطلوبة)
- **Postman** أو **Insomnia** لاختبار API

## إعداد سريع (5 دقائق)

### 1. استنساخ المستودع
```bash
git clone <repository-url>
cd saler
```

### 2. تشغيل سكريبت الإعداد الرئيسي
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

هذا السكريبت سيقوم بـ:
- فحص متطلبات النظام
- إنشاء بنية المشروع
- تثبيت أدوات التطوير
- إعداد Git hooks
- إنشاء ملفات البيئة
- إعداد IDE configurations

### 3. تعديل متغيرات البيئة
```bash
# نسخ ملف البيئة النموذجي
cp .env.example .env.local

# تعديل المفاتيح المطلوبة
nano .env.local
```

**المفاتيح المطلوبة:**
```bash
# OpenAI API (للذكاء الاصطناعي)
OPENAI_API_KEY=sk-...

# قاعدة البيانات
POSTGRES_PASSWORD=your_secure_password

# JWT Secret
SECRET_KEY=your-very-secure-secret-key

# مفاتيح الرسائل (اختيارية)
TWILIO_ACCOUNT_SID=...
ULTRAMSG_API_KEY=...
```

### 4. بدء بيئة التطوير
```bash
./scripts/dev.sh start --with-gui
```

هذا سيقوم بتشغيل:
- قاعدة البيانات PostgreSQL
- Redis للتخزين المؤقت
- Backend API (FastAPI)
- Frontend (Next.js)
- Worker للمهام الخلفية
- أدوات GUI التطوير

## الروابط المهمة

بعد بدء التشغيل، ستكون هذه الخدمات متاحة:

| الخدمة | الرابط | الوصف |
|---------|--------|---------|
| **Frontend** | http://localhost:3000 | واجهة المستخدم الرئيسية |
| **Backend API** | http://localhost:8000 | API الخادم |
| **API Documentation** | http://localhost:8000/docs | وثائق API التفاعلية |
| **pgAdmin** | http://localhost:8080 | إدارة قاعدة البيانات |
| **Redis Commander** | http://localhost:8081 | إدارة Redis |
| **MailHog** | http://localhost:8025 | اختبار الرسائل |

## أوامر سريعة

### إدارة البيئة
```bash
# بدء جميع الخدمات
./scripts/dev.sh start

# إيقاف جميع الخدمات
./scripts/dev.sh stop

# إعادة تشغيل
./scripts/dev.sh restart

# عرض الحالة
./scripts/dev.sh status

# عرض السجلات
./scripts/dev.sh logs

# تنظيف البيئة
./scripts/reset.sh clean
```

### قواعد البيانات
```bash
# اتصال PostgreSQL
docker-compose exec postgres psql -U saler_user saler

# نسخة احتياطية
./scripts/dev.sh db backup

# استعادة نسخة احتياطية
./scripts/dev.sh db restore backup_20231201_143022.sql

# إعادة تعيين قاعدة البيانات
./scripts/dev.sh db reset
```

### التطوير
```bash
# تشغيل الاختبارات (Python)
cd backend && python -m pytest

# تشغيل الاختبارات (JavaScript)
cd frontend && npm test

# فحص جودة الكود
./scripts/dev.sh lint

# تنسيق الكود
./scripts/dev.sh format
```

## هيكل المشروع

```
saler/
├── backend/                 # FastAPI Backend
│   ├── app/                # كود التطبيق
│   ├── tests/              # اختبارات Python
│   ├── requirements.txt    # متطلبات Python
│   └── venv/               # البيئة الافتراضية
├── frontend/               # Next.js Frontend
│   ├── src/                # كود React
│   ├── pages/              # صفحات Next.js
│   ├── components/         # مكونات React
│   └── tests/              # اختبارات JavaScript
├── scripts/                # سكريبتات التطوير
│   ├── setup.sh           # إعداد البيئة
│   ├── dev.sh             # إدارة البيئة
│   ├── reset.sh           # تنظيف البيئة
│   └── tools.sh           # تثبيت الأدوات
├── docs/                   # الوثائق
├── logs/                   # سجلات التطبيق
├── dev-data/              # بيانات التطوير
└── docker-compose.yml     # تكوين Docker
```

## بيئات التطوير

### VS Code
1. افتح VS Code في المجلد الجذر
2. ثبت الإضافات المطلوبة (سيتم تثبيتها تلقائياً)
3. استخدم F5 لتشغيل Debug configurations
4. انظر إلى Terminal المتكامل للأوامر السريعة

### Docker Desktop
راقب حالة الحاويات من خلال Docker Desktop
اعرض السجلات وموارد النظام

### أدوات إضافية
- **pgAdmin**: إدارة قاعدة البيانات
- **Redis Commander**: إدارة Redis
- **MailHog**: اختبار الرسائل

## مشاكل شائعة وحلولها

### مشكلة: Docker غير متاح
```bash
# فحص حالة Docker
docker --version
docker info

# إعادة تشغيل Docker daemon
sudo systemctl restart docker
```

### مشكلة: المنفذ مستخدم
```bash
# فحص المنافذ المستخدمة
netstat -tulpn | grep :8000
netstat -tulpn | grep :3000

# إيقاف العمليات التي تستخدم المنافذ
sudo kill -9 <PID>
```

### مشكلة: خطأ في قاعدة البيانات
```bash
# إعادة تشغيل قاعدة البيانات
docker-compose restart postgres

# فحص سجلات قاعدة البيانات
docker-compose logs postgres
```

### مشكلة: مشاكل في البيئة الافتراضية
```bash
# إعادة إنشاء البيئة الافتراضية
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### مشكلة: مشاكل في Node.js
```bash
# تنظيف cache
cd frontend
rm -rf node_modules package-lock.json
npm install

# أو استخدام nvm
nvm use 18
```

## نصائح للتطوير الفعال

### 1. استخدم Aliases
أضف هذهAliases إلى ملف `.bashrc` أو `.zshrc`:
```bash
alias saler-start='./scripts/dev.sh start'
alias saler-stop='./scripts/dev.sh stop'
alias saler-status='./scripts/dev.sh status'
alias psql-dev='docker-compose exec postgres psql -U saler_user saler'
```

### 2. Monitor Resources
راقب استخدام الذاكرة والمعالج:
```bash
# مراقبة الموارد
docker stats

# مراقبة السجلات
tail -f logs/*.log
```

### 3. Regular Backups
قم بعمل نسخ احتياطية دورية:
```bash
# نسخة احتياطية تلقائية
./scripts/dev.sh db backup
```

### 4. Code Quality
حافظ على جودة الكود:
```bash
# فحص جودة الكود قبل كل commit
pre-commit run --all-files
```

## الخطوات التالية

بعد إعداد البيئة، أنصحك بـ:

1. **قراءة الوثائق التقنية** في مجلد `docs/technical/`
2. **فهم API Documentation** على http://localhost:8000/docs
3. **استكشاف Frontend Code** في مجلد `frontend/src/`
4. **فهم Backend Architecture** في مجلد `backend/app/`
5. **تشغيل الاختبارات** للتأكد من عمل كل شيء

## الدعم والمساعدة

- **الوثائق**: `docs/development/`
- **Troubleshooting Guide**: `docs/development/troubleshooting.md`
- **Architecture Guide**: `docs/development/architecture.md`
- **API Documentation**: http://localhost:8000/docs

---

🎉 **مبروك! بيئة التطوير جاهزة للاستخدام!**

إذا واجهت أي مشكلة، راجع [دليل استكشاف الأخطاء](./troubleshooting.md) أو رفع issue في المستودع.