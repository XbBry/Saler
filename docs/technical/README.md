# التوثيق التقني - مشروع Saler

## نظرة عامة عن المشروع

مشروع Saler هو منصة تجارة إلكترونية متقدمة تهدف إلى توفير حلول شاملة لإدارة المتاجر الإلكترونية والمبيعات. تم تصميم النظام ليكون قابل للتوسع ومرناً لتلبية احتياجات الشركات من جميع الأحجام.

### المميزات الرئيسية

- **إدارة المنتجات**: نظام متقدم لإدارة الفئات والخصائص
- **إدارة الطلبات**: تتبع وإدارة الطلبات من البداية للنهاية
- **تكامل مع منصات خارجية**: دعم Shopify وMeta Ads
- **نظام تحليلي متقدم**: تقارير ولوحات معلومات تفاعلية
- **واجهة برمجية شاملة**: API موثقة بالكامل
- **أمان عالي**: معايير أمان متقدمة وحماية البيانات

## البنية التقنية

### التقنيات المستخدمة

#### Backend
- **Node.js** - خادم التطبيق الأساسي
- **Express.js** - إطار عمل الخادم
- **PostgreSQL** - قاعدة البيانات الرئيسية
- **Redis** - تخزين مؤقت وقواعد بيانات
- **Socket.io** - الاتصال الفوري

#### Frontend
- **React.js** - مكتبة واجهة المستخدم
- **Next.js** - إطار عمل React
- **TypeScript** - لغة البرمجة المطورة
- **Tailwind CSS** - إطار عمل CSS
- **Redux Toolkit** - إدارة الحالة

#### DevOps & Infrastructure
- **Docker** - حاويات التطبيقات
- **Kubernetes** - إدارة الحاويات
- **AWS Cloud** - الخدمات السحابية
- **NGINX** - خادم الويب العكسي
- **GitHub Actions** - CI/CD

### هيكل المشروع

```
saler/
├── backend/                 # خادم التطبيق
│   ├── src/
│   │   ├── controllers/     # وحدات التحكم
│   │   ├── models/         # نماذج البيانات
│   │   ├── routes/         # مسارات API
│   │   ├── middleware/     # البرمجيات الوسطية
│   │   ├── services/       # خدمات العمل
│   │   └── utils/          # أدوات مساعدة
├── frontend/               # واجهة المستخدم
│   ├── src/
│   │   ├── components/     # المكونات
│   │   ├── pages/          # الصفحات
│   │   ├── hooks/          # React Hooks
│   │   ├── store/          # إدارة الحالة
│   │   └── utils/          # أدوات مساعدة
├── docs/                   # التوثيق
│   └── technical/          # التوثيق التقني
└── scripts/               # سكريبتات التشغيل
```

## مخططات النظام

### مخطط المعمارية العامة

```mermaid
graph TB
    subgraph "Frontend Layer"
        Web[React Web App]
        Mobile[Mobile App]
        Admin[Admin Dashboard]
    end
    
    subgraph "API Gateway"
        Gateway[API Gateway]
        Auth[Authentication Service]
    end
    
    subgraph "Application Layer"
        User[User Service]
        Product[Product Service]
        Order[Order Service]
        Payment[Payment Service]
    end
    
    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL)]
        Redis[(Redis Cache)]
        FileStorage[File Storage]
    end
    
    subgraph "External Services"
        Shopify[Shopify API]
        MetaAds[Meta Ads API]
        Email[Email Service]
        SMS[SMS Service]
    end
    
    Web --> Gateway
    Mobile --> Gateway
    Admin --> Gateway
    
    Gateway --> Auth
    Gateway --> User
    Gateway --> Product
    Gateway --> Order
    Gateway --> Payment
    
    User --> PostgreSQL
    Product --> PostgreSQL
    Order --> PostgreSQL
    
    User --> Redis
    Product --> Redis
    
    Order --> FileStorage
    
    Product --> Shopify
    Payment --> MetaAds
    
    User --> Email
    Order --> SMS
```

### مخطط قاعدة البيانات

