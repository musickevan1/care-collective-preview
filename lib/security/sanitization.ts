import DOMPurify from 'isomorphic-dompurify';

// Strict HTML sanitization - removes all HTML
export function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .trim();
}

// Limited HTML sanitization - allows safe formatting
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

// Markdown sanitization - for rich text areas
export function sanitizeMarkdown(markdown: string): string {
  // Remove script tags and javascript: protocols
  let cleaned = markdown
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
    
  return cleaned;
}

// URL sanitization - prevent javascript: and data: URLs
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url, 'http://example.com');
    
    // Only allow http(s) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '#';
    }
    
    return url;
  } catch {
    return '#';
  }
}

// Email sanitization
export function sanitizeEmail(email: string): string {
  // Basic email sanitization - remove any HTML and dangerous characters
  return email
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, '')
    .replace(/[<>\"']/g, '');
}

// Phone number sanitization
export function sanitizePhone(phone: string): string {
  // Keep only digits, spaces, hyphens, parentheses, and plus sign
  return phone.replace(/[^\d\s\-()+ ]/g, '');
}

// File name sanitization
export function sanitizeFileName(fileName: string): string {
  // Remove directory traversal attempts and dangerous characters
  return fileName
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    .replace(/[^a-zA-Z0-9._\- ]/g, '')
    .trim();
}

// SQL-safe string sanitization (for search queries)
export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[%_]/g, '\\$&') // Escape SQL wildcards
    .replace(/[^\w\s\-]/g, '') // Keep only alphanumeric, spaces, and hyphens
    .trim();
}

// JSON sanitization - remove any executable code
export function sanitizeJSON(json: any): any {
  if (typeof json === 'string') {
    return sanitizeText(json);
  }
  
  if (Array.isArray(json)) {
    return json.map(item => sanitizeJSON(item));
  }
  
  if (json && typeof json === 'object') {
    const sanitized: any = {};
    for (const key in json) {
      if (json.hasOwnProperty(key)) {
        // Skip potentially dangerous keys
        if (!key.startsWith('__') && !key.includes('prototype')) {
          sanitized[sanitizeText(key)] = sanitizeJSON(json[key]);
        }
      }
    }
    return sanitized;
  }
  
  return json;
}

// General purpose input sanitizer
export function sanitizeInput(input: string, type: 'text' | 'email' | 'phone' | 'url' | 'search' = 'text'): string {
  switch (type) {
    case 'email':
      return sanitizeEmail(input);
    case 'phone':
      return sanitizePhone(input);
    case 'url':
      return sanitizeURL(input);
    case 'search':
      return sanitizeSearchQuery(input);
    case 'text':
    default:
      return sanitizeText(input);
  }
}