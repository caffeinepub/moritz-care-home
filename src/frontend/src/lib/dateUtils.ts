/**
 * Date utility functions to handle date conversions without timezone issues
 * Backend stores dates as nanoseconds (bigint)
 * Frontend needs to display dates in local format without timezone offset
 */

/**
 * Convert a date string (YYYY-MM-DD) to nanoseconds for backend storage
 * Treats the date as a local calendar date without timezone conversion
 */
export function dateStringToNanoseconds(dateString: string): bigint {
  const [year, month, day] = dateString.split('-').map(Number);
  // Use UTC to avoid timezone offset issues - treat as pure calendar date
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  return BigInt(date.getTime() * 1_000_000);
}

/**
 * Convert nanoseconds from backend to a date string (YYYY-MM-DD)
 * Returns the date in local format without timezone offset
 */
export function nanosecondsToDateString(nanoseconds: bigint): string {
  const milliseconds = Number(nanoseconds) / 1_000_000;
  const date = new Date(milliseconds);
  
  // Extract UTC date components to avoid timezone issues
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format nanoseconds as a human-readable date
 * Returns date in format: "January 17, 2026"
 */
export function formatDate(nanoseconds: bigint): string {
  const milliseconds = Number(nanoseconds) / 1_000_000;
  const date = new Date(milliseconds);
  
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Format nanoseconds as a human-readable date and time
 * Returns datetime in format: "Jan 17, 2026, 02:30 PM"
 */
export function formatDateTime(nanoseconds: bigint): string {
  const milliseconds = Number(nanoseconds) / 1_000_000;
  const date = new Date(milliseconds);
  
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
}

/**
 * Calculate age from date of birth in nanoseconds
 * Returns age in years
 */
export function calculateAge(dateOfBirthNanoseconds: bigint): number {
  const dobMilliseconds = Number(dateOfBirthNanoseconds) / 1_000_000;
  const dobDate = new Date(dobMilliseconds);
  const today = new Date();
  
  // Use UTC components to avoid timezone issues
  const dobYear = dobDate.getUTCFullYear();
  const dobMonth = dobDate.getUTCMonth();
  const dobDay = dobDate.getUTCDate();
  
  const todayYear = today.getUTCFullYear();
  const todayMonth = today.getUTCMonth();
  const todayDay = today.getUTCDate();
  
  let age = todayYear - dobYear;
  const monthDiff = todayMonth - dobMonth;
  
  // Adjust age if birthday hasn't occurred this year yet
  if (monthDiff < 0 || (monthDiff === 0 && todayDay < dobDay)) {
    age--;
  }
  
  return age;
}
