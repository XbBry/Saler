#!/bin/bash

echo "🚀 بدء إعداد بيئة التطوير Saler..."

# تثبيت Python packages
echo "📦 تثبيت Backend Dependencies..."
cd /workspace/backend
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt

# تثبيت Frontend dependencies
echo "📦 تثبيت Frontend Dependencies..."
cd /workspace/frontend
npm install

# إعداد قاعدة البيانات
echo "🗄️ إعداد قاعدة البيانات..."
cd /workspace/backend
source .venv/bin/activate
python -c "from app.core.database import engine; from app.models import *; print('✅ تم إعداد قاعدة البيانات بنجاح')"

echo "🎉 تم إعداد البيئة بنجاح!"
echo "🔗 للوصول للتطبيق:"
echo "   • Backend API: http://localhost:8000/docs"
echo "   • Frontend: http://localhost:3000"
echo ""
echo "📝 لتشغيل Backend:"
echo "   cd /workspace/backend && source .venv/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "📝 لتشغيل Frontend:"
echo "   cd /workspace/frontend && npm run dev"