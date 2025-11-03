# 🚀 إعداد PostgreSQL للإنتاج - Saler Platform

هذا الدليل يوضح كيفية إعداد قاعدة بيانات PostgreSQL للإنتاج مع Redis للمشروع.

## 📋 المحتويات

- [نظرة عامة](#-نظرة-عامة)
- [المتطلبات](#-المتطلبات)
- [الإعدادات](#-الإعدادات)
- [التشغيل](#-التشغيل)
- [المراقبة](#-المراقبة)
- [النسخ الاحتياطي](#-النسخ-الاحتياطي)
- [الأمان](#-الأمان)
- [استكشاف الأخطاء](#-استكشاف-الأخطاء)

## 🌟 نظرة عامة

تم إعداد النظام مع:
- **PostgreSQL 15** - قاعدة البيانات الأساسية
- **Redis 7** - التخزين المؤقت وإدارة الجلسات
- **Docker Compose** - إدارة الخدمات
- **مراقبة شاملة** - Prometheus و Grafana
- **أمان متقدم** - SSL وتشفير

## 🔧 المتطلبات

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM كحد أدنى
- 20GB مساحة قرص صلب

## ⚙️ الإعدادات

### 1. تحديث متغيرات البيئة

انسخ ملف البيئة النموذجي:
```bash
cp .env.example .env
cp .env.database .env
```

حدث القيم في `.env`:
```bash
# إعدادات قاعدة البيانات
POSTGRES_USER=saler_user
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://saler_user:your_secure_password@localhost:5432/saler

# إعدادات Redis
REDIS_PASSWORD=your_redis_password
REDIS_URL=redis://:your_redis_password@localhost:6379/0
```

### 2. إعدادات PostgreSQL

#### ملف التكوين: `docker/postgres/postgresql.conf`
- تحسين الأداء
- إعدادات الأمان
- مراقبة مفصلة

#### إعدادات المصادقة: `docker/postgres/pg_hba.conf`
- أمان متقدم
- إعدادات SSL
- تحكم في الوصول

### 3. إعدادات Redis

#### ملف التكوين: `docker/redis.conf`
- تحسين الذاكرة
- إعدادات الأمان
- إعدادات التكرار

## 🚀 التشغيل

### بدء الخدمات

```bash
# بدء الخدمات الأساسية
docker-compose up -d postgres redis

# بدء جميع الخدمات (يشمل المراقبة)
docker-compose --profile monitoring up -d

# بدء الخدمات مع لوحة الإدارة
docker-compose --profile dev up -d
```

### التحقق من الحالة

```bash
# فحص حالة الخدمات
docker-compose ps

# فحص السجلات
docker-compose logs postgres
docker-compose logs redis

# اختبار الاتصال
docker-compose exec postgres pg_isready -U saler_user
docker-compose exec redis redis-cli ping
```

### تشغيل التطبيق

```bash
# تشغيل التطبيق
cd backend
python main.py

# أو باستخدام Docker
docker-compose up -d backend
```

## 📊 المراقبة

### 1. Prometheus (مقاييس النظام)
- العنوان: `http://localhost:9090`
- مراقبة مقاييس PostgreSQL و Redis

### 2. Grafana (لوحات المراقبة)
- العنوان: `http://localhost:3001`
- المستخدم: `admin`
- كلمة المرور: `saler_grafana`

### 3. PgAdmin (إدارة قاعدة البيانات)
- العنوان: `http://localhost:5050`
- البريد الإلكتروني: `admin@saler.com`
- كلمة المرور: `saler_admin`

### 4. Redis Insight (إدارة Redis)
- العنوان: `http://localhost:8001`

## 💾 النسخ الاحتياطي

### النسخ الاحتياطي التلقائي

```bash
# تشغيل النسخ الاحتياطي اليدوي
docker-compose --profile backup up postgres-backup

# البرنامج النصي للنسخ الاحتياطي
./docker/backup/backup.sh
```

### النسخ الاحتياطي اليدوي

```bash
# إنشاء نسخة احتياطية
docker-compose exec postgres pg_dump -U saler_user saler > backup_$(date +%Y%m%d).sql

# استعادة النسخة الاحتياطية
docker-compose exec -T postgres psql -U saler_user saler < backup_20240101.sql
```

### جدولة النسخ الاحتياطية

```bash
# إضافة إلى crontab
0 2 * * * /path/to/saler/docker/backup/backup.sh
```

## 🔒 الأمان

### 1. إعدادات SSL

```bash
# إنشاء شهادات SSL
mkdir -p docker/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/ssl/server.key \
  -out docker/ssl/server.crt
```

### 2. تحسين كلمة المرور

```bash
# استخدام كلمات مرور قوية
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
```

### 3. إعدادات الجدار الناري

```bash
# السماح فقط للمنافذ المطلوبة
ufw allow 5432  # PostgreSQL
ufw allow 6379  # Redis
```

## 🛠️ استكشاف الأخطاء

### مشاكل شائعة

#### 1. فشل الاتصال بقاعدة البيانات
```bash
# فحص حالة الخدمة
docker-compose ps postgres

# فحص السجلات
docker-compose logs postgres

# اختبار الاتصال
docker-compose exec postgres pg_isready -U saler_user -d saler
```

#### 2. مشاكل Redis
```bash
# فحص الذاكرة
docker-compose exec redis redis-cli info memory

# فحص الاتصالات
docker-compose exec redis redis-cli info clients

# إعادة تشغيل الخدمة
docker-compose restart redis
```

#### 3. مشاكل الأداء

```sql
-- فحص الاستعلامات البطيئة
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- فحص الاتصالات النشطة
SELECT count(*) FROM pg_stat_activity;

-- فحص استخدام الفهارس
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public';
```

### مراقبة المساحة

```bash
# فحص مساحة قاعدة البيانات
docker-compose exec postgres psql -U saler_user -d saler -c "
SELECT pg_size_pretty(pg_database_size('saler'));"

# فحص مساحة Redis
docker-compose exec redis redis-cli info memory
```

## 📈 تحسين الأداء

### 1. إعدادات PostgreSQL

```sql
-- تحسين الاستعلامات
ANALYZE;
REINDEX DATABASE saler;

-- إنشاء فهارس إضافية
CREATE INDEX CONCURRENTLY idx_leads_user_status 
ON leads(user_id, status);

-- إحصائيات الجداول
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables;
```

### 2. إعدادات Redis

```bash
# مراقبة استخدام الذاكرة
redis-cli info memory

# مراقبة الاتصالات
redis-cli info clients

-- تحليل الأداء
redis-cli --latency
```

## 🔄 النسخ والتكرار

### إعداد التكرار

```yaml
# في docker-compose.yml
postgres-master:
  # إعدادات قاعدة البيانات الرئيسية
  
postgres-replica:
  # إعدادات قاعدة البيانات المكررة
  environment:
    PGUSER: replicator
    POSTGRES_MASTER_SERVICE: postgres-master
```

### مزامنة البيانات

```bash
# إعداد التكرار الأساسي
docker-compose exec postgres-master pg_basebackup -h localhost -U replicator -D /var/lib/postgresql/data/replica -Fp -Xs -R
```

## 📝 ملاحظات مهمة

1. **غير كلمات المرور الافتراضية في الإنتاج**
2. **استخدم SSL في البيئة الإنتاجية**
3. **راقب الأداء بانتظام**
4. **اعمل نسخ احتياطية يومية**
5. **راجع إعدادات الأمان شهرياً**

## 🆘 الدعم

في حالة وجود مشاكل:
1. راجع السجلات: `docker-compose logs [service]`
2. فحص الحالة: `docker-compose ps`
3. مراجعة هذا الدليل
4. التواصل مع فريق التطوير

---

📧 **للمساعدة والدعم**: [support@saler.com](mailto:support@saler.com)