import Link from "next/link"
import type { LucideIcon } from "lucide-react"

type MenuTileProps = {
  href: string
  icon: LucideIcon
  label: string
  description: string
}

export function MenuTile({ href, icon: Icon, label, description }: MenuTileProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-center shadow-sm transition-all hover:shadow-md hover:border-sky-200 dark:hover:border-sky-500/30 hover:-translate-y-0.5 active:translate-y-0 select-none min-h-[120px]"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 transition-colors group-hover:bg-sky-100 dark:group-hover:bg-sky-500/20">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
          {label}
        </p>
        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-snug">
          {description}
        </p>
      </div>
    </Link>
  )
}
