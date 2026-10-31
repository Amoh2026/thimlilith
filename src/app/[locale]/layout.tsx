import { Suspense } from 'react';
import MobileBottomNav from '@/components/MobileBottomNav';

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col pb-16 md:pb-0 relative min-h-screen">
      {children}
      <Suspense fallback={null}>
        <MobileBottomNav />
      </Suspense>
    </div>
  );
}