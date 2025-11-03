# تحسين أداء قاعدة البيانات - مشروع Saler

## نظرة عامة

تحسين أداء قاعدة البيانات في مشروع Saler أمر بالغ الأهمية لضمان استجابة سريعة وفعالة للطلبات. يشمل التحسين فهارس ذكية، تحسين الاستعلامات، إدارة الذاكرة، ومراقبة مستمرة للأداء.

### أهداف التحسين

- **استجابة سريعة**: تقليل وقت تنفيذ الاستعلامات
- **قابلية التوسع**: دعم النمو في البيانات والمستخدمين
- **كفاءة الذاكرة**: استخدام أمثل للموارد
- **الموثوقية**: ضمان سلامة البيانات والاستمرارية

## استراتيجيات الفهرسة

### 1. الفهارس الأساسية

#### فهارس Foreign Keys
```sql
-- فهارس مفروضة تلقائياً (PostgreSQL)
-- لكن يمكن تحسينها
CREATE INDEX CONCURRENTLY idx_stores_owner_id ON stores(owner_id);
CREATE INDEX CONCURRENTLY idx_products_store_id ON products(store_id);
CREATE INDEX CONCURRENTLY idx_orders_customer_id ON orders(customer_id);
CREATE INDEX CONCURRENTLY idx_order_items_order_id ON order_items(order_id);
```

#### فهارس البحث النصي
```sql
-- فهرس البحث النصي للغة العربية
CREATE INDEX CONCURRENTLY idx_products_title_arabic 
    ON products USING gin(to_tsvector('arabic', title));

CREATE INDEX CONCURRENTLY idx_products_description_arabic 
    ON products USING gin(to_tsvector('arabic', description));

-- فهرس مخصص للمنتجات
CREATE INDEX CONCURRENTLY idx_products_search 
    ON products USING gin(
        setweight(to_tsvector('arabic', title), 'A') ||
        setweight(to_tsvector('arabic', description), 'B') ||
        setweight(to_tsvector('arabic', sku), 'C')
    );
```

#### فهارس مركبة
```sql
-- فهرس للطلبات حسب المتجر والحالة والتاريخ
CREATE INDEX CONCURRENTLY idx_orders_store_status_date 
    ON orders(store_id, status, created_at);

-- فهرس للعملاء حسب المتجر والإجمالي المنفق
CREATE INDEX CONCURRENTLY idx_customers_store_spent 
    ON customers(store_id, total_spent DESC);

-- فهرس للمنتجات حسب المتجر والحالة والسعر
CREATE INDEX CONCURRENTLY idx_products_store_status_price 
    ON products(store_id, status, price);
```

#### فهارس جزئية
```sql
-- فهرس للمنتجات النشطة فقط
CREATE INDEX CONCURRENTLY idx_products_active 
    ON products(store_id, price) 
    WHERE status = 'active';

-- فهرس للطلبات المكتملة
CREATE INDEX CONCURRENTLY idx_orders_completed 
    ON orders(customer_id, total_amount, created_at) 
    WHERE status IN ('delivered', 'completed');

-- فهرس للعملاء ذوي الإنفاق العالي
CREATE INDEX CONCURRENTLY idx_customers_high_value 
    ON customers(store_id, last_order_at) 
    WHERE total_spent > 1000;
```

### 2. فهارس متقدمة

#### فهارس JSONB
```sql
-- فهرس لخصائص JSON في المنتجات
CREATE INDEX CONCURRENTLY idx_products_properties 
    ON products USING gin(properties);

-- فهرس لإعدادات المتجر
CREATE INDEX CONCURRENTLY idx_store_settings_json 
    ON store_settings USING gin(value);

-- فهرس لبيانات التحليلات
CREATE INDEX CONCURRENTLY idx_analytics_events_properties 
    ON analytics_events USING gin(properties);
```

