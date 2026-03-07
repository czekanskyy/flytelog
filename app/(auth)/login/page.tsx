"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plane } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { loginUser } from "@/lib/auth-actions"

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations("auth.login")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError("")
    setLoading(true)

    const result = await loginUser(formData)

    if (result.success) {
      router.push("/")
      router.refresh()
    } else {
      setError(result.error || "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-xl shadow-sky-100/50 dark:shadow-none dark:border dark:border-zinc-800 dark:bg-zinc-900">
      <CardHeader className="text-center space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-500/20 shadow-sm">
          <Plane className="h-7 w-7 text-sky-600 dark:text-sky-400" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-800 dark:text-zinc-100">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-zinc-400">
          {t("subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="login" className="text-slate-700 dark:text-zinc-300">
              {t("loginLabel")}
            </Label>
            <Input
              id="login"
              name="login"
              placeholder={t("loginPlaceholder")}
              required
              autoComplete="username"
              className="h-11 bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 dark:text-zinc-300">
              {t("passwordLabel")}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              required
              autoComplete="current-password"
              className="h-11 bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800"
            />
            <div className="text-right mt-1">
              <Link 
                href="/forgot-password" 
                className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
              >
                {t("forgotPassword")}
              </Link>
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-sm transition-colors"
          >
            {loading ? t("submitting") : t("submit")}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
          >
            {t("createOne")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
