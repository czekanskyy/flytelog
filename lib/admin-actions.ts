'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }
  return session;
}

export async function getAllUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      role: true,
      avatarSeed: true,
      createdAt: true,
    },
  });
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin();

  // Zabezpieczenie: admin nie może usunąć samego siebie
  if (session.user.id === userId) {
    return { success: false, error: 'You cannot delete your own account' };
  }

  // Zabezpieczenie: sprawdzamy czy target user istnieje i nie jest ADMINem
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!targetUser) {
    return { success: false, error: 'User not found' };
  }

  if (targetUser.role === 'ADMIN') {
    return { success: false, error: 'Cannot delete another admin account' };
  }

  await prisma.user.delete({ where: { id: userId } });
  return { success: true };
}
