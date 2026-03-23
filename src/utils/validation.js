import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().default(false)
});

export const signupSchema = z.object({
  name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters'),
  jobTitle: z.string().min(2, 'Job title is required'),
  department: z.string().min(2, 'Department is required'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirm: z.string().min(1, 'Please confirm your password'),
  terms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
}).refine((data) => data.password === data.confirm, {
  message: "Passwords don't match",
  path: ["confirm"],
});

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional()
    .or(z.literal('')),
  confirm: z.string().optional()
}).refine((data) => !data.password || data.password === data.confirm, {
  message: "Passwords don't match",
  path: ["confirm"],
});

export const calculatePasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'Weak', color: '#ef4444' };
  
  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    noCommon: !['password', '12345678', 'qwerty123'].includes(password.toLowerCase())
  };

  Object.values(checks).forEach(check => {
    if (check) score++;
  });

  if (score <= 2) return { score, label: 'Weak', color: '#ef4444' };
  if (score <= 4) return { score, label: 'Medium', color: '#f59e0b' };
  return { score, label: 'Strong', color: '#22c55e' };
};