import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { auth } from "@/lib/auth"
import { HomeHeader } from "./header"
import { HomeMenu } from "./menu"

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin")
  }

  const t = await getTranslations("home")

  return (
    <div className="min-h-svh bg-slate-50 dark:bg-zinc-950">
      <HomeHeader
        firstName={session.user.firstName}
        lastName={session.user.lastName}
        avatarColor={session.user.avatarColor}
        greeting={t("greeting", { name: session.user.firstName })}
        signOutLabel={t("signOut")}
      />
      <main className="mx-auto max-w-lg px-4 pb-8 pt-6 space-y-6">
        <HomeMenu />
      </main>
    </div>
  )
}
