# Saler Frontend - منصة إدارة المبيعات

منصة شاملة لإدارة المبيعات مبنية بـ Next.js 14 مع دعم كامل للغة العربية.

## المميزات

- 🎯 **إدارة العملاء المحتملين**: إنشاء وتتبع وإدارة العملاء المحتملين
- 📋 **دليل المبيعات**: إنشاء وإدارة دليل المبيعات والأتمتة
- 💬 **الرسائل والمحادثات**: نظام رسائل متكامل
- 📊 **التحليلات والتقارير**: إحصائيات شاملة ومفصلة
- 🌐 **دعم متعدد اللغات**: العربية والإنجليزية مع RTL
- 🎨 **تصميم متجاوب**: Tailwind CSS مع مكونات UI حديثة
- ⚡ **أداء محسّن**: React Query للـ caching وإدارة البيانات
- 🔒 **مصادقة آمنة**: نظام مصادقة متقدم مع JWT
- 📱 **جاهز للهواتف**: تصميم متجاوب بالكامل

## التقنيات المستخدمة

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Internationalization**: next-intl
- **UI Components**: Radix UI + Custom Components
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod validation

## هيكل المشروع

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Localized routes
│   │   ├── layout.tsx     # Locale layout
│   │   └── page.tsx       # Home page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── loading.tsx        # Loading component
│   ├── error.tsx          # Error boundary
│   └── not-found.tsx      # 404 page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── leads/            # Leads management components
│   └── playbooks/        # Playbooks components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
│   ├── auth-store.ts     # Zustand auth store
│   ├── auth-context.tsx  # Auth context provider
│   ├── api.ts           # API client
│   ├── utils.ts         # Utility functions
│   └── messages.ts      # Translation messages
├── types/               # TypeScript type definitions
└── middleware.ts        # Next.js middleware
```

## الإعداد والتشغيل

### متطلبات النظام

- Node.js 18.0.0 أو أحدث
- npm 9.0.0 أو أحدث

### تثبيت المتطلبات

```bash
cd saler/frontend
npm install
```

### إعداد متغيرات البيئة

أنشئ ملف `.env.local` وأضف المتغيرات التالية:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# CDN (Production)
NEXT_PUBLIC_CDN_URL=https://cdn.saler.com

# Development
NODE_ENV=development
```

### تشغيل المشروع

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Linting
npm run lint

# Type checking
npm run type-check

# Testing
npm test
```

## المعمارية والنمط المستخدم

### App Router Structure
يستخدم المشروع Next.js 14 App Router مع دعم كامل للـ server-side rendering والـ static generation.

### Internationalization
- **الترجمة**: next-intl للترجمة
- **RTL Support**: دعم كامل للكتابة من اليمين لليسار
- **Locale Detection**: كشف تلقائي للغة المفضلة

### State Management
- **Global State**: Zustand لإدارة الحالة العامة
- **Server State**: React Query لإدارة البيانات من الخادم
- **Form State**: React Hook Form للنماذج

### Authentication
- **JWT Tokens**: نظام مصادقة بـ JWT
- **Automatic Refresh**: تجديد تلقائي للرموز
- **Protected Routes**: حماية الصفحات الخاصة

## API Integration

### Authentication Endpoints
- `POST /auth/login` - تسجيل الدخول
- `POST /auth/logout` - تسجيل الخروج  
- `POST /auth/refresh` - تجديد الرمز
- `GET /auth/me` - معلومات المستخدم الحالي

### Leads Management
- `GET /leads` - قائمة العملاء المحتملين
- `POST /leads` - إنشاء عميل محتمل جديد
- `GET /leads/:id` - تفاصيل عميل محتمل
- `PUT /leads/:id` - تحديث بيانات العميل
- `DELETE /leads/:id` - حذف العميل

### Playbooks
- `GET /playbooks` - قائمة دليل المبيعات
- `POST /playbooks` - إنشاء دليل جديد
- `GET /playbooks/:id` - تفاصيل الدليل
- `PUT /playbooks/:id` - تحديث الدليل

### Analytics
- `GET /analytics/dashboard` - إحصائيات لوحة التحكم
- `GET /analytics/leads` - إحصائيات العملاء المحتملين

## المكونات الأساسية

### Layout System
- **Root Layout**: Layout الجذر للتطبيق
- **Locale Layout**: Layout مخصص لكل لغة
- **Page Components**: مكونات الصفحات

### Auth System
- **AuthStore**: Zustand store للمصادقة
- **AuthProvider**: Context provider للحالة العامة
- **Protected Routes**: حماية الصفحات الحساسة

### UI Components
- **Button**: أزرار بأشكال مختلفة
- **Input**: حقول الإدخال
- **Card**: بطاقات المحتوى
- **Modal**: نوافذ منبثقة
- **Toast**: إشعارات

## الخطوط والتصميم

### الخطوط
- **العربية**: Inter مع دعم العربية
- **الإنجليزية**: Inter
- **تحميل**: Google Fonts

### نظام الألوان
```css
--primary: #3b82f6    /* أزرق أساسي */
--secondary: #64748b  /* رمادي ثانوي */
--accent: #f59e0b     /* برتقالي مميز */
--success: #10b981    /* أخضر نجاح */
--warning: #f59e0b    /* أصفر تحذير */
--danger: #ef4444     /* أحمر خطأ */
```

## الأداء والتحسين

### تحسين الصور
- Next.js Image Optimization
- WebP و AVIF formats
- Lazy loading

### كود التقسيم
- Dynamic imports
- Route-based splitting
- Vendor bundles

### التخزين المؤقت
- React Query caching
- Static generation
- CDN assets

## الاختبار

```bash
# تشغيل جميع الاختبارات
npm test

# تشغيل في وضع المراقبة
npm run test:watch

# تقرير التغطية
npm run test:coverage
```

## النشر

### Vercel (مُوصى به)
```bash
npm install -g vercel
vercel --prod
```

### Docker
```bash
docker build -t saler-frontend .
docker run -p 3000:3000 saler-frontend
```

### Netlify
```bash
npm run build
# رفع مجلد .next إلى Netlify
```

## المساهمة

1. Fork المشروع
2. إنشاء branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للـ branch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## الدعم والتواصل

- **الوثائق**: [docs.saler.com](https://docs.saler.com)
- **المساعدة**: [support@saler.com](mailto:support@saler.com)
- **المجتمع**: [Discord](https://discord.gg/saler)

---

**تم التطوير بـ ❤️ لفريق Saler**