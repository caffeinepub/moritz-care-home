/**
 * Centralized startup timing configuration
 * All timeouts in milliseconds
 */

// Actor creation timeout (30 seconds)
export const ACTOR_CREATE_TIMEOUT_MS = 30_000;

// Admin initialization timeout (15 seconds)
export const ADMIN_INIT_TIMEOUT_MS = 15_000;

// Profile startup timeout (15 seconds)
export const PROFILE_STARTUP_TIMEOUT_MS = 15_000;

// Resident query timeout (15 seconds)
export const RESIDENT_QUERY_TIMEOUT_MS = 15_000;

// Resident fetch timeout (10 seconds)
export const RESIDENT_FETCH_TIMEOUT_MS = 10_000;

// Fast-fail timeout - triggers when backend is reachable but slow (15 seconds)
export const FAIL_FAST_MS = 15_000;

// Overall startup watchdog timer - fallback if other mechanisms don't trigger (45 seconds)
export const STARTUP_TIMEOUT_MS = 45_000;

// Health check early trigger - runs when loading is slow (5 seconds)
export const HEALTHCHECK_EARLY_TRIGGER_MS = 5_000;
