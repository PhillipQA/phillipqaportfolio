import { SectionHeading } from "@/components/section-heading"
import { Code2, FileText, ListChecks, ArrowUpRight } from "lucide-react"

type Link = { label: string; href: string; icon: React.ComponentType<{ className?: string }> }

type Project = {
  id: string
  title: string
  stack: string
  description: string
  links: Link[]
}

const projects: Project[] = [
  {
    id: "01",
    title: "E-Commerce Test Automation",
    stack: "Playwright + TypeScript",
    description:
      "End-to-end suite covering cart, checkout, and payment flows with parallel execution and CI reporting.",
    links: [
      { label: "View Repository", href: "#", icon: Code2 },
      { label: "View Test Report", href: "#", icon: FileText },
    ],
  },
  {
    id: "02",
    title: "API Testing Framework",
    stack: "Playwright / Postman",
    description:
      "Contract and integration tests for REST endpoints with schema validation, auth flows, and data-driven cases.",
    links: [{ label: "View Repository", href: "#", icon: Code2 }],
  },
  {
    id: "03",
    title: "Database Validation",
    stack: "PostgreSQL + SQL",
    description:
      "SQL-based data integrity checks verifying transformations, referential integrity, and reconciliation.",
    links: [{ label: "View Test Cases", href: "#", icon: ListChecks }],
  },
  {
    id: "04",
    title: "End-to-End Testing",
    stack: "Playwright",
    description:
      "Cross-browser regression coverage for critical user journeys with visual and accessibility assertions.",
    links: [{ label: "View Repository", href: "#", icon: Code2 }],
  },
]

export function Projects() {
  return (
    <section id="projects" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading index="02" title="Featured Projects" subtitle="Selected QA and automation work" />
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {projects.map((p) => (
            <article
              key={p.id}
              className="group flex flex-col rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-sm text-primary">{p.id}</span>
                <span className="rounded-md border border-border px-2 py-1 font-mono text-xs text-muted-foreground">
                  {p.stack}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                {p.links.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    className="inline-flex items-center gap-1.5 font-mono text-sm text-foreground transition-colors hover:text-primary"
                  >
                    <l.icon className="h-4 w-4" />
                    {l.label}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
