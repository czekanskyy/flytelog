import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Settings className="h-12 w-12 text-sky-500/30" />
        <h1 className="text-xl font-bold text-slate-800 dark:text-zinc-100">
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Profile, preferences and subscription — coming soon
        </p>
      </div>
    </div>
  )
}
