 
import DOMPurify from 'dompurify';

/**
 * Sanitizează complet un string HTML pentru a elimina orice vector XSS (tag-uri script, onmouseover, etc.)
 */
export const sanitizeHTML = (dirtyString) => {
  return DOMPurify.sanitize(dirtyString, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre', 'span'],
    ALLOWED_ATTR: ['class']
  });
};