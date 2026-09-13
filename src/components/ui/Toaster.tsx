import { useToast } from "@/hooks/useToast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "./Toast";

/* - Deve ser montado uma única vez, próximo à raiz da aplicação, dentro de AppShell ou App. - */

const Toaster = () => {
  const { toasts: activeToasts } = useToast();

  return (
    <ToastProvider>
      {activeToasts.map(({ id: toastId, title: toastTitle, description: toastDescription, variant: toastVariant, isOpen: toastIsOpen }) => (
        <Toast
          key={toastId}
          variant={toastVariant}
          open={toastIsOpen}
        >
          <div className="grid gap-1">
            {toastTitle ? <ToastTitle>{toastTitle}</ToastTitle> : null}
            {toastDescription ? <ToastDescription>{toastDescription}</ToastDescription> : null}
          </div>

          <ToastClose />
        </Toast>
      ))}

      <ToastViewport />
    </ToastProvider>
  );
};

export { Toaster };
