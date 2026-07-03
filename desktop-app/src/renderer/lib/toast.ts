// Lightweight in-app toast — dispatches a custom DOM event that the Toaster
// component in App.tsx listens for. No context or prop-drilling needed.

export type ToastKind = 'success' | 'error' | 'info'

export interface ToastEvent {
  message: string
  kind: ToastKind
}

export function toast(message: string, kind: ToastKind = 'info') {
  window.dispatchEvent(new CustomEvent<ToastEvent>('app:toast', { detail: { message, kind } }))
}
