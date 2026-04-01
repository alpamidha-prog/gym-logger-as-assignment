'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, UtensilsCrossed, ClipboardList, Dumbbell, BarChart2, Settings } from 'lucide-react';

const tabs = [
  { href: '/', label: 'Workout', icon: Activity },
  { href: '/diet', label: 'Diet', icon: UtensilsCrossed },
  { href: '/templates', label: 'Templates', icon: ClipboardList },
  { href: '/movements', label: 'Moves', icon: Dumbbell },
  { href: '/history', label: 'History', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div
        className="w-full max-w-lg"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid var(--glass-border)',
        }}
      >
        <div className="flex items-center justify-around px-1 pt-2 pb-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all active:scale-90 ${
                  isActive
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--accent)]'
                }`}
                style={isActive ? { filter: 'drop-shadow(0 0 6px var(--accent))' } : {}}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-transform ${isActive ? 'scale-110' : ''}`}
                />
                <span
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ letterSpacing: '0.05em' }}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <span
                    className="w-1 h-1 rounded-full mt-0.5"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                )}
              </Link>
            );
          })}
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>
    </nav>
  );
}
