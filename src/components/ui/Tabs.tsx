import { createContext, forwardRef, useContext, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { mergeClassNames } from "@/lib/utils";

type TabsVisualVariant = "pill" | "underline";

const TabsVisualVariantContext = createContext<TabsVisualVariant>("pill");

const Tabs = TabsPrimitive.Root;

interface TabsListProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: TabsVisualVariant;
}

const TabsList = forwardRef<ElementRef<typeof TabsPrimitive.List>, TabsListProps>(function TabsList(
  { className, variant = "pill", ...tabsListProps },
  tabsListRef,
) {
  return (
    <TabsVisualVariantContext.Provider value={variant}>
      <TabsPrimitive.List
        ref={tabsListRef}
        className={mergeClassNames(
          variant === "pill"
            ? "inline-flex items-center gap-1 rounded-control bg-surface p-1"
            : "inline-flex items-center gap-6 border-b border-border",
          className,
        )}
        {...tabsListProps}
      />
    </TabsVisualVariantContext.Provider>
  );
});

const TabsTrigger = forwardRef<ElementRef<typeof TabsPrimitive.Trigger>, ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(function TabsTrigger(
  { className, ...tabsTriggerProps },
  tabsTriggerRef,
) {
  const tabsVisualVariant = useContext(TabsVisualVariantContext);

  return (
    <TabsPrimitive.Trigger
      ref={tabsTriggerRef}
      className={mergeClassNames(
        tabsVisualVariant === "pill"
          ? [
              "min-h-9 rounded-control px-4 text-sm font-semibold text-muted transition-colors",
              "data-[state=active]:bg-accent data-[state=active]:text-accent-foreground",
              "hover:not-data-[state=active]:text-foreground",
            ]
          : [
              "min-h-10 border-b-2 border-transparent px-1 pb-3 text-sm text-muted transition-colors",
              "data-[state=active]:border-accent data-[state=active]:font-semibold data-[state=active]:text-accent",
              "hover:not-data-[state=active]:text-foreground",
            ],
        className,
      )}
      {...tabsTriggerProps}
    />
  );
});

const TabsContent = forwardRef<ElementRef<typeof TabsPrimitive.Content>, ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(function TabsContent(
  { className, ...tabsContentProps },
  tabsContentRef,
) {
  return (
    <TabsPrimitive.Content
      ref={tabsContentRef}
      className={mergeClassNames("mt-4 focus-visible:outline-none", className)}
      {...tabsContentProps}
    />
  );
});

export { Tabs, TabsList, TabsTrigger, TabsContent };
