import { Sailboat } from "lucide-react"

export default function GliderLogbookPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <Sailboat className="h-12 w-12 text-sky-500/30" />
      <h1 className="text-xl font-bold text-slate-800 dark:text-zinc-100">
        Glider Logbook
      </h1>
      <p className="text-sm text-slate-500 dark:text-zinc-400">
        Part-SFCL compliant soaring log — coming soon
      </p>
    </div>
  )
}
