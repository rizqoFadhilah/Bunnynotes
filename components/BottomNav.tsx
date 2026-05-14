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
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-surface-container shadow-[0_-4px_10px_rgba(0,0,0,0.05),0_-4px_0_0_rgba(255,255,255,1)] rounded-t-[2rem]">
      {links.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              'flex flex-col items-center justify-center transition-colors',
              isActive
                ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-2 shadow-[4px_4px_0_0_#81515b] ring-2 ring-white scale-95 duration-150 relative -top-2'
                : 'text-on-surface-variant opacity-70 hover:bg-secondary-container/50 p-2 rounded-xl'
            )}
          >
            <Icon className="w-6 h-6 mb-1" strokeWidth={isActive ? 2.5 : 2} />
            <span className={clsx('text-[10px] sm:text-[11px]', isActive && 'font-bold')}>
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
