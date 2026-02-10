/**
 * Centralized startup timing configuration
 * All timeouts for startup operations are defined here for easy tuning
 */

/**
 * Fast-fail timeout for startup operations when backend is reachable but slow
 * This is shorter than STARTUP_TIMEOUT_MS to provide faster feedback
 */
export const FAIL_FAST_MS = 15000; // 15 seconds

/**
 * Threshold for triggering early health check during startup
 * If actor/profile is still pending after this time, we check backend reachability
 */
export const HEALTHCHECK_EARLY_TRIGGER_MS = 5000; // 5 seconds

/**
 * Timeout for profile fetch during startup
 */
export const PROFILE_STARTUP_TIMEOUT_MS = 12000; // 12 seconds

/**
 * Timeout for actor creation during startup
 */
export const ACTOR_CREATE_TIMEOUT_MS = 15000; // 15 seconds

/**
 * Timeout for admin initialization (best-effort)
 */
export const ADMIN_INIT_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Overall startup watchdog timeout (fallback if other mechanisms don't trigger)
 */
export const STARTUP_TIMEOUT_MS = 45000; // 45 seconds

/**
 * Timeout for resident list queries (Dashboard and other views)
 * Ensures resident loading fails fast instead of hanging indefinitely
 */
export const RESIDENT_QUERY_TIMEOUT_MS = 15000; // 15 seconds

/**
 * Timeout for individual resident fetch
 */
export const RESIDENT_FETCH_TIMEOUT_MS = 10000; // 10 seconds
