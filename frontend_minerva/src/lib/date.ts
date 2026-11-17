/** Date-only API values represent a calendar day in the user's timezone. */
export function parseDisplayDate(value: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
}
