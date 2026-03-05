import { ListChecks } from "lucide-react"

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <ListChecks className="h-12 w-12 text-sky-500/30" />
        <h1 className="text-xl font-bold text-slate-800 dark:text-zinc-100">
          Changelog
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Version history and updates — coming soon
        </p>
      </div>
    </div>
  )
}
