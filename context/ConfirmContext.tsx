import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  danger?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<{ confirmAction: ConfirmFn }>({
  confirmAction: async () => window.confirm(''),
});

export const useConfirm = () => useContext(ConfirmContext);

interface PendingConfirm extends ConfirmOptions {
  message: string;
}

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | undefined>(undefined);

  const confirmAction = useCallback<ConfirmFn>((message, options) => {
    return new Promise<boolean>(resolve => {
      resolverRef.current = resolve;
      setPending({ message, ...options });
    });
  }, []);

  const resolve = (value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = undefined;
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirmAction }}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => resolve(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-sm p-6"
            role="alertdialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${pending.danger ? 'bg-red-50' : 'bg-blue-50'}`}>
                {pending.danger
                  ? <AlertTriangle size={18} className="text-red-500" />
                  : <HelpCircle size={18} className="text-blue-500" />}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-800">{pending.title ?? 'Confirmação'}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{pending.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => resolve(false)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all shadow-sm"
              >
                {pending.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={() => resolve(true)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl active:scale-95 transition-all shadow-sm ${
                  pending.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {pending.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
