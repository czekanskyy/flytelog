"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  CircleUserRound,
  ShieldCheck,
  Settings,
  HelpCircle,
  Megaphone,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { UserAvatar } from "@/components/user-avatar"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Button } from "@/components/ui/button"

const GREETING_COUNT = 9

type NavbarProps = {
  firstName: string
  lastName: string
  avatarColor: string
  isAdmin: boolean
}

export function Navbar({ firstName, lastName, avatarColor, isAdmin }: NavbarProps) {
  const t = useTranslations()
  const [greetingIndex, setGreetingIndex] = useState(0)

  useEffect(() => {
    setGreetingIndex(Math.floor(Math.random() * GREETING_COUNT))
  }, [])

  const greeting = t(`greetings.${greetingIndex}`, { name: firstName })

  const actions = [
    { icon: Megaphone, label: t("nav.changelog"), href: "/changelog" },
    { icon: HelpCircle, label: t("nav.help"), href: "/manual" },
    { icon: Settings, label: t("nav.settings"), href: "/settings" },
    ...(isAdmin
      ? [{ icon: ShieldCheck, label: t("nav.admin"), href: "/admin" }]
      : []),
  ]

  return (
    <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Left — logo */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-sky-600 dark:text-sky-400 select-none shrink-0"
        >
          flyteLog
        </Link>

        {/* Center — greeting (hidden on small screens) */}
        <p className="hidden md:block text-sm text-slate-500 dark:text-zinc-400 truncate px-4">
          {greeting}
        </p>

        {/* Right — actions */}
        <div className="flex items-center gap-1">
          <ThemeSwitcher />

          <div className="hidden sm:flex items-center gap-0.5 ml-1">
            {actions.map(({ icon: Icon, label, href }) => (
              <Button
                key={href}
                variant="ghost"
                size="sm"
                asChild
                className="h-9 w-9 px-0 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                title={label}
              >
                <Link href={href}>
                  <Icon className="h-4.5 w-4.5" />
                </Link>
              </Button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 px-0 ml-0.5"
            title={t("nav.account")}
          >
            <UserAvatar
              firstName={firstName}
              lastName={lastName}
              color={avatarColor}
              size="sm"
            />
          </Button>
        </div>
      </div>
    </header>
  )
}
