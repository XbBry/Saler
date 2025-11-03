# دليل المساهمة - مشروع Saler

## نظرة عامة

مرحباً بك في مشروع Saler! هذا الدليل يوضح كيفية المساهمة في تطوير المشروع من خلال اتباع أفضل الممارسات والضوابط المطلوبة.

### قيم المشروع

- **الجودة**: نهدف لجودة عالية في كل جانب من جوانب المشروع
- **الشفافية**: كود مفتوح وواضح مع توثيق شامل
- **التعاون**: عمل جماعي فعال ومفيد
- **الابتكار**: البحث عن حلول إبداعية وفعالة
- **المسؤولية**: التزام بالمعايير الأخلاقية والأمنية

## طرق المساهمة

### 1. تطوير الكود
- إضافة ميزات جديدة
- إصلاح الأخطاء (Bugs)
- تحسين الأداء
- إعادة هيكلة الكود

### 2. التوثيق
- تحسين التوثيق الموجود
- إضافة أمثلة جديدة
- إنشاء أدلة استخدام
- ترجمة التوثيق

### 3. الاختبار
- كتابة اختبارات جديدة
- تحسين اختبارات موجودة
- اختبار الميزات الجديدة
- اختبار التكامل

### 4. مراجعة الكود
- مراجعة Pull Requests
- اقتراح تحسينات
- التحقق من الجودة
- ضمان اتباع المعايير

## البدء

### 1. Fork المستودع
```bash
# Fork المستودع من GitHub
# ثم استنساخ نسختك
git clone https://github.com/YOUR_USERNAME/saler.git
cd saler

# إضافة remote للمستودع الأصلي
git remote add upstream https://github.com/company/saler.git
```

### 2. إعداد بيئة التطوير
```bash
# اتباع دليل الإعداد
# https://docs.saler.com/technical/development/setup

# إنشاء branch جديد للعمل
git checkout -b feature/your-feature-name
```

### 3. اتباع Git Flow
```bash
# branches أساسية
main        # الكود الإنتاجي
develop     # تطوير الميزات
feature/*   # ميزات جديدة
fix/*       # إصلاحات سريعة
hotfix/*    # إصلاحات عاجلة
release/*   # إصدارات جديدة
```

## معايير الكود

### 1. Style Guide

#### JavaScript/TypeScript
```javascript
// استخدام const/let بدلاً من var
const API_BASE_URL = 'https://api.saler.com';
let userCount = 0;

// تسمية واضحة للوظائف
function calculateTotalPrice(items) {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

// استخدام async/await بدلاً من Promises العادية
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    const userData = await response.json();
    return userData;
  } catch (error) {
    logger.error('Failed to fetch user data:', error);
    throw new Error('User not found');
  }
}

// Docstrings للوظائف المعقدة
/**
 * يحسب إجمالي الطلب مع الضرائب والرسوم
 * @param {Array} items - قائمة المنتجات
 * @param {Object} shipping - بيانات الشحن
 * @param {string} taxRate - نسبة الضريبة
 * @returns {Object} تفاصيل الإجمالي
 */
function calculateOrderTotal(items, shipping, taxRate) {
  const subtotal = calculateSubtotal(items);
  const shippingCost = shipping.cost || 0;
  const taxAmount = (subtotal + shippingCost) * (parseFloat(taxRate) / 100);
  
  return {
    subtotal,
    shippingCost,
    taxAmount,
    total: subtotal + shippingCost + taxAmount
  };
}
```

#### React Components
```jsx
// استخدام Functional Components
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ProductCard = ({ 
  product, 
  onAddToCart, 
  className = '',
  showDescription = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Effect logic here
  }, [product.id]);

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      await onAddToCart(product);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`product-card ${className}`}>
      <img 
        src={product.imageUrl} 
        alt={product.title}
        className="product-image"
      />
      
      <div className="product-info">
        <h3 className="product-title">{product.title}</h3>
        
        {showDescription && (
          <p className="product-description">
            {product.description}
          </p>
        )}
        
        <div className="product-price">
          {product.currency} {product.price.toFixed(2)}
        </div>
        
        <button 
          onClick={handleAddToCart}
          disabled={isLoading || !product.inStock}
          className="add-to-cart-btn"
        >
          {isLoading ? 'جاري الإضافة...' : 'أضف للسلة'}
        </button>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    price: PropTypes.number.isRequired,
    currency: PropTypes.string,
    imageUrl: PropTypes.string.isRequired,
    inStock: PropTypes.bool
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired,
  className: PropTypes.string,
  showDescription: PropTypes.bool
};

export default ProductCard;
```