#### فهارس表达式
```sql
-- فهرس للبحث الجزئي في الأسماء
CREATE INDEX CONCURRENTLY idx_products_title_lower 
    ON products(lower(title));

-- فهرس للتاريخ المحول لصيغة Unix
CREATE INDEX CONCURRENTLY idx_orders_created_timestamp 
    ON orders(EXTRACT(EPOCH FROM created_at));

-- فهرس للسعر مع الضريبة
CREATE INDEX CONCURRENTLY idx_products_price_with_tax 
    ON products(price * 1.15);
```

## تحسين الاستعلامات

### 1. استعلامات المنتجات المتقدمة

#### البحث المتقدم في المنتجات
```sql
-- استعلام محسن للبحث في المنتجات
WITH product_search AS (
    SELECT 
        p.id,
        p.title,
        p.price,
        p.featured,
        COALESCE(pi.image_url, '/default-product.jpg') as image_url,
        ts_rank(
            setweight(to_tsvector('arabic', p.title), 'A') ||
            setweight(to_tsvector('arabic', p.description), 'B'),
            plainto_tsquery('arabic', $1)
        ) as relevance_score
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
    WHERE p.store_id = $2
    AND p.status = 'active'
    AND (
        to_tsvector('arabic', p.title || ' ' || p.description) @@ plainto_tsquery('arabic', $1)
        OR p.title ILIKE '%' || $1 || '%'
        OR p.sku ILIKE '%' || $1 || '%'
    )
)
SELECT 
    id,
    title,
    price,
    featured,
    image_url,
    relevance_score
FROM product_search
ORDER BY relevance_score DESC, featured DESC, price ASC
LIMIT 20 OFFSET $3;
```

#### جلب المنتجات مع الفئات والصور
```sql
-- استعلام محسن لجلب المنتجات مع البيانات المرتبطة
SELECT 
    p.id,
    p.title,
    p.price,
    p.compare_at_price,
    p.status,
    p.featured,
    p.created_at,
    -- معلومات الفئة
    c.name as category_name,
    c.handle as category_handle,
    -- الصورة الرئيسية
    pi.image_url,
    pi.alt_text,
    -- عدد المتغيرات
    COUNT(pv.id) as variants_count,
    -- التوفر
    SUM(CASE WHEN pv.track_inventory THEN pv.inventory_quantity ELSE 999 END) as total_inventory
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.product_id AND pc.is_primary = true
LEFT JOIN categories c ON pc.category_id = c.id
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.store_id = $1
AND p.status = 'active'
GROUP BY p.id, c.id, pi.id
ORDER BY p.featured DESC, p.created_at DESC
LIMIT 50;
```

### 2. استعلامات التقارير المحسنة

#### تقرير المبيعات الشهري
```sql
-- تقرير المبيعات المحسن باستخدام Materialized View
CREATE MATERIALIZED VIEW monthly_sales_report AS
SELECT 
    store_id,
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status IN ('delivered', 'completed')) as completed_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_order_value,
    COUNT(DISTINCT customer_id) as unique_customers
FROM orders
WHERE status NOT IN ('cancelled', 'refunded')
GROUP BY store_id, DATE_TRUNC('month', created_at)
ORDER BY store_id, month DESC;

-- فهرس للـ Materialized View
CREATE INDEX CONCURRENTLY idx_monthly_sales_store_month 
    ON monthly_sales_report(store_id, month);
```

