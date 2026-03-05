import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        login: { label: 'Email or Username' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const login = credentials.login as string;
        const password = credentials.password as string;

        if (!login || !password) return null;

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: login.toLowerCase() }, { username: login.toLowerCase() }],
          },
        });

        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;

        if (!user.approved) {
          throw new Error('ACCOUNT_NOT_APPROVED');
        }

        if (user.expiresAt && user.expiresAt < new Date()) {
          throw new Error('ACCOUNT_EXPIRED');
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id! },
          select: { role: true, approved: true, firstName: true, lastName: true, username: true, avatarColor: true, expiresAt: true, email: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.approved = dbUser.approved;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          token.username = dbUser.username;
          token.email = dbUser.email;
          token.avatarColor = dbUser.avatarColor;
          token.expiresAt = dbUser.expiresAt ? dbUser.expiresAt.toISOString() : null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.approved = token.approved as boolean;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.username = token.username as string;
        session.user.email = token.email as string;
        session.user.avatarColor = token.avatarColor as string;
        session.user.expiresAt = token.expiresAt ? new Date(token.expiresAt as string) : null;
      }
      return session;
    },
  },
});
