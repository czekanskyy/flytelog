"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
  }
  return session
}

export async function getPendingUsers() {
  await requireAdmin()
  return prisma.user.findMany({
    where: { approved: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      avatarColor: true,
      createdAt: true,
    },
  })
}

export async function getApprovedUsers() {
  await requireAdmin()
  return prisma.user.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      role: true,
      avatarColor: true,
      expiresAt: true,
      createdAt: true,
    },
  })
}

export async function approveUser(userId: string) {
  await requireAdmin()
  await prisma.user.update({
    where: { id: userId },
    data: { approved: true },
  })
}

export async function rejectUser(userId: string) {
  await requireAdmin()
  await prisma.user.delete({
    where: { id: userId },
  })
}
