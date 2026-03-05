import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      approved: boolean;
      firstName: string;
      lastName: string;
      username: string;
      avatarColor: string;
      expiresAt: Date | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    approved: boolean;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    avatarColor: string;
    expiresAt: string | null;
  }
}
