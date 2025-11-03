# نظام الاختبارات - Saler Frontend

## نظرة عامة

هذا المستودع يحتوي على نظام شامل للاختبارات للـ Frontend الخاص بمنصة سالير، مع دعم كامل لـ Jest Testing Library والاختبارات المتقدمة.

## الميزات

### 🔧 تقنيات الاختبار
- **Jest 29** - Test Runner
- **Testing Library React 14** - لاختبار المكونات
- **Testing Library Jest DOM** - assertions للـ DOM
- **Testing Library User Event** - محاكاة التفاعلات
- **TypeScript** - دعم كامل للـ types
- **Jest Environment JSDOM** - بيئة متصفح محاكاة

### 📁 بنية الاختبارات
```
tests/
├── setup.ts                    # إعدادات Jest العامة
├── unit/                       # اختبارات الوحدة
│   ├── components/            # اختبارات المكونات
│   │   ├── LeadCard.test.tsx
│   │   ├── PlaybookCard.test.tsx
│   │   └── ...
│   └── ...
├── integration/               # اختبارات التكامل
│   └── pages/                # اختبارات الصفحات
│       └── Dashboard.test.tsx
└── utils/                     # أدوات مساعدة
    └── test-utils.tsx
```

### 🎯 أنواع الاختبارات

#### 1. اختبارات الوحدة (Unit Tests)
- اختبار المكونات الفردية
- اختبار الـ hooks
- اختبار الـ utilities
- اختبار الـ services

#### 2. اختبارات التكامل (Integration Tests)
- اختبار التفاعل بين المكونات
- اختبار الصفحات كاملة
- اختبار الـ routing
- اختبار الـ API integrations

#### 3. اختبارات End-to-End (E2E Tests)
- اختبار العمليات الكاملة
- باستخدام Playwright
- على بيئة متصفح حقيقية

## تشغيل الاختبارات

### تشغيل جميع الاختبارات
```bash
npm test
```

### تشغيل الاختبارات في وضع المراقبة
```bash
npm run test:watch
```

### تشغيل الاختبارات مع تقرير التغطية
```bash
npm run test:coverage
```

### تشغيل اختبارات محددة
```bash
# اختبارات مكون واحد
npm test LeadCard

# اختبارات مجلد معين
npm test -- --testPathPattern=unit/components

# اختبارات ملف معين
npm test -- --testNamePattern="LeadCard Component"
```

### تشغيل اختبارات في CI
```bash
npm run test:ci
```

## إعداد البيئة

### المتطلبات
- Node.js 18+
- npm 9+

### تثبيت Dependencies
```bash
npm install
```

### إعداد الاختبارات
```bash
# نسخ ملف الإعدادات
cp .env.example .env.local

# إعداد متغيرات البيئة
echo "NODE_ENV=test" > .env.test
```

## مكونات الاختبار

### LeadCard Component Tests
```typescript
describe('LeadCard Component', () => {
  it('should render lead information correctly')
  it('should handle click interactions')
  it('should display intelligence metrics')
  it('should show temperature indicators')
  it('should handle compact mode')
})
```

### PlaybookCard Component Tests
```typescript
describe('PlaybookCard Component', () => {
  it('should render playbook data')
  it('should show metrics correctly')
  it('should handle status changes')
  it('should render expandable content')
  it('should handle action buttons')
})
```

### Dashboard Page Tests
```typescript
describe('Dashboard Page', () => {
  it('should render dashboard layout')
  it('should display metric cards')
  it('should handle search and filters')
  it('should show leads list')
  it('should handle real-time updates')
})
```

## أدوات المساعدة

### Test Utilities (`tests/utils/test-utils.tsx`)
- `TestDataGenerator` - مولد بيانات وهمية
- `MockHelpers` - مساعدين للـ mocks
- `TestAssertions` - assertions مخصصة
- `EventSimulators` - محاكاة الأحداث
- `QueryHelpers` - مساعدين للاستعلام

