import { auth } from "@/lib/auth"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"
import { ProfileForm } from "./profile-form"
import { SecurityForm } from "./security-form"
import { EmailForm } from "./email-form"
import { Settings, Wrench } from "lucide-react"

import { prisma } from "@/lib/prisma"

export const metadata = {
  title: "Settings | flyteLog",
  description: "Manage your account settings",
}

export default async function SettingsPage() {
  const session = await auth()
  const t = await getTranslations("settings")

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch the absolute latest fresh data from the DB 
  // because the JWT session token might be stale after updates.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (!dbUser) {
    redirect("/login")
  }

  // Pass user data to client components
  const user = {
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    username: dbUser.username,
    email: dbUser.email,
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-12 pb-24">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-3">
          <Settings className="h-8 w-8 text-sky-500" />
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
          {t("subtitle")}
        </p>
      </div>

      <div className="space-y-8">
        <ProfileForm user={user} />
        <EmailForm initialEmail={user.email} />
        <SecurityForm />
      </div>

      <div className="flex flex-col items-center justify-center gap-4 pt-12 text-center border-t border-slate-200 dark:border-zinc-800">
        <Wrench className="h-10 w-10 text-slate-300 dark:text-zinc-600" />
        <div>
          <h2 className="text-lg font-medium text-slate-700 dark:text-zinc-300">
            More settings are coming soon
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-500 max-w-md mx-auto mt-1">
            We are actively working on bringing you app preferences, subscription management, detailed aircraft options, and more!
          </p>
        </div>
      </div>
    </div>
  )
}