#### CSS/Styling
```css
/* استخدام CSS Grid و Flexbox */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

/* Mobile First Approach */
.product-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0.5rem;
  }
  
  .product-card {
    border-radius: 0;
  }
}

/* استخدام CSS Variables */
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --info-color: #17a2b8;
  --light-color: #f8f9fa;
  --dark-color: #343a40;
  
  --border-radius: 4px;
  --box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  --transition: all 0.2s ease;
}
```

### 2. نمط التسمية

#### Functions and Variables
```javascript
// camelCase للوظائف والمتغيرات
const getUserById = (userId) => { /* ... */ };
const isUserAuthenticated = true;
const userCartItems = [];

// PascalCase للclasses والcomponents
class UserService { /* ... */ }
const UserProfile = () => { /* ... */ };

// UPPER_CASE للثوابت
const API_BASE_URL = 'https://api.saler.com';
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_PAGE_SIZE = 20;

// snake_case للملفات ومجلدات
user_service.js
get_user_data.js
product_categories/

// kebab-case للurls والattributes
<product-details product-id="123" />
/api/products/search
```

#### Database Naming
```sql
-- snake_case للجداول والأعمدة
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email_address VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- descriptive foreign key names
ALTER TABLE orders ADD CONSTRAINT fk_orders_customer 
    FOREIGN KEY (customer_id) REFERENCES customers(id);

-- indexes with descriptive names
CREATE INDEX idx_orders_customer_status 
    ON orders(customer_id, status);
```

### 3. هيكل المشروع

#### Backend Structure
```
backend/
├── src/
│   ├── controllers/     # منطق HTTP
│   ├── services/        # منطق العمل
│   ├── models/          # نماذج البيانات
│   ├── routes/          # تعريف المسارات
│   ├── middleware/      # برمجيات وسطية
│   ├── utils/           # أدوات مساعدة
│   ├── database/        # إعدادات قاعدة البيانات
│   ├── config/          # ملفات الإعداد
│   └── tests/           # اختبارات
├── migrations/          # قاعدة البيانات migrations
├── seeds/              # بيانات تجريبية
├── docs/               # توثيق خاص بـ backend
├── scripts/            # سكريبتات التشغيل
└── tests/              # اختبارات التكامل
```

#### Frontend Structure
```
frontend/
├── src/
│   ├── components/      # مكونات قابلة للإعادة
│   ├── pages/          # صفحات التطبيق
│   ├── hooks/          # React hooks مخصصة
│   ├── store/          # إدارة الحالة (Redux)
│   ├── services/       # خدمات API
│   ├── utils/          # أدوات مساعدة
│   ├── styles/         # ملفات CSS
│   ├── types/          # TypeScript types
│   ├── assets/         # صور وملفات ثابتة
│   └── tests/          # اختبارات
├── public/             # ملفات عامة
├── docs/              # توثيق خاص بـ frontend
└── cypress/           # اختبارات e2e
```

## عملية التطوير

### 1. إنشاء Feature Branch
```bash
# تحديث fork
git fetch upstream
git checkout main
git pull upstream main

# إنشاء branch جديد
git checkout -b feature/product-search-implementation

# أو للـ fixes
git checkout -b fix/cart-total-calculation
```

### 2. كتابة الكود
```bash
# اتباع style guide
npm run lint          # فحص الأخطاء
npm run format        # تنسيق الكود
npm run type-check    # فحص الأنواع
```

### 3. كتابة الاختبارات
```javascript
// unit test example
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = await userService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.id).toBeDefined();
    });

    it('should throw error for invalid email', async () => {
      const invalidData = {
        email: 'invalid-email',
        firstName: 'Test',
        lastName: 'User'
      };

      await expect(userService.createUser(invalidData))
        .rejects
        .toThrow('Invalid email format');
    });
  });
});
```

