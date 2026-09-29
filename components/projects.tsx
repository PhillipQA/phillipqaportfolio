import { SectionHeading } from "@/components/section-heading"
import {
  ArrowUpRight,
  Bot,
  Code2,
  FileCheck2,
  FileText,
  LockKeyhole,
  Workflow,
} from "lucide-react"

type Link = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

type Project = {
  id: string
  title: string
  stack: string
  description: string
  highlights: string[]
  badge?: string
  links: Link[]
}

const projects: Project[] = [
  {
    id: "01",
    title: "BA Client Ops Tracker",
    stack: "BA · QA · TypeScript · Supabase",
    badge: "Flagship · Private build",
    description:
      "A multi-module operations platform designed around day-to-day Business Analyst and QA work: clients, projects, tasks, requirements, communications, document workflows, traceability, and reporting.",
    highlights: [
      "Client / project / task and subtask operations with role-based access",
      "Requirements Traceability Matrix linked to delivery activities",
      "Document workflows for BRD, FSD, DRF, sign-off, and DocHub handoff",
      "Per-user Gmail / Discord communication workflows and integrations",
    ],
    links: [{ label: "Private case study", href: "#artifacts", icon: LockKeyhole }],
  },
  {
    id: "02",
    title: "Playwright Automation Framework",
    stack: "Playwright · TypeScript · API",
    badge: "Public repository",
    description:
      "A maintainable test automation project covering authentication, negative scenarios, product flows, cart and checkout journeys, reusable fixtures, data-driven testing, and API validation.",
    highlights: [
      "Page Object Model and reusable custom fixtures",
      "Data-driven positive and negative test scenarios",
      "UI coverage for login, sorting, cart, and checkout flows",
      "API checks alongside browser-based end-to-end testing",
    ],
    links: [
      {
        label: "View repository",
        href: "https://github.com/PhillipQA/playwright-automation-project",
        icon: Code2,
      },
      {
        label: "Run live tests",
        href: "#test-lab",
        icon: Workflow,
      },
    ],
  },
  {
    id: "03",
    title: "AI Document & Requirements Automation",
    stack: "BRD · FSD · OCR · AI Mapping",
    badge: "Case study",
    description:
      "A document workflow focused on turning uploaded business documents and supporting evidence into structured, reviewable requirements while preserving user control over scope and output.",
    highlights: [
      "Parse-first workflow for documents and supporting images",
      "BRD-to-FSD mapping with presets and scope controls",
      "OCR-assisted DRF field extraction and template population",
      "Reset, validation, auditability, and error-handling requirements",
    ],
    links: [{ label: "See related artifacts", href: "#artifacts", icon: Bot }],
  },
  {
    id: "04",
    title: "QA Engineering Case Study",
    stack: "Test Plans · Cases · Bugs · UAT",
    badge: "Working artifacts",
    description:
      "A practical QA delivery set showing how requirements are translated into test coverage, reproducible defect reports, regression checks, and release / UAT validation.",
    highlights: [
      "Risk-based test planning and scenario coverage",
      "Reproducible bug reports with expected vs. actual behavior",
      "Regression and re-test workflows across releases",
      "API and SQL validation used where business flows depend on backend data",
    ],
    links: [
      {
        label: "View test plan",
        href: "https://docs.google.com/document/d/1_tVQjg26c509b6NH6hE0ahBZ5vsuWy88G1JdqDpmmsY/edit?usp=drive_link",
        icon: FileText,
      },
      {
        label: "View test cases",
        href: "https://docs.google.com/spreadsheets/d/1hd9PTq0pAyuasOcS5uQaAEqLuxphuavxmOanE3mfxbU/edit?usp=drive_link",
        icon: FileCheck2,
      },
    ],
  },
]

function isExternal(href: string) {
  return href.startsWith("http://") || href.startsWith("https://")
}

export function Projects() {
  return (
    <section id="projects" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          index="02"
          title="Featured Projects"
          subtitle="Selected BA, QA, automation, and workflow design work"
        />
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {projects.map((p) => (
            <article
              key={p.id}
              className="group flex flex-col rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-sm text-primary">{p.id}</span>
                {p.badge ? (
                  <span className="rounded-md border border-primary/20 bg-primary/5 px-2 py-1 font-mono text-[11px] text-primary">
                    {p.badge}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{p.title}</h3>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{p.stack}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.description}</p>

              <ul className="mt-4 flex-1 space-y-2 border-t border-border pt-4">
                {p.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                    <Workflow className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                {p.links.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target={isExternal(l.href) ? "_blank" : undefined}
                    rel={isExternal(l.href) ? "noopener noreferrer" : undefined}
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
