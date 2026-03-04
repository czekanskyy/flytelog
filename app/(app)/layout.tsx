import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { FeatureTabs } from "@/components/feature-tabs"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-svh bg-slate-50 dark:bg-zinc-950">
      <Navbar
        firstName={session.user.firstName}
        lastName={session.user.lastName}
        avatarColor={session.user.avatarColor}
        isAdmin={session.user.role === "ADMIN"}
      />
      <FeatureTabs />
      <main className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
        {children}
      </main>
    </div>
  )
}
