"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
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
import { updateProfile } from "@/lib/settings-actions"

type ProfileFormProps = {
  user: {
    firstName: string
    lastName: string
    username: string
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const t = useTranslations("settings.profile")
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    // Basic frontend validation
    const username = formData.get("username") as string
    if (!/^[a-zA-Z0-9.\-_]+$/.test(username)) {
      toast.error("Username formatting is invalid")
      return
    }

    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.success) {
        toast.success(t("success"))
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50)
      } else {
        toast.error(result.error || t("error"))
      }
    })
  }

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t("firstName")}</Label>
              <Input 
                id="firstName" 
                name="firstName" 
                defaultValue={user.firstName}
                required 
                className="bg-zinc-50 dark:bg-zinc-800/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t("lastName")}</Label>
              <Input 
                id="lastName" 
                name="lastName" 
                defaultValue={user.lastName}
                required 
                className="bg-zinc-50 dark:bg-zinc-800/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">{t("username")}</Label>
            <Input 
              id="username" 
              name="username" 
              defaultValue={user.username}
              required 
              className="bg-zinc-50 dark:bg-zinc-800/50"
            />
            <p className="text-xs text-slate-500 dark:text-zinc-500">
              Only letters, numbers, dots, dashes, and underscores allowed. Must be unique.
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t border-zinc-200/50 dark:border-zinc-800/50 px-6 py-4">
          <Button type="submit" disabled={isPending} className="ml-auto bg-sky-600 hover:bg-sky-700 text-white">
            {isPending ? t("saving") : t("save")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
