import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      approved: boolean
      firstName: string
      lastName: string
      username: string
      avatarColor: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    approved: boolean
    firstName: string
    lastName: string
    username: string
    avatarColor: string
  }
}