```mermaid
erDiagram
    USERS {
        id UUID PK
        email VARCHAR
        password_hash VARCHAR
        role VARCHAR
        created_at TIMESTAMP
        updated_at TIMESTAMP
    }
    
    STORES {
        id UUID PK
        name VARCHAR
        domain VARCHAR
        owner_id UUID FK
        settings JSON
        created_at TIMESTAMP
        updated_at TIMESTAMP
    }
    
    PRODUCTS {
        id UUID PK
        store_id UUID FK
        title VARCHAR
        description TEXT
        price DECIMAL
        category_id UUID FK
        status VARCHAR
        created_at TIMESTAMP
        updated_at TIMESTAMP
    }
    
    CATEGORIES {
        id UUID PK
        store_id UUID FK
        name VARCHAR
        parent_id UUID FK
        created_at TIMESTAMP
        updated_at TIMESTAMP
    }
    
    ORDERS {
        id UUID PK
        store_id UUID FK
        customer_id UUID FK
        total_amount DECIMAL
        status VARCHAR
        created_at TIMESTAMP
        updated_at TIMESTAMP
    }
    
    ORDER_ITEMS {
        id UUID PK
        order_id UUID FK
        product_id UUID FK
        quantity INTEGER
        price DECIMAL
    }
    
    USERS ||--o{ STORES : owns
    STORES ||--o{ PRODUCTS : contains
    STORES ||--o{ CATEGORIES : has
    STORES ||--o{ ORDERS : receives
    USERS ||--o{ ORDERS : places
    ORDERS ||--o{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : included_in
```

## طرق التشغيل والتطوير

### متطلبات النظام

- **Node.js**: إصدار 18.0.0 أو أحدث
- **PostgreSQL**: إصدار 14.0 أو أحدث
- **Redis**: إصدار 6.0 أو أحدث
- **Docker**: إصدار 20.0 أو أحدث
- **npm**: إصدار 8.0 أو أحدث

### خطوات التشغيل

#### 1. الاستنساخ والتثبيت

```bash
# استنساخ المشروع
git clone https://github.com/company/saler.git
cd saler

# تثبيت التبعيات
npm install

# نسخ ملف البيئة
cp .env.example .env
```

#### 2. إعداد قاعدة البيانات

```bash
# تشغيل قاعدة البيانات مع Docker
docker-compose up -d postgres redis

# تشغيل migrations
npm run migrate

# إضافة بيانات اختبار
npm run seed
```

#### 3. تشغيل الخادم

```bash
# تشغيل البيئة التطويرية
npm run dev

# أو تشغيل البيئة الإنتاجية
npm start
```

#### 4. الوصول للواجهة

- **الواجهة الأمامية**: http://localhost:3000
- **لوحة الإدارة**: http://localhost:3000/admin
- **API Documentation**: http://localhost:3000/api/docs

### إعداد بيئة التطوير

#### المتغيرات البيئية

```bash
# ملف .env
NODE_ENV=development
PORT=3000

# قاعدة البيانات
DATABASE_URL=postgresql://username:password@localhost:5432/saler_db
REDIS_URL=redis://localhost:6379

# الأمان
JWT_SECRET=your-jwt-secret-key
ENCRYPTION_KEY=your-encryption-key

# الخدمات الخارجية
SHOPIFY_API_KEY=your-shopify-key
SHOPIFY_API_SECRET=your-shopify-secret
META_ACCESS_TOKEN=your-meta-token

# البريد الإلكتروني
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### أدوات التطوير

```bash
# تشغيل الاختبارات
npm test

# فحص جودة الكود
npm run lint

# إصلاح مشاكل التنسيق
npm run format

# بناء المشروع
npm run build
```

### متغيرات البيئة المطلوبة

| المتغير | الوصف | مطلوب |
|---------|-------|--------|
| `NODE_ENV` | بيئة التشغيل | نعم |
| `PORT` | منفذ الخادم | نعم |
| `DATABASE_URL` | رابط قاعدة البيانات | نعم |
| `REDIS_URL` | رابط Redis | نعم |
| `JWT_SECRET` | مفتاح JWT | نعم |
| `ENCRYPTION_KEY` | مفتاح التشفير | نعم |

## روابط مهمة

- [توثيق API](./api/)
- [مخطط قاعدة البيانات](./database/)
- [معمارية النظام](./architecture/)
- [دليل التطوير](./development/)
- [تحسين الأداء](./performance/)
- [دليل الأمان](./security/)
- [التكاملات](./integrations/)
- [حل المشاكل](./troubleshooting/)

## المساهمة

إذا كنت تريد المساهمة في المشروع، يرجى قراءة [دليل المساهمة](./development/contributing.md) أولاً.

## الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

---

**آخر تحديث**: 2 نوفمبر 2025  
**إصدار المشروع**: 1.0.0