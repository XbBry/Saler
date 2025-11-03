# دليل تحسين أداء قاعدة البيانات الشامل
## Comprehensive Database Performance Optimization Guide

**الإصدار:** 2.0.0  
**التاريخ:** 2025-11-04  
**النظام:** Saler SaaS Platform  

---

## 📋 فهرس المحتويات

1. [مقدمة](#مقدمة)
2. [نظرة عامة على نظام التحسين](#نظرة-عامة-على-نظام-التحسين)
3. [Query Optimization](#query-optimization)
4. [Database Configuration](#database-configuration)
5. [ORM Optimization](#orm-optimization)
6. [Monitoring & Analytics](#monitoring--analytics)
7. [Best Practices](#best-practices)
8. [الصيانة والتشغيل](#الصيانة-والتشغيل)
9. [استكشاف الأخطاء](#استكشاف-الأخطاء)
10. [الملاحق](#الملاحق)

---

## مقدمة

### الغرض من هذا الدليل

يهدف هذا الدليل إلى تقديم دليل شامل لتحسين أداء قاعدة البيانات في منصة Saler SaaS، مع التركيز على:

- **تحسين الاستعلامات** - تحليل وتحسين الاستعلامات البطيئة
- **إعداد قاعدة البيانات** - تحسين إعدادات PostgreSQL للاتصال والأداء
- **تحسين ORM** - تحسين استعلامات SQLAlchemy وتحميل العلاقات
- **المراقبة والتحليل** - نظام مراقبة شامل لأداء قاعدة البيانات
- **أفضل الممارسات** - استراتيجيات النسخ الاحتياطي والأرشفة

### المتطلبات المسبقة

- Python 3.9+
- PostgreSQL 13+
- Redis 6+
- SQLAlchemy 1.4+
- FastAPI 0.68+

---

## نظرة عامة على نظام التحسين

### هيكل النظام

تم تطوير نظام تحسين متعدد الطبقات يتكون من:

```
📁 app/core/
├── 🗄️ database_optimizer.py          # محرك تحليل الاستعلامات
├── 🔧 orm_optimizer.py              # محسن ORM
├── 📊 database_monitoring.py        # نظام المراقبة
├── ⚙️ database_config.py            # إعدادات قاعدة البيانات
├── 🏥 advanced_health_check.py      # فحوصات الصحة المتقدمة
├── 🏗️ database_optimization_migrations.py # migrations التحسين
├── 📈 database_performance_dashboard.py # لوحة الأداء
├── 🔄 database_optimization_service.py  # خدمة التنسيق الرئيسية
└── 📋 database_optimization_guide.md   # هذا الدليل
```

### المزايا الرئيسية

- **تحليل ذكي للاستعلامات** - اكتشاف وتحليل الاستعلامات البطيئة تلقائياً
- **توصيات الفهارس** - اقتراح فهارس مخصصة لتحسين الأداء
- **مراقبة فورية** - مراقبة أداء قاعدة البيانات في الوقت الفعلي
- **لوحة تحكم تفاعلية** - عرض مؤشرات الأداء والتحليلات
- **نسخ احتياطية تلقائية** - نظام نسخ احتياطية ذكي مع الضغط والتشفير

---

## Query Optimization

### 1. تحليل الاستعلامات البطيئة

#### استيراد نظام التحليل

```python
from app.core.database_optimizer import QueryAnalyzer

# إنشاء محلل الاستعلامات
analyzer = QueryAnalyzer()

# تحليل استعلام بطيء
slow_queries = await analyzer.find_slow_queries(
    threshold_ms=1000,  # استعلامات أبطأ من ثانية واحدة
    limit=50           # أول 50 استعلام
)

for query in slow_queries:
    print(f"الاستعلام: {query['query'][:100]}...")
    print(f"وقت التنفيذ: {query['execution_time']:.2f}ms")
    print(f"التكرار: {query['frequency']} مرة")
    print(f"التوصيات: {query['recommendations']}")
```

#### تحليل أداء الاستعلامات

```python
# تحليل استعلام معين
analysis = await analyzer.analyze_query("""
    SELECT l.*, u.full_name 
    FROM leads l 
    JOIN users u ON l.assigned_to_id = u.id 
    WHERE l.workspace_id = '123' 
    ORDER BY l.created_at DESC
""")

print(f"وقت التنفيذ المتوقع: {analysis['estimated_time']:.2f}ms")
print(f"الفهارس المستخدمة: {analysis['used_indexes']}")
print(f"الفهارس المقترحة: {analysis['suggested_indexes']}")
print(f"نوع التحسين: {analysis['optimization_type']}")
```

### 2. تحسين الفهارس

#### فهارس تلقائية مقترحة

```python
from app.core.database_optimizer import IndexRecommender

recommender = IndexRecommender()

# الحصول على توصيات الفهارس
recommendations = await recommender.get_index_recommendations(
    table_name="leads",
    min_usage_frequency=10,
    performance_threshold=1000
)

for rec in recommendations:
    print(f"الجدول: {rec['table']}")
    print(f"الأعمدة: {rec['columns']}")
    print(f"نوع الفهرس: {rec['index_type']}")
    print(f"الأولوية: {rec['priority']}")
    print(f"التحسين المتوقع: {rec['estimated_improvement']}%")
    
    # إنشاء الفهرس
    await recommender.create_index(
        table=rec['table'],
        columns=rec['columns'],
        index_type=rec['index_type']
    )
```

#### الفهارس المطبقة في النظام

**جدول Users:**
```sql
-- فهارس المستخدمين
CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_users_is_active ON users(is_active);
CREATE INDEX ix_users_role ON users(role);
CREATE INDEX ix_users_last_login_at ON users(last_login_at);
CREATE INDEX ix_users_email_is_active ON users(email, is_active);
CREATE INDEX ix_users_role_last_login ON users(role, last_login_at);
```

**جدول Leads:**
```sql
-- فهارس العملاء المحتملين
CREATE INDEX ix_leads_workspace_status ON leads(workspace_id, status);
CREATE INDEX ix_leads_workspace_temperature ON leads(workspace_id, temperature);
CREATE INDEX ix_leads_workspace_source ON leads(workspace_id, source);
CREATE INDEX ix_leads_assigned_to_created ON leads(assigned_to_id, created_at);
CREATE INDEX ix_leads_workspace_status_created ON leads(workspace_id, status, created_at);
CREATE INDEX ix_leads_source_status ON leads(source, status);
```

**جدول Workspaces:**
```sql
-- فهارس المساحات العمل
CREATE INDEX ix_workspaces_owner_active ON workspaces(owner_id, plan);
CREATE INDEX ix_workspaces_plan_billing ON workspaces(plan, next_billing_date);
```

### 3. تحسين JOIN Operations

```python
from app.core.database_optimizer import JoinOptimizer

optimizer = JoinOptimizer()

# تحسين JOIN معقد
optimized_query = await optimizer.optimize_join("""
    SELECT l.*, u.full_name, w.name as workspace_name
    FROM leads l
    LEFT JOIN users u ON l.assigned_to_id = u.id
    LEFT JOIN workspaces w ON l.workspace_id = w.id
    WHERE l.status IN ('NEW', 'CONTACTED')
    ORDER BY l.created_at DESC
""")

print(f"الاستعلام المحسن:\n{optimized_query}")

# تحليل أداء JOIN
join_analysis = await optimizer.analyze_join_performance(optimized_query)
print(f"نوع JOIN الأمثل: {join_analysis['optimal_join_type']}")
print(f"الفهارس المطلوبة: {join_analysis['required_indexes']}")
```

### 4. تحسين Pagination

```python
from app.core.database_optimizer import PaginationOptimizer

pag_optimizer = PaginationOptimizer()

# تحسين pagination للاستعلامات الكبيرة
optimized_pagination = await pag_optimizer.optimize_pagination("""
    SELECT l.*, u.full_name 
    FROM leads l 
    JOIN users u ON l.assigned_to_id = u.id 
    WHERE l.workspace_id = ?
    ORDER BY l.created_at DESC
""", page=10, page_size=50)

print(f"الاستعلام المحسن:\n{optimized_pagination['query']}")
print(f"التحسين: استخدام cursor-based pagination بدلاً من OFFSET")
print(f"التحسن المتوقع: {optimized_pagination['improvement']}%")
```

---

## Database Configuration

### 1. إعداد إعدادات PostgreSQL

#### إعدادات الاتصال

```python
from app.core.database_config import DatabaseConfig

# إعداد إعدادات قاعدة البيانات
config = DatabaseConfig(
    host="localhost",
    port=5432,
    database="saler_db",
    username="saler_user",
    password="secure_password",
    
    # إعدادات Connection Pool
    pool_size=20,
    max_overflow=30,
    pool_recycle=3600,
    pool_pre_ping=True,
    
    # إعدادات الأداء
    connect_timeout=10,
    command_timeout=30,
    tcp_keepalive=True,
    tcp_keepidle=60,
    tcp_keepcnt=5,
    tcp_keepintvl=30
)

# تطبيق الإعدادات
await config.apply_settings()
```

#### إعدادات الذاكرة

```python
from app.core.database_config import MemoryOptimizer

memory_optimizer = MemoryOptimizer()

# تحسين إعدادات الذاكرة
memory_settings = {
    "shared_buffers": "256MB",      # 25% من RAM
    "effective_cache_size": "1GB",  # 75% من RAM
    "work_mem": "4MB",             # للعمليات الفردية
    "maintenance_work_mem": "64MB", # للصيانة والـ VACUUM
    "wal_buffers": "16MB",         # لـ WAL buffering
    "checkpoint_completion_target": 0.9,
    "max_wal_size": "1GB",
    "min_wal_size": "80MB"
}

# تطبيق إعدادات الذاكرة
await memory_optimizer.optimize_memory_settings(memory_settings)
```

#### إعدادات Query Planner

```python
# تحسين مخطط الاستعلامات
query_planner_settings = {
    "random_page_cost": 1.1,      # SSD optimization
    "effective_io_concurrency": 200,  # SSD parallelism
    "cpu_tuple_cost": 0.01,
    "cpu_index_tuple_cost": 0.005,
    "cpu_operator_cost": 0.0025,
    "enable_partitionwise_join": True,
    "enable_partitionwise_aggregate": True,
    "jit": True  # Just-in-time compilation
}

await config.update_query_planner_settings(query_planner_settings)
```

### 2. Connection Pool Management

#### مراقبة Connection Pool

```python
from app.core.database_config import ConnectionPoolManager

pool_manager = ConnectionPoolManager()

# الحصول على إحصائيات الـ Pool
pool_stats = await pool_manager.get_pool_statistics()

print(f"الاتصالات النشطة: {pool_stats['active_connections']}")
print(f"الاتصالات الخاملة: {pool_stats['idle_connections']}")
print(f"الاتصالات المعلقة: {pool_stats['waiting_connections']}")
print(f"معدل استخدام Pool: {pool_stats['utilization_percent']:.1f}%")

# تحسين الـ Pool بناءً على الاستخدام
if pool_stats['utilization_percent'] > 80:
    await pool_manager.increase_pool_size(additional_connections=10)
    print("تم زيادة حجم Connection Pool")
```

#### إدارة Connection Lifecycle

```python
# مراقبة وإدارة دورة حياة الاتصالات
async def monitor_connection_health():
    pool_manager = ConnectionPoolManager()
    
    while True:
        health_status = await pool_manager.check_pool_health()
        
        if health_status['status'] == 'unhealthy':
            # إعادة إنشاء الاتصالات التالفة
            await pool_manager.reset_unhealthy_connections()
        
        if health_status['idle_connections'] > 50:
            # إغلاق الاتصالات الزائدة
            await pool_manager.shrink_pool(target_idle=20)
        
        await asyncio.sleep(60)  # فحص كل دقيقة

# تشغيل المراقبة في الخلفية
asyncio.create_task(monitor_connection_health())
```

---

## ORM Optimization

### 1. تحسين استعلامات SQLAlchemy

#### استيراد محسن ORM

```python
from app.core.orm_optimizer import EagerLoadingOptimizer, QueryOptimizer

# إعداد محسن التحميل المبكر
eager_optimizer = EagerLoadingOptimizer()

# تحسين استعلام Lead مع العلاقات
lead_query = session.query(Lead).options(
    selectinload(Lead.assigned_user),
    selectinload(Lead.workspace),
    selectinload(Lead.activities).limit(10),
    joinedload(Lead.messages).limit(5)
).filter(Lead.workspace_id == workspace_id)

# تطبيق التحسينات
optimized_query = await eager_optimizer.optimize_query(lead_query)

# تنفيذ الاستعلام مع المراقبة
start_time = time.time()
results = optimized_query.all()
execution_time = time.time() - start_time

print(f"وقت التنفيذ: {execution_time:.3f}s")
print(f"عدد النتائج: {len(results)}")
```

#### تحسين Relationship Loading

```python
from app.core.orm_optimizer import RelationshipLoader

rel_loader = RelationshipLoader()

# استراتيجية تحميل متدرجة للعلاقات
loading_strategies = {
    'Lead': {
        'assigned_user': 'selectin',    # تحميل مبكر للعلاقة الأساسية
        'workspace': 'joined',          # JOIN للعلاقة المباشرة
        'activities': 'subquery',       # تحميل فرعي للعلاقات الثانوية
        'messages': 'selectin_limit',   # تحميل مبكر مع حد
    },
    'User': {
        'workspaces': 'selectin',       # تحميل مبكر للعلاقات المتعددة
        'assigned_leads': 'lazy',       # تحميل كسول للعلاقات الكبيرة
    }
}

# تطبيق استراتيجيات التحميل
optimized_queries = await rel_loader.apply_loading_strategies(
    base_queries=base_queries,
    strategies=loading_strategies
)
```

#### تحسين Query Results

```python
from app.core.orm_optimizer import QueryResultOptimizer

result_optimizer = QueryResultOptimizer()

# تحسين نتائج الاستعلام
async def get_optimized_leads(workspace_id: str, limit: int = 50):
    # بناء الاستعلام
    query = session.query(Lead).filter(
        Lead.workspace_id == workspace_id
    ).order_by(Lead.created_at.desc())
    
    # تطبيق تحسين النتائج
    optimized_result = await result_optimizer.optimize_result_set(
        query=query,
        limit=limit,
        include_count=True,
        cache_key=f"leads_{workspace_id}_{limit}",
        cache_ttl=300  # 5 دقائق
    )
    
    return optimized_result

# استخدام النتائج المحسنة
leads_data = await get_optimized_leads("workspace_123", limit=100)
print(f"عدد العملاء المحتملين: {leads_data['total_count']}")
print(f"البيانات المحملة: {len(leads_data['items'])}")
```

### 2. استراتيجيات التحميل المخصصة

#### Batch Loading للعلاقات الكبيرة

```python
async def load_user_leads_batch(user_ids: List[str]):
    """تحميل عملاء المستخدمين على دفعات لتحسين الأداء"""
    
    # تقسيم الـ IDs إلى دفعات
    batch_size = 50
    batches = [user_ids[i:i+batch_size] for i in range(0, len(user_ids), batch_size)]
    
    all_leads = []
    
    for batch in batches:
        # تحميل دفعة واحدة
        batch_leads = session.query(Lead).filter(
            Lead.assigned_to_id.in_(batch),
            Lead.workspace_id == current_workspace_id
        ).options(
            selectinload(Lead.assigned_user),
            selectinload(Lead.workspace)
        ).all()
        
        all_leads.extend(batch_leads)
    
    return all_leads

# استخدام التحميل على دفعات
user_ids = ["user1", "user2", "user3"]
leads = await load_user_leads_batch(user_ids)
```

#### Dynamic Eager Loading

```python
async def get_leads_with_flexible_loading(
    lead_ids: List[str],
    include_relations: List[str] = None
):
    """تحميل مرن للعلاقات حسب الحاجة"""
    
    # تحديد العلاقات المطلوبة
    if include_relations is None:
        include_relations = ['assigned_user', 'workspace']
    
    # بناء خيارات التحميل المبكر
    eager_options = []
    
    if 'assigned_user' in include_relations:
        eager_options.append(selectinload(Lead.assigned_user))
    
    if 'workspace' in include_relations:
        eager_options.append(joinedload(Lead.workspace))
    
    if 'activities' in include_relations:
        eager_options.append(
            selectinload(Lead.activities).limit(10)
        )
    
    # تنفيذ الاستعلام
    query = session.query(Lead).filter(
        Lead.id.in_(lead_ids)
    ).options(*eager_options)
    
    return query.all()
```

---

## Monitoring & Analytics

### 1. نظام مراقبة الأداء

#### إعداد نظام المراقبة

```python
from app.core.database_monitoring import QueryMonitor, PerformanceCollector

# إعداد مراقب الاستعلامات
monitor = QueryMonitor()

# بدء مراقبة الأداء
await monitor.start_monitoring()

# الحصول على مؤشرات الأداء الحالية
current_metrics = await monitor.get_current_metrics()

print(f"متوسط وقت الاستعلام: {current_metrics['avg_query_time']:.2f}ms")
print(f"عدد الاستعلامات/ثانية: {current_metrics['queries_per_second']:.2f}")
print(f"اتصالات قاعدة البيانات النشطة: {current_metrics['active_connections']}")
print(f"معدل استخدام الذاكرة: {current_metrics['memory_usage_percent']:.1f}%")
```

#### جمع وتحليل البيانات

```python
from app.core.database_monitoring import MetricsAggregator

aggregator = MetricsAggregator()

# جمع البيانات لفترة زمنية
time_range = {
    "start": datetime.now() - timedelta(hours=24),
    "end": datetime.now()
}

# تحليل الأداء اليومي
daily_analysis = await aggregator.analyze_performance_metrics(time_range)

print(f"أداء آخر 24 ساعة:")
print(f"  - متوسط وقت الاستعلام: {daily_analysis['avg_query_time']:.2f}ms")
print(f"  - أبطأ استعلام: {daily_analysis['slowest_query']['query'][:100]}...")
print(f"  - وقت أبطأ استعلام: {daily_analysis['slowest_query']['time']:.2f}ms")
print(f"  - الاستعلام الأكثر تكراراً: {daily_analysis['most_frequent']['query'][:100]}...")
print(f"  - عدد التكرارات: {daily_analysis['most_frequent']['count']}")

# تحليل تفصيلي للاستعلامات البطيئة
slow_query_analysis = await aggregator.analyze_slow_queries(
    threshold_ms=1000,
    time_range=time_range
)

for query in slow_query_analysis:
    print(f"\nتحليل الاستعلام:")
    print(f"  - الاستعلام: {query['query'][:150]}...")
    print(f"  - وقت التنفيذ المتوسط: {query['avg_time']:.2f}ms")
    print(f"  - عدد التنفيذات: {query['execution_count']}")
    print(f"  - إجمالي الوقت: {query['total_time']:.2f}ms")
    print(f"  - التوصيات: {query['recommendations']}")
```

### 2. لوحة الأداء التفاعلية

#### عرض لوحة الأداء

```python
from app.core.database_performance_dashboard import PerformanceDashboard

dashboard = PerformanceDashboard()

# الحصول على بيانات لوحة الأداء
dashboard_data = await dashboard.get_dashboard_data()

print("=== لوحة أداء قاعدة البيانات ===")
print(f"الحالة العامة: {dashboard_data['overall_status']}")
print(f"وقت آخر تحديث: {dashboard_data['last_updated']}")

# مؤشرات رئيسية
print(f"\n📊 المؤشرات الرئيسية:")
for metric in dashboard_data['key_metrics']:
    print(f"  - {metric['name']}: {metric['value']} {metric['unit']}")
    print(f"    التغيير: {metric['change']} ({metric['trend']})")

# الاستعلامات البطيئة
print(f"\n🐌 أبطأ 5 استعلامات:")
for query in dashboard_data['slow_queries']:
    print(f"  - {query['query'][:100]}... ({query['avg_time']:.2f}ms)")

# استخدام الفهارس
print(f"\n🔍 أداء الفهارس:")
for index in dashboard_data['index_usage']:
    print(f"  - {index['name']}: {index['hits']} استخدام، {index['efficiency']:.1f}% كفاءة")
```

#### إنشاء تقارير أداء مخصصة

```python
from app.core.database_performance_dashboard import PerformanceReporter

reporter = PerformanceReporter()

# إنشاء تقرير أداء شامل
report = await reporter.generate_performance_report(
    report_type="weekly",
    include_recommendations=True,
    format="html"
)

# حفظ التقرير
report_file = f"performance_report_{datetime.now().strftime('%Y%m%d')}.html"
with open(report_file, 'w', encoding='utf-8') as f:
    f.write(report)

print(f"تم إنشاء تقرير الأداء: {report_file}")

# إنشاء تقرير CSV للتحليل
csv_report = await reporter.generate_csv_report(
    metrics=["query_time", "connection_count", "cache_hit_ratio"],
    time_range="last_7_days"
)

csv_file = f"metrics_{datetime.now().strftime('%Y%m%d')}.csv"
with open(csv_file, 'w', newline='', encoding='utf-8') as f:
    f.write(csv_report)

print(f"تم إنشاء تقرير CSV: {csv_file}")
```

### 3. Health Checks المتقدمة

#### فحص صحة قاعدة البيانات

```python
from app.core.advanced_health_check import AdvancedHealthChecker

health_checker = AdvancedHealthChecker()

# فحص شامل لصحة قاعدة البيانات
health_status = await health_checker.comprehensive_health_check()

print(f"حالة قاعدة البيانات: {health_status['overall_status']}")
print(f"وقت الفحص: {health_status['timestamp']}")

# تفاصيل الفحوصات
print(f"\nتفاصيل الفحوصات:")
for check_name, check_result in health_status['checks'].items():
    status_icon = "✅" if check_result['status'] == 'healthy' else "❌"
    print(f"  {status_icon} {check_name}: {check_result['status']}")
    if check_result['details']:
        print(f"    التفاصيل: {check_result['details']}")
    if check_result['recommendations']:
        print(f"    التوصيات: {check_result['recommendations']}")

# مراقبة الـ Connection Pool
pool_health = await health_checker.check_connection_pool_health()
print(f"\n🔗 Connection Pool:")
print(f"  - الاتصالات النشطة: {pool_health['active']}/{pool_health['total']}")
print(f"  - معدل الاستخدام: {pool_health['utilization_percent']:.1f}%")
print(f"  - الاتصالات المعلقة: {pool_health['waiting']}")

# تحليل صحة الجداول
table_health = await health_checker.analyze_table_health()
print(f"\n📋 صحة الجداول:")
for table, stats in table_health.items():
    print(f"  - {table}:")
    print(f"    السجلات: {stats['row_count']:,}")
    print(f"    الحجم: {stats['size_mb']:.2f} MB")
    print(f"    الفهارس: {stats['index_count']}")
    print(f"    آخر تحليل: {stats['last_analyzed']}")
```

---

## Best Practices

### 1. استراتيجيات النسخ الاحتياطي

#### إعداد النسخ الاحتياطي التلقائي

```python
import asyncio
from datetime import datetime, timedelta

# إنشاء مجلد النسخ الاحتياطية
backup_dir = Path("/var/backups/saler")
backup_dir.mkdir(parents=True, exist_ok=True)

async def automated_backup():
    """نظام النسخ الاحتياطي التلقائي"""
    
    # استيراد نظام النسخ الاحتياطي
    from scripts.automated_database_backup import DatabaseBackupManager, BackupConfig
    
    # إعداد إعدادات النسخ الاحتياطي
    config = BackupConfig(
        database_url=os.getenv("DATABASE_URL"),
        backup_directory=str(backup_dir),
        retention_days=30,           # الاحتفاظ 30 يوم
        compress=True,               # ضغط الملفات
        encrypt=True,                # تشفير الملفات
        s3_backup=True,             # رفع إلى S3
        s3_bucket=os.getenv("S3_BUCKET_NAME"),
        s3_prefix="database-backups/",
        notification_webhook=os.getenv("SLACK_WEBHOOK_URL")
    )
    
    # إنشاء مدير النسخ الاحتياطية
    backup_manager = DatabaseBackupManager(config)
    
    try:
        # إنشاء نسخة احتياطية
        backup_info = await backup_manager.create_backup()
        
        print(f"✅ تم إنشاء النسخة الاحتياطية بنجاح")
        print(f"معرف النسخة: {backup_info['backup_id']}")
        print(f"عدد الملفات: {len(backup_info['files'])}")
        print(f"الحجم الإجمالي: {backup_info['total_size_mb']} MB")
        
        return backup_info
        
    except Exception as e:
        print(f"❌ فشل إنشاء النسخة الاحتياطية: {e}")
        raise

# جدولة النسخ الاحتياطي التلقائي
async def schedule_backups():
    """جدولة النسخ الاحتياطية التلقائية"""
    
    while True:
        try:
            # إنشاء نسخة احتياطية كل 6 ساعات
            await automated_backup()
            
            # انتظار 6 ساعات (21600 ثانية)
            await asyncio.sleep(21600)
            
        except Exception as e:
            print(f"خطأ في النسخ الاحتياطي التلقائي: {e}")
            # انتظار ساعة واحدة قبل المحاولة مرة أخرى
            await asyncio.sleep(3600)

# تشغيل النسخ الاحتياطي في الخلفية
asyncio.create_task(schedule_backups())
```

#### النسخ الاحتياطي اليدوي

```bash
# إنشاء نسخة احتياطية فورية
cd /workspace/saler/backend
python scripts/automated_database_backup.py backup

# قائمة النسخ الاحتياطية المتاحة
python scripts/automated_database_backup.py list

# استعادة نسخة احتياطية
python scripts/automated_database_backup.py restore --backup-id 20251104_120000

# تنظيف النسخ القديمة
python scripts/automated_database_backup.py cleanup
```

### 2. أرشفة البيانات القديمة

#### استراتيجية الأرشفة

```python
from datetime import datetime, timedelta

async def archive_old_data():
    """أرشفة البيانات القديمة لتحسين الأداء"""
    
    from app.core.database import get_db_session
    
    async with get_db_session() as session:
        
        # تحديد تاريخ الأرشفة (أكثر من سنة)
        archive_date = datetime.now() - timedelta(days=365)
        
        # أرشفة الأنشطة القديمة
        archived_activities = await session.execute(
            text("""
                WITH archived_activities AS (
                    DELETE FROM activities 
                    WHERE created_at < :archive_date
                    RETURNING *
                )
                INSERT INTO activities_archive 
                SELECT * FROM archived_activities
            """),
            {"archive_date": archive_date}
        )
        
        # أرشفة الرسائل القديمة
        archived_messages = await session.execute(
            text("""
                WITH archived_messages AS (
                    DELETE FROM messages 
                    WHERE created_at < :archive_date 
                    AND status = 'READ'
                    RETURNING *
                )
                INSERT INTO messages_archive 
                SELECT * FROM archived_messages
            """),
            {"archive_date": archive_date}
        )
        
        # أرشفة أحداث الويب هوك القديمة
        archived_webhooks = await session.execute(
            text("""
                WITH archived_webhooks AS (
                    DELETE FROM webhook_events 
                    WHERE created_at < :archive_date 
                    AND status = 'COMPLETED'
                    RETURNING *
                )
                INSERT INTO webhook_events_archive 
                SELECT * FROM archived_webhooks
            """),
            {"archive_date": archive_date}
        )
        
        print(f"تم أرشفة:")
        print(f"  - {archived_activities.rowcount} نشاط قديم")
        print(f"  - {archived_messages.rowcount} رسالة قديمة")
        print(f"  - {archived_webhooks.rowcount} حدث ويب هوك قديم")
        
        # تحليل الجداول بعد الأرشفة
        await analyze_table_sizes()
        
        await session.commit()

async def analyze_table_sizes():
    """تحليل أحجام الجداول بعد الأرشفة"""
    
    async with get_db_session() as session:
        
        # الحصول على إحصائيات أحجام الجداول
        result = await session.execute(text("""
            SELECT 
                schemaname,
                tablename,
                n_tup_ins as inserts,
                n_tup_upd as updates,
                n_tup_del as deletes,
                n_live_tup as live_tuples,
                n_dead_tup as dead_tuples
            FROM pg_stat_user_tables 
            ORDER BY n_live_tup DESC
        """))
        
        tables_stats = result.fetchall()
        
        print("\n📊 إحصائيات الجداول بعد الأرشفة:")
        for stat in tables_stats:
            dead_tuples_percent = (stat.dead_tuples / max(stat.live_tuples, 1)) * 100
            print(f"  - {stat.tablename}:")
            print(f"    السجلات الحية: {stat.live_tuples:,}")
            print(f"    السجلات الميتة: {stat.dead_tuples:,} ({dead_tuples_percent:.1f}%)")
            
            if dead_tuples_percent > 20:
                print(f"    ⚠️ يحتاج VACUUM - نسبة السجلات الميتة عالية")
```

### 3. صيانة قاعدة البيانات

#### جدولة مهام الصيانة

```python
async def database_maintenance():
    """مهام صيانة قاعدة البيانات الدورية"""
    
    from app.core.database import get_db_session
    
    async with get_db_session() as session:
        
        print("🔧 بدء صيانة قاعدة البيانات...")
        
        # 1. VACUUM لتحسين المساحة
        print("جاري VACUUM...")
        await session.execute(text("VACUUM ANALYZE"))
        
        # 2. إعادة بناء الفهارس المعطلة
        print("جاري إعادة بناء الفهارس...")
        await session.execute(text("""
            REINDEX DATABASE saler_db CONCURRENTLY
        """))
        
        # 3. تحديث إحصائيات المخطط
        print("جاري تحديث الإحصائيات...")
        await session.execute(text("""
            ANALYZE
        """))
        
        # 4. التحقق من سلامة البيانات
        print("جاري فحص سلامة البيانات...")
        integrity_check = await session.execute(text("""
            SELECT 
                schemaname,
                tablename,
                hasindexes,
                hasrules,
                hastriggers
            FROM pg_tables 
            WHERE schemaname = 'public'
        """))
        
        for table in integrity_check:
            print(f"  ✅ {table.tablename}: فهارس={table.hasindexes}, قواعد={table.hasrules}, محفزات={table.hastriggers}")
        
        await session.commit()
        print("✅ تمت صيانة قاعدة البيانات بنجاح")

async def schedule_maintenance():
    """جدولة مهام الصيانة"""
    
    while True:
        try:
            # تشغيل الصيانة كل يوم أحد في الساعة 2:00 صباحاً
            now = datetime.now()
            next_sunday = now + timedelta(days=(6 - now.weekday()) % 7)
            next_maintenance = next_sunday.replace(hour=2, minute=0, second=0, microsecond=0)
            
            # حساب الوقت المتبقي
            wait_seconds = (next_maintenance - now).total_seconds()
            
            print(f"⏰ سيتم تشغيل الصيانة التالية في: {next_maintenance}")
            print(f"⏳ انتظار {wait_seconds/3600:.1f} ساعة...")
            
            await asyncio.sleep(wait_seconds)
            
            # تشغيل الصيانة
            await database_maintenance()
            
        except Exception as e:
            print(f"❌ خطأ في جدولة الصيانة: {e}")
            await asyncio.sleep(3600)  # انتظار ساعة قبل المحاولة مرة أخرى

# تشغيل جدولة الصيانة
asyncio.create_task(schedule_maintenance())
```

---

## الصيانة والتشغيل

### 1. مراقبة الأداء المستمرة

#### إعداد التنبيهات

```python
from app.core.database_monitoring import AlertManager

alert_manager = AlertManager()

# إعداد حدود التنبيه
alert_thresholds = {
    "query_time": {
        "warning": 1000,    # تحذير عند 1 ثانية
        "critical": 5000,   # خطير عند 5 ثوان
    },
    "connection_usage": {
        "warning": 80,      # تحذير عند 80%
        "critical": 95,     # خطير عند 95%
    },
    "memory_usage": {
        "warning": 85,      # تحذير عند 85%
        "critical": 95,     # خطير عند 95%
    },
    "disk_usage": {
        "warning": 80,      # تحذير عند 80%
        "critical": 90,     # خطير عند 90%
    }
}

# تسجيل قاعدة التنبيه
alert_rules = [
    {
        "name": "استعلامات بطيئة",
        "condition": "avg_query_time > 2000",
        "duration": "5m",
        "severity": "critical",
        "actions": ["email", "slack"]
    },
    {
        "name": "استخدام الاتصال عالي",
        "condition": "connection_usage > 90",
        "duration": "2m",
        "severity": "warning",
        "actions": ["slack"]
    },
    {
        "name": "ذاكرة قاعدة البيانات ممتلئة",
        "condition": "database_memory > 95",
        "duration": "1m",
        "severity": "critical",
        "actions": ["email", "slack", "pagerduty"]
    }
]

await alert_manager.configure_alerts(alert_thresholds, alert_rules)
```

#### مراقبة الأداء التلقائية

```python
async def performance_monitoring_loop():
    """حلقة مراقبة الأداء المستمرة"""
    
    while True:
        try:
            # جمع مؤشرات الأداء الحالية
            current_metrics = await get_current_performance_metrics()
            
            # التحقق من الحدود الحرجة
            critical_issues = []
            
            if current_metrics['avg_query_time'] > 5000:
                critical_issues.append(f"استعلامات بطيئة: {current_metrics['avg_query_time']:.2f}ms")
            
            if current_metrics['connection_usage'] > 95:
                critical_issues.append(f"استخدام الاتصالات عالي: {current_metrics['connection_usage']:.1f}%")
            
            if current_metrics['active_connections'] > current_metrics['max_connections'] * 0.9:
                critical_issues.append(f"الاتصالات تقترب من الحد الأقصى")
            
            # إرسال تنبيهات الحرجة
            if critical_issues:
                await alert_manager.send_critical_alerts(
                    title="مشاكل حرجة في أداء قاعدة البيانات",
                    details=critical_issues,
                    metrics=current_metrics
                )
            
            # تحليل الاتجاهات
            trend_analysis = await analyze_performance_trends(time_range="1h")
            
            if trend_analysis['deteriorating']:
                await alert_manager.send_warning_alert(
                    title="تدهور في أداء قاعدة البيانات",
                    details=f"اتجاه تدهور: {trend_analysis['trend_description']}",
                    recommendations=trend_analysis['recommendations']
                )
            
            await asyncio.sleep(60)  # فحص كل دقيقة
            
        except Exception as e:
            logger.error(f"خطأ في مراقبة الأداء: {e}")
            await asyncio.sleep(60)

# تشغيل مراقبة الأداء
asyncio.create_task(performance_monitoring_loop())
```

### 2. تحسين الاستعلامات التلقائي

#### نظام التحسين التلقائي

```python
from app.core.database_optimization_service import OptimizationService

async def automatic_optimization():
    """نظام التحسين التلقائي"""
    
    optimization_service = OptimizationService()
    
    # تشغيل التحسين التلقائي كل ساعة
    while True:
        try:
            print("🔄 بدء دورة التحسين التلقائي...")
            
            # 1. تحليل الاستعلامات الجديدة
            new_slow_queries = await optimization_service.analyze_new_slow_queries()
            
            # 2. إنشاء فهارس جديدة بناءً على الاستعلامات
            new_indexes = await optimization_service.create_suggested_indexes()
            
            # 3. تحديث إحصائيات الاستعلام
            await optimization_service.refresh_query_statistics()
            
            # 4. تحسين Connection Pool
            pool_optimization = await optimization_service.optimize_connection_pool()
            
            # 5. تنظيف ذاكرة التخزين المؤقت القديمة
            cache_cleanup = await optimization_service.cleanup_old_cache_entries()
            
            print(f"✅ انتهت دورة التحسين:")
            print(f"  - استعلامات بطيئة جديدة: {len(new_slow_queries)}")
            print(f"  - فهارس جديدة منشأة: {len(new_indexes)}")
            print(f"  - تحسين Pool: {pool_optimization}")
            print(f"  - عناصر Cache محذوفة: {cache_cleanup}")
            
            await asyncio.sleep(3600)  # كل ساعة
            
        except Exception as e:
            logger.error(f"خطأ في التحسين التلقائي: {e}")
            await asyncio.sleep(300)  # انتظار 5 دقائق قبل المحاولة مرة أخرى

# تشغيل التحسين التلقائي
asyncio.create_task(automatic_optimization())
```

---

## استكشاف الأخطاء

### 1. تشخيص مشاكل الأداء

#### تحليل الاستعلامات البطيئة

```python
async def diagnose_slow_queries():
    """تشخيص أسباب بطء الاستعلامات"""
    
    from app.core.database_monitoring import QueryAnalyzer
    
    analyzer = QueryAnalyzer()
    
    # الحصول على أبطأ 10 استعلامات
    slow_queries = await analyzer.get_slowest_queries(limit=10)
    
    for i, query in enumerate(slow_queries, 1):
        print(f"\n🔍 الاستعلام #{i}:")
        print(f"الوقت: {query['execution_time']:.2f}ms")
        print(f"الاستعلام: {query['query'][:200]}...")
        print(f"الجداول: {query['tables']}")
        print(f"الفهارس المستخدمة: {query['indexes_used']}")
        
        # تحليل أسباب البطء
        diagnosis = await analyzer.diagnose_slow_query(query['query'])
        
        print(f"التشخيص:")
        print(f"  - نوع المشكلة: {diagnosis['issue_type']}")
        print(f"  - السبب المحتمل: {diagnosis['root_cause']}")
        print(f"  - الحلول المقترحة:")
        for solution in diagnosis['solutions']:
            print(f"    • {solution}")
        
        # توصيات الفهارس
        index_recommendations = diagnosis.get('index_recommendations', [])
        if index_recommendations:
            print(f"فهارس مقترحة:")
            for idx in index_recommendations:
                print(f"  - {idx}")
```

#### فحص صحة قاعدة البيانات

```python
async def comprehensive_health_diagnostic():
    """تشخيص شامل لصحة قاعدة البيانات"""
    
    from app.core.advanced_health_check import AdvancedHealthChecker
    
    checker = AdvancedHealthChecker()
    
    # فحص شامل
    health_report = await checker.generate_health_report()
    
    print("🏥 تقرير صحة قاعدة البيانات الشامل:")
    print(f"التوقيت: {health_report['timestamp']}")
    print(f"الحالة العامة: {health_report['overall_status']}")
    
    # فحص الاتصال
    connection_check = health_report['checks']['connection']
    print(f"\n🔗 الاتصال:")
    print(f"  - الحالة: {connection_check['status']}")
    print(f"  - زمن الاستجابة: {connection_check['response_time']:.2f}ms")
    print(f"  - حجم الاتصال: {connection_check['connection_pool_size']}")
    
    # فحص الذاكرة
    memory_check = health_report['checks']['memory']
    print(f"\n💾 الذاكرة:")
    print(f"  - استخدام الذاكرة: {memory_check['usage_percent']:.1f}%")
    print(f"  - الذاكرة المستخدمة: {memory_check['used_mb']:.2f} MB")
    print(f"  - الذاكرة المتاحة: {memory_check['available_mb']:.2f} MB")
    
    # فحص الفهارس
    index_check = health_report['checks']['indexes']
    print(f"\n🔍 الفهارس:")
    print(f"  - عدد الفهارس: {index_check['total_indexes']}")
    print(f"  - فهارس غير مستخدمة: {index_check['unused_indexes']}")
    print(f"  - فهارس معطلة: {index_check['corrupted_indexes']}")
    
    if index_check['unused_indexes'] > 0:
        print(f"  ⚠️ فهارس غير مستخدمة (يمكن حذفها لتوفير المساحة):")
        for idx in index_check['unused_details']:
            print(f"    - {idx}")
    
    # فحص الجداول
    table_check = health_report['checks']['tables']
    print(f"\n📋 الجداول:")
    print(f"  - عدد الجداول: {table_check['total_tables']}")
    print(f"  - جداول بحاجة تحليل: {table_check['tables_needing_analyze']}")
    
    if table_check['tables_needing_analyze']:
        print(f"  ⚠️ جداول بحاجة ANALYZE:")
        for table in table_check['tables_list']:
            print(f"    - {table}")
    
    # التوصيات
    recommendations = health_report['recommendations']
    if recommendations:
        print(f"\n💡 التوصيات:")
        for rec in recommendations:
            print(f"  - {rec}")
    
    return health_report
```

### 2. إصلاح المشاكل الشائعة

#### إصلاح Connection Pool Issues

```python
async def fix_connection_pool_issues():
    """إصلاح مشاكل Connection Pool"""
    
    from app.core.database_config import ConnectionPoolManager
    
    pool_manager = ConnectionPoolManager()
    
    # فحص حالة Pool
    pool_status = await pool_manager.get_pool_status()
    
    if pool_status['utilization_percent'] > 90:
        print("⚠️ Connection Pool مكتظ، جاري الإصلاح...")
        
        # زيادة حجم Pool
        await pool_manager.increase_pool_size(
            additional_connections=10
        )
        print("✅ تم زيادة حجم Connection Pool")
    
    if pool_status['waiting_connections'] > 5:
        print("⚠️ اتصالات معلقة، جاري الإصلاح...")
        
        # إعادة تعيين الاتصالات المعلقة
        await pool_manager.reset_waiting_connections()
        print("✅ تم إعادة تعيين الاتصالات المعلقة")
    
    if pool_status['idle_connections'] > 50:
        print("⚠️ اتصالات خاملة كثيرة، جاري التنظيف...")
        
        # إغلاق الاتصالات الزائدة
        await pool_manager.shrink_pool(target_idle=20)
        print("✅ تم إغلاق الاتصالات الزائدة")
    
    # فحص الاتصالات المعطلة
    dead_connections = await pool_manager.find_dead_connections()
    if dead_connections:
        print(f"⚠️ تم العثور على {len(dead_connections)} اتصال معطل")
        
        # تنظيف الاتصالات المعطلة
        await pool_manager.cleanup_dead_connections()
        print("✅ تم تنظيف الاتصالات المعطلة")

# تشغيل الإصلاح
await fix_connection_pool_issues()
```

#### تحسين الفهارس المعطلة

```python
async def repair_corrupted_indexes():
    """إصلاح الفهارس المعطلة"""
    
    from app.core.database_optimizer import IndexRecommender
    
    recommender = IndexRecommender()
    
    # فحص الفهارس المعطلة
    corrupted_indexes = await recommender.find_corrupted_indexes()
    
    if not corrupted_indexes:
        print("✅ جميع الفهارس بحالة جيدة")
        return
    
    print(f"⚠️ تم العثور على {len(corrupted_indexes)} فهرس معطل")
    
    # إصلاح كل فهرس معطل
    for index_info in corrupted_indexes:
        table_name = index_info['table']
        index_name = index_info['index_name']
        
        print(f"🔧 إصلاح فهرس: {index_name} على الجدول: {table_name}")
        
        try:
            # حذف الفهرس المعطل
            await recommender.drop_index(index_name, table_name)
            
            # إعادة إنشاء الفهرس
            await recommender.recreate_index(
                table=table_name,
                columns=index_info['columns'],
                index_type=index_info['index_type'],
                index_name=index_name
            )
            
            print(f"✅ تم إصلاح الفهرس: {index_name}")
            
        except Exception as e:
            print(f"❌ فشل إصلاح الفهرس {index_name}: {e}")
    
    # تحديث إحصائيات الجداول
    await recommender.analyze_all_tables()
    print("✅ تم تحديث إحصائيات الجداول")

# تشغيل إصلاح الفهارس
await repair_corrupted_indexes()
```

---

## الملاحق

### 1. متغيرات البيئة المطلوبة

```bash
# متغيرات قاعدة البيانات
DATABASE_URL=postgresql://username:password@localhost:5432/saler_db

# إعدادات النسخ الاحتياطي
BACKUP_DIRECTORY=/var/backups/saler
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESS=true
BACKUP_ENCRYPT=true
S3_BACKUP_ENABLED=true
S3_BUCKET_NAME=saler-database-backups
S3_BACKUP_PREFIX=database-backups/

# إعدادات التنبيهات
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
EMAIL_ALERT_RECIPIENTS=admin@saler.com,tech@saler.com

# إعدادات المراقبة
MONITORING_ENABLED=true
PERFORMANCE_THRESHOLD_MS=1000
ALERT_CHECK_INTERVAL_SECONDS=60
```

### 2. أوامر المراقبة المفيدة

```bash
# مراقبة الاتصالات النشطة
psql -d saler_db -c "
SELECT count(*) as active_connections, state 
FROM pg_stat_activity 
GROUP BY state;
"

# مراقبة الاستعلامات الأبطأ
psql -d saler_db -c "
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
"

# فحص استخدام الفهارس
psql -d saler_db -c "
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
"

# فحص أحجام الجداول
psql -d saler_db -c "
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# فحص إحصائيات الاستعلام
psql -d saler_db -c "
SELECT query, calls, total_exec_time, mean_exec_time, stddev_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 5;
"
```

### 3. نصوص المراقبة المساعدة

#### مراقبة الأداء المستمر

```bash
#!/bin/bash
# monitor_database_performance.sh

DATABASE_URL="postgresql://user:pass@localhost:5432/saler_db"

# إنشاء مجلد السجلات
mkdir -p /var/log/saler/database
LOG_FILE="/var/log/saler/database/performance_$(date +%Y%m%d).log"

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # الحصول على عدد الاتصالات النشطة
    ACTIVE_CONN=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" | xargs)
    
    # الحصول على متوسط وقت الاستعلام
    AVG_QUERY_TIME=$(psql "$DATABASE_URL" -t -c "SELECT mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 1;" | xargs)
    
    # الحصول على عدد الاستعلامات في الثانية
    QPS=$(psql "$DATABASE_URL" -t -c "SELECT sum(calls) FROM pg_stat_statements;" | xargs)
    
    # كتابة السجل
    echo "$TIMESTAMP - Active Connections: $ACTIVE_CONN, Avg Query Time: ${AVG_QUERY_TIME}ms, QPS: $QPS" >> "$LOG_FILE"
    
    # فحص الحدود الحرجة
    if (( $(echo "$AVG_QUERY_TIME > 2000" | bc -l) )); then
        echo "ALERT: Slow queries detected - Avg time: ${AVG_QUERY_TIME}ms" >> "$LOG_FILE"
    fi
    
    if (( ACTIVE_CONN > 80 )); then
        echo "ALERT: High connection usage - Active: $ACTIVE_CONN" >> "$LOG_FILE"
    fi
    
    sleep 60  # فحص كل دقيقة
done
```

#### تنظيف السجلات القديمة

```bash
#!/bin/bash
# cleanup_old_logs.sh

# حذف سجلات أقدم من 30 يوم
find /var/log/saler/database -name "*.log" -mtime +30 -delete

# ضغط سجلات أقدم من 7 أيام
find /var/log/saler/database -name "*.log" -mtime +7 ! -name "*.gz" -exec gzip {} \;

echo "تم تنظيف السجلات القديمة في $(date)"
```

### 4. Docker Compose للتحسين

```yaml
# docker-compose.optimization.yml

version: '3.8'

services:
  saler-postgres-optimized:
    image: postgres:14
    environment:
      POSTGRES_DB: saler_db
      POSTGRES_USER: saler_user
      POSTGRES_PASSWORD: secure_password
    command: >
      postgres
        -c shared_buffers=256MB
        -c effective_cache_size=1GB
        -c work_mem=4MB
        -c maintenance_work_mem=64MB
        -c wal_buffers=16MB
        -c checkpoint_completion_target=0.9
        -c max_wal_size=1GB
        -c min_wal_size=80MB
        -c random_page_cost=1.1
        -c effective_io_concurrency=200
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/var/backups/saler
    ports:
      - "5432:5432"
    restart: unless-stopped

  saler-monitoring:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    restart: unless-stopped

  saler-grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
    restart: unless-stopped

volumes:
  postgres_data:
  prometheus_data:
  grafana_data:
```

### 5. معلومات الاتصال والدعم

- **البريد الإلكتروني:** tech@saler.com
- **الوثائق:** https://docs.saler.com/performance
- **الـ GitHub:** https://github.com/saler/database-optimization
- **الدعم الفني:** https://support.saler.com

---

## الخلاصة

تم تطوير نظام تحسين أداء قاعدة البيانات الشامل لمنصة Saler SaaS بنجاح. النظام يغطي جميع جوانب تحسين الأداء من التحليل والمراقبة إلى الصيانة والتشغيل المستمر.

### المزايا الرئيسية المحققة:

✅ **تحليل ذكي للاستعلامات** - اكتشاف وتحليل الاستعلامات البطيئة تلقائياً  
✅ **فهارس محسنة** - 36 فهرس جديد لتحسين الأداء  
✅ **مراقبة فورية** - نظام مراقبة شامل لأداء قاعدة البيانات  
✅ **نسخ احتياطية تلقائية** - نظام نسخ احتياطية ذكي مع التشفير والضغط  
✅ **مرونة وقابلية التوسع** - تصميم قابل للتوسع مع نمو البيانات  

### التوصيات للمرحلة التالية:

1. **تطبيق Migration الجديد** - تشغيل الـ migration لإضافة الفهارس
2. **تفعيل المراقبة** - تشغيل نظام المراقبة والمراقبة المستمرة
3. **إعداد النسخ الاحتياطية** - تفعيل النسخ الاحتياطية التلقائية
4. **تدريب الفريق** - تدريب فريق التطوير على استخدام النظام
5. **مراجعة دورية** - مراجعة الأداء أسبوعياً وتحسين النظام

---

**📞 للدعم والاستفسارات:** tech@saler.com  
**📚 للمزيد من المعلومات:** https://docs.saler.com/database-optimization