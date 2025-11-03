# إدارة Migrations - قاعدة البيانات

## نظرة عامة

نظام Migrations في مشروع Saler يوفر طريقة منظمة وآمنة لإدارة تغيرات مخطط قاعدة البيانات. يضمن هذا النظام أن جميع التغيرات في البنية تتم بشكل متدرج ومتزامن عبر جميع البيئات.

### الخصائص الرئيسية

- **Version Control**: تتبع إصدارات قاعدة البيانات
- **Rollback Support**: إمكانية التراجع عن التغييرات
- **Zero Downtime**: تنفيذ بدون توقف الخدمة
- **Environment Safety**: أمان عبر البيئات المختلفة
- **Dependency Management**: إدارة التبعيات بين الجداول
- **Rollback Plans**: خطط طوارئ للتراجع

## هيكل نظام Migrations

```
database/
├── migrations/
│   ├── 20251102000000_create_users_table.sql
│   ├── 20251102000100_create_stores_table.sql
│   ├── 20251102000200_create_products_table.sql
│   └── ...
├── rollback/
│   ├── 20251102000000_rollback_users_table.sql
│   ├── 20251102000100_rollback_stores_table.sql
│   └── ...
├── seeds/
│   ├── 001_initial_data.sql
│   ├── 002_sample_stores.sql
│   └── 003_sample_products.sql
└── config/
    └── migration_config.json
```

## تسمية الملفات

### نمط التسمية
```
YYYYMMDDHHMMSS_description_action.sql
```

### أمثلة
```bash
# إنشاء جدول جديد
20251102000000_create_users_table.sql

# إضافة عمود لجدول موجود
20251102000100_add_avatar_to_users_table.sql

# إنشاء فهرس
20251102000200_create_products_title_index.sql

# حذف جدول
20251102000300_drop_old_categories_table.sql
```

## إنشاء Migration جديد

### 1. إنشاء Migration أساسي

```sql
-- migrations/20251102000000_create_users_table.sql

-- التحقق من عدم وجود الجدول
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- إنشاء الجدول
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            avatar_url TEXT,
            email_verified BOOLEAN DEFAULT FALSE,
            status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- إضافة التعليقات
        COMMENT ON TABLE users IS 'جدول المستخدمين الأساسي';
        COMMENT ON COLUMN users.id IS 'المعرف الفريد للمستخدم';
        COMMENT ON COLUMN users.email IS 'البريد الإلكتروني للمستخدم';
        COMMENT ON COLUMN users.password_hash IS 'كلمة المرور المشفرة';
        
        RAISE NOTICE 'تم إنشاء جدول users بنجاح';
    ELSE
        RAISE NOTICE 'جدول users موجود مسبقاً';
    END IF;
END $$;
```

### 2. Migration مع Foreign Keys

```sql
-- migrations/20251102000100_create_stores_table.sql

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') THEN
        -- إنشاء الجدول
        CREATE TABLE stores (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            handle VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            currency VARCHAR(3) DEFAULT 'SAR',
            status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- إضافة الفهارس
        CREATE INDEX idx_stores_owner_id ON stores(owner_id);
        CREATE INDEX idx_stores_handle ON stores(handle);
        CREATE INDEX idx_stores_status ON stores(status);
        
        -- إضافة القيود
        ALTER TABLE stores ADD CONSTRAINT chk_currency CHECK (currency IN ('SAR', 'USD', 'EUR', 'AED'));
        
        RAISE NOTICE 'تم إنشاء جدول stores بنجاح';
    ELSE
        RAISE NOTICE 'جدول stores موجود مسبقاً';
    END IF;
END $$;
```

### 3. Migration لبيانات فئوية

```sql
-- migrations/20251102000200_create_product_categories_table.sql

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_categories') THEN
        -- إنشاء الجدول
        CREATE TABLE product_categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            handle VARCHAR(255) NOT NULL,
            description TEXT,
            parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
            sort_order INTEGER DEFAULT 0,
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            UNIQUE(store_id, handle)
        );
        
        -- إضافة الفهارس
        CREATE INDEX idx_product_categories_store_id ON product_categories(store_id);
        CREATE INDEX idx_product_categories_parent_id ON product_categories(parent_id);
        CREATE INDEX idx_product_categories_status ON product_categories(status);
        CREATE INDEX idx_product_categories_sort_order ON product_categories(sort_order);
        
        -- إضافة القيد
        ALTER TABLE product_categories ADD CONSTRAINT chk_category_status 
            CHECK (status IN ('active', 'inactive', 'deleted'));
        
        RAISE NOTICE 'تم إنشاء جدول product_categories بنجاح';
    ELSE
        RAISE NOTICE 'جدول product_categories موجود مسبقاً';
    END IF;
END $$;
```

## عمليات معقدة

### 1. إضافة عمود مع القيم الافتراضية

```sql
-- migrations/20251102000300_add_avatar_to_users_table.sql

DO $$
BEGIN
    -- التحقق من عدم وجود العمود
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar_url'
    ) THEN
        -- إضافة العمود
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
        
        -- إضافة التعليق
        COMMENT ON COLUMN users.avatar_url IS 'رابط صورة المستخدم';
        
        -- تحديث السجلات الموجودة (إن وجدت)
        UPDATE users SET avatar_url = 'https://default-avatar.com/default.jpg' 
        WHERE avatar_url IS NULL;
        
        RAISE NOTICE 'تم إضافة عمود avatar_url إلى جدول users';
    ELSE
        RAISE NOTICE 'عمود avatar_url موجود مسبقاً في جدول users';
    END IF;
END $$;
```

### 2. إنشاء فهرس متقدم

```sql
-- migrations/20251102000400_create_products_search_index.sql

DO $$
BEGIN
    -- إنشاء فهرس البحث النصي
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'products' AND indexname = 'idx_products_title_search'
    ) THEN
        -- إضافة عمود البحث إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'search_vector'
        ) THEN
            ALTER TABLE products ADD COLUMN search_vector tsvector;
        END IF;
        
        -- تحديث البحث
        UPDATE products SET search_vector = 
            setweight(to_tsvector('arabic', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('arabic', COALESCE(description, '')), 'B') ||
            setweight(to_tsvector('arabic', COALESCE(sku, '')), 'C');
        
        -- إنشاء الفهرس
        CREATE INDEX idx_products_title_search ON products USING gin(search_vector);
        
        -- إضافة Trigger للتحديث التلقائي
        CREATE OR REPLACE FUNCTION update_products_search_vector()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.search_vector :=
                setweight(to_tsvector('arabic', COALESCE(NEW.title, '')), 'A') ||
                setweight(to_tsvector('arabic', COALESCE(NEW.description, '')), 'B') ||
                setweight(to_tsvector('arabic', COALESCE(NEW.sku, '')), 'C');
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER trigger_products_search_vector
            BEFORE INSERT OR UPDATE ON products
            FOR EACH ROW EXECUTE FUNCTION update_products_search_vector();
        
        RAISE NOTICE 'تم إنشاء فهرس البحث للنص في جدول products';
    ELSE
        RAISE NOTICE 'فهرس البحث موجود مسبقاً في جدول products';
    END IF;
END $$;
```

### 3. تقسيم جدول كبير

```sql
-- migrations/20251102000500_partition_orders_table.sql

DO $$
BEGIN
    -- إنشاء جدول رئيسي مقسم
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        -- إنشاء الجدول الرئيسي
        CREATE TABLE orders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            store_id UUID NOT NULL,
            customer_id UUID,
            order_number VARCHAR(50) UNIQUE NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        ) PARTITION BY RANGE (created_at);
        
        -- إنشاء الأقسام الشهرية
        CREATE TABLE orders_2025_01 PARTITION OF orders
            FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
        
        CREATE TABLE orders_2025_02 PARTITION OF orders
            FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
        
        -- إنشاء فهارس على الأقسام
        CREATE INDEX idx_orders_2025_01_store_id ON orders_2025_01(store_id);
        CREATE INDEX idx_orders_2025_01_status ON orders_2025_01(status);
        CREATE INDEX idx_orders_2025_01_created_at ON orders_2025_01(created_at);
        
        CREATE INDEX idx_orders_2025_02_store_id ON orders_2025_02(store_id);
        CREATE INDEX idx_orders_2025_02_status ON orders_2025_02(status);
        CREATE INDEX idx_orders_2025_02_created_at ON orders_2025_02(created_at);
        
        RAISE NOTICE 'تم إنشاء جدول orders مقسم';
    ELSE
        RAISE NOTICE 'جدول orders موجود مسبقاً';
    END IF;
END $$;
```

