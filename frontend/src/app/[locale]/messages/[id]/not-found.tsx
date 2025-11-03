'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { MessageCircle, ArrowRight, Home, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConversationNotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push('/messages');
  };

  const handleSearchConversations = () => {
    router.push('/messages?search=true');
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <MessageCircle className="h-8 w-8 text-blue-600" />
          </div>
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            المحادثة غير موجودة
          </h1>
          
          {/* Description */}
          <p className="text-gray-600 mb-8">
            عذراً، لم نتمكن من العثور على المحادثة التي تبحث عنها. قد تكون المحادثة قد تم حذفها أو أن الرابط غير صحيح.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Button 
              onClick={handleSearchConversations}
              variant="outline"
              className="flex-1"
              leftIcon={<Search className="h-4 w-4" />}
            >
              البحث في المحادثات
            </Button>
            
            <Button 
              onClick={handleGoBack}
              variant="outline"
              className="flex-1"
              leftIcon={<ArrowRight className="h-4 w-4" />}
            >
              العودة للخلف
            </Button>
          </div>
          
          <Button 
            onClick={handleGoHome}
            className="w-full"
            leftIcon={<Home className="h-4 w-4" />}
          >
            العودة إلى قائمة المحادثات
          </Button>
          
          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              هل تحتاج مساعدة؟
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• تأكد من أن الرابط صحيح ومكتمل</p>
              <p>• قد تحتاج لتسجيل الدخول مرة أخرى</p>
              <p>• تحقق من أن لديك صلاحية الوصول لهذه المحادثة</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}