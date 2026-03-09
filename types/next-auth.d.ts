import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: 'USER' | 'ADMIN';
    firstName: string;
    lastName: string;
    username: string;
    avatarSeed: string;
    email: string;
  }
  interface Session {
    user: {
      id: string;
      role: 'USER' | 'ADMIN';
      firstName: string;
      lastName: string;
      username: string;
      avatarSeed: string;
      email: string;
    } & DefaultSession['user'];
  }
}
