import { Map } from "lucide-react"

export default function RoutePage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <Map className="h-12 w-12 text-sky-500/30" />
      <h1 className="text-xl font-bold text-slate-800 dark:text-zinc-100">
        Route / Map
      </h1>
      <p className="text-sm text-slate-500 dark:text-zinc-400">
        VFR waypoints and interactive map — coming soon
      </p>
    </div>
  )
}
