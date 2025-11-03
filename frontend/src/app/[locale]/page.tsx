import React from 'react';
import { useTranslations } from 'next-intl';
import { useAuthContext } from '@/lib/auth-context';
import { redirect } from 'next/navigation';

interface HomePageProps {
  params: { locale: string };
}

export default function HomePage({ params: { locale } }: HomePageProps) {
  const t = useTranslations();
  const { isAuthenticated, isLoading } = useAuthContext();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></div>
          <span className="text-sm text-slate-600">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if authenticated
  if (isAuthenticated) {
    redirect(`/${locale}/dashboard`);
  }

  // Redirect to login if not authenticated
  redirect(`/${locale}/auth/login`);

  return null;
}