'use client';

import Link from 'next/link';
import { Home, Wallet, CalendarDays, Receipt, User } from 'lucide-react';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/money', icon: Wallet, label: 'Money' },
    { href: '/planner', icon: CalendarDays, label: 'Planner' },
    { href: '/budget', icon: Receipt, label: 'Budget' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-6 left-4 right-4 z-50 flex justify-around items-center px-2 py-3 clay-card [--clay-card-bg:rgba(255,255,255,0.95)] border-white/60">
      {links.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              'flex flex-col items-center justify-center transition-all',
              isActive
                ? 'clay-button w-14 h-14 -top-6 absolute z-10 [--clay-btn-bg:var(--color-primary)] [--clay-btn-highlight:rgba(255,255,255,0.5)]'
                : 'text-on-surface-variant opacity-60 p-3 rounded-2xl decoration-none'
            )}
            style={{ 
              position: isActive ? 'relative' : 'initial',
              marginTop: isActive ? '-1.5rem' : '0'
            }}
          >
            <Icon className={clsx("w-6 h-6", isActive && "mb-0 text-white")} strokeWidth={isActive ? 2.5 : 2} />
            {!isActive && <span className="text-[10px] mt-1 font-medium">{link.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
