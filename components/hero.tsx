import { BriefcaseBusiness, CheckCircle2, Workflow } from "lucide-react"

const stats = [
  { icon: BriefcaseBusiness, value: "5+ yrs", label: "QA & delivery experience" },
  { icon: Workflow, value: "BA + QA", label: "requirements through validation" },
  { icon: CheckCircle2, value: "4", label: "featured case studies" },
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
          business analysis · quality assurance · automation
        </div>

        <h1 className="mt-6 text-balance font-mono text-4xl font-bold tracking-tight sm:text-6xl">
          Phillip Val Cabalo
        </h1>
        <p className="mt-3 text-pretty text-lg text-muted-foreground sm:text-xl">
          Business Analyst | QA &amp; Test Automation
        </p>
        <p className="mt-5 max-w-3xl text-pretty leading-relaxed text-muted-foreground">
          I translate business needs into clear, testable requirements and stay close to delivery through
          QA, UAT, defect analysis, and automation. My work sits between stakeholders, developers, and
          users — reducing ambiguity, catching issues early, and building practical workflows that help
          teams ship with confidence.
        </p>

        <div className="mt-8 max-w-2xl rounded-lg border border-border bg-card font-mono text-sm shadow-sm">
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
            <span className="h-3 w-3 rounded-full bg-destructive/70" />
            <span className="h-3 w-3 rounded-full bg-chart-3/70" />
            <span className="h-3 w-3 rounded-full bg-primary/70" />
            <span className="ml-3 text-xs text-muted-foreground">delivery-workflow.sh</span>
          </div>
          <div className="space-y-1 px-4 py-4">
            <p className="text-muted-foreground">
              <span className="text-primary">$</span> map requirement --to delivery
            </p>
            <p className="text-foreground">✓ clarify scope, flows, and acceptance criteria</p>
            <p className="text-foreground">✓ validate edge cases, APIs, data, and user journeys</p>
            <p className="text-foreground">✓ automate repeatable regression where it adds value</p>
            <p className="text-muted-foreground">
              <span className="text-accent">▸</span> outcome: traceable requirements + testable delivery
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
