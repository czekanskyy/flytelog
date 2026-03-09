import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
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

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id! },
          select: { role: true, firstName: true, lastName: true, username: true, avatarColor: true, email: true, uiBgOpacity: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          token.username = dbUser.username;
          token.email = dbUser.email;
          token.avatarColor = dbUser.avatarColor;
          token.uiBgOpacity = dbUser.uiBgOpacity;
        }
      }
      if (trigger === 'update' && session !== null) {
        if (session.firstName) token.firstName = session.firstName;
        if (session.lastName) token.lastName = session.lastName;
        if (session.username) token.username = session.username;
        if (session.email) token.email = session.email;
        if (session.avatarColor) token.avatarColor = session.avatarColor;
        if (session.role) token.role = session.role;
        if (session.uiBgOpacity !== undefined) token.uiBgOpacity = session.uiBgOpacity;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.username = token.username as string;
        session.user.email = token.email as string;
        session.user.avatarColor = token.avatarColor as string;
        session.user.uiBgOpacity = token.uiBgOpacity as number;
      }
      return session;
    },
  },
});
