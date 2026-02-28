/**
 * Maps backend registration/bootstrap errors into stable, user-accurate English messages.
 * Distinguishes between anonymous/unauthenticated access, admin-only provisioning flows,
 * and generic failures without defaulting to the legacy "contact administrator" message
 * for normal authenticated users.
 */

export function mapRegistrationError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unexpected error occurred during registration. Please try again.';
  }

  const message = error.message.toLowerCase();

  // Anonymous/unauthenticated access
  if (
    message.includes('anonymous') ||
    message.includes('unauthenticated') ||
    message.includes('anonymous users cannot')
  ) {
    return 'You must be logged in to access this application. Please log in with Internet Identity.';
  }

  // Network/connectivity issues
  if (message.includes('network') || message.includes('fetch failed')) {
    return 'Network error: Unable to reach the backend. Please check your internet connection and try again.';
  }

  // Timeout issues
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'Request timed out: The backend is taking too long to respond. Please try again.';
  }

  // Backend not available
  if (message.includes('actor not available') || message.includes('not initialized')) {
    return 'Backend connection not available. Please refresh the page and try again.';
  }

  // Stopped canister
  if (message.includes('stopped') || message.includes('canister is stopped')) {
    return 'The backend canister is stopped. Please contact the administrator to restart it.';
  }

  // Generic authorization/permission errors (but NOT for baseline registration)
  // Only show admin-provisioning message if explicitly mentioned
  if (message.includes('provision') || message.includes('contact an administrator')) {
    return 'Unable to register user: Please contact an administrator to provision your account.';
  }

  // For other authorization errors during baseline registration, provide a clearer message
  if (message.includes('unauthorized') || message.includes('permission')) {
    return 'Authorization error: Unable to complete registration. Please try logging out and back in, or contact support if the issue persists.';
  }

  // Return original message if it's already descriptive (longer than 30 chars)
  if (error.message.length > 30) {
    return error.message;
  }

  // Fallback for unknown errors
  return 'Failed to register user. Please try again or contact support if the problem persists.';
}

/**
 * Checks if an error is specifically an anonymous/unauthenticated access error
 */
export function isAnonymousAccessError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('anonymous') ||
    message.includes('unauthenticated') ||
    message.includes('anonymous users cannot')
  );
}

/**
 * Checks if an error is a provisioning/admin-contact error
 */
export function isProvisioningError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('provision') || message.includes('contact an administrator');
}