### 4. اختبار محلي
```bash
# تشغيل جميع الاختبارات
npm test

# اختبار محدد
npm test -- --testNamePattern="UserService"

# اختبار التكامل
npm run test:integration

# اختبار e2e
npm run test:e2e

# فحص التغطية
npm run test:coverage
```

## Git Commits

### نمط Conventional Commits
```bash
# feat: ميزة جديدة
git commit -m "feat: add product search functionality"

# fix: إصلاح خطأ
git commit -m "fix: cart total calculation error"

# docs: توثيق
git commit -m "docs: update API documentation"

# style: تنسيق الكود
git commit -m "style: format code with prettier"

# refactor: إعادة هيكلة
git commit -m "refactor: extract user validation logic"

# perf: تحسين الأداء
git commit -m "perf: optimize database queries"

# test: اختبارات
git commit -m "test: add unit tests for OrderService"

# chore: مهام صيانة
git commit -m "chore: update dependencies"
```

### مفاتيح Commits
- `feat`: ميزة جديدة
- `fix`: إصلاح خطأ
- `docs`: توثيق
- `style`: تنسيق الكود (لا يؤثر على المنطق)
- `refactor`: إعادة هيكلة الكود
- `perf`: تحسين الأداء
- `test`: إضافة أو تعديل اختبارات
- `ci`: تغييرات CI/CD
- `build`: تغييرات build
- `revert`: التراجع عن commit سابق

## Pull Requests

### 1. إنشاء PR
```bash
# رفع التحديثات
git add .
git commit -m "feat: add advanced search filters"
git push origin feature/advanced-search-filters
```

### 2. PR Template
```markdown
<!-- .github/pull_request_template.md -->

## وصف التغيير

وصف مختصر وواضح للتغييرات المنجزة.

## نوع التغيير

- [ ] إصلاح خطأ (bug fix)
- [ ] ميزة جديدة (feature)
- [ ] تحسين الأداء (performance)
- [ ] إعادة هيكلة (refactoring)
- [ ] توثيق (documentation)
- [ ] اختبار (test)

## التحقق

- [ ] تم اختبار الكود محلياً
- [ ] جميع الاختبارات تمر بنجاح
- [ ] تم فحص الكود بـ linting
- [ ] التوثيق محدث إذا لزم الأمر

## ملاحظات إضافية

أي معلومات إضافية مهمة للمراجعة.

## صور مرفقة (اختياري)

إرفاق صور أو GIF يوضح الوظيفة الجديدة.
```

### 3. المراجعة

#### للـ Reviewer
```markdown
<!-- مراجعة نموذجية -->

## مراجعة الكود

### جودة الكود
- [ ] الكود واضح ومفهوم
- [ ] اتباع style guide
- [ ] معالجة الأخطاء مناسبة
- [ ] أمان الكود مضمون

### الوظائف
- [ ] الميزة تعمل كما هو مطلوب
- [ ] حالات الحافة معالجة
- [ ] الأداء مقبول

### الاختبارات
- [ ] اختبارات شاملة
- [ ] تغطية كافية
- [ ] اختبارات صحيحة

### التوثيق
- [ ] توثيق واضح
- [ ] أمثلة متوفرة
- [ ] Docstrings مناسبة

## ملاحظات
- [التعليقات والملاحظات]

## القرار
- [ ] موافق على الدمج
- [ ] يتطلب تعديلات
- [ ] يحتاج نقاش إضافي
```

## معايير المراجعة

### 1. Functional Requirements
- هل يحقق الكود المتطلبات الوظيفية؟
- هل تم اختبار جميع السيناريوهات؟
- هل التعامل مع الأخطاء مناسب؟

### 2. Code Quality
- هل الكود واضح ومقروء؟
- هل اتباع المعايير المحددة؟
- هل معالجة الذاكرة مناسبة؟
- هل تجنب تكرار الكود؟

### 3. Security
- هل التحقق من المدخلات مناسب؟
- هل حماية من SQL injection؟
- هل تشفير البيانات الحساسة؟
- هل معالجة البيانات الشخصية آمنة؟

