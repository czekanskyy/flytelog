"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  PlaneTakeoff,
  Sailboat,
  Monitor,
  Map,
  CloudSun,
  FileText,
} from "lucide-react"
import { useTranslations } from "next-intl"

const tabs = [
  { key: "aeroplane", href: "/logbook/aeroplane", icon: PlaneTakeoff },
  { key: "glider", href: "/logbook/glider", icon: Sailboat },
  { key: "fstd", href: "/logbook/fstd", icon: Monitor },
  { key: "route", href: "/planning/route", icon: Map },
  { key: "weather", href: "/planning/weather", icon: CloudSun },
  { key: "ofp", href: "/planning/ofp", icon: FileText },
] as const

export function FeatureTabs() {
  const pathname = usePathname()
  const t = useTranslations("tabs")

  return (
    <nav className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-x-auto">
      <div className="flex min-w-max px-2 lg:px-4">
        {tabs.map(({ key, href, icon: Icon }) => {
          const isActive = pathname.startsWith(href)

          return (
            <Link
              key={key}
              href={href}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors select-none whitespace-nowrap
                ${
                  isActive
                    ? "border-sky-500 text-sky-600 dark:text-sky-400"
                    : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-600"
                }
              `}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{t(key)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
