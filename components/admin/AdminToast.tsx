'use client';
import { Icon } from '@/lib/icons';

export type AdminToastState = { type: 'success' | 'error'; message: string } | null;

type Props = {
  toast: AdminToastState;
};

export function AdminToast({ toast }: Props) {
  if (!toast) return null;

  return (
    <div
      className={`admin-toast admin-toast-${toast.type}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <Icon name={toast.type === 'success' ? 'check' : 'alert'} size={18} />
      <span>{toast.message}</span>
    </div>
  );
}
