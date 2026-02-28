// Centralized startup timing configuration
// All values in milliseconds

/** Maximum time to wait for actor creation */
export const ACTOR_CREATION_TIMEOUT = 8000;

/** Maximum time to wait for admin initialization */
export const ADMIN_INIT_TIMEOUT = 5000;

/** Fail-fast timeout for early health check */
export const FAIL_FAST_TIMEOUT = 10000;

/** Overall watchdog timeout for the entire startup sequence */
export const OVERALL_WATCHDOG_TIMEOUT = 15000;

/** Trigger early health check after this delay */
export const EARLY_HEALTH_CHECK_TRIGGER = 2000;

/** Maximum time to wait for the profile query to resolve */
export const PROFILE_QUERY_TIMEOUT = 12000;
