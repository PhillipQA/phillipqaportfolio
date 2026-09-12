export function SectionHeading({
  index,
  title,
  subtitle,
}: {
  index: string
  title: string
  subtitle?: string
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-primary">{index}</span>
        <span className="h-px flex-none w-8 bg-primary/40" />
        <h2 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {subtitle ? <p className="mt-2 pl-[3.75rem] text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  )
}
