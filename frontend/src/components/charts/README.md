# مكونات الرسوم البيانية - Chart Components

مكتبة شاملة من مكونات الرسوم البيانية المبنية باستخدام Recharts و Tailwind CSS مع دعم اللغة العربية (RTL).

## المكونات المتاحة

### 1. ChartWrapper
المكون الأساسي الذي يوفر هيكل مشترك لجميع الرسوم البيانية مع:
- دعم الوضع المظلم والفاتح
- حالات التحميل والأخطاء
- Tooltips بالعربية
- Legend مخصص
- Grid مخصص

```tsx
import { ChartWrapper } from '@/components/charts';

<ChartWrapper
  title="عنوان الرسم البياني"
  description="وصف الرسم البياني"
  loading={false}
  error={null}
  height={300}
>
  {/* محتوى الرسم البياني */}
</ChartWrapper>
```

### 2. LineChart
رسم بياني خطي لعرض الاتجاهات عبر الزمن.

```tsx
import { LineChart, chartColors } from '@/components/charts';

<LineChart
  data={data}
  xAxisKey="date"
  yAxisKeys={["sales", "profit"]}
  yAxisLabels={{
    sales: "المبيعات",
    profit: "الربح"
  }}
  colors={chartColors.warm}
  height={300}
  showGrid={true}
  smooth={true}
/>
```

### 3. BarChart
رسم بياني بالأعمدة للبيانات المقارنة.

```tsx
import { BarChart } from '@/components/charts';

<BarChart
  data={data}
  xAxisKey="category"
  yAxisKey="value"
  orientation="vertical"
  stacked={false}
  colors={chartColors.cool}
  height={300}
/>
```

### 4. PieChart
رسم بياني دائري للبيانات النسبية.

```tsx
import { PieChart } from '@/components/charts';

<PieChart
  data={data}
  dataKey="value"
  nameKey="name"
  colors={chartColors.pastel}
  outerRadius={80}
  innerRadius={0}
  showLegend={true}
  showLabel={true}
/>
```

### 5. DoughnutChart
رسم بياني دونات مع نص في المركز.

```tsx
import { DoughnutChart } from '@/components/charts';

<DoughnutChart
  data={data}
  dataKey="value"
  nameKey="name"
  innerRadius={50}
  outerRadius={80}
  centerText={{
    value: 1250,
    subValue: "إجمالي المبيعات"
  }}
  colors={chartColors.default}
/>
```

### 6. AreaChart
رسم بياني بالمنطقة مع تدرجات لونية.

```tsx
import { AreaChart } from '@/components/charts';

<AreaChart
  data={data}
  xAxisKey="month"
  yAxisKeys={["revenue", "cost"]}
  stacked={false}
  fillOpacity={0.3}
  curveType="monotone"
  showBrush={true}
  height={300}
/>
```

### 7. MetricCard
بطاقة عرض المؤشرات الإحصائية مع الاتجاهات.

```tsx
import { MetricCard } from '@/components/charts';

<MetricCard
  title="إجمالي المبيعات"
  value={125000}
  trend="up"
  trendValue={15.2}
  trendLabel="من الشهر الماضي"
  icon={TrendingUp}
  iconColor="green"
  variant="gradient"
/>
```

## الأنماط والألوان المتاحة

### palettes الألوان
```tsx
import { chartColors } from '@/components/charts';

// ألوان افتراضية
chartColors.default

// ألوان هادئة
chartColors.pastel

// ألوان دافئة
chartColors.warm

// ألوان باردة
chartColors.cool

// ألوان أحادية
chartColors.monochrome
```

## دوال التنسيق المفيدة

### formatNumber
```tsx
import { formatNumber } from '@/components/charts';

formatNumber(1250000); // "1.3M"
formatNumber(1250);    // "1.3K"
formatNumber(1234.56); // "1,234.6"
```

### formatPercentage
```tsx
import { formatPercentage } from '@/components/charts';

formatPercentage(15.2); // "+15.2%"
formatPercentage(-5.8); // "-5.8%"
```

### formatCurrency
```tsx
import { formatCurrency } from '@/components/charts';

formatCurrency(125000); // "١٢٥٬٠٠٠ ر.س"
formatCurrency(125000, 'USD'); // "$125,000.00"
```

