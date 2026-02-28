/**
 * Date utility functions to handle date conversions without timezone issues.
 * Backend stores dates as nanoseconds (bigint).
 * Frontend Resident type uses number for timestamps.
 */

/**
 * Convert a date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm) to nanoseconds as bigint
 */
export function dateStringToNanoseconds(dateString: string): bigint {
  const parts = dateString.split('T');
  const [year, month, day] = parts[0].split('-').map(Number);
  let hours = 0, minutes = 0;
  if (parts[1]) {
    const timeParts = parts[1].split(':').map(Number);
    hours = timeParts[0] ?? 0;
    minutes = timeParts[1] ?? 0;
  }
  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
  return BigInt(date.getTime() * 1_000_000);
}

/**
 * Alias for dateStringToNanoseconds returning bigint — for backend calls
 */
export function dateToBackendTimestamp(dateString: string): bigint {
  return dateStringToNanoseconds(dateString);
}

/**
 * Convert a date string to nanoseconds as number — for local Resident type
 */
export function dateStringToTimestampNumber(dateString: string): number {
  return Number(dateStringToNanoseconds(dateString));
}

/**
 * Convert nanoseconds (bigint or number) to a date string (YYYY-MM-DD)
 */
export function nanosecondsToDateString(nanoseconds: bigint | number): string {
  const milliseconds = Number(nanoseconds) / 1_000_000;
  const date = new Date(milliseconds);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Alias for nanosecondsToDateString — accepts bigint or number
 */
export function backendTimestampToDate(nanoseconds: bigint | number): string {
  return nanosecondsToDateString(nanoseconds);
}

/**
 * Alias accepting bigint or number — for EditResidentDialog compatibility
 */
export function backendTimestampToDateString(nanoseconds: bigint | number): string {
  return nanosecondsToDateString(nanoseconds);
}

/**
 * Format nanoseconds (bigint or number) as a human-readable date: "January 17, 2026"
 */
export function formatDate(nanoseconds: bigint | number): string {
  const milliseconds = Number(nanoseconds) / 1_000_000;
  const date = new Date(milliseconds);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Format nanoseconds (bigint or number) as a human-readable datetime: "Jan 17, 2026, 02:30 PM"
 */
export function formatDateTime(nanoseconds: bigint | number): string {
  const milliseconds = Number(nanoseconds) / 1_000_000;
  const date = new Date(milliseconds);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

/**
 * Calculate age from date of birth in nanoseconds (bigint or number)
 */
export function calculateAge(dateOfBirthNanoseconds: bigint | number): number {
  const dobMilliseconds = Number(dateOfBirthNanoseconds) / 1_000_000;
  const dobDate = new Date(dobMilliseconds);
  const today = new Date();

  const dobYear = dobDate.getUTCFullYear();
  const dobMonth = dobDate.getUTCMonth();
  const dobDay = dobDate.getUTCDate();

  const todayYear = today.getUTCFullYear();
  const todayMonth = today.getUTCMonth();
  const todayDay = today.getUTCDate();

  let age = todayYear - dobYear;
  const monthDiff = todayMonth - dobMonth;
  if (monthDiff < 0 || (monthDiff === 0 && todayDay < dobDay)) {
    age--;
  }
  return age;
}
