'use server';

import { prisma } from '@/lib/prisma';
import { auth, unstable_update } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function updateUiBgOpacity(opacity: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (opacity < 0.0 || opacity > 1.0) {
      return { success: false, error: 'Invalid opacity range' };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { uiBgOpacity: opacity },
    });

    await unstable_update({
      user: {
        uiBgOpacity: opacity,
      },
    });

    revalidatePath('/settings');
    revalidatePath('/plan/route'); // refresh maps
    return { success: true };
  } catch (error) {
    console.error('[Settings] Update UI Opacity:', error);
    return { success: false, error: 'Failed to update UI Settings' };
  }
}
