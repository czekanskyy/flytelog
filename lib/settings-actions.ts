'use server';

import { prisma } from '@/lib/prisma';
import { auth, unstable_update } from '@/lib/auth';
import { z } from 'zod';
import { randomBytes, createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
});

export async function updateProfile(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      username: formData.get('username') as string,
    };

    const validatedFields = profileSchema.safeParse(data);
    if (!validatedFields.success) {
      return { success: false, error: validatedFields.error.issues[0].message };
    }

    // Check username uniqueness
    if (data.username !== session.user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: data.username },
      });

      if (existingUser) {
        return { success: false, error: 'Username is already taken' };
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
      },
    });

    await unstable_update({
      user: {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
      }
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('[Settings] Update Profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

export async function updatePassword(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      return { success: false, error: 'New passwords do not match' };
    }

    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long' };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      return { success: false, error: 'User not found or misconfigured' };
    }

    const isCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCorrect) {
      return { success: false, error: 'Incorrect current password' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('[Settings] Update Password:', error);
    return { success: false, error: 'Failed to update password' };
  }
}

export async function requestEmailChange(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const newEmail = formData.get('email') as string;
    const locale = formData.get('locale') as string || 'en';

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return { success: false, error: 'Invalid email address' };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!dbUser) {
      return { success: false, error: 'User not found' };
    }

    if (newEmail === dbUser.email) {
      return { success: false, error: 'This is already your current email' };
    }

    // Check if new email is in use
    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) {
      return { success: false, error: 'This email is already in use by another account' };
    }

    // 1. Rate Limiting Check (max 2 active requests per user in the last 1 hour)
    const recentRequests = await prisma.verificationToken.count({
      where: {
        identifier: { startsWith: `email-change:${session.user.id}:` },
        expires: { gt: new Date() }
      }
    });

    if (recentRequests >= 2) {
      return { success: false, error: 'Too many requests. Please try again later.' };
    }

    // 2. Generate token
    const token = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(token).digest('hex');
    
    // Identifier convention: email-change:USER_ID:NEW_EMAIL
    // Note: We deliberately DO NOT delete old requests here, so they accumulate and serve as our rate-limit counter!
    const identifier = `email-change:${session.user.id}:${newEmail}`;

    // 3. Save new request (expires in 1h)
    await prisma.verificationToken.create({
      data: {
        identifier,
        token: hashedToken,
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // 4. Send Email
    const { sendEmailChangeConfirmation } = await import('@/lib/emails');
    const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/verify-email?token=${token}&id=${encodeURIComponent(identifier)}`;
    
    await sendEmailChangeConfirmation(newEmail, verifyLink, dbUser.firstName, locale);

    return { success: true };
  } catch (error) {
    console.error('[Settings] Request Email Change:', error);
    return { success: false, error: 'Failed to request email change' };
  }
}

export async function confirmEmailChange(token: string, identifier: string) {
  try {
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const verificationToken = await prisma.verificationToken.findFirst({
      where: { identifier, token: hashedToken },
    });

    if (!verificationToken) {
      return { success: false, error: 'Invalid or expired magic link' };
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.deleteMany({ where: { identifier } });
      return { success: false, error: 'Token has expired' };
    }

    // Parse identifier: email-change:USER_ID:NEW_EMAIL
    const parts = identifier.split(':');
    if (parts.length !== 3 || parts[0] !== 'email-change') {
      return { success: false, error: 'Invalid token structure' };
    }
    
    const userId = parts[1];
    const newEmail = parts[2];

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: 'User no longer exists' };
    }

    // Check one last time if email was taken while waiting
    const emailTaken = await prisma.user.findUnique({ where: { email: newEmail } });
    if (emailTaken && emailTaken.id !== user.id) {
      return { success: false, error: 'Email was taken by another user' };
    }

    // Update email
    await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
    });

    // Delete all used/leftover tokens for this specific user's email changes (clean up)
    await prisma.verificationToken.deleteMany({ 
      where: { identifier: { startsWith: `email-change:${userId}:` } } 
    });

    await unstable_update({
      user: {
        email: newEmail,
      }
    });

    revalidatePath('/settings');
    return { success: true, email: newEmail };
  } catch (error) {
    console.error('[Settings] Confirm Email Change:', error);
    return { success: false, error: 'Failed to verify email' };
  }
}
