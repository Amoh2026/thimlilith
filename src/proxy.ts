import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from '@/lib/i18n';

// Initialize next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. BYPASS SSO (CRITICAL FIX)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/sso') ||  
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Run next-intl middleware for all other pages
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sso).*)'],
};