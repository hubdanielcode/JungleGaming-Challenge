import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { mergeClassNames } from "@/lib/utils";

const Label = forwardRef<ElementRef<typeof LabelPrimitive.Root>, ComponentPropsWithoutRef<typeof LabelPrimitive.Root>>(function Label(
  { className, ...labelProps },
  labelRef,
) {
  return (
    <LabelPrimitive.Root
      ref={labelRef}
      className={mergeClassNames("text-sm font-medium text-muted", className)}
      {...labelProps}
    />
  );
});

export { Label };
