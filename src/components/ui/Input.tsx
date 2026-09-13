import { forwardRef, type InputHTMLAttributes } from "react";
import { mergeClassNames } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  errorMessage?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, errorMessage, id, className, ...inputProps }, inputRef) {
  return (
    <label
      className="grid gap-2 text-sm text-muted"
      htmlFor={id}
    >
      {label ? <span>{label}</span> : null}

      <input
        ref={inputRef}
        id={id}
        className={mergeClassNames(
          "min-h-10 w-full rounded-control border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-2 focus:border-accent",
          errorMessage && "border-danger",
          className,
        )}
        {...inputProps}
      />

      {errorMessage ? <span className="text-xs text-danger">{errorMessage}</span> : null}
    </label>
  );
});

export { Input };
