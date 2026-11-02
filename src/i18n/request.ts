import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, isLocale } from '@/lib/i18n';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested ?? '') ? (requested as typeof locales[number]) : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});