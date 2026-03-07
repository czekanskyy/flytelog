"use client"

import { useState } from "react"
import Link from "next/link"
import { Plane, Send, CheckCircle2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Turnstile } from "@marsidev/react-turnstile"
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
import { initiateRegistration } from "@/lib/auth-actions"

export default function RegisterPage() {
  const t = useTranslations("auth.register")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sentEmail, setSentEmail] = useState("")

  async function handleSubmit(formData: FormData) {
    setError("")
    setLoading(true)
    const email = formData.get("email") as string
    const result = await initiateRegistration(formData)
    if (result.success) {
      setSentEmail(email)
      setSuccess(true)
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
          <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">
            {t("checkEmail")}
          </h2>
          <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-xs mx-auto">
            {t("checkEmailDesc", { email: sentEmail })}
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-600">
            {t("checkEmailExpiry")}
          </p>
          <Link href="/login">
            <Button variant="outline" className="mt-2 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800">
              {t("backToLogin")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
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
            <Label htmlFor="email" className="text-slate-700 dark:text-zinc-300">
              {t("emailLabel")}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              required
              autoComplete="email"
              className="h-11 bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800"
            />
          </div>
          <div className="flex justify-center py-2">
            <Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} options={{ theme: 'auto' }} />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-sm transition-colors"
          >
            {loading ? t("submitting") : (
              <><Send className="h-4 w-4 mr-2" />{t("submit")}</>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          {t("hasAccount")}{" "}
          <Link href="/login" className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors">
            {t("signIn")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
