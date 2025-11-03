import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ConversationLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        {/* Loading Animation */}
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-blue-100 animate-pulse"></div>
        </div>
        
        {/* Loading Text */}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            جاري تحميل المحادثة
          </h2>
          <p className="text-sm text-gray-500">
            يرجى الانتظار بينما نقوم بتحميل الرسائل...
          </p>
        </div>
        
        {/* Loading Steps */}
        <div className="flex space-x-2 text-xs text-gray-400">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>تحميل البيانات</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <span>إعداد الاتصال</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            <span>عرض الرسائل</span>
          </div>
        </div>
      </div>
    </div>
  );
}