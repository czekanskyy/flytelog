"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserAvatar } from "@/components/user-avatar"

type ApprovedUser = {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string
  role: string
  avatarColor: string
  expiresAt: Date | null
  createdAt: Date
}

export function ApprovedUsersTable({ users }: { users: ApprovedUser[] }) {
  const t = useTranslations("admin.table")

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-400">{t("user")}</TableHead>
            <TableHead className="text-zinc-400">{t("username")}</TableHead>
            <TableHead className="text-zinc-400">{t("email")}</TableHead>
            <TableHead className="text-zinc-400">{t("role")}</TableHead>
            <TableHead className="text-zinc-400">{t("expires")}</TableHead>
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
              <TableCell>
                <Badge
                  variant={user.role === "ADMIN" ? "default" : "secondary"}
                  className={
                    user.role === "ADMIN"
                      ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border-0"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border-0"
                  }
                >
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell className="text-zinc-500 text-sm">
                {user.expiresAt
                  ? new Date(user.expiresAt).toLocaleDateString()
                  : t("never")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
