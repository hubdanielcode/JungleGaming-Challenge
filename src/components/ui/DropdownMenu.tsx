import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { mergeClassNames } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(function DropdownMenuContent({ className, sideOffset = 8, ...dropdownMenuContentProps }, dropdownMenuContentRef) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={dropdownMenuContentRef}
        sideOffset={sideOffset}
        className={mergeClassNames(
          "z-50 min-w-46 overflow-hidden rounded-control border border-border bg-surface p-1 shadow-xl",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className,
        )}
        {...dropdownMenuContentProps}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

const DropdownMenuItem = forwardRef<ElementRef<typeof DropdownMenuPrimitive.Item>, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>>(
  function DropdownMenuItem({ className, ...dropdownMenuItemProps }, dropdownMenuItemRef) {
    return (
      <DropdownMenuPrimitive.Item
        ref={dropdownMenuItemRef}
        className={mergeClassNames(
          "flex min-h-9 cursor-pointer select-none items-center gap-2 rounded-control px-3 text-sm text-foreground outline-none transition-colors",
          "data-highlighted:bg-surface-2",
          className,
        )}
        {...dropdownMenuItemProps}
      />
    );
  },
);

const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(function DropdownMenuSeparator({ className, ...dropdownMenuSeparatorProps }, dropdownMenuSeparatorRef) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={dropdownMenuSeparatorRef}
      className={mergeClassNames("my-1 h-px bg-border", className)}
      {...dropdownMenuSeparatorProps}
    />
  );
});

const DropdownMenuLabel = forwardRef<ElementRef<typeof DropdownMenuPrimitive.Label>, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>>(
  function DropdownMenuLabel({ className, ...dropdownMenuLabelProps }, dropdownMenuLabelRef) {
    return (
      <DropdownMenuPrimitive.Label
        ref={dropdownMenuLabelRef}
        className={mergeClassNames("px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-2", className)}
        {...dropdownMenuLabelProps}
      />
    );
  },
);

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel };
