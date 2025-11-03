# 🛠️ دليل إعداد IDE للـ Saler SaaS Platform

## نظرة عامة
يحتوي هذا الدليل على إعدادات IDE المدعومة لمنصة Saler SaaS Platform. يدعم النظام VS Code و JetBrains IDEs و Vim/Neovim.

## 📁 الملفات المُنشأة

### VS Code Configuration Files
- `.vscode/settings.json` - إعدادات workspace الأساسية
- `.vscode/extensions.json` - توصيات الإضافات
- `.vscode/launch.json` - إعدادات تشغيل وتشخيص الأخطاء

### Editor Configuration
- `.editorconfig` - إعدادات معيارية للتحرير عبر جميع المحررات
- `.prettierrc` - إعدادات تنسيق الكود (Prettier)
- `frontend/.eslintrc.json` - إعدادات ESLint للـ Frontend

### Environment Configuration
- `.env.example` - نموذج متغيرات البيئة مع توثيق شامل

## 🚀 VS Code Setup

### الإضافات المُوصى بها
التحميل التلقائي للإضافات سيحدث عند فتح المشروع أولاً مرة في VS Code.

### Debug Configurations
قائمة بالتشكيلات المتاحة:
- `🚀 تشغيل Backend (FastAPI)` - تشغيل الخادم مع hot-reload
- `🧪 تشغيل Python Tests` - تشغيل جميع الاختبارات
- `🧪 تشغيل Specific Test` - اختبار محدد
- `⚡ تشغيل Worker (ARQ)` - تشغيل worker للمهام الخلفية
- `🌐 تشغيل Frontend (Next.js)` - تشغيل التطبيق الأمامي
- `🧪 Frontend Tests` - اختبارات الـ frontend
- `🔧 Database Migration` - ترحيل قاعدة البيانات
- `🔄 Database Migration Revision` - إنشاء مراجعة ترحيل
- `🐳 Docker: Build Backend` - بناء صورة Docker للخلفية
- `🐳 Docker: Build Frontend` - بناء صورة Docker للمقدمة
- `🔍 Attach to Python Process` - الاتصال بعملية Python
- `⚡ PowerShell Debug Session` - جلسة تشخيص PowerShell
- `🖥️ BASH Debug Session` - جلسة تشخيص Bash
- `🚀 تشغيل كامل` - تشغيل جميع الخدمات (Compound)

### Keyboard Shortcuts
```bash
# تشغيل الخدمات
Ctrl+Shift+D ثم اختيار "🚀 تشغيل كامل"

# تشغيل Frontend فقط
F5 في مجلد frontend/

# تشغيل Backend فقط  
F5 في مجلد backend/

# إيقاف جميع العمليات
Shift+F5
```

## 🐍 Python Development Setup

### Virtual Environment
```bash
# إنشاء البيئة الافتراضية
python -m venv .venv

# تفعيل البيئة
source .venv/bin/activate  # Linux/Mac
# أو
.venv\Scripts\activate     # Windows

# تثبيت المتطلبات
pip install -r requirements.txt
```

### Linting & Formatting
- **Black**: تنسيق الكود تلقائياً
- **Flake8**: فحص جودة الكود
- **MyPy**: فحص الأنواع
- **isort**: ترتيب الواردات

### Debug Configuration
تأكد من أن Python interpreter مُحدد بشكل صحيح:
```json
{
  "python.defaultInterpreterPath": "./.venv/bin/python"
}
```

## 🌐 Frontend Development Setup

### Next.js Configuration
```bash
# تثبيت dependencies
npm install

# تشغيل development server
npm run dev

# بناء للإنتاج
npm run build

# تشغيل tests
npm test
```

### TypeScript Configuration
- دعم TypeScript مُفعل بالكامل
- path mapping للمجلدات الرئيسية
- strict type checking

### Styling Configuration
- **Tailwind CSS**: إطار عمل CSS
- **Prettier**: تنسيق الكود
- **ESLint**: فحص جودة الكود

## 🗄️ Database Integration

### PostgreSQL Connection
الإعدادات في `.vscode/settings.json`:
```json
"sqltools.connections": [
  {
    "name": "Saler Database",
    "driver": "PostgreSQL",
    "server": "localhost",
    "port": 5432,
    "database": "saler_db",
    "username": "saler",
    "password": "saler123"
  }
]
```

### Redis Integration
- Redis commands highlighting
- Key-value browser support

## 🔧 Development Tools Integration

### Docker Support
- Docker extension للتطوير
- Docker Compose integration
- Container debugging

### Git Integration
- GitLens for enhanced Git features
- GitHub Pull Requests integration
- Automatic staging and commits

### API Testing
- REST Client extension
- Postman integration
- OpenAPI/Swagger support

## 🎨 UI/UX Enhancements

### Themes
- Material Icon Theme
- Material Theme
- Custom dark theme

### Productivity
- Todo Tree for task management
- Path Intellisense
- Auto Rename Tag
- Bracket Pair Colorizer

## 🔒 Security Configuration

### Environment Variables
- `.env.example` يحتوي على جميع المتغيرات المطلوبة
- Copy إلى `.env` وتعبئة القيم الفعلية

### Security Headers
- CORS configuration
- Authentication settings
- Rate limiting settings

## 📊 Monitoring & Debugging

### Health Checks
```bash
# تشغيل health check
./scripts/health-check.sh

# مراقبة الـ logs
./scripts/log-monitor.sh
```

### Performance Monitoring
- Integration with Sentry
- Datadog support
- Custom metrics

## 🚀 Development Workflow

### 1. Initial Setup
```bash
# تشغيل الإعداد الأولي
./scripts/setup.sh

# تثبيت tools التطويرية
./scripts/tools.sh

# إعداد IDE
./scripts/ide.sh
```

### 2. Daily Development
```bash
# تشغيل البيئة التطويرية
./scripts/dev.sh

# أو تشغيل خدمات محددة
docker-compose up -d db redis
```

### 3. Testing
```bash
# Backend tests
cd backend && pytest

# Frontend tests
cd frontend && npm test

# Integration tests
./scripts/run-integration-tests.sh
```

### 4. Deployment
```bash
# Production setup
./scripts/setup-production.sh

# Health check
./scripts/health-check.sh
```

## 🐛 Troubleshooting

### Common Issues

#### Python Issues
```bash
# إعادة إنشاء venv
rm -rf .venv
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

#### Node.js Issues
```bash
# تنظيف cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Database Issues
```bash
# إعادة تعيين قاعدة البيانات
./scripts/reset.sh

# إعادة تشغيل migrations
cd backend && alembic upgrade head
```

#### Docker Issues
```bash
# تنظيف containers
docker system prune -a

# إعادة بناء images
docker-compose build --no-cache
```

## 📚 Additional Resources

### Documentation
- `docs/development/` - دليل التطوير الكامل
- `docs/api/` - توثيق API
- `docs/architecture/` - بنية النظام

### Scripts Reference
- `scripts/setup.sh` - إعداد أولي
- `scripts/dev.sh` - تشغيل البيئة التطويرية
- `scripts/reset.sh` - إعادة تعيين
- `scripts/tools.sh` - أدوات التطوير
- `scripts/ide.sh` - إعداد IDE

### Configuration Files
- `docker-compose.yml` - Docker services
- `.env.example` - متغيرات البيئة
- `.prettierrc` - تنسيق الكود
- `frontend/.eslintrc.json` - فحص الكود

---

💡 **نصيحة**: ابدأ بقراءة `docs/development/quick-start.md` للحصول على دليل سريع للبدء.