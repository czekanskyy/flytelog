import { BookOpen } from "lucide-react"

export default function ManualPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <BookOpen className="h-12 w-12 text-sky-500/30" />
        <h1 className="text-xl font-bold text-slate-800 dark:text-zinc-100">
          App Manual
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          User guide and documentation — coming soon
        </p>
      </div>
    </div>
  )
}
