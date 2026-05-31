// // utils/errorHandler.ts

// export interface ApiError {
//   message: string;
//   status: number;
//   code?: string;
//   details?: any;
//   timestamp: Date;
// }

// export class AppError extends Error {
//   public status: number;
//   public code?: string;
//   public details?: any;
//   public timestamp: Date;

//   constructor(message: string, status: number = 500, code?: string, details?: any) {
//     super(message);
//     this.name = 'AppError';
//     this.status = status;
//     this.code = code;
//     this.details = details;
//     this.timestamp = new Date();
    
//     // Maintains proper stack trace for where our error was thrown
//     if (Error.captureStackTrace) {
//       Error.captureStackTrace(this, AppError);
//     }
//   }
// }

// // Error codes mapping
// export const ERROR_CODES = {
//   // Network Errors
//   NETWORK_ERROR: 'NETWORK_ERROR',
//   TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
//   // HTTP Errors
//   UNAUTHORIZED: 'UNAUTHORIZED',
//   FORBIDDEN: 'FORBIDDEN',
//   NOT_FOUND: 'NOT_FOUND',
//   VALIDATION_ERROR: 'VALIDATION_ERROR',
//   SERVER_ERROR: 'SERVER_ERROR',
  
//   // Business Logic Errors
//   INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
//   PRODUCT_UNAVAILABLE: 'PRODUCT_UNAVAILABLE',
//   CART_ITEM_LIMIT: 'CART_ITEM_LIMIT',
  
//   // Authentication Errors
//   TOKEN_EXPIRED: 'TOKEN_EXPIRED',
//   INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
//   // Payment Errors
//   PAYMENT_FAILED: 'PAYMENT_FAILED',
//   INVALID_PAYMENT_METHOD: 'INVALID_PAYMENT_METHOD',
// } as const;

// // User-friendly error messages
// export const ERROR_MESSAGES = {
//   [ERROR_CODES.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
//   [ERROR_CODES.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
//   [ERROR_CODES.UNAUTHORIZED]: 'Please log in to continue.',
//   [ERROR_CODES.FORBIDDEN]: 'You do not have permission to perform this action.',
//   [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found.',
//   [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
//   [ERROR_CODES.SERVER_ERROR]: 'Something went wrong on our end. Please try again later.',
//   [ERROR_CODES.INSUFFICIENT_STOCK]: 'Sorry, this product is out of stock.',
//   [ERROR_CODES.PRODUCT_UNAVAILABLE]: 'This product is currently unavailable.',
//   [ERROR_CODES.CART_ITEM_LIMIT]: 'Cart item limit reached.',
//   [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
//   [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password.',
//   [ERROR_CODES.PAYMENT_FAILED]: 'Payment failed. Please try again or use a different payment method.',
//   [ERROR_CODES.INVALID_PAYMENT_METHOD]: 'Invalid payment method.',
  
//   DEFAULT: 'An unexpected error occurred. Please try again.',
// } as const;

// export const handleApiError = (error: any): AppError => {
//   console.error('API Error:', error);

//   // Handle Axios errors
//   if (error.isAxiosError) {
//     return handleAxiosError(error);
//   }

//   // Handle our custom AppError
//   if (error instanceof AppError) {
//     return error;
//   }

//   // Handle generic errors
//   return handleGenericError(error);
// };

// const handleAxiosError = (error: any): AppError => {
//   const { response, code, message, request } = error;

//   // Network errors (no response)
//   if (!response) {
//     if (code === 'ECONNABORTED' || message?.includes('timeout')) {
//       return new AppError(
//         ERROR_MESSAGES[ERROR_CODES.TIMEOUT_ERROR],
//         408,
//         ERROR_CODES.TIMEOUT_ERROR
//       );
//     }
    
//     if (request && !response) {
//       return new AppError(
//         ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
//         0,
//         ERROR_CODES.NETWORK_ERROR
//       );
//     }
//   }

//   const status = response?.status || 500;
//   const serverMessage = response?.data?.message || message;
//   const errorCode = response?.data?.code || getErrorCodeFromStatus(status);

//   return new AppError(
//     ERROR_MESSAGES[errorCode] || serverMessage || ERROR_MESSAGES.DEFAULT,
//     status,
//     errorCode,
//     response?.data?.details
//   );
// };

// const handleGenericError = (error: any): AppError => {
//   if (error instanceof Error) {
//     return new AppError(error.message, 500, ERROR_CODES.SERVER_ERROR);
//   }

//   return new AppError(
//     ERROR_MESSAGES.DEFAULT,
//     500,
//     ERROR_CODES.SERVER_ERROR
//   );
// };

// const getErrorCodeFromStatus = (status: number): string => {
//   switch (status) {
//     case 400:
//       return ERROR_CODES.VALIDATION_ERROR;
//     case 401:
//       return ERROR_CODES.UNAUTHORIZED;
//     case 403:
//       return ERROR_CODES.FORBIDDEN;
//     case 404:
//       return ERROR_CODES.NOT_FOUND;
//     case 408:
//       return ERROR_CODES.TIMEOUT_ERROR;
//     case 500:
//     case 502:
//     case 503:
//       return ERROR_CODES.SERVER_ERROR;
//     default:
//       return ERROR_CODES.SERVER_ERROR;
//   }
// };

// // Utility function to check if error is recoverable
// export const isRecoverableError = (error: AppError): boolean => {
//   const nonRecoverableStatuses = [400, 401, 403, 404];
//   return !nonRecoverableStatuses.includes(error.status);
// };

// // Utility function to get user-friendly message
// export const getUserFriendlyMessage = (error: AppError): string => {
//   return error.message || ERROR_MESSAGES.DEFAULT;
// };
// utils/errorHandler.ts
export const handleApiError = (error: any) => {
  if (error.response?.status === 401) {
    // Handle unauthorized access
    console.warn('Authentication required');
    // Optionally redirect to login or refresh tokens
    // window.location.href = '/login';
  }
  return error.response?.data?.message || 'An error occurred';
};