import { forwardRef, type ButtonHTMLAttributes } from "react";
import { mergeClassNames } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant = "primary", ...buttonProps }, buttonRef) {
  const variantClassNames: Record<ButtonVariant, string> = {
    primary: "bg-accent text-accent-foreground hover:bg-accent-strong",
    secondary: "bg-surface-2 text-foreground hover:border-accent",
    ghost: "bg-transparent text-muted hover:bg-surface-2 hover:text-foreground",
    danger: "bg-danger text-white hover:opacity-90",
  };

  return (
    <button
      ref={buttonRef}
      className={mergeClassNames(
        "inline-flex min-h-10 items-center justify-center rounded-control border border-transparent px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variantClassNames[variant],
        className,
      )}
      {...buttonProps}
    />
  );
});

export { Button };