## مولدات البيانات التجريبية

### generateTimeSeriesData
```tsx
import { generateTimeSeriesData } from '@/components/charts';

const timeData = generateTimeSeriesData(30); // 30 يوم
```

### generateComparisonData
```tsx
import { generateComparisonData } from '@/components/charts';

const comparisonData = generateComparisonData([
  'منتج أ', 'منتج ب', 'منتج ج'
]);
```

### generateMetricData
```tsx
import { generateMetricData } from '@/components/charts';

const metrics = generateMetricData(1000);
```

## الإعدادات المسبقة

### chartPresets
```tsx
import { chartPresets } from '@/components/charts';

// presets جاهزة للاستخدام
chartPresets.sales
chartPresets.analytics
chartPresets.performance
chartPresets.users
```

## خصائص شاملة

### ChartWrapperProps
- `title`: عنوان الرسم البياني
- `description`: وصف إضافي
- `loading`: حالة التحميل
- `error`: رسالة الخطأ
- `height`: ارتفاع الرسم
- `showLegend`: إظهار المفتاح
- `showGrid`: إظهار الشبكة

### MetricCardProps
- `title`: عنوان البطاقة
- `value`: القيمة الحالية
- `trend`: اتجاه المؤشر (up/down/neutral)
- `trendValue`: قيمة التغيير
- `icon`: أيقونة البطاقة
- `variant`: نمط البطاقة
- `size`: حجم البطاقة

## أمثلة الاستخدام

### مثال متكامل - لوحة معلومات المبيعات
```tsx
import { 
  LineChart, 
  BarChart, 
  DoughnutChart, 
  MetricCard,
  chartColors,
  generateTimeSeriesData,
  generateComparisonData
} from '@/components/charts';

const Dashboard = () => {
  const salesData = generateTimeSeriesData(30);
  const categoryData = generateComparisonData(['منتج أ', 'منتج ب', 'منتج ج']);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="إجمالي المبيعات"
          value={125000}
          trend="up"
          trendValue={15.2}
          icon={TrendingUp}
          iconColor="green"
        />
        <MetricCard
          title="عدد العملاء"
          value={2840}
          trend="up"
          trendValue={8.1}
          icon={Users}
          iconColor="blue"
        />
        <MetricCard
          title="متوسط الطلب"
          value={250}
          trend="neutral"
          trendValue={0.5}
          icon={ShoppingBag}
          iconColor="amber"
        />
        <MetricCard
          title="معدل التحويل"
          value={3.2}
          trend="down"
          trendValue={-2.1}
          icon={Target}
          iconColor="purple"
          suffix="%"
        />
      </div>
      
      <LineChart
        title="تطور المبيعات الشهرية"
        data={salesData}
        xAxisKey="date"
        yAxisKeys={["value"]}
        yAxisLabels={{ value: "المبيعات" }}
        colors={chartColors.warm}
        height={300}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="المبيعات حسب الفئة"
          data={categoryData}
          xAxisKey="name"
          yAxisKey="value"
          colors={chartColors.cool}
          height={300}
        />
        
        <DoughnutChart
          title="توزيع المبيعات"
          data={categoryData}
          dataKey="value"
          nameKey="name"
          colors={chartColors.pastel}
          innerRadius={60}
          outerRadius={80}
          centerText={{
            value: 1250,
            subValue: "إجمالي المبيعات"
          }}
          height={300}
        />
      </div>
    </div>
  );
};
```

## التبعيات المطلوبة

تأكد من تثبيت هذه الحزم:
```json
{
  "recharts": "^2.8.0",
  "lucide-react": "^0.302.0",
  "tailwindcss": "^3.3.0"
}
```

## الدعم والتوافق

- ✅ Next.js 14+
- ✅ React 18+
- ✅ TypeScript
- ✅ Tailwind CSS 3+
- ✅ وضع RTL للعربية
- ✅ الوضع المظلم والفاتح
- ✅ الاستجابة للشاشات المختلفة

## المساهمة

لإضافة مكونات جديدة أو تحسين الموجود:
1. إنشاء مكون جديد في نفس المجلد
2. إضافة التصدير في `index.ts`
3. إضافة الوثائق في هذا الملف