// src/components/ui/LanguageSwitcher.tsx
'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { locales, localeFlags, localeNames, type Locale } from '@/lib/i18n';

interface Props {
  onSwitch?: () => void;
  direction?: 'up' | 'down';
}

export default function LanguageSwitcher({ onSwitch, direction = 'up' }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = ((params?.locale as string) || 'en') as Locale;
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const switchTo = (target: Locale) => {
    setIsOpen(false);
    const segments = pathname.split('/');
    if (segments[1] === currentLocale) segments[1] = target;
    else segments.splice(1, 0, target);
    const newPath = segments.join('/') || `/${target}`;
    startTransition(() => {
      router.push(newPath);
      onSwitch?.();
    });
  };

  const currentFlag = localeFlags[currentLocale];
  const dropdownPos =
    direction === 'up' ? 'bottom-full mb-2 left-0' : 'top-full mt-2 left-0';

  // 👇 This filters out the current language so only the other 3 show in the menu 👇
  const otherLocales = locales.filter((loc) => loc !== currentLocale);

  return (
    <div className="relative" ref={wrapRef}>
      {/* Trigger Button - Shows ONLY the currently active language */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        disabled={isPending}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Change Language"
        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#1e293b] border border-slate-700 hover:border-slate-500 transition ${
          isPending ? 'opacity-60 pointer-events-none' : ''
        }`}
      >
        <img src={currentFlag} alt={currentLocale} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu - Shows ONLY the other 3 languages */}
      {isOpen && (
        <div
          role="menu"
          className={`absolute ${dropdownPos} w-40 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl py-1 z-[100] animate-in fade-in zoom-in-95 duration-150`}
        >
          {otherLocales.map((loc) => {
            const flag = localeFlags[loc];
            return (
              <button
                key={loc}
                role="menuitem"
                type="button"
                onClick={() => switchTo(loc)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <div className="flex items-center gap-3">
                  <img src={flag} alt={loc} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                  <span className="font-medium">{localeNames[loc]}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}