#### تقرير المخزون
```sql
-- تقرير المخزون المتقدم
WITH inventory_summary AS (
    SELECT 
        p.id as product_id,
        p.title,
        p.sku,
        c.name as category_name,
        SUM(ii.quantity_on_hand) as total_stock,
        SUM(ii.quantity_reserved) as reserved_stock,
        SUM(ii.quantity_on_hand - ii.quantity_reserved) as available_stock,
        SUM(CASE 
            WHEN ii.quantity_on_hand - ii.quantity_reserved <= ii.low_stock_threshold 
            THEN 1 ELSE 0 
        END) as low_stock_indicators
    FROM products p
    LEFT JOIN product_categories pc ON p.id = pc.product_id AND pc.is_primary = true
    LEFT JOIN categories c ON pc.category_id = c.id
    LEFT JOIN inventory_items ii ON p.id = ii.product_id
    WHERE p.store_id = $1
    AND p.status = 'active'
    GROUP BY p.id, c.name
)
SELECT 
    product_id,
    title,
    sku,
    category_name,
    total_stock,
    reserved_stock,
    available_stock,
    CASE 
        WHEN available_stock = 0 THEN 'out_of_stock'
        WHEN low_stock_indicators > 0 THEN 'low_stock'
        ELSE 'in_stock'
    END as stock_status
FROM inventory_summary
WHERE available_stock <= 10 OR low_stock_indicators > 0
ORDER BY available_stock ASC, title;
```

### 3. تحسينات للمستخدمين

#### جلب بيانات المستخدم مع الجلسات
```sql
-- استعلام محسن لجلب المستخدم والجلسات النشطة
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.status,
    u.last_login_at,
    COUNT(DISTINCT s.id) as active_sessions
FROM users u
LEFT JOIN user_sessions s ON u.id = s.user_id AND s.is_active = true 
    AND s.expires_at > NOW()
WHERE u.id = $1
GROUP BY u.id, u.email, u.first_name, u.last_name, u.status, u.last_login_at;
```

#### جلب إحصائيات العميل السريعة
```sql
-- إحصائيات العميل المحسنة
WITH customer_stats AS (
    SELECT 
        c.id,
        c.store_id,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        MAX(o.created_at) as last_order_date,
        COUNT(DISTINCT o.id) FILTER (WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days') as orders_last_30_days,
        COALESCE(SUM(o.total_amount) FILTER (WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'), 0) as spent_last_30_days
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    WHERE c.id = $1
    GROUP BY c.id, c.store_id
)
SELECT * FROM customer_stats;
```

## تحسين الذاكرة والأداء

### 1. إعدادات PostgreSQL المحسنة

```sql
-- إعدادات الذاكرة
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- إعدادات الفهرسة
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- إعدادات الاتصال
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET superuser_reserved_connections = 3;

-- إعدادات WAL
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;

-- إعادة تحميل الإعدادات
SELECT pg_reload_conf();
```

### 2. تحسين Query Planner

```sql
-- إحصائيات محسنة للجداول
ANALYZE users;
ANALYZE stores;
ANALYZE products;
ANALYZE orders;
ANALYZE customers;

-- إعداد إحصائيات إضافية
ALTER TABLE products ALTER COLUMN title SET STATISTICS 1000;
ALTER TABLE products ALTER COLUMN description SET STATISTICS 1000;
ALTER TABLE customers ALTER COLUMN email SET STATISTICS 1000;
```

### 3. تحسين الفهارس

```sql
-- إعادة بناء الفهارس لإعادة تنظيم البيانات
REINDEX INDEX CONCURRENTLY idx_products_title_arabic;
REINDEX INDEX CONCURRENTLY idx_orders_store_status_date;

-- تحديث إحصائيات الفهارس
ANALYZE VERBOSE idx_products_search;
ANALYZE VERBOSE idx_customers_store_spent;
```

## إدارة البيانات

### 1. تنظيف البيانات القديمة

```sql
-- حذف الجلسات المنتهية الصلاحية
DELETE FROM user_sessions 
WHERE expires_at < NOW() - INTERVAL '7 days';

-- حذف أحداث التحليلات القديمة (أكثر من سنة)
DELETE FROM analytics_events 
WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

-- حذف طلبات Webhooks المكتملة الأثر (أكثر من 30 يوم)
DELETE FROM webhook_deliveries 
WHERE status = 'success' 
AND created_at < CURRENT_DATE - INTERVAL '30 days';

-- حذف طلبات ملغاة قديمة
DELETE FROM orders 
WHERE status = 'cancelled' 
AND created_at < CURRENT_DATE - INTERVAL '6 months';
```

