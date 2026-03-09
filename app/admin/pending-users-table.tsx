'use client';

import { useState, useTransition } from 'react';
import { Trash2, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserAvatar } from '@/components/user-avatar';
import { deleteUser } from '@/lib/admin-actions';
import { toast } from 'sonner';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  avatarSeed: string;
  createdAt: Date;
};

export function UsersTable({ users: initialUsers }: { users: User[] }) {
  const t = useTranslations('admin');
  const tTable = useTranslations('admin.table');
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDelete(userId: string, name: string) {
    if (!confirm(t('users.deleteConfirm', { name }))) return;

    setDeletingId(userId);
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast.success(t('users.deleteSuccess', { name }));
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
      } else {
        toast.error(result.error ?? t('users.deleteError'));
      }
      setDeletingId(null);
    });
  }

  return (
    <div className='rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden'>
      <Table>
        <TableHeader>
          <TableRow className='border-zinc-800 hover:bg-transparent'>
            <TableHead className='text-zinc-400'>{tTable('user')}</TableHead>
            <TableHead className='text-zinc-400 hidden sm:table-cell'>{tTable('email')}</TableHead>
            <TableHead className='text-zinc-400 hidden md:table-cell'>{tTable('role')}</TableHead>
            <TableHead className='text-zinc-400 hidden lg:table-cell'>{tTable('registered')}</TableHead>
            <TableHead className='text-zinc-400 text-right'>{tTable('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id} className='border-zinc-800/50 hover:bg-zinc-800/30'>
              <TableCell>
                <div className='flex items-center gap-3'>
                  <UserAvatar firstName={user.firstName} lastName={user.lastName} seed={user.avatarSeed} size='sm' />
                  <div className='min-w-0'>
                    <p className='font-medium text-zinc-100 truncate'>
                      {user.firstName} {user.lastName}
                    </p>
                    <p className='text-xs text-zinc-500 truncate'>@{user.username}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className='text-zinc-400 hidden sm:table-cell'>{user.email}</TableCell>
              <TableCell className='hidden md:table-cell'>
                <Badge
                  variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                  className={
                    user.role === 'ADMIN' ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 border-0' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border-0'
                  }
                >
                  {user.role === 'ADMIN' && <ShieldCheck className='h-3 w-3 mr-1' />}
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell className='text-zinc-500 text-sm hidden lg:table-cell'>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className='text-right'>
                {user.role !== 'ADMIN' && (
                  <Button
                    variant='ghost'
                    size='sm'
                    disabled={isPending && deletingId === user.id}
                    onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
                    className='h-8 w-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors'
                    title={t('users.deleteTitle')}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
