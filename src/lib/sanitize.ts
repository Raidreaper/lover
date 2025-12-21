/**
 * Input sanitization utility for frontend
 * Uses DOMPurify for XSS protection
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
};

/**
 * Sanitize plain text (removes HTML, trims, limits length)
 */
export const sanitizeText = (text: string, maxLength: number = 2000): string => {
  if (typeof text !== 'string') {
    return '';
  }
  
  // Remove HTML tags
  const sanitized = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  
  // Trim whitespace
  const trimmed = sanitized.trim();
  
  // Limit length
  return trimmed.substring(0, maxLength);
};

/**
 * Sanitize username (alphanumeric, underscore, hyphen, 3-30 chars)
 */
export const sanitizeUsername = (username: string): string => {
  return username
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .substring(0, 30);
};

/**
 * Sanitize email (basic validation)
 */
export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase().substring(0, 255);
};

