import { SectionHeading } from "@/components/section-heading"
import {
  FileText,
  FileCheck2,
  Bug,
  Network,
  BarChart3,
  GitBranch,
} from "lucide-react"

type Artifact = {
  label: string
  detail: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
}

const artifacts: Artifact[] = [
  {
    label: "Test Plans",
    detail: "Planning, scope, risks, coverage, and execution approach",
    icon: FileText,
    href: "https://docs.google.com/document/d/1_tVQjg26c509b6NH6hE0ahBZ5vsuWy88G1JdqDpmmsY/edit?usp=drive_link",
  },
  {
    label: "Test Cases",
    detail: "Structured scenarios, expected results, and regression coverage",
    icon: FileCheck2,
    href: "https://docs.google.com/spreadsheets/d/1hd9PTq0pAyuasOcS5uQaAEqLuxphuavxmOanE3mfxbU/edit?usp=drive_link",
  },
  {
    label: "Bug Reports",
    detail: "Reproduction steps, evidence, severity, and verification notes",
    icon: Bug,
    href: "https://docs.google.com/document/d/1nLQJmRZeVgZgYcwn2gei0ukE-sV2aNKj26LYC--vgu8/edit?usp=drive_link",
  },
  {
    label: "API Validation",
    detail: "REST checks, auth flows, payload validation, and negative cases",
    icon: Network,
  },
  {
    label: "Automation Results",
    detail: "Playwright runs, regression evidence, and failure investigation",
    icon: BarChart3,
  },
  {
    label: "Requirements & Traceability",
    detail: "BRD/FSD mapping, acceptance criteria, RTM, and delivery traceability",
    icon: GitBranch,
  },
]

export function Artifacts() {
  return (
    <section id="artifacts" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          index="03"
          title="Artifacts & Deliverables"
          subtitle="Examples of the documentation and evidence I create across BA and QA work"
        />

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artifacts.map((a) => {
            const content = (
              <>
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-accent/15 text-accent">
                  <a.icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{a.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{a.detail}</span>
                  {!a.href ? (
                    <span className="mt-2 block font-mono text-[11px] text-primary">sample available on request</span>
                  ) : null}
                </span>
              </>
            )

            if (a.href) {
              return (
                <a
                  key={a.label}
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/50"
                >
                  {content}
                </a>
              )
            }

            return (
              <div key={a.label} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                {content}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
