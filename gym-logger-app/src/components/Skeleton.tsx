'use client';

import { ReactNode } from 'react';

export function SkeletonCard() {
  return (
    <div
      className="skeleton rounded-2xl h-24"
      style={{ backgroundColor: 'var(--bg-tertiary)' }}
    />
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function StaggeredList({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 animate-fade-in">{children}</div>;
}
