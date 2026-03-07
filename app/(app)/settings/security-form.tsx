"use client"

import { useState, useTransition, useRef } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { ShieldAlert, ShieldCheck } from "lucide-react"
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePassword } from "@/lib/settings-actions"

export function SecurityForm() {
  const t = useTranslations("settings.security")
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (newPassword !== confirmPassword) {
      toast.error(t("passwordsMismatch", { fallback: "Passwords do not match" })) // Możemy użyć istniejącego w translations z validation
      return
    }
    if (newPassword.length < 8) {
      toast.error(t("passwordMin", { fallback: "Password must be at least 8 characters" }))
      return
    }

    startTransition(async () => {
      const result = await updatePassword(formData)
      if (result.success) {
        toast.success(t("success"))
        formRef.current?.reset()
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50)
      } else {
        toast.error(result.error || t("error"))
      }
    })
  }

  return (
    <Card className="border-red-500/20 dark:border-red-500/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-500" />
          <CardTitle className="text-red-600 dark:text-red-400">{t("title")}</CardTitle>
        </div>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <form ref={formRef} action={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
            <Input 
              id="currentPassword" 
              name="currentPassword" 
              type="password"
              required 
              autoComplete="current-password"
              className="bg-zinc-50 dark:bg-zinc-800/50"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("newPassword")}</Label>
              <Input 
                id="newPassword" 
                name="newPassword" 
                type="password"
                required 
                autoComplete="new-password"
                className="bg-zinc-50 dark:bg-zinc-800/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password"
                required 
                autoComplete="new-password"
                className="bg-zinc-50 dark:bg-zinc-800/50"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-red-500/10 dark:border-red-500/5 px-6 py-4">
          <Button 
            type="submit" 
            disabled={isPending} 
            className="ml-auto bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white"
          >
            {isPending ? t("saving") : t("save")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
