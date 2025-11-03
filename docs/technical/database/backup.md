# النسخ الاحتياطية - قاعدة البيانات

## نظرة عامة

نظام النسخ الاحتياطية في مشروع Saler مصمم لضمان حماية البيانات واستمرارية العمل في حالة حدوث أي طارئ. يتضمن النظام نسخ احتياطية تلقائية، يدوية، وتطابق للمحتوى بين الخوادم المختلفة.

### أهداف النظام

- **حماية البيانات**: حماية من فقدان البيانات بسبب أعطال النظام
- **استعادة سريعة**: إمكانية استعادة البيانات في وقت قصير
- **استمرارية العمل**: ضمان عدم توقف الخدمات
- **الامتثال القانوني**: الالتزام بقوانين حماية البيانات
- **اختبار الاستعادة**: التأكد من صحة النسخ الاحتياطية

## استراتيجية النسخ الاحتياطية

### هيكل النسخ الاحتياطية

```
backups/
├── daily/           # نسخ يومية
│   ├── 2025-11-01/
│   ├── 2025-11-02/
│   └── ...
├── weekly/          # نسخ أسبوعية
│   ├── week-44-2025/
│   ├── week-45-2025/
│   └── ...
├── monthly/         # نسخ شهرية
│   ├── november-2025/
│   ├── october-2025/
│   └── ...
├── incremental/     # نسخ متزايدة
└── test/           # نسخ اختبار
```

### جدولة النسخ

| النوع | التوقيت | الاحتفاظ | المكان |
|-------|---------|----------|---------|
| **Full Backup** | يومياً 2:00 AM | 7 أيام | محلي + سحابي |
| **Incremental** | كل 4 ساعات | 3 أيام | محلي |
| **Weekly Full** | الأحد 1:00 AM | 4 أسابيع | سحابي |
| **Monthly Full** | أول يوم بالشهر | 12 شهر | سحابي + أرشيف |

## النسخ الاحتياطية الكاملة

### 1. سكريبت النسخ الاحتياطي اليومي

```bash
#!/bin/bash
# scripts/backup_daily.sh

# متغيرات البيئة
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-saler_db}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-password}

BACKUP_DIR="/var/backups/saler"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/daily/saler_db_$DATE.sql"
LOG_FILE="$BACKUP_DIR/logs/backup_$DATE.log"

# إنشاء المجلدات
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/logs"

# بدء النسخ الاحتياطي
echo "بدء النسخ الاحتياطي - $DATE" | tee -a "$LOG_FILE"

# إنشاء نسخة احتياطية كاملة
pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --verbose \
    --clean \
    --no-owner \
    --no-privileges \
    --format=custom \
    --file="$BACKUP_FILE.custom" \
    >> "$LOG_FILE" 2>&1

# التحقق من نجاح النسخ
if [ $? -eq 0 ]; then
    # ضغط النسخة الاحتياطية
    gzip "$BACKUP_FILE.custom"
    
    # حساب الحجم والتوقيع
    BACKUP_SIZE=$(du -h "$BACKUP_FILE.custom.gz" | cut -f1)
    BACKUP_MD5=$(md5sum "$BACKUP_FILE.custom.gz" | cut -d' ' -f1)
    
    echo "تم إنشاء النسخة الاحتياطية بنجاح" | tee -a "$LOG_FILE"
    echo "حجم النسخة: $BACKUP_SIZE" | tee -a "$LOG_FILE"
    echo "التوقيع MD5: $BACKUP_MD5" | tee -a "$LOG_FILE"
    
    # رفع إلى التخزين السحابي
    upload_to_cloud "$BACKUP_FILE.custom.gz" "daily/"
    
    # حذف النسخ القديمة (الاحتفاظ بـ 7 أيام)
    find "$BACKUP_DIR/daily" -name "*.sql.gz" -mtime +7 -delete
    
    echo "تمت عملية النسخ الاحتياطي بنجاح" | tee -a "$LOG_FILE"
else
    echo "فشل في إنشاء النسخة الاحتياطية" | tee -a "$LOG_FILE"
    
    # إرسال تنبيه
    send_alert "فشل النسخ الاحتياطي اليومي" "$LOG_FILE"
    exit 1
fi

# ضغط ملف السجل
gzip "$LOG_FILE"
```

