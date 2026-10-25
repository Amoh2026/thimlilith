import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Thimlilith | ⵜⵉⵎⵍⵉⵍⵉⵜ',
  description: 'The Gathering. Connect with the Kabyle community.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen flex flex-col bg-[#0f172a]">
        {children}
        <Analytics />
      </body>
    </html>
  );
}