"use client";

import { useCallback, useRef, useState } from "react";

type ToastState = { message: string; type: "success" | "error" } | null;

export function useAdminToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const ToastEl = toast ? (
    <div className={`toast ${toast.type}`} role="status">
      {toast.message}
    </div>
  ) : null;

  return { showToast, ToastEl };
}
