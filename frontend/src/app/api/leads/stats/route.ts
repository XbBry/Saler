/**
 * API Route لإحصائيات العملاء المحتملين
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock data للإحصائيات
const mockStats = {
  total: 147,
  new: 23,
  contacted: 45,
  qualified: 67,
  proposal: 12,
  converted: 28,
  pipelineValue: 2847000,
  conversionRate: 31.4,
  averageValue: 19374,
  averageScore: 72,
  topSources: [
    { name: 'الموقع الإلكتروني', count: 45, percentage: 30.6 },
    { name: 'LinkedIn', count: 34, percentage: 23.1 },
    { name: 'مراجعة مباشرة', count: 28, percentage: 19.0 },
    { name: 'إحالة', count: 24, percentage: 16.3 },
    { name: 'معرض', count: 16, percentage: 10.9 },
  ],
  trends: [
    { date: '2024-01', leads: 12, converted: 3, value: 450000 },
    { date: '2024-02', leads: 15, converted: 5, value: 680000 },
    { date: '2024-03', leads: 18, converted: 6, value: 720000 },
    { date: '2024-04', leads: 22, converted: 8, value: 890000 },
    { date: '2024-05', leads: 25, converted: 9, value: 1100000 },
    { date: '2024-06', leads: 28, converted: 11, value: 1300000 },
    { date: '2024-07', leads: 32, converted: 14, value: 1560000 },
    { date: '2024-08', leads: 35, converted: 16, value: 1680000 },
    { date: '2024-09', leads: 38, converted: 18, value: 1820000 },
    { date: '2024-10', leads: 42, converted: 21, value: 2100000 },
    { date: '2024-11', leads: 45, converted: 24, value: 2340000 },
    { date: '2024-12', leads: 47, converted: 28, value: 2847000 },
  ],
  recentActivity: [
    {
      id: '1',
      type: 'lead_created',
      description: 'تم إضافة عميل محتمل جديد',
      user: 'أحمد محمد',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      type: 'lead_converted',
      description: 'تم تحويل عميل محتمل',
      user: 'سارة أحمد',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '3',
      type: 'stage_updated',
      description: 'تم تحديث مرحلة العميل المحتمل',
      user: 'خالد العلي',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
    },
  ],
};

export async function GET(request: NextRequest) {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));

    return NextResponse.json(mockStats);
  } catch (error) {
    console.error('Error fetching leads stats:', error);
    return NextResponse.json(
      { error: 'فشل في جلب إحصائيات العملاء المحتملين' },
      { status: 500 }
    );
  }
}
