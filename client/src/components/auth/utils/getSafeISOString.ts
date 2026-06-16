import { authLogger } from "@/lib/logger";
import { sentryTracker } from "@/lib/monitoring";

export const getSafeISOString = (dateValue: any): string | null => {
  try {
    if (!dateValue) return null;
    
    const date = new Date(dateValue);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      authLogger.error('Invalid date value:', dateValue);
      return null;
    }
    
    return date.toISOString();
  } catch (error) {
    sentryTracker(error, { source: "getSafeISOString" });
    authLogger.error('Error converting to ISO string:', error);
    return null;
  }
};
