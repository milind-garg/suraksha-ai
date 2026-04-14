/**
 * Phone number utilities for Indian phone numbers
 */

/**
 * Format phone number to Indian format: +91-XXXXX-XXXXX
 * Accepts: raw digits, with spaces, with dashes, with +91
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters except leading +
  let digits = phone.replace(/\D/g, '');

  // Remove leading 91 if present (we'll add +91)
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  }

  // Pad with leading zero if needed
  if (digits.length === 10) {
    // Indian phone number format: +91-XXXXX-XXXXX
    return `+91-${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  return phone;
}

/**
 * Validate Indian phone number (10 digits, must start with 6-9)
 */
export function validatePhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');

  // Indian mobile numbers are 10 digits starting with 6, 7, 8 or 9.
  if (digits.length === 10) return /^[6-9]/.test(digits);
  if (digits.length === 12 && digits.startsWith('91')) return /^91[6-9]/.test(digits);

  return false;
}

/**
 * Format phone for display
 * Input: +91-98765-43210 or 9876543210 or 919876543210
 * Output: +91 98765 43210
 */
export function formatPhoneForDisplay(phone: string): string {
  const clean = phone.replace(/\D/g, '');

  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }

  if (clean.length === 12 && clean.startsWith('91')) {
    const number = clean.slice(2);
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
  }

  return phone;
}
