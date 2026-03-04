import { getTranslations } from "next-intl/server"
import { getPendingUsers, getApprovedUsers } from "@/lib/admin-actions"
import { PendingUsersTable } from "./pending-users-table"
import { ApprovedUsersTable } from "./approved-users-table"
import { Users, UserCheck } from "lucide-react"

export default async function AdminPage() {
  const t = await getTranslations("admin")
  const [pendingUsers, approvedUsers] = await Promise.all([
    getPendingUsers(),
    getApprovedUsers(),
  ])

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-400">{t("subtitle")}</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold">
            {t("pending.title")}
            {pendingUsers.length > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-xs font-medium text-amber-400">
                {pendingUsers.length}
              </span>
            )}
          </h2>
        </div>
        {pendingUsers.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-10 text-center text-sm text-zinc-500">
            {t("pending.empty")}
          </div>
        ) : (
          <PendingUsersTable users={pendingUsers} />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold">
            {t("approved.title")}
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-800 px-1.5 text-xs font-medium text-zinc-400">
              {approvedUsers.length}
            </span>
          </h2>
        </div>
        {approvedUsers.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-10 text-center text-sm text-zinc-500">
            {t("approved.empty")}
          </div>
        ) : (
          <ApprovedUsersTable users={approvedUsers} />
        )}
      </section>
    </div>
  )
}
