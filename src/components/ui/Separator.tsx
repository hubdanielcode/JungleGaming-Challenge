import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { mergeClassNames } from "@/lib/utils";

const Separator = forwardRef<ElementRef<typeof SeparatorPrimitive.Root>, ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>>(function Separator(
  { className, orientation = "horizontal", decorative = true, ...separatorProps },
  separatorRef,
) {
  return (
    <SeparatorPrimitive.Root
      ref={separatorRef}
      orientation={orientation}
      decorative={decorative}
      className={mergeClassNames("shrink-0 bg-border", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)}
      {...separatorProps}
    />
  );
});

export { Separator };