### 2. أرشفة البيانات

```sql
-- إنشاء جدول للأرشيف
CREATE TABLE orders_archive (
    LIKE orders INCLUDING ALL
);

-- أرشفة الطلبات القديمة
INSERT INTO orders_archive 
SELECT * FROM orders 
WHERE created_at < CURRENT_DATE - INTERVAL '2 years';

-- حذف من الجدول الأصلي
DELETE FROM orders 
WHERE created_at < CURRENT_DATE - INTERVAL '2 years';

-- إنشاء فهرس للأرشيف
CREATE INDEX CONCURRENTLY idx_orders_archive_created_at 
    ON orders_archive(created_at);
```

### 3. ضغط الجداول

```sql
-- ضغط الجداول الكبيرة
VACUUM FULL products;
VACUUM FULL orders;
VACUUM FULL customers;

-- تحليل الجداول بعد الضغط
ANALYZE products;
ANALYZE orders;
ANALYZE customers;
```

## المراقبة والتحليل

### 1. استعلامات المراقبة

```sql
-- مراقبة الاستعلامات البطيئة
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time
FROM pg_stat_statements 
WHERE mean_time > 100  -- أكثر من 100 مللي ثانية
ORDER BY mean_time DESC
LIMIT 20;

-- مراقبة استخدام الفهارس
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_tup_read = 0  -- فهارس غير مستخدمة
ORDER BY tablename;

-- مراقبة حجم الجداول
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 2. إحصائيات الأداء

```sql
-- إحصائيات الاتصال
SELECT 
    state,
    COUNT(*) as connection_count,
    MAX(now() - state_change) as max_idle_time
FROM pg_stat_activity 
WHERE datname = current_database()
GROUP BY state;

-- إحصistiques قاعدة البيانات
SELECT 
    datname,
    numbackends as active_connections,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit,
    pg_size_pretty(pg_database_size(datname)) as database_size
FROM pg_stat_database 
WHERE datname = current_database();

