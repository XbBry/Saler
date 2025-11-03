'use client';

import React from 'react';
// import { Link } from '../../../components/ui/Link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import {
  ShoppingBag,
  Mail,
  MessageSquare,
  Calendar,
  Database,
  Settings,
  ArrowLeft,
  ExternalLink,
  Plus
} from 'lucide-react';

export default function IntegrationsIndexPage() {
  const integrations = [
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'ربط متجر Shopify مع نظام Saler لإدارة المبيعات والعملاء',
      icon: ShoppingBag,
      status: 'available',
      features: ['مزامنة الطلبات', 'إدارة العملاء', 'مزامنة المنتجات', 'Webhooks فورية'],
      color: 'bg-green-600'
    },
    {
      id: 'email',
      name: 'البريد الإلكتروني',
      description: 'تكامل مع خدمات البريد الإلكتروني لإرسال الرسائل التسويقية',
      icon: Mail,
      status: 'coming-soon',
      features: ['إرسال جماعي', 'قوالب محترفة', 'إحصائيات مفصلة'],
      color: 'bg-blue-600'
    },
    {
      id: 'sms',
      name: 'الرسائل النصية',
      description: 'إرسال رسائل نصية للعملاء عبر مزودي الخدمات',
      icon: MessageSquare,
      status: 'coming-soon',
      features: ['رسائل فورية', 'أتمتة كاملة', 'رسائل مخصصة'],
      color: 'bg-purple-600'
    },
    {
      id: 'calendar',
      name: 'التقويم',
      description: 'ربط مع خدمات التقويم لجدولة المواعيد والاجتماعات',
      icon: Calendar,
      status: 'coming-soon',
      features: ['جدولة تلقائية', 'تذكيرات', 'مزامنة متعدد'],
      color: 'bg-orange-600'
    },
    {
      id: 'crm',
      name: 'أنظمة CRM',
      description: 'التكامل مع أنظمة إدارة علاقات العملاء',
      icon: Database,
      status: 'coming-soon',
      features: ['مزامنة البيانات', 'تقارير موحدة', 'إدارة متقدمة'],
      color: 'bg-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">التكاملات</h1>
              <p className="text-gray-600 mt-2">
                ربط النظام مع الخدمات الخارجية لإدارة شاملة
              </p>
            </div>
            <a href="/dashboard">
              <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                العودة للرئيسية
              </Button>
            </a>
          </div>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <Card key={integration.id} className="relative overflow-hidden">
              {integration.status === 'available' && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              )}
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${integration.color}`}>
                    <integration.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      integration.status === 'available' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {integration.status === 'available' ? 'متوفر' : 'قريباً'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <CardTitle className="text-xl">{integration.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {integration.description}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">المميزات الرئيسية:</h4>
                    <ul className="space-y-1">
                      {integration.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full ml-2"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>

              <div className="px-6 pb-6">
                {integration.status === 'available' ? (
                  <a href={`/dashboard/integrations/${integration.id}`}>
                    <Button fullWidth>
                      بدء الإعداد
                    </Button>
                  </a>
                ) : (
                  <Button fullWidth disabled variant="outline">
                    <Plus className="w-4 h-4 ml-2" />
                    قريباً
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Settings className="w-5 h-5" />
                <span>إعدادات عامة</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                إدارة إعدادات التكاملات العامة وتفضيلات المزامنة
              </p>
              <Button variant="outline">
                عرض الإعدادات
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <ExternalLink className="w-5 h-5" />
                <span>المطورون</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                وثائق المطورين وأمثلة التكامل عبر API
              </p>
              <Button variant="outline">
                عرض الوثائق
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}