/**
 * مثال شامل على استخدام مكونات الرسوم البيانية
 * Example usage for chart components
 */

import React from 'react';
import { 
  LineChart, 
  BarChart, 
  PieChart,
  DoughnutChart,
  AreaChart,
  MetricCard,
  chartColors,
  generateTimeSeriesData,
  generateComparisonData,
  generateMetricData,
  chartPresets,
  formatNumber,
  formatPercentage
} from './index';

// أيقونات من lucide-react
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Target,
  DollarSign,
  Activity,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';

// مثال البيانات التجريبية
const salesData = generateTimeSeriesData(30);
const categoryData = generateComparisonData([
  'إلكترونيات', 
  'ملابس', 
  'أدوات منزلية', 
  'كتب وقرطاسية',
  'ألعاب'
]);

const regionData = [
  { name: 'الرياض', value: 45000, color: chartColors.default[0] },
  { name: 'جدة', value: 38000, color: chartColors.default[1] },
  { name: 'الدمام', value: 32000, color: chartColors.default[2] },
  { name: 'مكة', value: 28000, color: chartColors.default[3] },
  { name: 'المدينة', value: 22000, color: chartColors.default[4] },
];

// مثال على الاستخدام في مكون React
export const ChartsExample: React.FC = () => {
  const handleMetricClick = (metricTitle: string) => {
    console.log(`تم النقر على: ${metricTitle}`);
  };

  const handleTrendClick = (trendValue: number, title: string) => {
    console.log(`تفاصيل الاتجاه: ${title} - ${trendValue}%`);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Metric Cards - بطاقات المؤشرات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="إجمالي المبيعات"
          value={formatNumber(125000)}
          trend="up"
          trendValue={15.2}
          trendLabel="من الشهر الماضي"
          icon={TrendingUp}
          iconColor="green"
          variant="gradient"
          onClick={() => handleMetricClick('إجمالي المبيعات')}
          onTrendClick={() => handleTrendClick(15.2, 'المبيعات')}
        />
        
        <MetricCard
          title="عدد العملاء الجدد"
          value={2840}
          subtitle="هذا الشهر"
          trend="up"
          trendValue={8.1}
          icon={Users}
          iconColor="blue"
          variant="default"
          valueFormatter={(value) => formatNumber(Number(value))}
        />
        
        <MetricCard
          title="متوسط قيمة الطلب"
          value={250}
          trend="neutral"
          trendValue={0.5}
          icon={ShoppingBag}
          iconColor="amber"
          variant="outline"
          valueFormatter={(value) => `${value} ر.س`}
        />
        
        <MetricCard
          title="معدل التحويل"
          value={3.2}
          trend="down"
          trendValue={-2.1}
          icon={Target}
          iconColor="purple"
          variant="minimal"
          valueFormatter={(value) => `${value}%`}
        />
      </div>

      {/* Line Chart - الرسم البياني الخطي */}
      <div className="space-y-4">
        <LineChart
          title="تطور المبيعات خلال 30 يوم"
          description="رسم بياني يوضح تطور المبيعات اليومية"
          data={salesData}
          xAxisKey="date"
          yAxisKeys={["value"]}
          yAxisLabels={{ value: "المبيعات (ر.س)" }}
          colors={chartColors.warm}
          height={350}
          smooth={true}
          showGrid={true}
          tooltipFormatter={(value, name) => [`${formatNumber(Number(value))} ر.س`, name]}
          labelFormatter={(label) => {
            const date = new Date(label);
            return date.toLocaleDateString('ar-SA', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric' 
            });
          }}
          referenceLines={[
            {
              y: 500,
              label: "الهدف اليومي",
              stroke: '#EF4444',
              strokeDasharray: '5 5'
            }
          ]}
        />
      </div>

      {/* Area Chart - الرسم البياني بالمنطقة */}
      <div className="space-y-4">
        <AreaChart
          title="مقارنة الإيرادات والمصروفات"
          description="رسم بياني يوضح تطور الإيرادات والمصروفات"
          data={salesData.map((item, index) => ({
            ...item,
            revenue: Math.floor(Math.random() * 800) + 200,
            expense: Math.floor(Math.random() * 500) + 100,
            profit: Math.floor(Math.random() * 400) + 50
          }))}
          xAxisKey="date"
          yAxisKeys={["revenue", "expense", "profit"]}
          yAxisLabels={{
            revenue: "الإيرادات",
            expense: "المصروفات", 
            profit: "صافي الربح"
          }}
          colors={[
            { fill: '#10B981', stroke: '#059669' },
            { fill: '#EF4444', stroke: '#DC2626' },
            { fill: '#3B82F6', stroke: '#2563EB' }
          ]}
          height={350}
          stacked={false}
          curveType="monotone"
          showBrush={true}
          showGrid={true}
          tooltipFormatter={(value, name) => {
            const labelMap = {
              revenue: "الإيرادات",
              expense: "المصروفات",
              profit: "صافي الربح"
            };
            return [`${formatNumber(Number(value))} ر.س`, labelMap[name as keyof typeof labelMap] || name];
          }}
        />
      </div>

      {/* Bar Charts - الرسوم البيانية بالأعمدة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="المبيعات حسب الفئة"
          description="توزيع المبيعات على فئات المنتجات المختلفة"
          data={categoryData}
          xAxisKey="name"
          yAxisKey="value"
          colors={chartColors.cool}
          height={300}
          orientation="vertical"
          showGrid={true}
          tooltipFormatter={(value, name) => [`${formatNumber(Number(value))} ر.س`, name]}
          referenceLines={[
            {
              y: 15000,
              label: "متوسط المبيعات",
              stroke: '#F59E0B'
            }
          ]}
        />
        
        <BarChart
          title="المبيعات حسب المنطقة"
          description="مقارنة الأداء في المناطق الرئيسية"
          data={regionData}
          xAxisKey="name"
          yAxisKey="value"
          colors={[
            { fill: '#3B82F6', stroke: '#2563EB' },
            { fill: '#10B981', stroke: '#059669' },
            { fill: '#F59E0B', stroke: '#D97706' },
            { fill: '#EF4444', stroke: '#DC2626' },
            { fill: '#8B5CF6', stroke: '#7C3AED' }
          ]}
          height={300}
          orientation="horizontal"
          showGrid={true}
          barSize={20}
          tooltipFormatter={(value, name) => [`${formatNumber(Number(value))} ر.س`, name]}
        />
      </div>

      {/* Pie and Doughnut Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart
          title="توزيع المبيعات حسب الفئة"
          description="النسب المئوية للمبيعات في كل فئة"
          data={categoryData}
          dataKey="value"
          nameKey="name"
          colors={chartColors.pastel}
          outerRadius={80}
          innerRadius={0}
          paddingAngle={2}
          showLegend={true}
          showLabel={true}
          labelFormatter={(value, entry) => `${entry.name}: ${formatPercentage(Number(entry.percentage))}`}
          tooltipFormatter={(value, name) => [`${formatNumber(Number(value))} ر.س`, name]}
        />
        
        <DoughnutChart
          title="توزيع المبيعات حسب المنطقة"
          description="دائري يوضح المساهمة النسبية لكل منطقة"
          data={regionData}
          dataKey="value"
          nameKey="name"
          colors={chartColors.warm}
          outerRadius={80}
          innerRadius={50}
          paddingAngle={2}
          showLegend={true}
          showLabel={true}
          centerText={{
            value: formatNumber(regionData.reduce((sum, item) => sum + item.value, 0)),
            subValue: "إجمالي المبيعات",
            formatter: (value) => `${formatNumber(Number(value))} ر.س`
          }}
          labelFormatter={(value, entry) => entry.name}
          tooltipFormatter={(value, name) => [`${formatNumber(Number(value))} ر.س`, name]}
          animationDuration={800}
        />
      </div>

      {/* Advanced Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          أمثلة متقدمة
        </h3>
        
        {/* Multi-line chart with custom styling */}
        <LineChart
          title="مقارنة أداء المنتجات"
          description="مقارنة الأداء عبر عدة منتجات في فترة زمنية"
          data={Array.from({ length: 12 }, (_, i) => ({
            month: `2024-${String(i + 1).padStart(2, '0')}`,
            productA: Math.floor(Math.random() * 300) + 100,
            productB: Math.floor(Math.random() * 250) + 80,
            productC: Math.floor(Math.random() * 200) + 60
          }))}
          xAxisKey="month"
          yAxisKeys={["productA", "productB", "productC"]}
          yAxisLabels={{
            productA: "المنتج أ",
            productB: "المنتج ب", 
            productC: "المنتج ج"
          }}
          colors={chartColors.cool}
          height={400}
          strokeWidth={3}
          dotSize={6}
          smooth={true}
          showGrid={true}
          showLegend={true}
          strokeDasharray="5 5"
          strokeOpacity={0.8}
          tooltipFormatter={(value, name) => [`${formatNumber(Number(value))} وحدة`, name]}
          labelFormatter={(label) => {
            const date = new Date(label + '-01');
            return date.toLocaleDateString('ar-SA', { 
              month: 'long',
              year: 'numeric'
            });
          }}
          referenceLines={[
            {
              y: 200,
              label: "الهدف الأدنى",
              stroke: '#F59E0B',
              strokeDasharray: '3 3'
            },
            {
              y: 350,
              label: "الهدف الأعلى",
              stroke: '#10B981',
              strokeDasharray: '3 3'
            }
          ]}
        />
      </div>

      {/* Using presets */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          استخدام الإعدادات المسبقة
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MetricCard
            title={chartPresets.sales.title}
            value={formatNumber(50000)}
            trend="up"
            trendValue={12.5}
            icon={DollarSign}
            iconColor="green"
            variant="gradient"
          />
          
          <MetricCard
            title={chartPresets.analytics.title}
            value={formatNumber(300000)}
            trend="up"
            trendValue={18.3}
            icon={Activity}
            iconColor="blue"
            variant="default"
          />
        </div>
      </div>
    </div>
  );
};

