export function SectionHeading({
  title,
  subtitle,
}: {
  index?: string
  title: string
  subtitle?: string
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {subtitle ? <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p> : null}
    </div>
  )
}
