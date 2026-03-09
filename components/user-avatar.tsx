'use client';

import { getInitials } from '@/lib/avatar';
import { createAvatar } from '@dicebear/core';
import { glass } from '@dicebear/collection';
import { useMemo } from 'react';
import Image from 'next/image';

export function UserAvatar({ firstName, lastName, seed, size = 'md' }: { firstName: string; lastName: string; seed: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  };

  const avatarUri = useMemo(() => {
    return createAvatar(glass, {
      seed: seed,
    }).toDataUri();
  }, [seed]);

  return (
    <div
      className={`${sizeClasses[size]} relative flex items-center justify-center rounded-full font-semibold text-white select-none overflow-hidden drop-shadow-md`}
    >
      <Image src={avatarUri} alt='Avatar background' fill className='object-cover absolute inset-0 z-0' />
      <span className='relative z-10 drop-shadow-[0_0_1.25px_rgba(0,0,0,0.8)]'>{getInitials(firstName, lastName)}</span>
    </div>
  );
}
