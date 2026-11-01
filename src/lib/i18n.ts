export const locales = ['en', 'ar', 'kab'] as const;
export const defaultLocale = 'en' as const;

export type Locale = typeof locales[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
  kab: 'Taqbaylit',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  ar: '🇸🇦',
  // ⵣ Amazigh Flag with Blue, Green, Yellow and Red Yaz
  kab: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='16' viewBox='0 0 30 20'><rect width='30' height='6.66' fill='#0066B3'/><rect y='6.66' width='30' height='6.66' fill='#009E60'/><rect y='13.33' width='30' height='6.66' fill='#FFCD00'/><text x='15' y='16' font-size='14' font-family='sans-serif' text-anchor='middle' fill='#E4002B' font-weight='bold'>ⵣ</text></svg>",
};

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ar: 'rtl',
  kab: 'ltr',
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}