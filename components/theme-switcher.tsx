"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

const themes = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const t = useTranslations("theme")

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="h-9 w-[108px]" />
  }

  return (
    <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
      {themes.map(({ value, icon: Icon }) => (
        <Button
          key={value}
          variant="ghost"
          size="sm"
          onClick={() => setTheme(value)}
          className={`h-8 w-9 px-0 ${
            theme === value
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={t(value as "light" | "dark" | "system")}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  )
}