### 2. سكريبت النسخ الاحتياطي الأسبوعي

```bash
#!/bin/bash
# scripts/backup_weekly.sh

# متغيرات البيئة
BACKUP_DIR="/var/backups/saler"
DATE=$(date +%Y%m%d_%H%M%S)
WEEK=$(date +%U)
YEAR=$(date +%Y)
BACKUP_FILE="$BACKUP_DIR/weekly/saler_db_week_${WEEK}_${YEAR}.sql"

# إنشاء النسخة الاحتياطية
echo "إنشاء النسخة الاحتياطية الأسبوعية - Week $WEEK"

pg_dump \
    --host="$DB_HOST" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --format=custom \
    --file="$BACKUP_FILE" \
    --verbose \
    >> "$BACKUP_DIR/logs/weekly_backup.log" 2>&1

if [ $? -eq 0 ]; then
    # ضغط النسخة
    gzip "$BACKUP_FILE"
    
    # رفع إلى التخزين السحابي
    upload_to_cloud "$BACKUP_FILE.gz" "weekly/"
    
    echo "تم إنشاء النسخة الأسبوعية بنجاح"
else
    echo "فشل في إنشاء النسخة الأسبوعية"
    send_alert "فشل النسخ الاحتياطي الأسبوعي"
fi
```

## النسخ الاحتياطية المتزايدة

### 1. إعداد Write-Ahead Log (WAL)

```sql
-- إعداد WAL للأرشفة المستمرة
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /var/backups/wal_archive/%f';
ALTER SYSTEM SET max_wal_senders = 3;
ALTER SYSTEM SET checkpoint_timeout = 15min;
ALTER SYSTEM SET max_wal_size = 2GB;
ALTER SYSTEM SET min_wal_size = 1GB;

-- إعادة تشغيل الخادم
SELECT pg_reload_conf();
```

### 2. سكريبت النسخ المتزايد

```bash
#!/bin/bash
# scripts/backup_incremental.sh

BACKUP_DIR="/var/backups/saler"
INCREMENTAL_DIR="$BACKUP_DIR/incremental"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# إنشاء نسخة متزايدة باستخدام pg_basebackup
pg_basebackup \
    --host="$DB_HOST" \
    --username="$DB_USER" \
    --pgdata="$INCREMENTAL_DIR/incr_$TIMESTAMP" \
    --format=tar \
    --progress \
    --verbose \
    --no-password \
    --wal-method=stream

if [ $? -eq 0 ]; then
    # ضغط النسخة
    tar -czf "$INCREMENTAL_DIR/incr_$TIMESTAMP.tar.gz" -C "$INCREMENTAL_DIR" "incr_$TIMESTAMP"
    rm -rf "$INCREMENTAL_DIR/incr_$TIMESTAMP"
    
    # رفع إلى التخزين السحابي
    upload_to_cloud "$INCREMENTAL_DIR/incr_$TIMESTAMP.tar.gz" "incremental/"
    
    echo "تمت النسخة المتزايدة بنجاح"
else
    echo "فشلت النسخة المتزايدة"
    send_alert "فشل النسخ الاحتياطي المتزايد"
fi

# حذف النسخ القديمة (3 أيام)
find "$INCREMENTAL_DIR" -name "*.tar.gz" -mtime +3 -delete
```

## النسخ الاحتياطية للسحابة

### 1. رفع إلى Amazon S3

```bash
#!/bin/bash
# scripts/upload_to_s3.sh

SOURCE_FILE=$1
TARGET_PATH=$2

if [ -z "$SOURCE_FILE" ] || [ -z "$TARGET_PATH" ]; then
    echo "الاستخدام: upload_to_s3.sh <source_file> <target_path>"
    exit 1
fi

# رفع الملف
aws s3 cp "$SOURCE_FILE" "s3://saler-backups/$TARGET_PATH" \
    --storage-class STANDARD_IA \
    --metadata "backup-date=$(date),backup-type=database"

if [ $? -eq 0 ]; then
    echo "تم رفع الملف بنجاح: $SOURCE_FILE"
else
    echo "فشل في رفع الملف: $SOURCE_FILE"
    send_alert "فشل رفع النسخة الاحتياطية" "s3://saler-backups/$TARGET_PATH"
fi
```

