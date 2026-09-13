import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { mergeClassNames } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = forwardRef<ElementRef<typeof DialogPrimitive.Overlay>, ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>>(
  function DialogOverlay({ className, ...dialogOverlayProps }, dialogOverlayRef) {
    return (
      <DialogPrimitive.Overlay
        ref={dialogOverlayRef}
        className={mergeClassNames(
          "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          className,
        )}
        {...dialogOverlayProps}
      />
    );
  },
);

const DialogContent = forwardRef<ElementRef<typeof DialogPrimitive.Content>, ComponentPropsWithoutRef<typeof DialogPrimitive.Content>>(
  function DialogContent({ className, children, ...dialogContentProps }, dialogContentRef) {
    return (
      <DialogPortal>
        <DialogOverlay />

        <DialogPrimitive.Content
          ref={dialogContentRef}
          className={mergeClassNames(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-105 -translate-x-1/2 -translate-y-1/2",
            "rounded-card border border-border bg-surface p-6 shadow-xl",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            className,
          )}
          {...dialogContentProps}
        >
          {children}

          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-control text-muted transition-colors hover:text-foreground focus-visible:outline-none">
            <X size={18} />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  },
);

const DialogHeader = ({ className, ...dialogHeaderProps }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={mergeClassNames("mb-5 grid gap-1.5 text-center", className)}
    {...dialogHeaderProps}
  />
);

const DialogFooter = ({ className, ...dialogFooterProps }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={mergeClassNames("mt-5 flex flex-col gap-3", className)}
    {...dialogFooterProps}
  />
);

const DialogTitle = forwardRef<ElementRef<typeof DialogPrimitive.Title>, ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(function DialogTitle(
  { className, ...dialogTitleProps },
  dialogTitleRef,
) {
  return (
    <DialogPrimitive.Title
      ref={dialogTitleRef}
      className={mergeClassNames("font-display text-xl font-bold uppercase tracking-wide text-foreground", className)}
      {...dialogTitleProps}
    />
  );
});

const DialogDescription = forwardRef<ElementRef<typeof DialogPrimitive.Description>, ComponentPropsWithoutRef<typeof DialogPrimitive.Description>>(
  function DialogDescription({ className, ...dialogDescriptionProps }, dialogDescriptionRef) {
    return (
      <DialogPrimitive.Description
        ref={dialogDescriptionRef}
        className={mergeClassNames("text-sm text-muted", className)}
        {...dialogDescriptionProps}
      />
    );
  },
);

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
