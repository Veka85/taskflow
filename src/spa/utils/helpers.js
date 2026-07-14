// Utility functions used throughout the app

// Format a date string to a readable format
// e.g. "2026-06-20T14:30:00.000Z" → "Jun 20, 2026"
export function formatDate(dateString) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Check if a due date is overdue (past today)
export function isOverdue(dateString) {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
}

// Get initials from a full name for avatar fallback
// "John Doe" → "JD", "Alice" → "A"
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Extract error message from Axios error response
// Handles validation errors (422) and general errors
export function getErrorMessage(error) {
  if (error.response?.data?.errors) {
    // Laravel validation errors: { errors: { field: ['message'] } }
    return Object.values(error.response.data.errors).flat().join('. ');
  }
  return error.response?.data?.message || error.message || 'An error occurred';
}

// Generate a contrasting text color (black or white) for a given background color
export function getContrastColor(hexColor) {
  if (!hexColor) return '#000000';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}
