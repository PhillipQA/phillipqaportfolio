import { CheckCircle2, Bug, Gauge } from "lucide-react"

const stats = [
  { icon: Gauge, value: "5+ yrs", label: "QA experience" },
  { icon: CheckCircle2, value: "4", label: "featured projects" },
  { icon: Bug, value: "1000s", label: "bugs caught" },
]

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          available for QA opportunities
        </div>

        <h1 className="mt-6 text-balance font-mono text-4xl font-bold tracking-tight sm:text-6xl">
          Phillip Val Cabalo
        </h1>
        <p className="mt-3 text-pretty text-lg text-muted-foreground sm:text-xl">
          Software QA Engineer — Manual Testing, Automation, API Testing &amp; SQL
        </p>
        <p className="mt-5 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          I break things on purpose so users never have to. 5+ years designing test strategies,
          automating end-to-end suites, and validating APIs and databases to ship software with
          confidence.
        </p>

        <div className="mt-8 max-w-xl rounded-lg border border-border bg-card font-mono text-sm shadow-sm">
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
            <span className="h-3 w-3 rounded-full bg-destructive/70" />
            <span className="h-3 w-3 rounded-full bg-chart-3/70" />
            <span className="h-3 w-3 rounded-full bg-primary/70" />
            <span className="ml-3 text-xs text-muted-foreground">test-run.sh</span>
          </div>
          <div className="space-y-1 px-4 py-4">
            <p className="text-muted-foreground">
              <span className="text-primary">$</span> npx playwright test
            </p>
            <p className="text-foreground">Running 128 tests using 4 workers</p>
            <p className="text-primary">✓ 128 passed (12.4s)</p>
            <p className="text-muted-foreground">
              <span className="text-accent">▸</span> 0 flaky · 100% pass rate
            </p>
          </div>
        </div>

        <dl className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4">
              <s.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              <dt className="mt-3 font-mono text-2xl font-bold text-foreground">{s.value}</dt>
              <dd className="text-sm text-muted-foreground">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
