import bcrypt from 'bcryptjs';

// Password configuration
const SALT_ROUNDS = 12;

// Password requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

// Password validation regex patterns
const PASSWORD_PATTERNS = {
  hasLowerCase: /[a-z]/,
  hasUpperCase: /[A-Z]/,
  hasNumbers: /\d/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
  noWhitespace: /^\S*$/
};

// Hash password
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('Failed to hash password');
  }
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error('Failed to verify password');
  }
}

// Password strength validation
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number;
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Check length
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  } else if (password.length >= PASSWORD_MIN_LENGTH) {
    score += 1;
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Password must not exceed ${PASSWORD_MAX_LENGTH} characters`);
  }

  // Check for lowercase letters
  if (!PASSWORD_PATTERNS.hasLowerCase.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  // Check for uppercase letters
  if (!PASSWORD_PATTERNS.hasUpperCase.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  // Check for numbers
  if (!PASSWORD_PATTERNS.hasNumbers.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  // Check for special characters
  if (!PASSWORD_PATTERNS.hasSpecialChar.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
  } else {
    score += 1;
  }

  // Check for whitespace
  if (!PASSWORD_PATTERNS.noWhitespace.test(password)) {
    errors.push('Password must not contain whitespace characters');
  }

  // Additional security checks
  if (isCommonPassword(password)) {
    errors.push('Password is too common. Please choose a more unique password');
    score = Math.max(0, score - 2);
  }

  if (hasRepeatingCharacters(password)) {
    errors.push('Password should not have too many repeating characters');
    score = Math.max(0, score - 1);
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong';
  if (score <= 2) {
    strength = 'weak';
  } else if (score <= 4) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score
  };
}

// Check if password is commonly used
function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    '1234567890', 'password1', '123123', 'qwerty123',
    'iloveyou', 'princess', 'admin123', 'welcome123'
  ];

  const lowerPassword = password.toLowerCase();
  return commonPasswords.some(common => 
    lowerPassword.includes(common) || common.includes(lowerPassword)
  );
}

// Check for excessive repeating characters
function hasRepeatingCharacters(password: string): boolean {
  let consecutiveCount = 1;
  let maxConsecutive = 1;

  for (let i = 1; i < password.length; i++) {
    if (password[i] === password[i - 1]) {
      consecutiveCount++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
    } else {
      consecutiveCount = 1;
    }
  }

  // Flag if more than 3 consecutive identical characters
  return maxConsecutive > 3;
}

// Generate a secure random password
export function generateSecurePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*(),.?":{}|<>';
  
  const allChars = lowercase + uppercase + numbers + specialChars;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Check if password needs to be rehashed (for security upgrades)
export function needsRehash(hashedPassword: string): boolean {
  try {
    // Check if the hash was created with fewer rounds than current requirement
    const rounds = bcrypt.getRounds(hashedPassword);
    return rounds < SALT_ROUNDS;
  } catch (error) {
    // If we can't determine rounds, assume it needs rehashing
    return true;
  }
}

// Estimate password cracking time (for educational purposes)
export function estimateCrackingTime(password: string): string {
  const charset = getCharsetSize(password);
  const combinations = Math.pow(charset, password.length);
  
  // Assume 1 billion attempts per second (modern hardware)
  const attemptsPerSecond = 1e9;
  const secondsToCrack = combinations / (2 * attemptsPerSecond); // Average case
  
  if (secondsToCrack < 60) {
    return 'Less than a minute';
  } else if (secondsToCrack < 3600) {
    return `${Math.round(secondsToCrack / 60)} minutes`;
  } else if (secondsToCrack < 86400) {
    return `${Math.round(secondsToCrack / 3600)} hours`;
  } else if (secondsToCrack < 31536000) {
    return `${Math.round(secondsToCrack / 86400)} days`;
  } else {
    return `${Math.round(secondsToCrack / 31536000)} years`;
  }
}

function getCharsetSize(password: string): number {
  let size = 0;
  
  if (PASSWORD_PATTERNS.hasLowerCase.test(password)) size += 26;
  if (PASSWORD_PATTERNS.hasUpperCase.test(password)) size += 26;
  if (PASSWORD_PATTERNS.hasNumbers.test(password)) size += 10;
  if (PASSWORD_PATTERNS.hasSpecialChar.test(password)) size += 32;
  
  return size || 1; // Minimum 1 to avoid division by zero
}