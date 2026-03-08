"use client"

import { ShieldCheck, Zap, Bug, Wrench } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"

type ChangeType = "feat" | "fix" | "improvement" | "security"

interface ReleaseKey {
  version: string
  key: string
  changes: { type: ChangeType; key: string }[]
}

const releaseKeys: ReleaseKey[] = [
  {
    version: "v1.1.0",
    key: "v1_1_0",
    changes: [
      { type: "improvement", key: "c1" },
      { type: "feat",        key: "c2" },
      { type: "improvement", key: "c3" },
    ]
  },
  {
    version: "v1.0.5",
    key: "v1_0_5",
    changes: [
      { type: "security",    key: "c1" },
      { type: "fix",         key: "c2" },
    ]
  },
  {
    version: "v1.0.0",
    key: "v1_0_0",
    changes: [
      { type: "feat", key: "c1" },
      { type: "feat", key: "c2" },
      { type: "feat", key: "c3" },
      { type: "feat", key: "c4" },
    ]
  }
]

export default function ChangelogPage() {
  const t = useTranslations("changelog")

  const typeConfig: Record<ChangeType, { icon: React.ReactNode; color: string; label: string }> = {
    feat: {
      icon: <Zap className="h-4 w-4 shrink-0" />,
      color: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
      label: t("feat")
    },
    fix: {
      icon: <Bug className="h-4 w-4 shrink-0" />,
      color: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
      label: t("fix")
    },
    improvement: {
      icon: <Wrench className="h-4 w-4 shrink-0" />,
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
      label: t("improvement")
    },
    security: {
      icon: <ShieldCheck className="h-4 w-4 shrink-0" />,
      color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
      label: t("security")
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 lg:px-6 py-8 pb-safe select-none">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-zinc-400">
          {t("subtitle")}
        </p>
      </div>

      <div className="relative border-l border-slate-200 dark:border-zinc-800 ml-3 md:ml-6 space-y-12 pb-10">
        {releaseKeys.map((release) => (
          <div key={release.version} className="relative pl-8 md:pl-10">
            {/* Timeline Dot */}
            <div className="absolute -left-3.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-zinc-950 border-2 border-slate-200 dark:border-zinc-800">
              <div className="h-2.5 w-2.5 rounded-full bg-sky-500 dark:bg-sky-400" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-2">
              <div className="flex items-center gap-3 mb-1 sm:mb-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">
                  {t(`${release.key}.version`)}
                </h2>
                <Badge variant="secondary" className="font-mono text-xs text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 border-none shadow-none">
                  {t(`${release.key}.date`)}
                </Badge>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-200 mb-2">
              {t(`${release.key}.title`)}
            </h3>
            
            <p className="text-slate-600 dark:text-zinc-400 mb-6 text-sm sm:text-base leading-relaxed">
              {t(`${release.key}.description`)}
            </p>

            <ul className="space-y-4">
              {release.changes.map((change, j) => {
                const config = typeConfig[change.type]
                return (
                  <li key={j} className="flex items-start gap-3">
                    <div className={`mt-0.5 flex shrink-0 items-center justify-center rounded-full p-1.5 ${config.color}`}>
                      {config.icon}
                    </div>
                    <span className="text-slate-700 dark:text-zinc-300 text-sm sm:text-base leading-snug pt-0.5">
                      <strong className="font-semibold mr-1.5 inline-block opacity-80">{config.label}:</strong>
                      {t(`${release.key}.${change.key}`)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
