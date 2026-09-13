import { useEffect, useState } from "react";
import type { ToastVariant } from "@/components/ui/Toast";

/* - Tempo que uma notificação permanece na fila antes de ser removida do DOM após o fechamento. - */

const TOAST_REMOVE_DELAY_IN_MILLISECONDS = 6000;
const MAXIMUM_VISIBLE_TOASTS = 3;

interface ToastRecord {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  isOpen: boolean;
}

type ToastInput = Omit<ToastRecord, "id" | "isOpen">;

/* - Estado global simples em memória, compartilhado por todos os componentes que chamam useToast. - */

let toastRecords: ToastRecord[] = [];

const toastStateListeners = new Set<(records: ToastRecord[]) => void>();
const pendingRemovalTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const notifyToastStateListeners = () => {
  for (const listener of toastStateListeners) {
    listener(toastRecords);
  }
};

const scheduleToastRemoval = (toastId: string) => {
  if (pendingRemovalTimeouts.has(toastId)) {
    return;
  }

  const timeoutHandle = setTimeout(() => {
    pendingRemovalTimeouts.delete(toastId);
    toastRecords = toastRecords.filter((toastRecord) => toastRecord.id !== toastId);
    notifyToastStateListeners();
  }, TOAST_REMOVE_DELAY_IN_MILLISECONDS);

  pendingRemovalTimeouts.set(toastId, timeoutHandle);
};

const dismissToast = (toastId: string) => {
  toastRecords = toastRecords.map((toastRecord) => (toastRecord.id === toastId ? { ...toastRecord, isOpen: false } : toastRecord));
  notifyToastStateListeners();
  scheduleToastRemoval(toastId);
};

const showToast = ({ title, description, variant = "default" }: ToastInput) => {
  const toastId = crypto.randomUUID();

  const newToastRecord: ToastRecord = { id: toastId, title, description, variant, isOpen: true };
  toastRecords = [newToastRecord, ...toastRecords].slice(0, MAXIMUM_VISIBLE_TOASTS);
  notifyToastStateListeners();

  return { id: toastId, dismiss: () => dismissToast(toastId) };
};

/* - Hook consumido pelo Toaster (para renderizar) e por qualquer feature que precise notificar o usuário. - */

const useToast = () => {
  const [currentToastRecords, setCurrentToastRecords] = useState(toastRecords);

  useEffect(() => {
    toastStateListeners.add(setCurrentToastRecords);
    return () => {
      toastStateListeners.delete(setCurrentToastRecords);
    };
  }, []);

  return { toasts: currentToastRecords, showToast, dismissToast };
};

export { useToast, showToast, dismissToast };
