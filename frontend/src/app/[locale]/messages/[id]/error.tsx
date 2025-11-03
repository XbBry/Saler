'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface ConversationErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ConversationError({ error, reset }: ConversationErrorProps) {
  const handleGoHome = () => {
    window.location.href = '/messages';
  };

  const handleRetry = () => {
    reset();
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          
          {/* Error Message */}
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            فشل في تحميل المحادثة
          </h2>
          
          <p className="text-sm text-gray-600 mb-6">
            حدث خطأ أثناء تحميل المحادثة. يرجى المحاولة مرة أخرى أو العودة إلى قائمة المحادثات.
          </p>
          
          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-3 bg-gray-100 rounded-lg text-left">
              <p className="text-xs text-gray-700 font-mono break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-1">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={handleRetry}
              className="w-full"
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              إعادة المحاولة
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleGoHome}
              className="w-full"
              leftIcon={<Home className="h-4 w-4" />}
            >
              العودة إلى المحادثات
            </Button>
          </div>
          
          {/* Help Text */}
          <p className="text-xs text-gray-500 mt-4">
            إذا استمر الخطأ، يرجى التواصل مع فريق الدعم الفني
          </p>
        </div>
      </div>
    </div>
  );
}