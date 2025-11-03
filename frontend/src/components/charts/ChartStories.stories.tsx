/**
 * Storybook stories for chart components
 * ملفات تعريف Storybook لمكونات الرسوم البيانية
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Target,
  DollarSign,
  Activity
} from 'lucide-react';
import {
  ChartWrapper,
  LineChart,
  BarChart,
  PieChart,
  DoughnutChart,
  AreaChart,
  MetricCard,
  chartColors,
  generateTimeSeriesData,
  generateComparisonData
} from './index';

// Sample data for stories
const salesData = generateTimeSeriesData(30);
const categoryData = generateComparisonData([
  'إلكترونيات', 
  'ملابس', 
  'أدوات منزلية', 
  'كتب وقرطاسية',
  'ألعاب'
]);

const regionData = [
  { name: 'الرياض', value: 45000 },
  { name: 'جدة', value: 38000 },
  { name: 'الدمام', value: 32000 },
  { name: 'مكة', value: 28000 },
  { name: 'المدينة', value: 22000 },
];

// Chart Wrapper Stories
const chartWrapperMeta: Meta<typeof ChartWrapper> = {
  title: 'Charts/ChartWrapper',
  component: ChartWrapper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
المكون الأساسي لجميع الرسوم البيانية يوفر:
- دعم RTL للعربية
- حالات التحميل والأخطاء  
- Legend و Grid قابلين للتخصيص
- Tooltips بالعربية

الاستخدام الأساسي:
\`\`\`tsx
<ChartWrapper title="رسم بياني" height={300}>
  <div>محتوى الرسم البياني</div>
</ChartWrapper>
\`\`\`
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    height: {
      control: { type: 'number' },
      description: 'ارتفاع الرسم البياني بالبكسل'
    },
    loading: {
      control: { type: 'boolean' },
      description: 'إظهار حالة التحميل'
    },
    error: {
      control: { type: 'text' },
      description: 'رسالة الخطأ (اتركها فارغة لعدم إظهار الخطأ)'
    },
    showLegend: {
      control: { type: 'boolean' },
      description: 'إظهار المفتاح (Legend)'
    },
    showGrid: {
      control: { type: 'boolean' },
      description: 'إظهار الشبكة (Grid)'
    }
  }
};

export default chartWrapperMeta;
type Story = StoryObj<typeof chartWrapperMeta>;

export const Default: Story = {
  args: {
    title: 'رسم بياني أساسي',
    description: 'وصف الرسم البياني',
    height: 300,
    children: <div className="w-full h-full bg-blue-50 rounded flex items-center justify-center">محتوى الرسم البياني</div>
  }
};

export const Loading: Story = {
  args: {
    title: 'رسم بياني مع التحميل',
    description: 'يُظهر حالة التحميل',
    height: 300,
    loading: true,
    children: <div>محتوى الرسم البياني</div>
  }
};

export const WithError: Story = {
  args: {
    title: 'رسم بياني مع خطأ',
    description: 'يُظهر رسالة خطأ',
    height: 300,
    error: 'خطأ في تحميل البيانات',
    children: <div>محتوى الرسم البياني</div>
  }
};

// LineChart Stories
const lineChartMeta: Meta<typeof LineChart> = {
  title: 'Charts/LineChart',
  component: LineChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
رسم بياني خطي لعرض الاتجاهات عبر الزمن.

المميزات:
- دعم multiple lines
- Gradient fills
- Interactive points
- Custom tooltips
- Reference lines
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    height: {
      control: { type: 'number' },
      description: 'ارتفاع الرسم البياني'
    },
    smooth: {
      control: { type: 'boolean' },
      description: 'خطوط ناعمة'
    },
    showGrid: {
      control: { type: 'boolean' },
      description: 'إظهار الشبكة'
    },
    colors: {
      control: { type: 'select' },
      options: ['default', 'pastel', 'warm', 'cool', 'monochrome'],
      description: 'نمط الألوان'
    }
  }
};

export default lineChartMeta;
type LineStory = StoryObj<typeof lineChartMeta>;

export const BasicLineChart: LineStory = {
  args: {
    data: salesData,
    xAxisKey: 'date',
    yAxisKeys: ['value'],
    yAxisLabels: { value: 'المبيعات' },
    title: 'تطور المبيعات',
    description: 'مخطط خطي لتطور المبيعات خلال 30 يوم',
    height: 300,
    colors: chartColors.default
  }
};

export const MultiLineChart: LineStory = {
  args: {
    data: salesData.map((item, index) => ({
      ...item,
      revenue: Math.floor(Math.random() * 300) + 100,
      expense: Math.floor(Math.random() * 200) + 50
    })),
    xAxisKey: 'date',
    yAxisKeys: ['value', 'revenue', 'expense'],
    yAxisLabels: {
      value: 'المبيعات',
      revenue: 'الإيرادات',
      expense: 'المصروفات'
    },
    title: 'مقارنة الإيرادات والمصروفات',
    height: 350,
    colors: chartColors.cool,
    smooth: true,
    referenceLines: [
      {
        y: 200,
        label: 'الهدف',
        stroke: '#F59E0B'
      }
    ]
  }
};

// BarChart Stories
const barChartMeta: Meta<typeof BarChart> = {
  title: 'Charts/BarChart',
  component: BarChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'رسم بياني بالأعمدة للبيانات المقارنة مع دعم التكديس والاتجاهات'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: { type: 'select' },
      options: ['vertical', 'horizontal'],
      description: 'اتجاه الأعمدة'
    },
    stacked: {
      control: { type: 'boolean' },
      description: 'تكديس الأعمدة'
    },
    colors: {
      control: { type: 'select' },
      options: ['default', 'pastel', 'warm', 'cool', 'monochrome'],
      description: 'نمط الألوان'
    }
  }
};

export default barChartMeta;
type BarStory = StoryObj<typeof barChartMeta>;

export const VerticalBarChart: BarStory = {
  args: {
    data: categoryData,
    xAxisKey: 'name',
    yAxisKey: 'value',
    title: 'المبيعات حسب الفئة',
    height: 300,
    colors: chartColors.warm,
    orientation: 'vertical'
  }
};

export const HorizontalBarChart: BarStory = {
  args: {
    data: regionData,
    xAxisKey: 'name',
    yAxisKey: 'value',
    title: 'المبيعات حسب المنطقة',
    height: 300,
    colors: chartColors.cool,
    orientation: 'horizontal'
  }
};

export const StackedBarChart: BarStory = {
  args: {
    data: categoryData.map((item, index) => ({
      ...item,
      online: Math.floor(item.value * 0.6),
      offline: Math.floor(item.value * 0.4)
    })),
    xAxisKey: 'name',
    yAxisKeys: ['online', 'offline'],
    yAxisLabels: {
      online: 'أونلاين',
      offline: 'أوفلاين'
    },
    title: 'المبيعات حسب القناة',
    height: 350,
    colors: chartColors.cool,
    stacked: true
  }
};

// PieChart Stories
const pieChartMeta: Meta<typeof PieChart> = {
  title: 'Charts/PieChart',
  component: PieChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'رسم بياني دائري للبيانات النسبية مع تفاعلات'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    outerRadius: {
      control: { type: 'number', min: 50, max: 150 },
      description: 'نصف القطر الخارجي'
    },
    innerRadius: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'نصف القطر الداخلي'
    },
    showLabel: {
      control: { type: 'boolean' },
      description: 'إظهار التسميات'
    },
    colors: {
      control: { type: 'select' },
      options: ['default', 'pastel', 'warm', 'cool', 'monochrome'],
      description: 'نمط الألوان'
    }
  }
};

export default pieChartMeta;
type PieStory = StoryObj<typeof pieChartMeta>;

export const BasicPieChart: PieStory = {
  args: {
    data: categoryData,
    dataKey: 'value',
    nameKey: 'name',
    title: 'توزيع المبيعات حسب الفئة',
    height: 300,
    colors: chartColors.pastel,
    outerRadius: 80,
    showLabel: true
  }
};

export const PieChartWithLegend: PieStory = {
  args: {
    data: regionData,
    dataKey: 'value',
    nameKey: 'name',
    title: 'توزيع المبيعات حسب المنطقة',
    height: 300,
    colors: chartColors.warm,
    outerRadius: 80,
    showLegend: true,
    legendPosition: 'bottom'
  }
};

// DoughnutChart Stories
const doughnutChartMeta: Meta<typeof DoughnutChart> = {
  title: 'Charts/DoughnutChart',
  component: DoughnutChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'رسم بياني دونات مع نص في المركز وانيميشن'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    innerRadius: {
      control: { type: 'number', min: 30, max: 80 },
      description: 'نصف القطر الداخلي (للدونات)'
    },
    centerText: {
      control: { type: 'object' },
      description: 'النص في المركز'
    },
    animationDuration: {
      control: { type: 'number', min: 100, max: 2000 },
      description: 'مدة الانيميشن بالملي ثانية'
    }
  }
};

export default doughnutChartMeta;
type DoughnutStory = StoryObj<typeof doughnutChartMeta>;

export const BasicDoughnutChart: DoughnutStory = {
  args: {
    data: regionData,
    dataKey: 'value',
    nameKey: 'name',
    title: 'توزيع المبيعات',
    height: 300,
    colors: chartColors.cool,
    outerRadius: 80,
    innerRadius: 50,
    centerText: {
      value: 165000,
      subValue: 'إجمالي المبيعات'
    }
  }
};

export const AnimatedDoughnutChart: DoughnutStory = {
  args: {
    data: categoryData,
    dataKey: 'value',
    nameKey: 'name',
    title: 'رسم بياني متحرك',
    height: 300,
    colors: chartColors.pastel,
    outerRadius: 80,
    innerRadius: 50,
    centerText: {
      value: '45%',
      subValue: 'نمو شهري',
      formatter: (value) => value.toString()
    },
    animationDuration: 1200,
    showLabel: true
  }
};

// AreaChart Stories
const areaChartMeta: Meta<typeof AreaChart> = {
  title: 'Charts/AreaChart',
  component: AreaChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'رسم بياني بالمنطقة مع تدرجات لونية وتكديس'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    stacked: {
      control: { type: 'boolean' },
      description: 'تكديس المناطق'
    },
    curveType: {
      control: { type: 'select' },
      options: ['basis', 'linear', 'natural', 'monotoneX', 'monotoneY', 'monotone'],
      description: 'نوع المنحنى'
    },
    showBrush: {
      control: { type: 'boolean' },
      description: 'إظهار شريط التمرير'
    },
    fillOpacity: {
      control: { type: 'range', min: 0.1, max: 1, step: 0.1 },
      description: 'شفافية التعبئة'
    }
  }
};

export default areaChartMeta;
type AreaStory = StoryObj<typeof areaChartMeta>;

export const BasicAreaChart: AreaStory = {
  args: {
    data: salesData.map(item => ({
      ...item,
      revenue: Math.floor(Math.random() * 300) + 100,
      expense: Math.floor(Math.random() * 200) + 50,
      profit: Math.floor(Math.random() * 200) + 30
    })),
    xAxisKey: 'date',
    yAxisKeys: ['value'],
    yAxisLabels: { value: 'المبيعات' },
    title: 'المبيعات الشهرية',
    height: 300,
    colors: [
      { fill: '#3B82F6', stroke: '#2563EB' }
    ],
    fillOpacity: 0.3
  }
};

export const StackedAreaChart: AreaStory = {
  args: {
    data: salesData.map((item, index) => ({
      ...item,
      productA: Math.floor(Math.random() * 150) + 50,
      productB: Math.floor(Math.random() * 120) + 40,
      productC: Math.floor(Math.random() * 100) + 30
    })),
    xAxisKey: 'date',
    yAxisKeys: ['productA', 'productB', 'productC'],
    yAxisLabels: {
      productA: 'المنتج أ',
      productB: 'المنتج ب',
      productC: 'المنتج ج'
    },
    title: 'المبيعات المكدسة حسب المنتج',
    height: 350,
    colors: chartColors.cool,
    stacked: true,
    curveType: 'monotone',
    showBrush: true,
    fillOpacity: 0.4
  }
};

// MetricCard Stories
const metricCardMeta: Meta<typeof MetricCard> = {
  title: 'Charts/MetricCard',
  component: MetricCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'بطاقة عرض المؤشرات الإحصائية مع الاتجاهات'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'gradient', 'outline', 'minimal'],
      description: 'نمط البطاقة'
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'حجم البطاقة'
    },
    iconColor: {
      control: { type: 'select' },
      options: ['blue', 'green', 'red', 'amber', 'purple', 'pink', 'gray', 'indigo'],
      description: 'لون الأيقونة'
    },
    trend: {
      control: { type: 'select' },
      options: ['up', 'down', 'neutral'],
      description: 'اتجاه المؤشر'
    }
  }
};

export default metricCardMeta;
type MetricStory = StoryObj<typeof metricCardMeta>;

export const BasicMetricCard: MetricStory = {
  args: {
    title: 'إجمالي المبيعات',
    value: '125,000 ر.س',
    trend: 'up',
    trendValue: 15.2,
    trendLabel: 'من الشهر الماضي',
    icon: TrendingUp,
    iconColor: 'green',
    variant: 'default',
    size: 'md'
  }
};

export const UpTrend: MetricStory = {
  args: {
    title: 'عدد العملاء',
    value: 2840,
    trend: 'up',
    trendValue: 8.1,
    icon: Users,
    iconColor: 'blue',
    variant: 'gradient'
  }
};

export const DownTrend: MetricStory = {
  args: {
    title: 'معدل التخلي',
    value: 2.4,
    trend: 'down',
    trendValue: -0.8,
    trendLabel: 'هذا الأسبوع',
    icon: Target,
    iconColor: 'red',
    variant: 'outline'
  }
};

export const NeutralTrend: MetricStory = {
  args: {
    title: 'متوسط الطلب',
    value: 250,
    trend: 'neutral',
    trendValue: 0.5,
    icon: ShoppingBag,
    iconColor: 'amber',
    variant: 'minimal'
  }
};

export const DifferentSizes: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="بطاقة صغيرة"
        value={100}
        size="sm"
        icon={DollarSign}
        iconColor="green"
      />
      <MetricCard
        title="بطاقة متوسطة"
        value={100}
        size="md"
        icon={Activity}
        iconColor="blue"
      />
      <MetricCard
        title="بطاقة كبيرة"
        value={100}
        size="lg"
        icon={TrendingUp}
        iconColor="purple"
      />
    </div>
  )
};

// Complete Dashboard Story
export const DashboardExample: Story = {
  render: () => (
    <div className="p-6 space-y-8 max-w-7xl">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="إجمالي المبيعات"
          value="125,000 ر.س"
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
          value="250 ر.س"
          trend="neutral"
          trendValue={0.5}
          icon={ShoppingBag}
          iconColor="amber"
        />
        <MetricCard
          title="معدل التحويل"
          value="3.2%"
          trend="down"
          trendValue={-2.1}
          icon={Target}
          iconColor="purple"
        />
      </div>

      {/* Charts */}
      <div className="space-y-8">
        <LineChart
          title="تطور المبيعات"
          data={salesData}
          xAxisKey="date"
          yAxisKeys={['value']}
          yAxisLabels={{ value: 'المبيعات' }}
          height={300}
          colors={chartColors.warm}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChart
            title="المبيعات حسب الفئة"
            data={categoryData}
            xAxisKey="name"
            yAxisKey="value"
            height={300}
            colors={chartColors.cool}
          />
          <DoughnutChart
            title="توزيع المبيعات"
            data={regionData}
            dataKey="value"
            nameKey="name"
            height={300}
            colors={chartColors.pastel}
            outerRadius={80}
            innerRadius={50}
            centerText={{
              value: '165K',
              subValue: 'إجمالي المبيعات'
            }}
          />
        </div>
      </div>
    </div>
  )
};