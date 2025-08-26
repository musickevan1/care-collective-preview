// Password security requirements
export const passwordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Optional for better usability
};

// Common weak passwords to check against
const commonPasswords = [
  'password', '12345678', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890',
  'qwertyuiop', 'abc123', 'Password1', 'password1', '123456789',
  'welcome123', 'admin123', 'root', 'toor', 'pass',
  'password123!', 'qwerty123', '123qwe', 'qazwsx', '1q2w3e4r',
];

// Check password strength
export function getPasswordStrength(password: string): {
  score: number; // 0-100
  level: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];
  
  // Length scoring
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Character variety scoring
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 25;
  
  // Penalty for common passwords
  if (commonPasswords.includes(password.toLowerCase())) {
    score = 0;
    feedback.push('This password is too common');
  }
  
  // Penalty for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedback.push('Avoid repeated characters');
  }
  
  // Penalty for sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    score -= 10;
    feedback.push('Avoid sequential characters');
  }
  
  // Generate feedback
  if (password.length < 8) {
    feedback.push('Password should be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    feedback.push('Include at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    feedback.push('Include at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    feedback.push('Include at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Consider adding special characters for extra security');
  }
  
  // Determine level
  let level: 'weak' | 'fair' | 'good' | 'strong';
  if (score < 30) level = 'weak';
  else if (score < 50) level = 'fair';
  else if (score < 70) level = 'good';
  else level = 'strong';
  
  return {
    score: Math.max(0, Math.min(100, score)),
    level,
    feedback,
  };
}

// Validate password against requirements
export function validatePassword(password: string): { 
  valid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];
  
  if (password.length < passwordRequirements.minLength) {
    errors.push(`Password must be at least ${passwordRequirements.minLength} characters`);
  }
  
  if (password.length > passwordRequirements.maxLength) {
    errors.push(`Password must be less than ${passwordRequirements.maxLength} characters`);
  }
  
  if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (passwordRequirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (passwordRequirements.requireSpecialChars && !/[!@#$%^&*()]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check against common passwords
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a more secure password');
  }
  
  // Check for personal information (this would need user context in real implementation)
  // For now, just check for obvious patterns
  if (/password/i.test(password) || /admin/i.test(password) || /user/i.test(password)) {
    errors.push('Password should not contain common words');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Generate a secure random password
export function generateSecurePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + special;
  let password = '';
  
  // Ensure at least one of each required type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

// Check if passwords match (for confirmation fields)
export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}

// Estimate time to crack password (simplified estimation)
export function estimateCrackTime(password: string): string {
  const strength = getPasswordStrength(password);
  
  if (strength.level === 'weak') return 'Less than 1 second';
  if (strength.level === 'fair') return 'A few minutes';
  if (strength.level === 'good') return 'Several hours to days';
  return 'Years to centuries';
}