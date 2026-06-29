import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

let _nextId = 0;

const CONFIGS: Record<ToastType, { Icon: React.ElementType; bg: string; iconCls: string; textCls: string }> = {
  success: { Icon: CheckCircle, bg: 'bg-green-50 border-green-200', iconCls: 'text-green-500', textCls: 'text-green-800' },
  error:   { Icon: XCircle,     bg: 'bg-red-50 border-red-200',     iconCls: 'text-red-500',   textCls: 'text-red-800'   },
  warning: { Icon: AlertTriangle, bg: 'bg-amber-50 border-amber-200', iconCls: 'text-amber-500', textCls: 'text-amber-800' },
  info:    { Icon: Info,         bg: 'bg-blue-50 border-blue-200',   iconCls: 'text-blue-500',  textCls: 'text-blue-800'  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = ++_nextId;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none"
          role="region"
          aria-label="Notificações do sistema"
        >
          {toasts.map(t => {
            const { Icon, bg, iconCls, textCls } = CONFIGS[t.type];
            return (
              <div
                key={t.id}
                role="alert"
                className={`pointer-events-auto flex items-start gap-3 border rounded-xl px-4 py-3 shadow-lg min-w-[280px] max-w-[420px] ${bg}`}
              >
                <Icon size={18} className={`mt-0.5 shrink-0 ${iconCls}`} aria-hidden="true" />
                <p className={`text-sm flex-1 leading-snug ${textCls}`}>{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Fechar notificação"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
};
