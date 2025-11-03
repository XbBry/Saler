import React from 'react';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        {/* Main loading spinner */}
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
        
        {/* Loading text */}
        <p className="text-sm font-medium text-slate-600">
          جاري التحميل...
        </p>
        
        {/* Loading progress bar */}
        <div className="mt-4 w-64 h-1 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}