### 2. رفع إلى Google Cloud Storage

```bash
#!/bin/bash
# scripts/upload_to_gcs.sh

SOURCE_FILE=$1
TARGET_PATH=$2

gsutil cp "$SOURCE_FILE" "gs://saler-backups/$TARGET_PATH"

if [ $? -eq 0 ]; then
    echo "تم رفع الملف بنجاح: $SOURCE_FILE"
else
    echo "فشل في رفع الملف: $SOURCE_FILE"
fi
```

## استعادة البيانات

### 1. استعادة النسخة الاحتياطية الكاملة

```bash
#!/bin/bash
# scripts/restore_full.sh

# التحقق من المعاملات
BACKUP_FILE=$1
if [ -z "$BACKUP_FILE" ]; then
    echo "الاستخدام: restore_full.sh <backup_file>"
    echo "مثال: restore_full.sh /var/backups/saler/daily/saler_db_20251102_020000.sql.gz"
    exit 1
fi

# التحقق من وجود الملف
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ملف النسخة الاحتياطية غير موجود: $BACKUP_FILE"
    exit 1
fi

# طلب التأكيد
echo "تحذير: سيتم استعادة قاعدة البيانات من النسخة الاحتياطية:"
echo "الملف: $BACKUP_FILE"
echo "سيتم حذف جميع البيانات الحالية!"
read -p "هل تريد المتابعة؟ (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "تم إلغاء الاستعادة"
    exit 0
fi

# إيقاف التطبيق
echo "إيقاف التطبيق..."
systemctl stop saler-app

# إيقاف PostgreSQL مؤقتاً (للاستعادة الكاملة)
echo "إيقاف PostgreSQL..."
systemctl stop postgresql

# حذف قاعدة البيانات الحالية
echo "حذف قاعدة البيانات الحالية..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"

# استعادة النسخة الاحتياطية
echo "استعادة النسخة الاحتياطية..."

if [[ $BACKUP_FILE == *.gz ]]; then
    # نسخة مضغوطة
    gunzip -c "$BACKUP_FILE" | sudo -u postgres psql -d "$DB_NAME"
else
    # نسخة غير مضغوطة
    sudo -u postgres psql -d "$DB_NAME" < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo "تمت الاستعادة بنجاح"
else
    echo "فشلت الاستعادة"
    send_alert "فشل استعادة قاعدة البيانات" "$BACKUP_FILE"
    exit 1
fi

# إعادة تشغيل الخدمات
echo "إعادة تشغيل الخدمات..."
systemctl start postgresql
systemctl start saler-app

echo "تمت الاستعادة بنجاح"
```

### 2. استعادة جدول محدد

```bash
#!/bin/bash
# scripts/restore_table.sh

BACKUP_FILE=$1
TABLE_NAME=$2

if [ -z "$BACKUP_FILE" ] || [ -z "$TABLE_NAME" ]; then
    echo "الاستخدام: restore_table.sh <backup_file> <table_name>"
    exit 1
fi

# استعادة الجدول من النسخة الاحتياطية
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | grep "COPY $TABLE_NAME" -A 100000 | sudo -u postgres psql -d "$DB_NAME"
else
    grep "COPY $TABLE_NAME" -A 100000 "$BACKUP_FILE" | sudo -u postgres psql -d "$DB_NAME"
fi
```

### 3. استعادة نقطة زمنية (Point-in-Time Recovery)

```bash
#!/bin/bash
# scripts/point_in_time_restore.sh

TARGET_TIME=$1
BACKUP_FILE=$2

if [ -z "$TARGET_TIME" ] || [ -z "$BACKUP_FILE" ]; then
    echo "الاستخدام: point_in_time_restore.sh <target_time> <backup_file>"
    echo "مثال: point_in_time_restore.sh '2025-11-02 14:30:00' /backup/latest.sql"
    exit 1
fi

# إعداد recovery.conf
cat > /var/lib/postgresql/data/recovery.conf << EOF
restore_command = 'cp /var/backups/wal_archive/%f %p'
recovery_target_time = '$TARGET_TIME'
recovery_target_action = 'promote'
EOF

# استعادة النسخة الاحتياطية الأساسية
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | sudo -u postgres pg_restore -d "$DB_NAME"
else
    sudo -u postgres pg_restore -d "$DB_NAME" "$BACKUP_FILE"
fi

# إعادة تشغيل PostgreSQL
systemctl restart postgresql
```

