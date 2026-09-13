import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { mergeClassNames } from "@/lib/utils";

type ToastVariant = "default" | "success" | "danger";

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = forwardRef<ElementRef<typeof ToastPrimitive.Viewport>, ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>>(
  function ToastViewport({ className, ...toastViewportProps }, toastViewportRef) {
    return (
      <ToastPrimitive.Viewport
        ref={toastViewportRef}
        className={mergeClassNames("fixed bottom-0 right-0 z-100 flex w-full max-w-sm flex-col gap-3 p-4 sm:p-6", className)}
        {...toastViewportProps}
      />
    );
  },
);

interface ToastRootProps extends ComponentPropsWithoutRef<typeof ToastPrimitive.Root> {
  variant?: ToastVariant;
}

const Toast = forwardRef<ElementRef<typeof ToastPrimitive.Root>, ToastRootProps>(function Toast(
  { className, variant = "default", ...toastProps },
  toastRef,
) {
  const variantClassNames: Record<ToastVariant, string> = {
    default: "border-border bg-surface",
    success: "border-success bg-surface",
    danger: "border-danger bg-surface",
  };

  return (
    <ToastPrimitive.Root
      ref={toastRef}
      className={mergeClassNames(
        "relative grid w-full gap-1 rounded-card border p-4 pr-8 shadow-xl",
        "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-80",
        "data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x)",
        variantClassNames[variant],
        className,
      )}
      {...toastProps}
    />
  );
});

const ToastTitle = forwardRef<ElementRef<typeof ToastPrimitive.Title>, ComponentPropsWithoutRef<typeof ToastPrimitive.Title>>(function ToastTitle(
  { className, ...toastTitleProps },
  toastTitleRef,
) {
  return (
    <ToastPrimitive.Title
      ref={toastTitleRef}
      className={mergeClassNames("text-sm font-semibold text-foreground", className)}
      {...toastTitleProps}
    />
  );
});

const ToastDescription = forwardRef<ElementRef<typeof ToastPrimitive.Description>, ComponentPropsWithoutRef<typeof ToastPrimitive.Description>>(
  function ToastDescription({ className, ...toastDescriptionProps }, toastDescriptionRef) {
    return (
      <ToastPrimitive.Description
        ref={toastDescriptionRef}
        className={mergeClassNames("text-sm text-muted", className)}
        {...toastDescriptionProps}
      />
    );
  },
);

const ToastClose = forwardRef<ElementRef<typeof ToastPrimitive.Close>, ComponentPropsWithoutRef<typeof ToastPrimitive.Close>>(function ToastClose(
  { className, ...toastCloseProps },
  toastCloseRef,
) {
  return (
    <ToastPrimitive.Close
      ref={toastCloseRef}
      className={mergeClassNames("absolute right-2 top-2 text-muted transition-colors hover:text-foreground", className)}
      toast-close=""
      {...toastCloseProps}
    >
      <X size={16} />
      <span className="sr-only">Fechar notificação</span>
    </ToastPrimitive.Close>
  );
});

const ToastAction = forwardRef<ElementRef<typeof ToastPrimitive.Action>, ComponentPropsWithoutRef<typeof ToastPrimitive.Action>>(function ToastAction(
  { className, ...toastActionProps },
  toastActionRef,
) {
  return (
    <ToastPrimitive.Action
      ref={toastActionRef}
      className={mergeClassNames(
        "mt-2 inline-flex min-h-8 items-center justify-center rounded-control border border-border-strong px-3 text-xs font-semibold text-foreground transition-colors hover:border-accent",
        className,
      )}
      {...toastActionProps}
    />
  );
});

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction };
export type { ToastVariant };