## Rollback Scripts

### 1. Rollback بسيط

```sql
-- rollback/20251102000000_rollback_users_table.sql

DO $$
BEGIN
    -- حذف الجدول إذا كان فارغاً
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- التحقق من عدم وجود بيانات
        IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
            DROP TABLE users CASCADE;
            RAISE NOTICE 'تم حذف جدول users';
        ELSE
            RAISE NOTICE 'لا يمكن حذف جدول users - يحتوي على بيانات';
        END IF;
    ELSE
        RAISE NOTICE 'جدول users غير موجود';
    END IF;
END $$;
```

### 2. Rollback مع البيانات

```sql
-- rollback/20251102000300_rollback_add_avatar_to_users.sql

DO $$
BEGIN
    -- التحقق من وجود العمود
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar_url'
    ) THEN
        -- نسخ البيانات الحالية إلى جدول مؤقت إذا لزم الأمر
        CREATE TEMP TABLE temp_users_avatars AS 
        SELECT id, avatar_url FROM users WHERE avatar_url IS NOT NULL;
        
        -- حذف العمود
        ALTER TABLE users DROP COLUMN avatar_url;
        
        RAISE NOTICE 'تم حذف عمود avatar_url من جدول users';
        
        -- طباعة عدد السجلات المحذوفة
        RAISE NOTICE 'عدد السجلات التي تم حذف قيمها: %', (SELECT COUNT(*) FROM temp_users_avatars);
    ELSE
        RAISE NOTICE 'عمود avatar_url غير موجود في جدول users';
    END IF;
END $$;
```

### 3. Rollback للفهارس

```sql
-- rollback/20251102000400_rollback_products_search_index.sql

DO $$
BEGIN
    -- حذف الفهرس
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'products' AND indexname = 'idx_products_title_search'
    ) THEN
        DROP INDEX IF EXISTS idx_products_title_search;
        RAISE NOTICE 'تم حذف فهرس البحث من جدول products';
    ELSE
        RAISE NOTICE 'فهرس البحث غير موجود في جدول products';
    END IF;
    
    -- حذف العمود
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'search_vector'
    ) THEN
        -- حذف Trigger أولاً
        DROP TRIGGER IF EXISTS trigger_products_search_vector ON products;
        
        -- حذف الدالة
        DROP FUNCTION IF EXISTS update_products_search_vector();
        
        -- حذف العمود
        ALTER TABLE products DROP COLUMN search_vector;
        RAISE NOTICE 'تم حذف عمود search_vector من جدول products';
    ELSE
        RAISE NOTICE 'عمود search_vector غير موجود في جدول products';
    END IF;
END $$;
```

## Seeds البيانات

### 1. بيانات أولية أساسية

```sql
-- seeds/001_initial_data.sql

-- إدراج مستخدم افتراضي
INSERT INTO users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    email_verified,
    status
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@saler.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewGTh9Bc6GWjkysa', -- password: admin123
    'مدير',
    'النظام',
    true,
    'active'
) ON CONFLICT (email) DO NOTHING;

-- إدراج متجر افتراضي
INSERT INTO stores (
    id,
    owner_id,
    name,
    handle,
    description,
    currency,
    status
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'المتجر الافتراضي',
    'default-store',
    'متجر افتراضي للاختبار والتطوير',
    'SAR',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- إدراج فئات افتراضية
INSERT INTO product_categories (
    id,
    store_id,
    name,
    handle,
    description,
    sort_order,
    status
) VALUES 
(
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    'إلكترونيات',
    'electronics',
    'منتجات إلكترونية متنوعة',
    1,
    'active'
),
(
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    'ملابس',
    'clothing',
    'ملابس وأزياء',
    2,
    'active'
) ON CONFLICT (id) DO NOTHING;
```

### 2. بيانات عينة للمنتجات

