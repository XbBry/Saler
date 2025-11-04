#!/bin/bash

# إعداد سريع للمحترفين - CodeSpace مُحسّن
echo "🚀 إعداد CodeSpace مُحسّن للمشروع..."

# إعدادات Node.js مُحسّنة
export NODE_OPTIONS="--max-old-space-size=4096"
export NUXT_TELEMETRY_DISABLED=1

# تثبيت سريع للتبعيات
echo "📦 تثبيت التبعيات بسرعة..."
cd /workspace/frontend
npm install --prefer-offline --no-audit

# إعداد Backend سريع
echo "⚡ تشغيل Backend..."
cd /workspace/backend
source .venv/bin/activate

# تشغيل سريع للخدمات
echo "🏃‍♂️ تشغيل الخدمات..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &

# انتظار تفعيل Backend
sleep 3

echo "✅ جاهز! الآن:"
echo "   🔗 Backend API: http://localhost:8000/docs"
echo "   🌐 Frontend: http://localhost:3000"
echo ""
echo "💡 نصائح للسرعة:"
echo "   • استخدم Terminal منفصل للـ Frontend"
echo "   • فعل بينتظام الملفات: npm run lint:fix"
echo "   • غير Editor إلى VS Code (أسرع من Web)"