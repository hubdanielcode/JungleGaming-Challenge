import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { mergeClassNames } from "@/lib/utils";

const Avatar = forwardRef<ElementRef<typeof AvatarPrimitive.Root>, ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>>(function Avatar(
  { className, ...avatarProps },
  avatarRef,
) {
  return (
    <AvatarPrimitive.Root
      ref={avatarRef}
      className={mergeClassNames("relative flex size-12 shrink-0 overflow-hidden rounded-full", className)}
      {...avatarProps}
    />
  );
});

const AvatarImage = forwardRef<ElementRef<typeof AvatarPrimitive.Image>, ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>>(function AvatarImage(
  { className, ...avatarImageProps },
  avatarImageRef,
) {
  return (
    <AvatarPrimitive.Image
      ref={avatarImageRef}
      className={mergeClassNames("size-full object-cover", className)}
      {...avatarImageProps}
    />
  );
});

const AvatarFallback = forwardRef<ElementRef<typeof AvatarPrimitive.Fallback>, ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>>(
  function AvatarFallback({ className, ...avatarFallbackProps }, avatarFallbackRef) {
    return (
      <AvatarPrimitive.Fallback
        ref={avatarFallbackRef}
        className={mergeClassNames("flex size-full items-center justify-center bg-surface-2 text-sm font-semibold text-muted", className)}
        {...avatarFallbackProps}
      />
    );
  },
);

export { Avatar, AvatarImage, AvatarFallback };
