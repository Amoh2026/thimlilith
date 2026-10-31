import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';   // ← NEW

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-[#0f172a]">
        <AuthProvider>{children}</AuthProvider>   {/* ← NEW wrapper */}
      </body>
    </html>
  );
}