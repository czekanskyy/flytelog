"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signIn } from "@/lib/auth"
import { registerSchema, loginSchema } from "@/lib/schemas"
import { getRandomAvatarColor } from "@/lib/avatar"
import { AuthError } from "next-auth"

export type AuthResult = {
  success: boolean
  error?: string
}

export async function registerUser(formData: FormData): Promise<AuthResult> {
  const raw = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { firstName, lastName, username, email, password } = parsed.data

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    },
  })

  if (existingUser) {
    const field = existingUser.email === email.toLowerCase() ? "Email" : "Username"
    return { success: false, error: `${field} is already taken` }
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      firstName,
      lastName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      avatarColor: getRandomAvatarColor(),
    },
  })

  return { success: true }
}

export async function loginUser(formData: FormData): Promise<AuthResult> {
  const raw = {
    login: formData.get("login") as string,
    password: formData.get("password") as string,
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    await signIn("credentials", {
      login: raw.login,
      password: raw.password,
      redirect: false,
    })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.cause?.err?.message === "ACCOUNT_NOT_APPROVED") {
        return {
          success: false,
          error: "Your account is awaiting admin approval",
        }
      }
      if (error.cause?.err?.message === "ACCOUNT_EXPIRED") {
        return {
          success: false,
          error: "Your account has expired. Contact the administrator.",
        }
      }
      return { success: false, error: "Invalid email/username or password" }
    }
    throw error
  }
}
