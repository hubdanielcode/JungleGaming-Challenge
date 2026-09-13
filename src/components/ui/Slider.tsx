import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { mergeClassNames } from "@/lib/utils";

const Slider = forwardRef<ElementRef<typeof SliderPrimitive.Root>, ComponentPropsWithoutRef<typeof SliderPrimitive.Root>>(function Slider(
  { className, ...sliderProps },
  sliderRef,
) {
  return (
    <SliderPrimitive.Root
      ref={sliderRef}
      className={mergeClassNames("relative flex w-full touch-none select-none items-center py-2", className)}
      {...sliderProps}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-surface-2">
        <SliderPrimitive.Range className="absolute h-full bg-accent" />
      </SliderPrimitive.Track>

      <SliderPrimitive.Thumb className="block size-4 rounded-full border-2 border-accent bg-background outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-accent-strong" />

      <SliderPrimitive.Thumb className="block size-4 rounded-full border-2 border-accent bg-background outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-accent-strong" />
    </SliderPrimitive.Root>
  );
});

export { Slider };
