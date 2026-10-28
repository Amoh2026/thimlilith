// src/middleware.ts
// Locale-based URL redirect. Uses an allowlist so that paths like
// /enterprise or /english don't get mistaken for /en routes.
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Add more locales here as their UI strings become available.
const LOCALES = ['en', 'fr', 'ar', 'kab'] as const

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip static assets, api routes, and files with extensions
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Already localized? (exact segment match — /en, /en/x, but NOT /enterprise)
  const firstSegment = pathname.split('/')[1]
  if (LOCALES.includes(firstSegment as any)) {
    return NextResponse.next()
  }

  // Default: redirect to English
  return NextResponse.redirect(new URL(`/en${pathname}`, request.url))
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}