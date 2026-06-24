import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>();

  const confirm = useCallback((msg: string) => {
    setMessage(msg);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleClose = useCallback((value: boolean) => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(value);
    }
  }, [resolvePromise]);

  const ConfirmDialog = useCallback(() => {
    if (!isOpen) return null;

    return createPortal(
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-scale-in">
        <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-900/30">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-display">Are you sure?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
          </div>
          <div className="flex border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
            <button
              className="flex-1 py-3.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => handleClose(false)}
            >
              Cancel
            </button>
            <div className="w-[1px] bg-slate-200 dark:bg-slate-800" />
            <button
              className="flex-1 py-3.5 text-sm font-bold text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              onClick={() => handleClose(true)}
            >
              Yes, confirm
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }, [isOpen, message, handleClose]);

  return { confirm, ConfirmDialog };
};
