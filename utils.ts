/**
 * UUID generator that works in both secure (HTTPS) and non-secure (HTTP) contexts.
 * crypto.randomUUID() is only available in secure contexts; this falls back to
 * a Math.random-based v4 UUID when accessed over plain HTTP.
 */
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: RFC 4122 v4 UUID via Math.random
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
