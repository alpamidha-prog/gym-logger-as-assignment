'use client';

import { useEffect, useState } from 'react';
import { X, Undo2 } from 'lucide-react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export default function UndoToast({ message, onUndo, onDismiss, duration = 5000 }: UndoToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm animate-slide-up"
    >
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}
      >
        <p className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {message}
        </p>
        <button
          onClick={onUndo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all active:scale-95"
          style={{ color: 'var(--accent)' }}
        >
          <Undo2 size={14} />
          Undo
        </button>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg transition-all active:scale-90"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <X size={16} />
        </button>
        <div
          className="absolute bottom-0 left-0 h-0.5 transition-all"
          style={{
            width: `${progress}%`,
            backgroundColor: 'var(--accent)',
          }}
        />
      </div>
    </div>
  );
}

interface SuccessToastProps {
  message: string;
  onDismiss: () => void;
  duration?: number;
}

export function SuccessToast({ message, onDismiss, duration = 3000 }: SuccessToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm animate-slide-up">
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg"
        style={{
          backgroundColor: 'var(--success)',
          color: '#fff',
        }}
      >
        <p className="flex-1 text-sm font-bold">{message}</p>
        <button onClick={onDismiss} className="p-1 rounded-lg active:scale-90">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
