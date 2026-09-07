import type { ToastType } from '@/contexts/ToastContext';

/**
 * Puente entre el interceptor de Axios (fuera del arbol de React)
 * y el ToastProvider (dentro del arbol de React).
 *
 * El ToastProvider registra su funcion addToast aqui al montarse,
 * y el interceptor de Axios la invoca cuando recibe respuestas
 * con mensajes del backend.
 */

type ToastHandler = (toast: {
  type: ToastType;
  title: string;
  message?: string;
}) => void;

let handler: ToastHandler | null = null;

export function setToastHandler(fn: ToastHandler): void {
  handler = fn;
}

export function clearToastHandler(): void {
  handler = null;
}

export function showToastFromInterceptor(
  type: ToastType,
  title: string,
  message?: string
): void {
  if (handler) {
    handler({ type, title, message });
  }
}

/**
 * Verifica si un error de Axios ya fue mostrado como toast por el interceptor.
 * Los componentes deben usar esto en sus bloques catch para evitar
 * mostrar toasts duplicados.
 *
 * Uso:
 *   } catch (err) {
 *     if (!isToastAlreadyShown(err)) {
 *       addToast({ type: 'error', ... });
 *     }
 *   }
 */
export function isToastAlreadyShown(err: unknown): boolean {
  return (err as { __toastShown?: boolean })?.__toastShown === true;
}
