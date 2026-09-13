import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { mergeClassNames } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;
const SelectGroup = SelectPrimitive.Group;

const SelectTrigger = forwardRef<ElementRef<typeof SelectPrimitive.Trigger>, ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(
  function SelectTrigger({ className, children, ...selectTriggerProps }, selectTriggerRef) {
    return (
      <SelectPrimitive.Trigger
        ref={selectTriggerRef}
        className={mergeClassNames(
          "flex min-h-10 w-full items-center justify-between gap-2 rounded-control border border-border bg-background px-3 text-sm text-foreground outline-none",
          "focus:border-accent disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...selectTriggerProps}
      >
        {children}

        <SelectPrimitive.Icon asChild>
          <ChevronDown
            size={16}
            className="text-muted"
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
    );
  },
);

const SelectContent = forwardRef<ElementRef<typeof SelectPrimitive.Content>, ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(
  function SelectContent({ className, children, position = "popper", ...selectContentProps }, selectContentRef) {
    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          ref={selectContentRef}
          position={position}
          className={mergeClassNames(
            "z-50 max-h-80 min-w-(--radix-select-trigger-width) overflow-hidden rounded-control border border-border bg-surface shadow-xl",
            position === "popper" && "translate-y-1",
            className,
          )}
          {...selectContentProps}
        >
          <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    );
  },
);

const SelectItem = forwardRef<ElementRef<typeof SelectPrimitive.Item>, ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(function SelectItem(
  { className, children, ...selectItemProps },
  selectItemRef,
) {
  return (
    <SelectPrimitive.Item
      ref={selectItemRef}
      className={mergeClassNames(
        "relative flex min-h-9 cursor-pointer select-none items-center rounded-control py-1.5 pl-8 pr-3 text-sm text-foreground outline-none",
        "data-highlighted:bg-surface-2 data-[state=checked]:text-accent",
        className,
      )}
      {...selectItemProps}
    >
      <span className="absolute left-2.5 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check size={14} />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});

export { Select, SelectValue, SelectGroup, SelectTrigger, SelectContent, SelectItem };
