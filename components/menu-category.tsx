type MenuCategoryProps = {
  title: string
  children: React.ReactNode
}

export function MenuCategory({ title, children }: MenuCategoryProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-1">
        {title}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {children}
      </div>
    </section>
  )
}
