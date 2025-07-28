/**
 * Network retry utility with exponential backoff
 */

import { errorService } from '../services/errorService';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
}

/**
 * Default retry condition - retry on network errors and 5xx status codes
 */
const defaultRetryCondition = (error: any): boolean => {
  // Retry on network errors (no response)
  if (!error.response) {
    return true;
  }

  // Retry on server errors (5xx)
  if (error.response?.status >= 500) {
    return true;
  }

  // Retry on specific client errors that might be temporary
  if (error.response?.status === 408 || error.response?.status === 429) {
    return true;
  }

  return false;
};

/**
 * Sleep utility for delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateDelay = (
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffFactor: number
): number => {
  const exponentialDelay = baseDelay * Math.pow(backoffFactor, attempt - 1);
  const delayWithJitter = exponentialDelay * (0.5 + Math.random() * 0.5);
  return Math.min(delayWithJitter, maxDelay);
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = defaultRetryCondition,
    onRetry,
  } = options;

  let lastError: any;
  let attempts = 0;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    attempts = attempt;

    try {
      const result = await fn();
      return {
        success: true,
        data: result,
        attempts,
      };
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt > maxRetries) {
        break;
      }

      // Check if we should retry this error
      if (!retryCondition(error)) {
        break;
      }

      // Log the retry attempt
      errorService.logError(
        `Retry attempt ${attempt}/${maxRetries} failed`,
        {
          type: 'retry_attempt',
          attempt,
          maxRetries,
          error: error instanceof Error ? error.message : String(error),
        },
        'warning'
      );

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt, error);
      }

      // Calculate and wait for delay
      const delay = calculateDelay(attempt, baseDelay, maxDelay, backoffFactor);
      await sleep(delay);
    }
  }

  // All retries failed
  errorService.logError(
    `All retry attempts failed after ${attempts} attempts`,
    {
      type: 'retry_exhausted',
      attempts,
      maxRetries,
      finalError: lastError instanceof Error ? lastError.message : String(lastError),
    },
    'error'
  );

  return {
    success: false,
    error: lastError,
    attempts,
  };
}

/**
 * Retry wrapper for API calls
 */
export class NetworkRetryService {
  private defaultOptions: RetryOptions;

  constructor(defaultOptions: RetryOptions = {}) {
    this.defaultOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      retryCondition: defaultRetryCondition,
      ...defaultOptions,
    };
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const result = await retryWithBackoff(fn, mergedOptions);

    if (result.success) {
      return result.data!;
    }

    throw result.error;
  }

  /**
   * Create a retryable version of an async function
   */
  wrap<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options?: RetryOptions
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      return this.execute(() => fn(...args), options);
    };
  }

  /**
   * Update default options
   */
  updateDefaultOptions(options: Partial<RetryOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }
}

// Export singleton instance
export const networkRetryService = new NetworkRetryService();

// Export utility functions
export { defaultRetryCondition };