import { SectionHeading } from "@/components/section-heading"

const groups = [
  { title: "Test automation", items: ["Playwright + TypeScript", "Page Object Model and custom fixtures", "Data-driven test design", "GitHub Actions CI runs"] },
  { title: "Manual and functional testing", items: ["Exploratory and regression testing", "Test plans and test cases", "Reproducible defect reports", "UAT support and re-testing"] },
  { title: "API and data", items: ["REST testing with Postman", "Auth, payload, and negative-case checks", "SQL data validation", "Supabase / PostgreSQL"] },
]

export function Expertise() {
  return (
    <section id="expertise" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading title="Testing skills" subtitle="The tools and techniques I use day to day" />
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {groups.map((g) => (
            <div key={g.title} className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold">{g.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {g.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-accent/30 bg-accent/5 p-5 sm:p-6">
          <h3 className="font-semibold">Also a Business Analyst</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Testers usually inherit requirements. I also write them: BRD and FSD documentation, process flows,
            acceptance criteria, and requirements traceability. That means fewer ambiguous specs, tests tied
            directly to acceptance criteria, and defects caught at the requirement stage, where they are cheapest to fix.
          </p>
        </div>
      </div>
    </section>
  )
}
