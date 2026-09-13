import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const mergeClassNames = (...classNames: ClassValue[]) => {
  return twMerge(clsx(classNames));
};

export { mergeClassNames };
