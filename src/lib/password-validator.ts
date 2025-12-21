/**
 * Password validation utility
 * Provides password strength checking and validation
 */

export interface PasswordStrength {
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  feedback: string[];
  isValid: boolean;
}

export const validatePassword = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length === 0) {
    return {
      score: 0,
      feedback: [],
      isValid: false
    };
  }

  // Length checks
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long');
  }

  if (password.length >= 12) {
    score += 1;
  }

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 0.5;
  } else {
    feedback.push('Add lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 0.5;
  } else {
    feedback.push('Add uppercase letters');
  }

  if (/[0-9]/.test(password)) {
    score += 0.5;
  } else {
    feedback.push('Add numbers');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 0.5;
  } else {
    feedback.push('Add special characters (!@#$%^&*)');
  }

  // Common password check
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid common passwords');
  }

  // Final score (0-4)
  const finalScore = Math.min(4, Math.floor(score));

  return {
    score: finalScore,
    feedback: feedback.length > 0 ? feedback : ['Strong password!'],
    isValid: finalScore >= 2 && password.length >= 8
  };
};

export const getPasswordStrengthLabel = (score: number): string => {
  if (score === 0) return 'Very Weak';
  if (score === 1) return 'Weak';
  if (score === 2) return 'Fair';
  if (score === 3) return 'Good';
  return 'Strong';
};

export const getPasswordStrengthColor = (score: number): string => {
  if (score === 0) return 'bg-red-500';
  if (score === 1) return 'bg-orange-500';
  if (score === 2) return 'bg-yellow-500';
  if (score === 3) return 'bg-blue-500';
  return 'bg-green-500';
};