## مراقبة النسخ الاحتياطية

### 1. سكريبت مراقبة النسخ

```bash
#!/bin/bash
# scripts/check_backup_status.sh

BACKUP_DIR="/var/backups/saler"
LOG_FILE="$BACKUP_DIR/logs/monitoring.log"

# التحقق من وجود النسخ اليومية
DAILY_BACKUP_COUNT=$(find "$BACKUP_DIR/daily" -name "*.gz" -mtime -1 | wc -l)
if [ $DAILY_BACKUP_COUNT -eq 0 ]; then
    echo "تحذير: لا توجد نسخة احتياطية يومية حديثة" | tee -a "$LOG_FILE"
    send_alert "لا توجد نسخة احتياطية يومية"
fi

# التحقق من حجم النسخة الاحتياطية
LATEST_BACKUP=$(find "$BACKUP_DIR/daily" -name "*.gz" -mtime -1 | sort | tail -1)
if [ -n "$LATEST_BACKUP" ]; then
    BACKUP_SIZE=$(stat -f%z "$LATEST_BACKUP" 2>/dev/null || stat -c%s "$LATEST_BACKUP")
    BACKUP_SIZE_MB=$((BACKUP_SIZE / 1024 / 1024))
    
    if [ $BACKUP_SIZE_MB -lt 10 ]; then
        echo "تحذير: حجم النسخة الاحتياطية صغير: ${BACKUP_SIZE_MB}MB" | tee -a "$LOG_FILE"
        send_alert "حجم النسخة الاحتياطية صغير" "$LATEST_BACKUP"
    fi
fi

# التحقق من إمكانية الوصول للتخزين السحابي
if ! aws s3 ls s3://saler-backups/ > /dev/null 2>&1; then
    echo "تحذير: لا يمكن الوصول للتخزين السحابي" | tee -a "$LOG_FILE"
    send_alert "مشكلة في التخزين السحابي"
fi

echo "فحص النسخ الاحتياطية مكتمل - $DAILY_BACKUP_COUNT نسخة حديثة" | tee -a "$LOG_FILE"
```

### 2. تقرير حالة النسخ

```bash
#!/bin/bash
# scripts/backup_report.sh

BACKUP_DIR="/var/backups/saler"
REPORT_FILE="$BACKUP_DIR/reports/backup_status_$(date +%Y%m%d).txt"

# إنشاء مجلد التقارير
mkdir -p "$BACKUP_DIR/reports"

# إنشاء التقرير
cat > "$REPORT_FILE" << EOF
=== تقرير النسخ الاحتياطية - $(date) ===

النسخ اليومية:
$(find "$BACKUP_DIR/daily" -name "*.gz" -mtime -7 -exec ls -lh {} \;)

النسخ الأسبوعية:
$(find "$BACKUP_DIR/weekly" -name "*.gz" -mtime -30 -exec ls -lh {} \;)

النسخ الشهرية:
$(find "$BACKUP_DIR/monthly" -name "*.gz" -exec ls -lh {} \;)

مساحة التخزين المستخدمة:
$(du -sh "$BACKUP_DIR"/*)

التحقق من السجلات:
$(find "$BACKUP_DIR/logs" -name "*.gz" -mtime -7 -exec echo "{}:" \; -exec zcat {} \; | grep -i "error\|failed\|success" | tail -20)

EOF

echo "تم إنشاء التقرير: $REPORT_FILE"
```

## اختبار النسخ الاحتياطية

### 1. سكريبت اختبار الاستعادة

