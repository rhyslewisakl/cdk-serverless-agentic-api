/**
 * Validation utility functions
 */

import { VALIDATION } from './constants';

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const isValidPassword = (password: string): boolean => {
  return password.length >= VALIDATION.PASSWORD_MIN_LENGTH;
};

// Password strength validation
export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= VALIDATION.PASSWORD_MIN_LENGTH) {
    score += 1;
  } else {
    feedback.push(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters long`);
  }

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Password should contain lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Password should contain uppercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Password should contain numbers');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('Password should contain special characters');

  return { score, feedback };
};

// Title validation
export const isValidTitle = (title: string): boolean => {
  return title.trim().length > 0 && title.length <= VALIDATION.TITLE_MAX_LENGTH;
};

// Description validation
export const isValidDescription = (description: string): boolean => {
  return description.length <= VALIDATION.DESCRIPTION_MAX_LENGTH;
};

// Tag validation
export const isValidTag = (tag: string): boolean => {
  return tag.trim().length > 0 && tag.length <= VALIDATION.TAG_MAX_LENGTH;
};

// Tags array validation
export const isValidTags = (tags: string[]): boolean => {
  return tags.length <= VALIDATION.MAX_TAGS && tags.every(isValidTag);
};

// Priority validation
export const isValidPriority = (priority: number): boolean => {
  return Number.isInteger(priority) && priority >= 1 && priority <= 4;
};

// Date validation
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Form validation helper
export const validateRequired = (value: string, fieldName: string): string | undefined => {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  return undefined;
};

// Generic validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}