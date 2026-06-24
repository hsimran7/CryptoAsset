import { z } from 'zod';

// Schema for user registration
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters long').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please add a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long')
});

// Schema for user login
export const loginSchema = z.object({
  loginCredential: z.string().min(1, 'Please enter your username or email address'),
  password: z.string().min(1, 'Please enter your password')
});

// Schema for requesting password reset
export const forgotPasswordSchema = z.object({
  email: z.string().email('Please add a valid email address')
});

// Schema for resetting password
export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters long')
});