```sql
-- seeds/002_sample_products.sql

-- إدراج منتجات عينة
INSERT INTO products (
    id,
    store_id,
    title,
    handle,
    description,
    price,
    compare_at_price,
    sku,
    status,
    featured
) VALUES 
(
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000002',
    'هاتف ذكي Samsung Galaxy',
    'samsung-galaxy-smartphone',
    'هاتف ذكي بتقنية متقدمة وكاميرا عالية الدقة',
    1999.99,
    2199.99,
    'SAMSUNG001',
    'active',
    true
),
(
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000002',
    'قميص قطني رجالي',
    'mens-cotton-shirt',
    'قميص قطني مريح للاستخدام اليومي',
    89.99,
    119.99,
    'SHIRT001',
    'active',
    false
) ON CONFLICT (id) DO NOTHING;
```

## أدوات التشغيل

### 1. سكريبت Migration

```bash
#!/bin/bash
# scripts/run_migration.sh

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-saler_db}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-password}

MIGRATION_DIR="./database/migrations"
ENVIRONMENT=${1:-development}

echo "تشغيل Migration للبيئة: $ENVIRONMENT"

# تشغيل جميع Migration غير المنفذة
for migration_file in $(ls $MIGRATION_DIR/*.sql | sort); do
    echo "تشغيل: $(basename $migration_file)"
    
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        -f $migration_file
    
    if [ $? -eq 0 ]; then
        echo "تم تنفيذ Migration بنجاح: $(basename $migration_file)"
    else
        echo "فشل في تنفيذ Migration: $(basename $migration_file)"
        exit 1
    fi
done

echo "تم إنجاز جميع Migration بنجاح"
```

### 2. سكريبت Rollback

```bash
#!/bin/bash
# scripts/run_rollback.sh

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-saler_db}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-password}

ROLLBACK_DIR="./database/rollback"
MIGRATION_NAME=${1}

if [ -z "$MIGRATION_NAME" ]; then
    echo "يرجى تحديد اسم Migration للتراجع عنه"
    echo "مثال: ./scripts/run_rollback.sh 20251102000000_create_users_table"
    exit 1
fi

ROLLBACK_FILE="$ROLLBACK_DIR/rollback_$MIGRATION_NAME.sql"

if [ ! -f "$ROLLBACK_FILE" ]; then
    echo "ملف Rollback غير موجود: $ROLLBACK_FILE"
    exit 1
fi

echo "تشغيل Rollback لـ: $MIGRATION_NAME"

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    -f $ROLLBACK_FILE

if [ $? -eq 0 ]; then
    echo "تم تنفيذ Rollback بنجاح"
else
    echo "فشل في تنفيذ Rollback"
    exit 1
fi
```

### 3. سكريبت Seeds

```bash
#!/bin/bash
# scripts/run_seeds.sh

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-saler_db}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-password}

SEEDS_DIR="./database/seeds"

echo "تشغيل Seeds البيانات"

for seed_file in $(ls $SEEDS_DIR/*.sql | sort); do
    echo "تشغيل: $(basename $seed_file)"
    
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        -f $seed_file
    
    if [ $? -eq 0 ]; then
        echo "تم تنفيذ Seed بنجاح: $(basename $seed_file)"
    else
        echo "فشل في تنفيذ Seed: $(basename $seed_file)"
        exit 1
    fi
done

echo "تم إنجاز جميع Seeds بنجاح"
```

## أفضل الممارسات

### 1. التحقق من وجود الجداول/الأعمدة
```sql
-- استخدام DO block للتحقق
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'table_name') THEN
        -- إنشاء الجدول
    END IF;
END $$;
```

### 2. معالجة الأخطاء
```sql
DO $$
BEGIN
    -- العمليات
    RAISE NOTICE 'تم بنجاح';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'خطأ في Migration: %', SQLERRM;
END $$;
```

### 3. تتبع حالة Migration
```sql
CREATE TABLE IF NOT EXISTS migration_history (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'rolled_back')),
    checksum VARCHAR(64),
    execution_time INTEGER
);
```

### 4. النسخ الاحتياطية التلقائية
```bash
#!/bin/bash
# scripts/backup_before_migration.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_before_migration_$TIMESTAMP.sql"

echo "إنشاء نسخة احتياطية قبل Migration..."

pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "تم إنشاء النسخة الاحتياطية: $BACKUP_FILE"
else
    echo "فشل في إنشاء النسخة الاحتياطية"
    exit 1
fi
```

---

**آخر تحديث**: 2 نوفمبر 2025