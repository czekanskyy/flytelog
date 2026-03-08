"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Plane, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
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
import { completeRegistration } from "@/lib/auth-actions"

export default function RegisterCompletePage() {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      }
    >
      <RegisterCompleteContent />
    </Suspense>
  )
}

function RegisterCompleteContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  if (!token || !email) {
    return <InvalidLink />
  }

  return <CompleteForm token={token} email={email} />
}

function InvalidLink() {
  const t = useTranslations("auth.register")
  return (
    <Card className="border-0 shadow-xl shadow-sky-100/50 dark:shadow-none dark:border dark:border-zinc-800 dark:bg-zinc-900">
      <CardContent className="pt-10 pb-8 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">{t("invalidLink")}</h2>
        <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-xs mx-auto">{t("invalidLinkDesc")}</p>
        <Link href="/register">
          <Button className="mt-2 bg-sky-500 hover:bg-sky-600 text-white">{t("requestNewLink")}</Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function CompleteForm({ token, email }: { token: string; email: string }) {
  const t = useTranslations("auth.register")
  const router = useRouter()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError("")
    setLoading(true)
    const result = await completeRegistration(token, email, formData)
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
          <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">{t("completeSuccess")}</h2>
          <p className="text-slate-500 dark:text-zinc-400 text-sm">{t("completeSuccessDesc")}</p>
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
          {t("completeTitle")}
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-zinc-400">
          {t("completeSubtitle", { email })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20">
              {error}
              {error.includes("expired") || error.includes("Invalid") ? (
                <Link href="/register" className="block mt-1 font-medium underline underline-offset-2">
                  {t("requestNewLink")}
                </Link>
              ) : null}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-slate-700 dark:text-zinc-300">{t("firstNameLabel")}</Label>
              <Input id="firstName" name="firstName" placeholder={t("firstNamePlaceholder")} required className="h-11 bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-slate-700 dark:text-zinc-300">{t("lastNameLabel")}</Label>
              <Input id="lastName" name="lastName" placeholder={t("lastNamePlaceholder")} required className="h-11 bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username" className="text-slate-700 dark:text-zinc-300">{t("usernameLabel")}</Label>
            <Input id="username" name="username" placeholder={t("usernamePlaceholder")} required autoComplete="username" className="h-11 bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 dark:text-zinc-300">{t("passwordLabel")}</Label>
            <Input id="password" name="password" type="password" placeholder={t("passwordPlaceholder")} required autoComplete="new-password" className="h-11 bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-zinc-300">{t("confirmPasswordLabel")}</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" placeholder={t("confirmPasswordPlaceholder")} required autoComplete="new-password" className="h-11 bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-sm transition-colors">
            {loading ? t("completing") : t("complete")}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-xs text-slate-400 dark:text-zinc-600">{t("registering", { email })}</p>
      </CardFooter>
    </Card>
  )
}
