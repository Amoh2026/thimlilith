import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import '@/app/globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { locales } from '@/lib/i18n';
import MobileBottomNav from '@/components/MobileBottomNav'; // 👈 Make sure this is imported

export const metadata: Metadata = {
  title: 'Thimlilith | ⵜⵉⵎⵍⵉⵍⵉⵜ',
  description: 'The Gathering. Connect with the Kabyle community.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body className="min-h-screen bg-[#0f172a]">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AuthProvider>
            {children}
            {/* 👇 MOBILE BOTTOM NAV MUST BE HERE 👇 */}
            <MobileBottomNav /> 
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}