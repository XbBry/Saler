# مكون Button (زر)

مكون زر شامل ومتوافق مع shadcn/ui مع دعم كامل للـ RTL والنص العربي.

## الميزات

✅ **جميع المتغيرات**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`  
✅ **جميع الأحجام**: `sm`, `default`, `lg`, `icon`  
✅ **حالة التحميل**: مع أيقونة دوران ونص مخصص  
✅ **حالة المعطّل**: دعم كامل للحالات المعطلة  
✅ **دعم الأيقونات**: أيقونات يسار ويمين  
✅ **دعم RTL**: نص عربي واتجاه من اليمين لليسار  
✅ **عرض كامل**: خيار للعرض بكامل العرض  
✅ **إمكانية الوصول**: focus states و ARIA attributes  
✅ **TypeScript**: types قوية وآمنة  

## الاستخدام

### أمثلة أساسية

```tsx
import { Button } from '@/components/ui/button'

// زر أساسي
<Button>زر أساسي</Button>

// زر خطير (حذف)
<Button variant="destructive">حذف</Button>

// زر مخطط
<Button variant="outline">خيار</Button>

// زر ثانوي
<Button variant="secondary">ثانوي</Button>

// زر شفاف
<Button variant="ghost">نص فقط</Button>

// رابط
<Button variant="link">رابط</Button>
```

### أحجام مختلفة

```tsx
<Button size="sm">صغير</Button>
<Button size="default">متوسط</Button>
<Button size="lg">كبير</Button>
<Button size="icon"><Settings className="h-4 w-4" /></Button>
```

### مع الأيقونات

```tsx
import { Home, ArrowRight } from 'lucide-react'

<Button leftIcon={<Home className="h-4 w-4" />}>
  الرئيسية
</Button>

<Button rightIcon={<ArrowRight className="h-4 w-4" />}>
  التالي
</Button>

<Button 
  leftIcon={<Download className="h-4 w-4" />}
  rightIcon={<Heart className="h-4 w-4" />}
>
  تحميل مع إعجاب
</Button>
```

### حالة التحميل

```tsx
<Button loading loadingText="جاري التحميل...">
  حفظ
</Button>

// أو مع دالة
<Button 
  loading={isLoading}
  loadingText="جاري المعالجة..."
  onClick={handleSave}
>
  حفظ البيانات
</Button>
```

### عرض كامل

```tsx
<Button fullWidth>
  زر بعرض كامل
</Button>
```

### دعم RTL والنص العربي

```tsx
// النص العربي يكتشف تلقائياً
<Button>زر عربي</Button>

// أو إعداد RTL يدوياً
<div dir="rtl">
  <Button>زر بالعربية</Button>
</div>
```

## Props

| الخاصية | النوع | الافتراضي | الوصف |
|---------|-------|-----------|--------|
| `variant` | `ButtonVariant` | `'default'` | نمط الزر |
| `size` | `ButtonSize` | `'default'` | حجم الزر |
| `asChild` | `boolean` | `false` | استخدام Radix Slot |
| `loading` | `boolean` | `false` | حالة التحميل |
| `loadingText` | `string` | - | نص أثناء التحميل |
| `leftIcon` | `ReactNode` | - | أيقونة يسار |
| `rightIcon` | `ReactNode` | - | أيقونة يمين |
| `fullWidth` | `boolean` | `false` | عرض كامل |
| `disabled` | `boolean` | `false` | حالة معطلة |
| `className` | `string` | - | classes إضافية |
| `children` | `ReactNode` | - | محتوى الزر |

## أنواع البيانات

```tsx
type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
type ButtonSize = "default" | "sm" | "lg" | "icon"
```

## الأنماط (Variants)

### Default
زر أساسي بألوان الثيم الرئيسية.

### Destructive  
للعمليات الخطيرة مثل الحذف.

### Outline
زر بمخطط حدودي وشفافية في الخلفية.

### Secondary
زر ثانوي بلون فاتح ونص داكن.

### Ghost
زر شفاف بالكامل عند الـ hover فقط.

### Link
زر نصي مع خط سفلي.

## الأحجام

### sm (صغير)
- الارتفاع: `h-9` (36px)
- المسافات: `px-3`

### default (متوسط)  
- الارتفاع: `h-10` (40px)
- المسافات: `px-4 py-2`

### lg (كبير)
- الارتفاع: `h-11` (44px)
- المسافات: `px-8`

### icon (أيقونة)
- العرض والارتفاع: `h-10 w-10`
- مربع مربع مثالي للأيقونات

## إعدادات RTL

المكون يدعم النص العربي والاتجاه من اليمين لليسار تلقائياً:

- **اتجاه النص**: يتم كشف النص العربي تلقائياً وتطبيق `text-right`
- **اتجاه الأيقونات**: تتم عكس الأيقونات حسب الاتجاه
- **الحدود والهوامش**: تتكيف مع اتجاه RTL

## إمكانية الوصول (Accessibility)

✅ **Focus States**: border واضح عند التركيز  
✅ **Disabled States**: cursor و opacity مناسبة  
✅ **Loading States**: تكبير الأيقونة للحركة  
✅ **ARIA Labels**: تلقائية للمكونات icon  
✅ **Keyboard Navigation**: دعم كامل  

## أمثلة متقدمة

### زر متعدد الحالات

```tsx
const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle')

<Button 
  loading={state === 'loading'}
  loadingText="جاري المعالجة..."
  disabled={state !== 'idle'}
  onClick={handleAction}
>
  {state === 'idle' && 'ابدأ'}
  {state === 'loading' && 'جاري المعالجة...'}
  {state === 'success' && 'تمت بنجاح!'}
</Button>
```

### في نماذج

```tsx
<form onSubmit={handleSubmit}>
  <input {...register('email')} />
  <Button type="submit">إرسال</Button>
</form>

<div className="flex gap-2">
  <Button type="button" variant="outline">إلغاء</Button>
  <Button type="submit" loading={isLoading}>حفظ</Button>
</div>
```

## التثبيت

تأكد من وجود هذه المكتبات في `package.json`:

```json
{
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "@radix-ui/react-slot": "^1.0.2",
    "lucide-react": "^0.302.0",
    "clsx": "^2.0.0"
  }
}
```

## الملفات

- `src/components/ui/button.tsx` - المكون الرئيسي
- `src/components/ui/button-examples.tsx` - أمثلة شاملة
- `src/lib/utils.ts` - دالة مساعدة `cn()`
- `tailwind.config.js` - إعدادات الثيم

## روابط مفيدة

- [shadcn/ui Button](https://ui.shadcn.com/docs/components/button)
- [Radix UI Slot](https://www.radix-ui.com/docs/primitives/utilities/slot)
- [Class Variance Authority](https://cva.style/docs)