import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Thimlilith | ⵜⵉⵎⵍⵉⵍⵉⵜ',
  description: 'The Gathering. Connect with the Kabyle community.',
};

// 👇 THIS IS THE FIX FOR THE MOBILE BOTTOM BAR 👇
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
      <body className="h-[100dvh] w-full overflow-hidden bg-[#0f172a]">
  {children}
</body>
    </html>
  );
}