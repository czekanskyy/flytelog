"use client"

import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import {
  Sun,
  Moon,
  Monitor,
  Languages,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { setLocale } from "@/lib/locale-actions"

const themes = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const

const locales = [
  { value: "en", label: "English" },
  { value: "pl", label: "Polski" },
] as const

export function ThemeDropdown() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations("theme")
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const currentIcon = mounted
    ? (themes.find((th) => th.value === theme)?.icon ?? Monitor)
    : Monitor

  const CurrentIcon = currentIcon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 px-0 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
        >
          <CurrentIcon className="h-4.5 w-4.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map(({ value, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {t(value as "light" | "dark" | "system")}
            {mounted && theme === value && (
              <Check className="h-3.5 w-3.5 ml-auto text-sky-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function LocaleDropdown() {
  const locale = useLocale()
  const router = useRouter()

  async function handleLocaleChange(newLocale: string) {
    await setLocale(newLocale)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 px-0 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
        >
          <Languages className="h-4.5 w-4.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map(({ value, label }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => handleLocaleChange(value)}
            className="gap-2"
          >
            {label}
            {locale === value && (
              <Check className="h-3.5 w-3.5 ml-auto text-sky-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
