// Pub/sub mínimo para propagar falhas de leitura (fetch) que hoje só iam para o
// console até a UI, sem exigir que cada tela conheça o serviço que a alimenta.
// Assinado uma única vez pelo ToastProvider (context/ToastContext.tsx).

type ErrorListener = (message: string) => void;

const listeners = new Set<ErrorListener>();

let lastEmit = 0;
const THROTTLE_MS = 3000; // evita rajada de toasts quando várias leituras falham juntas

export function onError(listener: ErrorListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitError(message: string): void {
  const now = Date.now();
  if (now - lastEmit < THROTTLE_MS) return;
  lastEmit = now;
  listeners.forEach(l => l(message));
}
