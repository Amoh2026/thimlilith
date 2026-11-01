import { getRequestConfig } from 'next-intl/server';
import { locales } from '@/lib/i18n';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as any)) {
    return { messages: (await import(`../../messages/en.json`)).default };
  }

  return {
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});