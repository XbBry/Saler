import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { messages } from '@/lib/messages';

// Can be imported from a shared config
const locales = ['ar', 'en'];

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (messages as any)[locale as keyof typeof messages] || messages.en
  };
});