import { UserAvatar } from "@/components/user-avatar"
import { ThemeSwitcher } from "@/components/theme-switcher"

type HomeHeaderProps = {
  firstName: string
  lastName: string
  avatarColor: string
  greeting: string
  signOutLabel: string
}

export function HomeHeader({
  firstName,
  lastName,
  avatarColor,
  greeting,
  signOutLabel,
}: HomeHeaderProps) {
  return (
    <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            firstName={firstName}
            lastName={lastName}
            color={avatarColor}
            size="sm"
          />
          <span className="text-sm font-medium text-slate-700 dark:text-zinc-200">
            {greeting}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <form
            action={async () => {
              "use server"
              const { signOut } = await import("@/lib/auth")
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors select-none"
            >
              {signOutLabel}
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
