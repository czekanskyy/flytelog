import { ThemeSwitcher } from "@/components/theme-switcher"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-sky-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-4">
        {children}
        <div className="flex justify-center">
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  )
}
