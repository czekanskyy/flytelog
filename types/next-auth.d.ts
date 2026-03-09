import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
    username: string;
    avatarColor: string;
    email: string;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      firstName: string;
      lastName: string;
      username: string;
      avatarColor: string;
      email: string;
    } & DefaultSession['user'];
  }
}
