/**
 * Application constants
 */

// API endpoints
export const API_ENDPOINTS = {
  CONFIG: '/api/config',
  WHOAMI: '/api/whoami',
  AUTH: {
    CHANGE_PASSWORD: '/api/auth/change-password',
  },
  ITEMS: {
    LIST: '/api/items',
    CREATE: '/api/items',
    GET: (id: string) => `/api/items/${id}`,
    UPDATE: (id: string) => `/api/items/${id}`,
    DELETE: (id: string) => `/api/items/${id}`,
  },
} as const;

// Item categories
export const ITEM_CATEGORIES = [
  'Personal',
  'Work',
  'Shopping',
  'Health',
  'Finance',
  'Education',
  'Travel',
  'Other',
] as const;

// Item statuses
export const ITEM_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
] as const;

// Priority levels
export const PRIORITY_LEVELS = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'High' },
  { value: 4, label: 'Urgent' },
] as const;

// Validation constants
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  TAG_MAX_LENGTH: 50,
  MAX_TAGS: 10,
} as const;

// UI constants
export const UI = {
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  PAGINATION_LIMIT: 20,
} as const;