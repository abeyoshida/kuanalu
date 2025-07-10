import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Not set";
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d instanceof Date 
    ? d.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    : String(date);
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  if (!name) return "?";
  
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Formats an error message for permission denied errors
 */
export function formatPermissionError(
  error: unknown, 
  defaultMessage = "You don't have permission to perform this action",
  resource?: string,
  action?: string
): string {
  // If we have resource and action, use a specific message
  if (resource && action) {
    return `You don't have permission to ${action} this ${resource}.`;
  }
  
  // If it's an Error object with a message
  if (error instanceof Error) {
    if (error.message.includes("permission")) {
      return error.message;
    }
  }
  
  // If it's a string that mentions permissions
  if (typeof error === "string" && error.toLowerCase().includes("permission")) {
    return error;
  }
  
  // Default message
  return defaultMessage;
}

/**
 * Checks if an error is a permission error
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.toLowerCase().includes("permission");
  }
  
  if (typeof error === "string") {
    return error.toLowerCase().includes("permission");
  }
  
  return false;
}

/**
 * Safely handles errors from server actions
 */
export function handleActionError(error: unknown): { 
  success: false; 
  message: string; 
  isPermissionError: boolean;
} {
  console.error("Action error:", error);
  
  const isPermError = isPermissionError(error);
  
  let message = "An unexpected error occurred";
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  }
  
  return {
    success: false,
    message,
    isPermissionError: isPermError
  };
}
