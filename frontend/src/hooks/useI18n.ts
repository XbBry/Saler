import { useTranslations, useLocale } from 'next-intl';
import { useParams } from 'next/navigation';

// Hook for getting translated text
export const useT = () => {
  return useTranslations();
};

// Hook for getting current locale
export const useCurrentLocale = () => {
  const locale = useLocale();
  return locale as 'ar' | 'en';
};

// Hook for getting params with proper typing
export const useI18nParams = () => {
  const params = useParams();
  return {
    locale: params.locale as 'ar' | 'en',
  };
};

// Hook for formatting dates
export const useFormatDate = () => {
  const locale = useCurrentLocale();
  
  return (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(dateObj);
  };
};

// Hook for formatting numbers
export const useFormatNumber = () => {
  const locale = useCurrentLocale();
  
  return (number: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale, options).format(number);
  };
};

// Hook for formatting currency
export const useFormatCurrency = () => {
  const locale = useCurrentLocale();
  
  return (amount: number, currency = 'SAR') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };
};