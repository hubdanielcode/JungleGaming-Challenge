import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";
import { mergeClassNames } from "@/lib/utils";

const RadioGroup = forwardRef<ElementRef<typeof RadioGroupPrimitive.Root>, ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>>(
  function RadioGroup({ className, ...radioGroupProps }, radioGroupRef) {
    return (
      <RadioGroupPrimitive.Root
        ref={radioGroupRef}
        className={mergeClassNames("grid gap-3", className)}
        {...radioGroupProps}
      />
    );
  },
);

const RadioGroupItem = forwardRef<ElementRef<typeof RadioGroupPrimitive.Item>, ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>>(
  function RadioGroupItem({ className, ...radioGroupItemProps }, radioGroupItemRef) {
    return (
      <RadioGroupPrimitive.Item
        ref={radioGroupItemRef}
        className={mergeClassNames(
          "flex size-5 shrink-0 items-center justify-center rounded-full border border-border-strong text-accent outline-none",
          "data-[state=checked]:border-accent focus-visible:ring-2 focus-visible:ring-accent-strong",
          className,
        )}
        {...radioGroupItemProps}
      >
        <RadioGroupPrimitive.Indicator>
          <Circle
            size={10}
            className="fill-accent text-accent"
          />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
    );
  },
);

export { RadioGroup, RadioGroupItem };
