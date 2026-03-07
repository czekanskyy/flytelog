"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { CheckCircle2, AlertCircle, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { confirmEmailChange } from "@/lib/settings-actions"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Suspense 
        fallback={
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm text-slate-500">Loading verification data...</p>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const identifier = searchParams.get("id")

  if (!token || !identifier) {
    return <InvalidLink />
  }

  return <VerificationProcess token={token} identifier={identifier} />
}

function VerificationProcess({ token, identifier }: { token: string; identifier: string }) {
  const t = useTranslations("settings.email")
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [newEmail, setNewEmail] = useState("")

  useEffect(() => {
    let isMounted = true

    async function verify() {
      const result = await confirmEmailChange(token, identifier)
      if (!isMounted) return

      if (result.success) {
        setStatus("success")
        setNewEmail(result.email!)
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([30, 50, 30])
      } else {
        setStatus("error")
        setErrorMessage(result.error || t("verifyError"))
      }
    }

    verify()

    return () => { isMounted = false }
  }, [token, identifier, t])

  if (status === "loading") {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl shadow-indigo-100/50 dark:shadow-none dark:border dark:border-zinc-800 dark:bg-zinc-900">
        <CardContent className="pt-10 pb-8 text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-2">{t("verifyTitle")}</h2>
            <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-xs mx-auto mb-6">{t("verifyDesc")}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status === "success") {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl shadow-emerald-100/50 dark:shadow-none dark:border dark:border-zinc-800 dark:bg-zinc-900 border-t-4 border-t-emerald-500">
        <CardContent className="pt-10 pb-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 mb-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">{t("verifySuccess")}</h2>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-md border border-slate-100 dark:border-zinc-800">
            {newEmail}
          </p>
        </CardContent>
        <CardFooter className="justify-center border-t border-slate-100 dark:border-zinc-800/50 pt-6">
          <Link href="/settings">
            <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 px-8">
              {t("backToSettings")}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-xl shadow-red-100/50 dark:shadow-none dark:border dark:border-zinc-800 dark:bg-zinc-900 border-t-4 border-t-red-500">
      <CardContent className="pt-10 pb-8 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 mb-2">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Verification Failed</h2>
        <p className="text-red-500 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-500/10 p-3 rounded-md">
          {errorMessage}
        </p>
      </CardContent>
      <CardFooter className="justify-center border-t border-slate-100 dark:border-zinc-800/50 pt-6">
        <Link href="/settings">
          <Button variant="outline" className="px-8">
            {t("backToSettings")}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

function InvalidLink() {
  const t = useTranslations("settings.email")
  return (
    <Card className="w-full max-w-md border-0 shadow-xl shadow-red-100/50 dark:shadow-none dark:border dark:border-zinc-800 dark:bg-zinc-900 border-t-4 border-t-red-500">
      <CardContent className="pt-10 pb-8 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 mb-2">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Invalid Link</h2>
        <p className="text-slate-500 dark:text-zinc-400 text-sm">{t("verifyError")}</p>
      </CardContent>
      <CardFooter className="justify-center border-t border-slate-100 dark:border-zinc-800/50 pt-6">
        <Link href="/settings">
          <Button variant="outline" className="px-8">{t("backToSettings")}</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
