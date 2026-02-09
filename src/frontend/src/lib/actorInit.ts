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
 * Detects if an error indicates a stopped canister
 * @param error - The error to check
 * @returns True if the error indicates a stopped canister
 */
export function isStoppedCanisterError(error: unknown): boolean {
  if (!error) return false;
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Check for stopped canister patterns
    return (
      message.includes('is stopped') ||
      message.includes('callcontextmanager') ||
      (message.includes('canister') && message.includes('stopped'))
    );
  }
  
  if (typeof error === 'string') {
    const message = error.toLowerCase();
    return (
      message.includes('is stopped') ||
      message.includes('callcontextmanager') ||
      (message.includes('canister') && message.includes('stopped'))
    );
  }
  
  return false;
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

    // Check for stopped canister first
    if (isStoppedCanisterError(error)) {
      return 'Backend canister is stopped: The canister cannot process requests. Please contact the administrator to restart it.';
    }

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

  // Try to extract message from object
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof (error as any).message === 'string') {
      return normalizeError((error as any).message);
    }
  }

  return 'An unexpected error occurred';
}

/**
 * Checks if an error is non-fatal (e.g., "already initialized")
 * @param error - The error to check
 * @returns True if the error is non-fatal
 */
export function isNonFatalError(error: unknown): boolean {
  if (!error) return false;

  const message = normalizeError(error).toLowerCase();
  return (
    message.includes('already initialized') ||
    message.includes('already exists') ||
    message.includes('non-fatal')
  );
}

/**
 * Checks if an error is an authorization error
 * @param error - The error to check
 * @returns True if the error is authorization-related
 */
export function isAuthorizationError(error: unknown): boolean {
  if (!error) return false;

  const message = normalizeError(error).toLowerCase();
  return (
    message.includes('unauthorized') ||
    message.includes('permission') ||
    message.includes('authorization') ||
    message.includes('access denied')
  );
}
