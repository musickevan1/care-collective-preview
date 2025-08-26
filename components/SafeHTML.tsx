'use client';

import DOMPurify from 'isomorphic-dompurify';

interface SafeHTMLProps {
  html: string;
  className?: string;
  allowedTags?: string[];
  allowedAttributes?: string[];
}

export function SafeHTML({ 
  html, 
  className,
  allowedTags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'b', 'i'],
  allowedAttributes = []
}: SafeHTMLProps) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    KEEP_CONTENT: true,
  });
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}