// src/app/[locale]/page.tsx
import { redirect } from 'next/navigation';

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  // 👇 Next.js 16: must await params
  const resolvedParams = await params; 
  const activeLocale = resolvedParams?.locale || 'en';
  
  redirect(`/${activeLocale}/rooms`);
}