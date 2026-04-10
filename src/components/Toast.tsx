'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export default function Toast({ message, onUndo, onDismiss, duration = 5000 }: ToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
      <span className="flex-1 text-sm">{message}</span>
      <button
        onClick={onUndo}
        className="text-amber-400 font-semibold text-sm hover:text-amber-300 shrink-0"
      >
        Annuler
      </button>
      <div className="absolute bottom-0 left-0 h-0.5 bg-amber-400 rounded-b-lg transition-all" style={{ width: `${progress}%` }} />
    </div>
  );
}
