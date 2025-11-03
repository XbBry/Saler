#!/bin/bash
# 🚀 تطبيق Redis Caching System - Script تشغيل سريع

echo "🚀 بدء تطبيق نظام Redis Caching المتقدم..."

# التحقق من وجود Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker غير مثبت. يرجى تثبيت Docker أولاً."
    exit 1
fi

# التحقق من وجود Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose غير مثبت. يرجى تثبيت Docker Compose أولاً."
    exit 1
fi

echo "✅ Docker متوفر"

# إنشاء مجلد البيانات إذا لم يكن موجوداً
mkdir -p redis-data/{primary,cache,sessions,cluster}

# إعداد صلاحيات الملفات
chmod 755 redis-data
chmod 755 docker/redis-*.conf

echo "📋 خطوات التطبيق:"

echo "1️⃣ نسخ ملف البيئة وتحديث الإعدادات..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ تم إنشاء ملف .env من .env.example"
    echo "⚠️  يرجى تحديث متغيرات Redis في ملف .env"
else
    echo "ℹ️  ملف .env موجود بالفعل"
fi

echo "2️⃣ بناء وتشغيل Redis Cluster..."
docker-compose -f docker-compose.enhanced.yml up -d redis-primary redis-replica redis-cache redis-sessions redis-sentinel

echo "3️⃣ انتظار Redis للاتصال..."
sleep 10

echo "4️⃣ فحص حالة Redis..."
docker-compose -f docker-compose.enhanced.yml ps redis-primary redis-cache redis-sessions

echo "5️⃣ اختبار اتصال Redis..."
docker exec -it $(docker ps -q -f name=redis-primary) redis-cli -a your_redis_password ping

echo "6️⃣ تشغيل فحوصات الصحة..."
python3 scripts/cache_health_check.py

echo ""
echo "🎉 تم تطبيق نظام Redis Caching بنجاح!"
echo ""
echo "📊 URLs المفيدة:"
echo "   • API Documentation: http://localhost:8000/docs"
echo "   • Health Check: http://localhost:8000/health"
echo "   • Cache Health: http://localhost:8000/api/v1/cache/health"
echo "   • Cache Statistics: http://localhost:8000/api/v1/cache/statistics"
echo ""
echo "🔧 أوامر مفيدة:"
echo "   • فحص حالة Redis: docker-compose -f docker-compose.enhanced.yml ps"
echo "   • مراقبة Redis: docker-compose -f docker-compose.enhanced.yml logs -f redis-primary"
echo "   • فحص-cache: python3 scripts/cache_health_check.py"
echo "   • إعادة تشغيل: docker-compose -f docker-compose.enhanced.yml restart"
echo ""
echo "📝 ملاحظات:"
echo "   • تأكد من تحديث كلمات المرور في ملف .env"
echo "   • راجع إعدادات Redis في docker/redis-*.conf"
echo "   • تأكد من أن الكود يستخدم Cache decorators الجديدة"