### 4. Performance
- هل الأداء مقبول؟
- هل استعلامات قاعدة البيانات محسنة؟
- هل استخدام الذاكرة مناسب؟
- هل تحسين التخزين المؤقت؟

### 5. Testing
- هل الاختبارات شاملة؟
- هل التغطية كافية (>80%)؟
- هل اختبار حالات الحافة؟
- هل اختبارات التكامل؟

## إرشادات خاصة

### 1. الأمان
```javascript
// تحقق من المدخلات
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// تشفير كلمات المرور
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(password, 12);

// تحقق من الصلاحيات
const checkPermission = (user, resource, action) => {
  return user.permissions.includes(`${resource}:${action}`);
};
```

### 2. Performance
```javascript
// استخدام Indexing في قاعدة البيانات
CREATE INDEX idx_products_store_status ON products(store_id, status);

// تخزين مؤقت للاستعلامات
const getCachedProducts = async (storeId) => {
  const cached = await redis.get(`products:${storeId}`);
  if (cached) return JSON.parse(cached);
  
  const products = await db.products.findMany({ store_id: storeId });
  await redis.setex(`products:${storeId}`, 300, JSON.stringify(products));
  return products;
};

// استخدام Pagination
const getPaginatedResults = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  return await db.products.findMany({
    take: limit,
    skip: offset
  });
};
```

### 3. Accessibility
```jsx
// استخدام semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">الرئيسية</a></li>
    <li><a href="/products">المنتجات</a></li>
    <li><a href="/cart">السلة</a></li>
  </ul>
</nav>

// إضافة ARIA labels
<button 
  aria-label="إضافة إلى السلة"
  aria-describedby="cart-addition"
>
  أضف للسلة
</button>
<div id="cart-addition" className="sr-only">
  سيتم إضافة المنتج لسلة التسوق
</div>

// دعم keyboard navigation
<div 
  role="button" 
  tabIndex="0"
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  onClick={handleClick}
>
  قابل للنقر
</div>
```

## Continuous Integration

### 1. GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linting
      run: npm run lint
      
    - name: Run tests
      run: npm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
        REDIS_URL: redis://localhost:6379
        
    - name: Build application
      run: npm run build
```

### 2. Code Quality Checks
```yaml
# .github/workflows/code-quality.yml
name: Code Quality

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  code-quality:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run ESLint
      uses: github/super-linter@v4
      env:
        DEFAULT_BRANCH: main
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        
    - name: Run SonarCloud Scan
      uses: SonarSource/sonarcloud-github-action@master
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

## مشاكل شائعة وحلولها

### 1. Conflicts في Git
```bash
# حل conflicts
git status
# حل Conflicts يدوياً
git add .
git commit -m "resolve merge conflicts"
git push origin feature-branch
```

### 2. مشاكل الاختبارات
```bash
# إعادة تعيين قاعدة البيانات للاختبارات
npm run test:reset-db

# تشغيل اختبار محدد
npm test -- --testNamePattern="UserService"

# فحص تغطية الاختبارات
npm run test:coverage
```

### 3. مشاكل Performance
```bash
# profiling الكود
npm run profile

# فحص استعلامات قاعدة البيانات
npm run db:explain

# تحليل استخدام الذاكرة
npm run analyze:memory
```

## الموارد والمراجع

### 1. التوثيق
- [API Documentation](../api/)
- [Database Schema](../database/)
- [Architecture Overview](../architecture/)
- [Security Guidelines](../security/)

### 2. أدوات مفيدة
- [VS Code Extensions](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Git Hooks](../scripts/pre-commit)
- [Testing Tools](../testing/)

### 3. المجتمعات
- [GitHub Discussions](https://github.com/company/saler/discussions)
- [Discord Server](https://discord.gg/saler)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/saler)

## خلاصة

المساهمة في مشروع Saler تتطلب التزاماً بالمعايير العالية للجودة والأمان. نحن نقدر كل مساهمة ونعمل لضمان بيئة تطوير محفزة ومفيدة للجميع.

لا تتردد في طرح الأسئلة أو طلب المساعدة من خلال القنوات المتاحة. نرحب بجميع المساهمات ونتطلع للعمل معك!

---

**آخر تحديث**: 2 نوفمبر 2025