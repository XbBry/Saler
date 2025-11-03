# Pre-commit Hooks - دليل شامل

هذا الدليل يشرح كيفية استخدام نظام pre-commit hooks الشامل المطور لمشروع Saler.

## 🎯 نظرة عامة

نظام pre-commit hooks الشامل يتضمن:

- **Python Formatting**: Black
- **Python Import Sorting**: isort  
- **Python Linting**: Flake8 مع إضافات
- **Python Type Checking**: MyPy
- **Python Security Scanning**: Bandit
- **Python Testing**: pytest hooks
- **JavaScript/TypeScript Linting**: ESLint
- **JavaScript/TypeScript Formatting**: Prettier
- **Conventional Commits**: commitizen
- **General File Checks**: trailing-whitespace, end-of-file-fixer, etc.

## 🚀 التثبيت السريع

```bash
# تثبيت سريع باستخدام الـ Makefile
make pc-setup

# أو باستخدام الـ script مباشرة
bash scripts/pre-commit-install.sh
```

## 📋 الملفات الإعدادات

### 1. `.pre-commit-config.yaml`
الملف الرئيسي الذي يحتوي على إعدادات جميع الـ hooks

### 2. `setup.cfg`
إعدادات Flake8 مع إعدادات مفصلة للأخطاء والتجاهلات

### 3. `pyproject.toml`
إعدادات Black، isort، MyPy، pytest، coverage، و Bandit

### 4. `.mypy.ini`
إعدادات MyPy المفصلة للتحقق من الأنواع

### 5. `requirements-dev.txt`
جميع التبعيات المطلوبة للأدوات المختلفة

## 🛠️ الأوامر الأساسية

### التثبيت والإعداد

```bash
# تثبيت pre-commit hooks
make pc-install

# تحديث جميع الـ hooks لأحدث إصدار
make pc-update

# إعداد بيئة التطوير الكاملة
make pc-setup

# تحميل aliases للأوامر السريعة
make pc-aliases
```

### تشغيل الفحوصات

```bash
# تشغيل جميع الـ hooks على جميع الملفات
make pc-run

# تشغيل الـ hooks على الملفات المدرجة فقط
make pc-run-staged

# فحص الجودة دون إصلاح
make pc-check

# إصلاح المشاكل تلقائياً
make pc-fix
```

### تشغيل أدوات فردية

```bash
# Python formatting
make pc-black
make pc-isort

# Python linting
make pc-flake8
make pc-mypy

# Python security
make pc-bandit

# Frontend tools
make pc-eslint
make pc-prettier
```

### إدارة الـ hooks

```bash
# عرض حالة التثبيت
make pc-status

# تنظيف ملفات pre-commit المؤقتة
make pc-clean

# إعادة تثبيت من البداية
make pc-reinstall

# تخطي الـ hooks (حالات طارئة فقط)
make pc-skip
```

## 🔧 الاستخدام اليومي

### العمل الطبيعي

```bash
# 1. إجراء التغييرات على الكود
# 2. إضافة الملفات
git add .

# 3. عمل commit - الـ hooks ستعمل تلقائياً
git commit -m "feat: إضافة ميزة جديدة"

# إذا فشلت الـ hooks، قم بالإصلاح:
make pc-fix

# ثم كرر المحاولة
git commit -m "feat: إضافة ميزة جديدة"
```

### فحص التغييرات قبل الـ commit

```bash
# فحص ما سيتم commit
make pc-run-staged

# أو فحص جميع الملفات
make pc-run
```

### إصلاح المشاكل

```bash
# إصلاح تلقائي للمشاكل القابلة للإصلاح
make pc-fix

# ثم فحص النتائج
make pc-check
```

## 📚 aliases سريعة

بعد تحميل aliases باستخدام `make pc-aliases`:

```bash
# aliases مفيدة للاستخدام اليومي
pc-all        # تشغيل جميع الـ hooks
pc-black      # تنسيق Python
pc-isort      # ترتيب imports
pc-flake8     # فحص Python
pc-mypy       # فحص الأنواع
pc-eslint     # فحص JavaScript/TypeScript
pc-prettier   # تنسيق JavaScript/TypeScript
pc-update     # تحديث الـ hooks
pc-install    # تثبيت الـ hooks
pc-staged     # فحص الملفات المدرجة
pc-status     # عرض الحالة
```

## ⚙️ التخصيص والإعدادات

### إضافة ignore rules

في `setup.cfg`:
```ini
[flake8]
ignore = E203, W503, E501
```

في `pyproject.toml`:
```toml
[tool.black]
line-length = 100
exclude = '''
/(
  \.eggs
  | \.git
  | venv
)/
'''
```

### تخصيص MyPy

في `.mypy.ini`:
```ini
[mypy-app.models.*]
disallow_untyped_defs = False
```

