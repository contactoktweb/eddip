'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AdminToastState } from '@/components/admin/AdminToast';

const TOAST_DURATION_MS = 3500;

export function useAdminToast() {
  const [toast, setToast] = useState<AdminToastState>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ type, message });
    timerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { toast, showToast };
}
