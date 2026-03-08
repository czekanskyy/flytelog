'use server';

import { randomBytes, createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { z } from 'zod';
import { getRandomAvatarColor } from '@/lib/avatar';
import { sendWelcomeEmail, sendRegistrationEmail, sendPasswordResetEmail } from '@/lib/emails';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateToken() {
  const raw = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

function hashToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

async function verifyTurnstileToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.warn("[Turnstile] Missing TURNSTILE_SECRET_KEY. Bypassing validation (NOT SECURE FOR PRODUCTION).");
    return true; 
  }

  const fd = new URLSearchParams();
  fd.append('secret', secretKey);
  fd.append('response', token);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("[Turnstile] verification crashed:", err);
    return false;
  }
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const completeRegistrationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, dots, dashes, and underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  login: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthResult = {
  success: boolean;
  error?: string;
};

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Step 1: Accepts an email, sends a magic link for registration.
 */
export async function initiateRegistration(formData: FormData): Promise<AuthResult> {
  const turnstileToken = formData.get('cf-turnstile-response') as string | null;
  const isHuman = await verifyTurnstileToken(turnstileToken);
  
  if (!isHuman) {
    return { success: false, error: 'Anti-spam check failed. Please verify you are a human.' };
  }

  const parsed = emailSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const normalizedEmail = parsed.data.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    return { success: false, error: 'An account with this email already exists. Please sign in.' };
  }

  // Rate Limiting Check: Max 2 registration emails per hour for this email address
  const recentRequests = await prisma.verificationToken.count({
    where: {
      identifier: `register:${normalizedEmail}`,
      expires: { gt: new Date() }
    }
  });

  if (recentRequests >= 2) {
    return { success: false, error: 'Too many registration attempts for this email. Please try again later (after 1 hour).' };
  }

  // We deliberately do NOT delete old tokens. They accumulate to act as our rate limiter history!
  
  const { raw, hash } = generateToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.verificationToken.create({
    data: {
      identifier: `register:${normalizedEmail}`,
      token: hash,
      expires,
    },
  });

  const magicLink = `${appUrl}/register/complete?token=${raw}&email=${encodeURIComponent(normalizedEmail)}`;
  void sendRegistrationEmail(normalizedEmail, magicLink);

  return { success: true };
}

/**
 * Step 2: Validates magic link token and creates the user.
 */
export async function completeRegistration(
  token: string,
  email: string,
  formData: FormData
): Promise<AuthResult> {
  const tokenHash = hashToken(token);

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
  });

  if (!verificationToken || verificationToken.identifier !== `register:${email.toLowerCase()}`) {
    return { success: false, error: 'Invalid or expired registration link. Please request a new one.' };
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: tokenHash } });
    return { success: false, error: 'This registration link has expired. Please request a new one.' };
  }

  const raw = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    username: formData.get('username') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  };

  const parsed = completeRegistrationSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { firstName, lastName, username, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Double-check email still free (race condition guard)
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email: normalizedEmail }, { username: username.toLowerCase() }] },
  });

  if (existingUser) {
    const field = existingUser.email === normalizedEmail ? 'Email' : 'Username';
    return { success: false, error: `${field} is already taken.` };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      firstName,
      lastName,
      username: username.toLowerCase(),
      email: normalizedEmail,
      password: hashedPassword,
      avatarColor: getRandomAvatarColor(),
    },
  });

  // Delete ALL used/leftover tokens for this registration intent (cleanup)
  await prisma.verificationToken.deleteMany({ where: { identifier: `register:${normalizedEmail}` } });

  // Send welcome email — non-blocking
  void sendWelcomeEmail(normalizedEmail, firstName);

  return { success: true };
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginUser(formData: FormData): Promise<AuthResult> {
  const raw = {
    login: formData.get('login') as string,
    password: formData.get('password') as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const userExists = await prisma.user.findFirst({
    where: {
      OR: [{ email: raw.login.toLowerCase() }, { username: raw.login.toLowerCase() }],
    },
    select: { id: true },
  });

  if (!userExists) {
    return { success: false, error: 'No account found with that email or username' };
  }

  try {
    await signIn('credentials', {
      login: raw.login,
      password: raw.password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: 'Invalid email/username or password' };
    }
    throw error;
  }
}

// ─── Password Reset ───────────────────────────────────────────────────────────

/**
 * Initiates a password reset. Always returns success (anti-enumeration).
 */
export async function initiatePasswordReset(formData: FormData): Promise<AuthResult> {
  const turnstileToken = formData.get('cf-turnstile-response') as string | null;
  const isHuman = await verifyTurnstileToken(turnstileToken);
  
  if (!isHuman) {
    return { success: false, error: 'Anti-spam check failed. Please verify you are a human.' };
  }

  const parsed = emailSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  
  // Rate Limiting Check for Password Reset (Even if user doesn't exist, we prevent spamming the endpoint)
  // Max 2 reset requests per email per hour.
  const recentRequests = await prisma.verificationToken.count({
    where: {
      identifier: `reset:${normalizedEmail}`,
      expires: { gt: new Date() }
    }
  });

  if (recentRequests >= 2) {
    // Return a generic success to prevent email enumeration, but do not actually send the email.
    return { success: true };
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (user) {
    // We deliberately do NOT delete old tokens. They accumulate to act as our rate limiter history!
    
    const { raw, hash } = generateToken();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${normalizedEmail}`,
        token: hash,
        expires,
      },
    });

    const resetLink = `${appUrl}/reset-password?token=${raw}&email=${encodeURIComponent(normalizedEmail)}`;
    void sendPasswordResetEmail(normalizedEmail, resetLink, user.firstName);
  }

  // Always return success (anti-enumeration)
  return { success: true };
}

/**
 * Validates reset token and updates the password.
 */
export async function resetPassword(
  token: string,
  email: string,
  formData: FormData
): Promise<AuthResult> {
  const tokenHash = hashToken(token);

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
  });

  if (!verificationToken || verificationToken.identifier !== `reset:${email.toLowerCase()}`) {
    return { success: false, error: 'Invalid or expired reset link. Please request a new one.' };
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: tokenHash } });
    return { success: false, error: 'This reset link has expired (15 min). Please request a new one.' };
  }

  const raw = {
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { password: hashedPassword },
  });

  // Delete ALL used/leftover tokens for this reset intent (cleanup)
  await prisma.verificationToken.deleteMany({ where: { identifier: `reset:${email.toLowerCase()}` } });

  return { success: true };
}