## 🔍 استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### 1. فشل MyPy
```bash
# إضافة ignore مؤقت
# type: ignore

# أو تحديث الإعدادات
echo "[module]" >> .mypy.ini
echo "ignore_errors = True" >> .mypy.ini
```

#### 2. فشل Flake8
```bash
# فحص التفاصيل
flake8 --verbose app/

# إضافة ignore للسطر
# noqa: F401
```

#### 3. فشل Black مع imports طويلة
```bash
# زيادة طول السطر
black --line-length=120 app/
```

### تنظيف وإعادة التثبيت

```bash
# تنظيف شامل
make pc-clean
make pc-reinstall

# أو إعادة تشغيل التثبيت
bash scripts/pre-commit-install.sh
```

## 🔐 Conventional Commits

الـ hooks تفرض تنسيق Conventional Commits:

```bash
# أمثلة صحيحة
git commit -m "feat: إضافة ميزة تسجيل الدخول"
git commit -m "fix: إصلاح خطأ في عرض البيانات"
git commit -m "docs: تحديث وثائق API"
git commit -m "style: تنسيق كود Python"
git commit -m "refactor: إعادة هيكلة كود قاعدة البيانات"
git commit -m "test: إضافة اختبارات للتكامل"
git commit -m "chore: تحديث التبعيات"

# مع scope
git commit -m "feat(auth): إضافة JWT tokens"
git commit -m "fix(database): إصلاح استعلام SQL"
```

### أنواع الـ commits المدعومة:
- `feat`: ميزة جديدة
- `fix`: إصلاح bug
- `docs`: تحديث الوثائق
- `style`: تنسيق الكود (لا يؤثر على منطق الكود)
- `refactor`: إعادة هيكلة الكود
- `test`: إضافة أو تحديث اختبارات
- `chore`: مهام صيانة (dependencies, tools)
- `build`: تغييرات في build system
- `ci`: تغييرات في CI/CD
- `perf`: تحسين الأداء
- `revert`: التراجع عن commit سابق

## 📊 فحص جودة الكود

### التغطية (Coverage)
```bash
# فحص تغطية الاختبارات
make test-coverage

# أو مباشرة
pytest --cov=app --cov-report=html
```

### أداء التطبيق
```bash
# فحص أداء الكود
make benchmark

# اختبار الحمولة
make load-test
```

## 🐳 استخدام مع Docker

```bash
# تشغيل checks داخل container
docker-compose exec backend make pc-check

# تثبيت hooks في container
docker-compose exec backend make pc-install
```

## 🔄 التكامل مع CI/CD

### GitHub Actions
```yaml
- name: Run Pre-commit
  run: |
    make pc-ci
```

### GitLab CI
```yaml
pre-commit:
  script:
    - make pc-ci
```

## 📝 نصائح للمطورين

### 1. قبل كتابة الكود
```bash
make pc-check  # فحص الكود الحالي
```

### 2. أثناء التطوير
```bash
# تشغيل فحوصات سريعة
pc-black && pc-flake8  # Python
```

### 3. قبل الـ commit
```bash
make pc-run-staged  # فحص نهائي
```

### 4. بعد مشاكل في الـ hooks
```bash
make pc-fix  # إصلاح تلقائي
git add .
git commit -m "fix: إصلاح مشاكل الجودة"
```

## 🎯 أمثلة عملية

### سيناريو 1: إضافة ميزة جديدة
```bash
# 1. إنشاء branch
git checkout -b feature/new-feature

# 2. كتابة الكود
# ... إضافة الكود ...

# 3. فحص تلقائي
make pc-fix

# 4. فحص شامل
make pc-check

# 5. commit مع فحص
git add .
make pc-run-staged
git commit -m "feat: إضافة ميزة جديدة"
```

### سيناريو 2: إصلاح bug
```bash
# 1. تحديد المشكلة
# 2. كتابة إصلاح
# 3. اختبار
make test

# 4. فحص الجودة
make pc-check

# 5. commit
git add .
git commit -m "fix: إصلاح مشكلة العرض في لوحة التحكم"
```

## 📞 الدعم والمساعدة

### للحصول على المساعدة
```bash
# عرض الأوامر المتاحة
make help | grep pre-commit

# عرض معلومات pre-commit
pre-commit --help

# عرض حالة hooks
make pc-status
```

### مشاكل شائعة
1. **Python version**: تأكد من استخدام Python 3.12+
2. **Dependencies**: تشغيل `pip install -r requirements-dev.txt`
3. **Git hooks**: تشغيل `make pc-reinstall`
4. **File permissions**: تأكد من صلاحيات الملفات

## 🔄 التحديث والصيانة

```bash
# تحديث الـ hooks أسبوعياً
make pc-update

# فحص التبعيات المنتهية الصلاحية
pip list --outdated

# تحديث التبعيات
pip install --upgrade -r requirements-dev.txt
```

---

**ملاحظة**: هذا النظام مصمم لضمان جودة الكود والأمان. استخدم `pc-skip` فقط في حالات الطوارئ القصوى.