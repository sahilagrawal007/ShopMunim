// Debug utilities for better error tracking and debugging

export const DEBUG_MODE = __DEV__;

export const debugLog = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
};

export const debugError = (message: string, error?: any) => {
  if (DEBUG_MODE) {
    console.error(`[ERROR] ${message}`, error || '');
  }
};

export const debugWarn = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    console.warn(`[WARN] ${message}`, data || '');
  }
};

// Performance monitoring
export const measurePerformance = <T>(name: string, fn: () => T): T => {
  if (!DEBUG_MODE) return fn();
  
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`[PERF] ${name} took ${(end - start).toFixed(2)}ms`);
  return result;
};

// Async performance monitoring
export const measureAsyncPerformance = async <T>(
  name: string, 
  fn: () => Promise<T>
): Promise<T> => {
  if (!DEBUG_MODE) return fn();
  
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  console.log(`[PERF] ${name} took ${(end - start).toFixed(2)}ms`);
  return result;
};

// Validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

// Firebase error handling
export const getFirebaseErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  
  const errorCode = error?.code || error?.message;
  
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    default:
      return error?.message || 'An unexpected error occurred';
  }
};

// Network status check
export const checkNetworkStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD',
      timeout: 5000 
    });
    return response.ok;
  } catch {
    return false;
  }
}; 