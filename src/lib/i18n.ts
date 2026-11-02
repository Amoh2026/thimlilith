// src/lib/i18n.ts
export const locales = ['fr', 'en', 'ar', 'kab'] as const;
export const defaultLocale = 'en' as const;

export type Locale = typeof locales[number];

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
  kab: 'Taqbaylit',
};

// ✅ Using SVG image data so flags render perfectly on Windows!
export const localeFlags: Record<Locale, string> = {
  // France Flag
  fr: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3Crect width='3' height='2' fill='%23002395'/%3E%3Crect x='1' width='1' height='2' fill='%23fff'/%3E%3Crect x='2' width='1' height='2' fill='%23ED2939'/%3E%3C/svg%3E",
  // UK Flag
  en: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 30'%3E%3CclipPath id='s'%3E%3Cpath d='M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z'/%3E%3C/clipPath%3E%3Cpath d='M0,0 v30 h60 v-30 z' fill='%23012169'/%3E%3Cpath d='M0,0 L60,30 M60,0 L0,30' stroke='%23fff' stroke-width='6'/%3E%3Cpath d='M0,0 L60,30 M60,0 L0,30' clip-path='url(%23s)' stroke='%23C8102E' stroke-width='4'/%3E%3Cpath d='M30,0 v30 M0,15 h60' stroke='%23fff' stroke-width='10'/%3E%3Cpath d='M30,0 v30 M0,15 h60' stroke='%23C8102E' stroke-width='6'/%3E%3C/svg%3E",
  // Algeria Flag
  ar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3Crect width='3' height='2' fill='%23006633'/%3E%3Crect x='1.5' width='1.5' height='2' fill='%23fff'/%3E%3Cpath d='M2.2 1 A 0.45 0.45 0 1 1 2.2 0.7 A 0.35 0.35 0 1 0 2.2 1 Z' fill='%23D21034'/%3E%3Cpath d='M2.3 0.5 L2.4 0.8 L2.7 0.8 L2.5 0.95 L2.6 1.25 L2.3 1.05 L2 1.25 L2.1 0.95 L1.9 0.8 L2.2 0.8 Z' fill='%23D21034'/%3E%3C/svg%3E",
  // Amazigh (Kabyle) Flag - Cleaned up URL Encoding
  kab: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 20'%3E%3Crect width='30' height='6.66' fill='%230066B3'/%3E%3Crect y='6.66' width='30' height='6.66' fill='%23009E60'/%3E%3Crect y='13.33' width='30' height='6.66' fill='%23FFCD00'/%3E%3Ctext x='15' y='16' font-size='14' font-family='sans-serif' text-anchor='middle' fill='%23E4002B' font-weight='bold'%3E%E2%B5%A3%3C/text%3E%3C/svg%3E",
};

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  fr: 'ltr',
  en: 'ltr',
  ar: 'rtl',
  kab: 'ltr',
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}