### الاستخدام
```typescript
import { renderWithProviders, TestDataGenerator, EventSimulators } from '../utils/test-utils';

const mockLead = TestDataGenerator.generateLead();
renderWithProviders(<LeadCard lead={mockLead} />);

EventSimulators.click(button);
```

## الإعداد والتكوين

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov'],
  testMatch: ['<rootDir>/tests/**/*.(test|spec).(ts|tsx)'],
};
```

### TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## التغطية (Coverage)

### الأهداف
- **الكود البرمجي**: 80%
- **الدوال**: 80%
- **الفروع**: 80%
- **العبارات**: 80%

### عرض تقرير التغطية
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### عتبات مخصصة
```javascript
coverageThresholds: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  },
  'src/components/': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  }
}
```

## Continuous Integration (CI/CD)

### GitHub Actions
- تشغيل تلقائي عند الـ push و pull request
- اختبارات متعددة المستويات
- تقرير التغطية التلقائي
- إشعارات Slack
- Lighthouse Performance Tests

### المهام في CI
1. **Lint & Type Check** - فحص الكود والأنواع
2. **Unit Tests** - اختبارات الوحدة
3. **Integration Tests** - اختبارات التكامل
4. **E2E Tests** - اختبارات End-to-End
5. **Security Audit** - فحص الأمان
6. **Performance Tests** - اختبارات الأداء
7. **Build & Deploy** - البناء والنشر

## أفضل الممارسات

### كتابة الاختبارات
1. **استخدم describe و it بوضوح**
2. **اختبر السلوك وليس التنفيذ**
3. **استخدم data-testid للعناصر**
4. **اكتب اختبارات سريعة ومستقرة**
5. **استخدم mocks بحذر**

### مثال على الاختبار الجيد
```typescript
describe('LeadCard Component', () => {
  it('should call onClick when card is clicked', () => {
    const mockOnClick = jest.fn();
    render(<LeadCard lead={mockLead} onClick={mockOnClick} />);
    
    fireEvent.click(screen.getByText('أحمد محمد'));
    
    expect(mockOnClick).toHaveBeenCalledWith(mockLead);
  });
});
```

### مثال على الاختبار السيء
```typescript
// ❌ لا تفعل هذا
it('test function', () => {
  const result = component.someMethod();
  expect(result).toBe(true);
});
```

## استكشاف الأخطاء

### مشاكل شائعة

#### 1. خطأ "ReferenceError: window is not defined"
```typescript
// في jest.config.js
testEnvironment: 'jsdom'
```

#### 2. مشاكل في CSS imports
```typescript
// في jest.config.js
moduleNameMapping: {
  '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
}
```

#### 3. مشاكل في الـ TypeScript
```typescript
// في tsconfig.json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### تصحيح الأخطاء
```bash
# تشغيل اختبار واحد بالتفصيل
npm test -- --verbose LeadCard.test.tsx

# تشغيل مع debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# فحص memory leaks
npm test -- --detectLeaks
```

## المساهمة

### إضافة اختبارات جديدة
1. ضع الملف في المجلد المناسب
2. استخدم التسمية `ComponentName.test.tsx`
3. اتبع نفس نمط الاختبارات الموجودة
4. أضف data-testid للعناصر إذا لزم الأمر

### تحديث التغطية
```bash
# التحقق من التغطية
npm run test:coverage

# إضافة tests للخطوط غير المغطاة
open coverage/lcov-report/index.html
```

## الموارد

### التوثيق
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [React Testing Guide](https://reactjs.org/docs/testing-recipes.html)

### أدوات مفيدة
- [Jest Extension for VSCode](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest)
- [Testing Library Queries](https://testing-library.com/docs/queries/about/)

---

**ملاحظة**: جميع الاختبارات مكتوبة بالعربية لدعم فريق التطوير العربي.