```bash
#!/bin/bash
# scripts/test_backup_restore.sh

TEST_DB="saler_test_restore"
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "الاستخدام: test_backup_restore.sh <backup_file>"
    exit 1
fi

echo "بدء اختبار استعادة النسخة: $BACKUP_FILE"

# إنشاء قاعدة بيانات اختبار
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $TEST_DB;"
sudo -u postgres psql -c "CREATE DATABASE $TEST_DB;"

# استعادة النسخة في قاعدة البيانات الاختبارية
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "استعادة النسخة المضغوطة..."
    gunzip -c "$BACKUP_FILE" | sudo -u postgres psql -d "$TEST_DB"
else
    echo "استعادة النسخة العادية..."
    sudo -u postgres psql -d "$TEST_DB" < "$BACKUP_FILE"
fi

# التحقق من الاستعادة
TABLES_COUNT=$(sudo -u postgres psql -d "$TEST_DB" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
USERS_COUNT=$(sudo -u postgres psql -d "$TEST_DB" -t -c "SELECT count(*) FROM users;")

echo "عدد الجداول المستعادة: $TABLES_COUNT"
echo "عدد المستخدمين المستعاد: $USERS_COUNT"

if [ "$TABLES_COUNT" -gt 0 ] && [ "$USERS_COUNT" -gt 0 ]; then
    echo "✅ نجح اختبار الاستعادة"
else
    echo "❌ فشل اختبار الاستعادة"
    send_alert "فشل اختبار استعادة النسخة الاحتياطية" "$BACKUP_FILE"
fi

# تنظيف قاعدة البيانات الاختبارية
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $TEST_DB;"
```

### 2. اختبار الجداول الحرجة

```bash
#!/bin/bash
# scripts/test_critical_tables.sh

TEST_DB="saler_critical_test"
BACKUP_FILE=$1

# إنشاء قاعدة بيانات اختبار
sudo -u postgres createdb "$TEST_DB"

# استعادة النسخة
gunzip -c "$BACKUP_FILE" | sudo -u postgres psql -d "$TEST_DB"

# اختبار الجداول الحرجة
TABLES=("users" "stores" "products" "orders" "customers")

for table in "${TABLES[@]}"; do
    COUNT=$(sudo -u postgres psql -d "$TEST_DB" -t -c "SELECT count(*) FROM $table;")
    echo "الجدول $table: $COUNT سجل"
    
    if [ "$COUNT" -eq 0 ]; then
        echo "⚠️  تحذير: الجدول $table فارغ"
    fi
done

# اختبار العلاقات Foreign Keys
echo "اختبار العلاقات..."
sudo -u postgres psql -d "$TEST_DB" << EOF
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema='public'
LIMIT 5;
EOF

# تنظيف
sudo -u postgres dropdb "$TEST_DB"
echo "انتهى اختبار الجداول الحرجة"
```

## أفضل الممارسات

### 1. النصائح العامة

- **اختبار الاستعادة دورياً**: تأكد من صحة النسخ الاحتياطية
- **تشفير النسخ الحساسة**: حماية البيانات الحساسة
- **توزيع النسخ**: حفظ النسخ في أماكن مختلفة
- **مراقبة السعة**: التأكد من وجود مساحة كافية
- **توثيق العمليات**: توثيق جميع إجراءات النسخ والاستعادة

### 2. التحسينات الأمنية

```bash
# تشفير النسخة الاحتياطية
gpg --symmetric --cipher-algo AES256 backup.sql
# أو استخدام openssl
openssl enc -aes-256-cbc -salt -in backup.sql -out backup.sql.enc
```

### 3. الجدولة التلقائية

```bash
# إضافة المهام إلى cron
# تحرير crontab
crontab -e

# النسخ الاحتياطي اليومي في 2:00 AM
0 2 * * * /var/www/saler/scripts/backup_daily.sh

# النسخ المتزايد كل 4 ساعات
0 */4 * * * /var/www/saler/scripts/backup_incremental.sh

# النسخ الأسبوعي يوم الأحد 1:00 AM
0 1 * * 0 /var/www/saler/scripts/backup_weekly.sh

# مراقبة النسخ الاحتياطية كل ساعة
0 * * * * /var/www/saler/scripts/check_backup_status.sh
```

---

**آخر تحديث**: 2 نوفمبر 2025