"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { KeyRound, CheckCircle2, AlertCircle } from "lucide-react"
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
import { resetPassword } from "@/lib/auth-actions"

type Props = {
  searchParams: Promise<{ token?: string; email?: string }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, email } = await searchParams

  if (!token || !email) {
    return <InvalidLink />
  }

  return <ResetForm token={token} email={decodeURIComponent(email)} />
}

function InvalidLink() {
  const t = useTranslations("auth.resetPassword")
  return (
    <Card className="border-0 shadow-xl shadow-sky-100/50 dark:shadow-none dark:border dark:border-zinc-800 dark:bg-zinc-900">
      <CardContent className="pt-10 pb-8 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">{t("invalidLink")}</h2>
        <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-xs mx-auto">{t("invalidLinkDesc")}</p>
        <Link href="/forgot-password">
          <Button className="mt-2 bg-orange-500 hover:bg-orange-600 text-white">{t("requestNewLink")}</Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function ResetForm({ token, email }: { token: string; email: string }) {
  const t = useTranslations("auth.resetPassword")
  const router = useRouter()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError("")
    setLoading(true)
    const result = await resetPassword(token, email, formData)
    if (result.success) {
      setSuccess(true)
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50)
      setTimeout(() => router.push("/login"), 2000)
    } else {
      setError(result.error || "Something went wrong")
    }
    setLoading(false)
  }

  if (success) {
    return (
      <Card className="border-0 shadow-xl shadow-sky-100/50 dark:shadow-none dark:border dark:border-zinc-800 dark:bg-zinc-900">
        <CardContent className="pt-10 pb-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">{t("successTitle")}</h2>
          <p className="text-slate-500 dark:text-zinc-400 text-sm">{t("successDesc")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl shadow-sky-100/50 dark:shadow-none dark:border dark:border-zinc-800 dark:bg-zinc-900">
      <CardHeader className="text-center space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/20 shadow-sm">
          <KeyRound className="h-7 w-7 text-orange-500 dark:text-orange-400" />
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
              {(error.includes("expired") || error.includes("Invalid")) && (
                <Link href="/forgot-password" className="block mt-1 font-medium underline underline-offset-2">
                  {t("requestNewLink")}
                </Link>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 dark:text-zinc-300">{t("passwordLabel")}</Label>
            <Input id="password" name="password" type="password" placeholder={t("passwordPlaceholder")} required autoComplete="new-password" className="h-11 bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-zinc-300">{t("confirmPasswordLabel")}</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" placeholder={t("confirmPasswordPlaceholder")} required autoComplete="new-password" className="h-11 bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-sm transition-colors">
            {loading ? t("submitting") : t("submit")}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link href="/login" className="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors">
          ← {t("backToLogin")}
        </Link>
      </CardFooter>
    </Card>
  )
}
