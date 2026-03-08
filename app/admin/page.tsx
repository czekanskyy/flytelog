import { getTranslations } from "next-intl/server"
import { getAllUsers } from "@/lib/admin-actions"
import { UsersTable } from "./pending-users-table"
import { Users } from "lucide-react"

export default async function AdminPage() {
  const t = await getTranslations("admin")
  const users = await getAllUsers()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-400">{t("subtitle")}</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-sky-400" />
          <h2 className="text-lg font-semibold">
            {t("users.title")}
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-800 px-1.5 text-xs font-medium text-zinc-400">
              {users.length}
            </span>
          </h2>
        </div>
        {users.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-10 text-center text-sm text-zinc-500">
            {t("users.empty")}
          </div>
        ) : (
          <UsersTable users={users} />
        )}
      </section>
    </div>
  )
}
