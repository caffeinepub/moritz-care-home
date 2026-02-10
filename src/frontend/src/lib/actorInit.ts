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
 * Tightened matching to avoid false positives during transient startup/network failures
 * @param error - The error to check
 * @returns True if the error indicates a stopped canister
 */
export function isStoppedCanisterError(error: unknown): boolean {
  if (!error) return false;
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Tightened: require explicit "is stopped" or CallContextManager pattern
    // Avoid matching generic "canister" + "stopped" which can be too broad
    return (
      message.includes('canister is stopped') ||
      message.includes('is stopped') ||
      message.includes('callcontextmanager')
    );
  }
  
  if (typeof error === 'string') {
    const message = error.toLowerCase();
    return (
      message.includes('canister is stopped') ||
      message.includes('is stopped') ||
      message.includes('callcontextmanager')
    );
  }
  
  return false;
}

/**
 * Detects if an error indicates a canister not found or not deployed
 * @param error - The error to check
 * @returns True if the error indicates canister not found
 */
export function isCanisterNotFoundError(error: unknown): boolean {
  if (!error) return false;
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('canister not found') ||
      message.includes('not found') ||
      message.includes('does not exist') ||
      message.includes('could not be found')
    );
  }
  
  if (typeof error === 'string') {
    const message = error.toLowerCase();
    return (
      message.includes('canister not found') ||
      message.includes('not found') ||
      message.includes('does not exist') ||
      message.includes('could not be found')
    );
  }
  
  return false;
}

/**
 * Detects if an error is a network/fetch error
 * @param error - The error to check
 * @returns True if the error is network-related
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('unreachable')
    );
  }
  
  if (typeof error === 'string') {
    const message = error.toLowerCase();
    return (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('unreachable')
    );
  }
  
  return false;
}

/**
 * Detects if an error is a timeout error
 * @param error - The error to check
 * @returns True if the error is timeout-related
 */
export function isTimeoutError(error: unknown): boolean {
  if (!error) return false;
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('timed out')
    );
  }
  
  if (typeof error === 'string') {
    const message = error.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('timed out')
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

    // Check for stopped canister first (with tightened detection)
    if (isStoppedCanisterError(error)) {
      return 'Backend canister is stopped: The canister cannot process requests. Please contact the administrator to restart it.';
    }

    // Check for canister not found
    if (isCanisterNotFoundError(error)) {
      return 'Backend canister not found: The canister may not be deployed or the canister ID may be incorrect.';
    }

    // Check for network errors
    if (isNetworkError(error)) {
      return 'Network error: Unable to reach the backend. Please check your internet connection.';
    }

    // Check for timeout errors
    if (isTimeoutError(error)) {
      return 'Connection timed out: The backend is taking too long to respond.';
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
