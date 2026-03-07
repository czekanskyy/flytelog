"use client"

import { useState, useTransition, useRef } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Mail, CheckCircle2 } from "lucide-react"
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
import { requestEmailChange } from "@/lib/settings-actions"

type EmailFormProps = {
  initialEmail: string
}

export function EmailForm({ initialEmail }: EmailFormProps) {
  const t = useTranslations("settings.email")
  const [isPending, startTransition] = useTransition()
  const [successSent, setSuccessSent] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    const email = formData.get("email") as string
    
    if (email === initialEmail) {
      toast.error(t("error") + " - Same email")
      return
    }

    startTransition(async () => {
      const result = await requestEmailChange(formData)
      if (result.success) {
        setSuccessSent(true)
        toast.success(t("success"))
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50)
      } else {
        toast.error(result.error || t("error"))
      }
    })
  }

  return (
    <Card className="border-indigo-500/20 dark:border-indigo-500/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
          <CardTitle className="text-indigo-600 dark:text-indigo-400">{t("title")}</CardTitle>
        </div>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      
      {successSent ? (
        <CardContent className="space-y-4 pt-4">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-4 py-4 border border-emerald-100 dark:border-emerald-500/20 flex flex-col items-center text-center space-y-3">
             <CheckCircle2 className="h-10 w-10 text-emerald-500" />
             <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
               {t("checkEmail")}
             </p>
             <Button variant="outline" onClick={() => setSuccessSent(false)} className="mt-2 text-xs">
                Close
             </Button>
          </div>
        </CardContent>
      ) : (
        <form ref={formRef} action={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentEmail">{t("current")}</Label>
              <Input 
                id="currentEmail" 
                value={initialEmail}
                readOnly
                disabled
                className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 opacity-70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("new")}</Label>
              <Input 
                id="email" 
                name="email" 
                type="email"
                required 
                placeholder="new@example.com"
                className="bg-zinc-50 dark:bg-zinc-800/50"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t border-indigo-500/10 dark:border-indigo-500/5 px-6 py-4">
            <Button 
              type="submit" 
              disabled={isPending} 
              className="ml-auto bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              {isPending ? t("requesting") : t("requestChange")}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