-- إحصائيات الجداول
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins + n_tup_upd + n_tup_del as total_modifications
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;
```

## تقسيم البيانات (Partitioning)

### 1. تقسيم جدول الطلبات

```sql
-- إنشاء جدول الطلبات الرئيسي المقسم
CREATE TABLE orders_partitioned (
    LIKE orders INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- إنشاء أقسام شهرية للسنة القادمة
CREATE TABLE orders_2025_01 PARTITION OF orders_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE orders_2025_02 PARTITION OF orders_partitioned
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- إدراج البيانات الموجودة
INSERT INTO orders_partitioned SELECT * FROM orders;

-- حذف الجدول القديم
DROP TABLE orders;
ALTER TABLE orders_partitioned RENAME TO orders;
```

### 2. تقسيم جدول التحليلات

```sql
-- تقسيم جدول التحليلات حسب الشهر
CREATE TABLE analytics_events_partitioned (
    LIKE analytics_events INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- إنشاء أقسام شهرية
CREATE TABLE analytics_2025_01 PARTITION OF analytics_events_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE analytics_2025_02 PARTITION OF analytics_events_partitioned
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

## نصائح التحسين المتقدمة

### 1. تحسين الذاكرة المؤقتة

```sql
-- إعداد Cache للاستعلامات المتكررة
CREATE OR REPLACE FUNCTION get_popular_products(store_uuid UUID)
RETURNS TABLE(product_id UUID, title VARCHAR, sales_count INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        COALESCE(order_stats.sales_count, 0) as sales_count
    FROM products p
    LEFT JOIN (
        SELECT 
            oi.product_id,
            COUNT(*) as sales_count
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.store_id = store_uuid
        AND o.status IN ('delivered', 'completed')
        AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY oi.product_id
    ) order_stats ON p.id = order_stats.product_id
    WHERE p.store_id = store_uuid
    AND p.status = 'active'
    ORDER BY sales_count DESC, p.featured DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;
```

### 2. تحسين المعاملات

```sql
-- استخدام CTEs محسنة
WITH order_totals AS (
    SELECT 
        order_id,
        SUM(quantity * price) as subtotal,
        SUM(discount_amount) as total_discount
    FROM order_items
    GROUP BY order_id
),
customer_metrics AS (
    SELECT 
        c.id,
        COUNT(o.id) as total_orders,
        SUM(ot.subtotal - ot.total_discount) as lifetime_value
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    LEFT JOIN order_totals ot ON o.id = ot.order_id
    WHERE c.store_id = $1
    GROUP BY c.id
)
SELECT 
    c.*,
    cm.total_orders,
    cm.lifetime_value
FROM customers c
JOIN customer_metrics cm ON c.id = cm.id
ORDER BY cm.lifetime_value DESC;
```

### 3. تحسينات تطبيقية

```sql
-- دالة محسنة لجلب المنتجات مع التخزين المؤقت
CREATE OR REPLACE FUNCTION get_cached_products(
    store_uuid UUID,
    category_uuid UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    title VARCHAR,
    price DECIMAL,
    image_url TEXT,
    category_name VARCHAR
) AS $$
BEGIN
    -- استخدام Cache إذا كان متوفراً
    IF cache_lookup('products_' || store_uuid::text) IS NOT NULL THEN
        RETURN QUERY SELECT * FROM cache_get('products_' || store_uuid::text);
    END IF;
    
    -- جلب البيانات من قاعدة البيانات
    RETURN QUERY
    WITH filtered_products AS (
        SELECT p.*, pc.category_id
        FROM products p
        LEFT JOIN product_categories pc ON p.id = pc.product_id AND pc.is_primary = true
        WHERE p.store_id = store_uuid
        AND p.status = 'active'
        AND (category_uuid IS NULL OR pc.category_id = category_uuid)
    )
    SELECT 
        fp.id,
        fp.title,
        fp.price,
        COALESCE(pi.image_url, '/default-product.jpg') as image_url,
        c.name as category_name
    FROM filtered_products fp
    LEFT JOIN categories c ON fp.category_id = c.id
    LEFT JOIN product_images pi ON fp.id = pi.product_id AND pi.is_primary = true
    ORDER BY fp.featured DESC, fp.created_at DESC
    LIMIT limit_count OFFSET offset_count;
    
    -- حفظ في Cache
    PERFORM cache_set('products_' || store_uuid::text, query_result, 300); -- 5 minutes
END;
$$ LANGUAGE plpgsql;
```

## خطة الصيانة الدورية

### نصائح للصيانة الدورية

1. **أسبوعياً**:
   ```bash
   # تحليل الجداول الرئيسية
   psql -d saler_db -c "ANALYZE users, stores, products, orders;"
   
   # تنظيف الفهارس
   psql -d saler_db -c "REINDEX DATABASE saler_db CONCURRENTLY;"
   ```

2. **شهرياً**:
   ```bash
   # ضغط الجداول الكبيرة
   psql -d saler_db -c "VACUUM FULL ANALYZE orders;"
   
   # تحديث Materialized Views
   psql -d saler_db -c "REFRESH MATERIALIZED VIEW monthly_sales_report;"
   ```

3. **ربع سنوي**:
   ```bash
   # إعادة بناء الفهارس
   psql -d saler_db -c "REINDEX DATABASE saler_db;"
   
   # تنظيف البيانات القديمة
   psql -d saler_db -c "DELETE FROM user_sessions WHERE expires_at < NOW() - INTERVAL '30 days';"
   ```

---

**آخر تحديث**: 2 نوفمبر 2025