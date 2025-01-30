import React, { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onClose: () => void;
  duration?: number;
}

export function UndoToast({ message, onUndo, onClose, duration = 30000 }: UndoToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up">
      <p>{message}</p>
      <button
        onClick={onUndo}
        className="flex items-center gap-1 text-indigo-300 hover:text-indigo-200"
      >
        <RotateCcw className="w-4 h-4" />
        Undo
      </button>
    </div>
  );
}