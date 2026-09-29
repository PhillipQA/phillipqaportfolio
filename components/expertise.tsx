import { SectionHeading } from "@/components/section-heading"

const businessAnalysis = [
  "Requirements Gathering",
  "BRD / FSD Documentation",
  "Process & Workflow Mapping",
  "Acceptance Criteria",
  "Requirements Traceability",
  "Stakeholder / Dev Coordination",
]

const quality = [
  "Manual & Exploratory Testing",
  "Functional & Regression Testing",
  "UAT Support",
  "API Testing",
  "SQL / Data Validation",
  "Defect Analysis & Re-testing",
]

const technical = [
  "Playwright + TypeScript",
  "Postman / REST APIs",
  "Supabase / PostgreSQL",
  "Git / GitHub",
  "AI-assisted Document Workflows",
  "Gmail / Discord Integrations",
]

function Tree({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="font-mono text-sm text-primary">{title}/</p>
      <ul className="mt-3 font-mono text-sm">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={item} className="flex items-center py-1 text-foreground">
              <span className="text-muted-foreground">{last ? "└──" : "├──"}</span>
              <span className="ml-3">{item}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Expertise() {
  return (
    <section id="expertise" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading index="01" title="Expertise" subtitle="From requirements to release validation" />
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Tree title="business-analysis" items={businessAnalysis} />
          <Tree title="quality-assurance" items={quality} />
          <Tree title="technical-toolkit" items={technical} />
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          I work across the delivery lifecycle: clarifying business intent, turning it into structured
          requirements, validating implementation, documenting defects and decisions, and automating
          repeatable checks when automation improves feedback speed and consistency.
        </p>
      </div>
    </section>
  )
}
