import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names, resolving conflicts so the last-declared utility
 * wins. Every reno component uses this for its `className` prop so consumers can
 * override styling without fighting specificity.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