// مثال على مكون منفصل للاستخدام في الصفحات
export const SalesDashboard: React.FC = () => {
  const salesMetrics = [
    {
      ...generateMetricData(125000),
      title: "إجمالي المبيعات",
      icon: DollarSign,
      color: "green" as const
    },
    {
      ...generateMetricData(2840),
      title: "عدد العملاء",
      icon: Users,
      color: "blue" as const
    },
    {
      ...generateMetricData(250),
      title: "متوسط الطلب",
      icon: ShoppingBag,
      color: "amber" as const
    },
    {
      ...generateMetricData(3.2),
      title: "معدل التحويل",
      icon: Target,
      color: "purple" as const
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            لوحة تحكم المبيعات
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            نظرة عامة على أداء المبيعات والمؤشرات الرئيسية
          </p>
        </div>
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {salesMetrics.map((metric, index) => (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.title.includes('تحويل') ? metric.current : formatNumber(metric.current)}
              trend={Number(metric.growth) > 0 ? 'up' : Number(metric.growth) < 0 ? 'down' : 'neutral'}
              trendValue={Number(metric.growth)}
              icon={metric.icon}
              iconColor={metric.color}
              variant="default"
              valueFormatter={(value) => {
                if (metric.title.includes('تحويل')) return `${value}%`;
                return `${formatNumber(Number(value))} ر.س`;
              }}
            />
          ))}
        </div>
        
        {/* Main Charts */}
        <ChartsExample />
      </div>
    </div>
  );
};

export default ChartsExample;