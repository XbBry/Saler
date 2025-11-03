import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface NotFoundProps {
  params: { locale: string };
}

export default function NotFound({ params: { locale } }: NotFoundProps) {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 illustration */}
        <div className="mb-8">
          <div className="text-6xl font-bold text-slate-300 mb-2">404</div>
          <div className="h-24 w-24 mx-auto bg-slate-200 rounded-full flex items-center justify-center">
            <svg
              className="h-12 w-12 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.83-6.14-2.23l-.86-.86M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Error title */}
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          الصفحة غير موجودة
        </h1>

        {/* Error description */}
        <p className="text-slate-600 mb-8">
          عذراً، الصفحة التي تبحث عنها غير موجودة. تأكد من الرابط أو ارجع إلى الصفحة الرئيسية.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg
              className="ml-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            العودة للرئيسية
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
          >
            <svg
              className="ml-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            العودة للخلف
          </button>
        </div>
      </div>
    </div>
  );
}

// Generate static params for locales
export function generateStaticParams() {
  return [{ locale: 'ar' }, { locale: 'en' }];
}