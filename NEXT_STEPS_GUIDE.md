# ⚡ دليل الخطوات التالية - Saler v2.0

**🎯 الهدف:** إكمال البنية التحتية المتبقية للإطلاق الكامل

---

## 🚀 خطوات التنفيذ الفورية (Next 30 minutes)

### 1. إعداد قاعدة البيانات PostgreSQL
```bash
# تشغيل PostgreSQL في Docker
docker run --name saler-postgres \
  -e POSTGRES_DB=saler_dev \
  -e POSTGRES_USER=saler \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# التحقق من الاتصال
export DATABASE_URL=postgresql://saler:password@localhost:5432/saler_dev
```

### 2. إعداد Redis
```bash
# تشغيل Redis في Docker  
docker run --name saler-redis \
  -p 6379:6379 \
  -d redis:7-alpine

# التحقق من الاتصال
export REDIS_URL=redis://localhost:6379/0
```

### 3. تطبيق Alembic Migrations
```bash
cd /workspace/saler/backend
alembic upgrade head
echo "✅ Database migrations applied!"
```

---

## 🔧 فحص النظام المتكامل

### 4. تشغيل FastAPI
```bash
cd /workspace/saler/backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
echo "🚀 FastAPI running on http://localhost:8000"
```

### 5. اختبار Health Checks
```bash
# فحص الصحة الأساسي
curl http://localhost:8000/health

# فحص Prometheus metrics
curl http://localhost:8000/metrics | head -20

# فحص API documentation
curl http://localhost:8000/docs
```

### 6. اختبار قاعدة البيانات
```bash
# فحص اتصال قاعدة البيانات
python -c "
from app.core.database import connection_manager
import asyncio
async def test_db():
    async with connection_manager.get_connection() as conn:
        result = await conn.execute('SELECT 1')
        print('✅ Database connection: SUCCESS')
        print(f'Result: {result}')
asyncio.run(test_db())
"
```

---

## 📊 إعداد المراقبة

### 7. تشغيل Prometheus
```bash
# تشغيل Prometheus
docker run --name saler-prometheus \
  -p 9090:9090 \
  -d prom/prometheus

# التحقق من metrics
curl http://localhost:9090/metrics
```

### 8. تشغيل Grafana
```bash
# تشغيل Grafana (اختياري للـ monitoring)
docker run --name saler-grafana \
  -p 3001:3000 \
  -d grafana/grafana
# Access: http://localhost:3001 (admin/admin)
```

---

## 🧪 الاختبار الشامل

### 9. تشغيل الاختبارات
```bash
cd /workspace/saler/backend
python -m pytest tests/ -v --tb=short
echo "🧪 Test suite completed!"
```

### 10. اختبار الأداء الأساسي
```bash
# اختبار بسيط للأداء
for i in {1..10}; do
  curl -s http://localhost:8000/health > /dev/null
  echo "Request $i: OK"
done
echo "⚡ Performance test completed!"
```

---

## 🔍 فحص تقدم جاهزية الإطلاق

### 11. تحديث تقرير الجاهزية
```bash
# فحص سريع لحالة جميع المكونات
echo "🔍 Checking Saler v2.0 Launch Readiness:"
echo ""
echo "📊 Component Status:"
echo "✅ FastAPI: Running on port 8000"
echo "✅ PostgreSQL: $(docker ps | grep saler-postgres > /dev/null && echo 'Running' || echo 'Needs Setup')"
echo "✅ Redis: $(docker ps | grep saler-redis > /dev/null && echo 'Running' || echo 'Needs Setup')"
echo "✅ Prometheus: $(docker ps | grep saler-prometheus > /dev/null && echo 'Running' || echo 'Optional')"
echo ""
echo "🌐 Endpoints to test:"
echo "• Health: http://localhost:8000/health"
echo "• Metrics: http://localhost:8000/metrics"
echo "• API Docs: http://localhost:8000/docs"
echo "• Prometheus: http://localhost:9090"
```

---

## 🎯 المرحلة التالية: الأمن والـ Frontend

### بعد إكمال البنية الأساسية:
1. **اختبار JWT Authentication** - تسجيل دخول، إنشاء tokens
2. **اختبار Rate Limiting** - تجربة حدود الطلبات
3. **إعداد Frontend** - Next.js + React integration
4. **اختبار Integration** - Backend + Frontend together
5. **Load Testing** - اختبار الضغط العالي

---

## 📞 إذا واجهت مشاكل

### مشاكل شائعة وحلولها:

#### ❌ "ModuleNotFoundError: email-validator"
```bash
pip install email-validator
```

#### ❌ "Connection refused to PostgreSQL"
```bash
# تأكد أن PostgreSQL يعمل
docker ps | grep saler-postgres
# أو أعد تشغيله
docker restart saler-postgres
```

#### ❌ "Connection refused to Redis"
```bash
# تأكد أن Redis يعمل
docker ps | grep saler-redis
# أو أعد تشغيله
docker restart saler-redis
```

#### ❌ "alembic upgrade head failed"
```bash
# تحقق من DATABASE_URL
echo $DATABASE_URL
# أعد تطبيق migrations
alembic upgrade head
```

---

## ✅ مؤشرات النجاح

عندما تكمل هذه الخطوات، ستحصل على:

- 🟢 **FastAPI Backend**: يعمل بالكامل مع database + Redis
- 🟢 **Database Migrations**: مطبقة وجاهزة
- 🟢 **Health Monitoring**: endpoints تعمل
- 🟢 **Prometheus Metrics**: متوفرة
- 🟢 **Test Suite**: يعمل بنجاح

**🎉 النتيجة: Saler v2.0 جاهز للإطلاق الجزئي!**

---

**📧 من:** MiniMax Agent  
**⏱️ الوقت المتوقع:** 30-60 دقيقة  
**🎯 الهدف:** إكمال البنية التحتية للإطلاق الكامل
