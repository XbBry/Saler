# 🚀 رابط CodeSpace جاهز للمشروع

## ⚡ **الطريقة الأسرع - استخدم هذا الرابط:**

```
👈 اضغط على الرابط أدناه لإنشاء CodeSpace فورياً:
🔗 https://github.com/codespaces/new?template_owner=github&template_name=python&owner=%7B%7D
```

**ثم اتبع هذه الخطوات:**

### 1️⃣ **اختر repository جديد:**
```
Name: saler-ai-crm
Public: ✅ (للتشغيل السريع)
```

### 2️⃣ **اختر منطقة:**
```
Region: اختيار أي منطقة قريبة منك
```

### 3️⃣ **إنشاء CodeSpace:**
```
Click: "Create codespace"
```

---

## 🏃‍♂️ **التشغيل السريع في CodeSpace:**
<tool_call>
<invoke name="Write">
<parameter name="content">#!/bin/bash

echo "🚀 إعداد Saler في CodeSpace - سرعة قصوى!"

# تهيئة المشروع
mkdir -p /workspace/saler
cd /workspace/saler

# نسخ الكود (أو استخدم GitHub API لاستنساخ)
echo "📦 نسخ ملفات المشروع..."

# إعداد Backend سريع
echo "⚡ إعداد Backend..."
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn sqlalchemy aiosqlite alembic pydantic email-validator python-multipart python-jose cryptography passlib bcrypt

# إعداد Frontend سريع  
echo "🌐 إعداد Frontend..."
npm install -g npm@latest
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --use-npm
cd frontend
npm install @tanstack/react-query zod react-hook-form axios lucide-react
cd ..

# بدء الخدمات
echo "🏁 بدء التشغيل..."
source .venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &

echo "✅ تم! الآن:"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000/docs"
echo ""
echo "💡 في terminal آخر: cd /workspace/saler/frontend && npm run dev"