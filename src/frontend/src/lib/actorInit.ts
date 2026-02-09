/**
 * Actor initialization utilities for resilient backend connection
 */

/**
 * Wraps a promise with a timeout
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Custom timeout error message
 * @returns Promise that rejects if timeout is exceeded
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Normalizes various error types into a human-readable message
 * @param error - The error to normalize
 * @returns A user-friendly error message
 */
export function normalizeError(error: unknown): string {
  if (!error) {
    return 'Unknown error occurred';
  }

  if (error instanceof Error) {
    // Check for common error patterns
    const message = error.message;

    if (message.includes('fetch') || message.includes('network')) {
      return 'Network error: Unable to reach the backend. Please check your internet connection.';
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return 'Connection timed out: The backend is taking too long to respond.';
    }

    if (message.includes('canister') && message.includes('not found')) {
      return 'Backend canister not found. The application may not be properly deployed.';
    }

    if (message.includes('Unauthorized')) {
      // Extract more specific authorization error details
      if (message.includes('admin')) {
        return 'Unauthorized: Only administrators can perform this action';
      }
      return 'Authorization error: ' + message;
    }

    if (message.includes('permission')) {
      return 'Permission denied: You do not have the required permissions for this action';
    }

    if (message.includes('already initialized')) {
      return 'Access control already initialized (non-fatal)';
    }

    // Return the original message if no pattern matches
    return message;
  }

  if (typeof error === 'string') {
    return error;
  }

  // For objects, try to extract a message
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if ('message' in errorObj && typeof errorObj.message === 'string') {
      return errorObj.message;
    }
    if ('error' in errorObj && typeof errorObj.error === 'string') {
      return errorObj.error;
    }
  }

  return 'An unexpected error occurred';
}

/**
 * Checks if an error is non-fatal (can be ignored)
 * @param error - The error to check
 * @returns True if the error can be safely ignored
 */
export function isNonFatalError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('already initialized') ||
      message.includes('already exists')
    );
  }
  return false;
}

/**
 * Checks if an error is an authorization/permission error
 * @param error - The error to check
 * @returns True if the error is related to authorization
 */
export function isAuthorizationError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('unauthorized') ||
      message.includes('permission') ||
      message.includes('admin')
    );
  }
  return false;
}
