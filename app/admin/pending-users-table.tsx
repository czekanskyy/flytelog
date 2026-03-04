"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Check, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserAvatar } from "@/components/user-avatar"
import { approveUser, rejectUser } from "@/lib/admin-actions"

type PendingUser = {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string
  avatarColor: string
  createdAt: Date
}

export function PendingUsersTable({ users }: { users: PendingUser[] }) {
  const router = useRouter()
  const t = useTranslations("admin.table")
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleApprove(userId: string) {
    setLoadingId(userId)
    await approveUser(userId)
    router.refresh()
  }

  async function handleReject(userId: string) {
    setLoadingId(userId)
    await rejectUser(userId)
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-400">{t("user")}</TableHead>
            <TableHead className="text-zinc-400">{t("username")}</TableHead>
            <TableHead className="text-zinc-400">{t("email")}</TableHead>
            <TableHead className="text-zinc-400">{t("registered")}</TableHead>
            <TableHead className="text-zinc-400 text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              className="border-zinc-800/50 hover:bg-zinc-800/30"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    firstName={user.firstName}
                    lastName={user.lastName}
                    color={user.avatarColor}
                    size="sm"
                  />
                  <span className="font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-zinc-400">{user.username}</TableCell>
              <TableCell className="text-zinc-400">{user.email}</TableCell>
              <TableCell className="text-zinc-500 text-sm">
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(user.id)}
                    disabled={loadingId === user.id}
                    className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {t("approve")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReject(user.id)}
                    disabled={loadingId === user.id}
                    className="h-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t("reject")}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
