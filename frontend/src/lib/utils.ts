import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number according to the Indian numbering system (e.g., ₹1,99,000)
 */
export function formatIndianNumber(amount: number, hideSymbol = false): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: hideSymbol ? 'decimal' : 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
  return formatter.format(amount);
}
