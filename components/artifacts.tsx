import { SectionHeading } from "@/components/section-heading"
import {
  FileText,
  FileCheck2,
  Bug,
  Network,
  BarChart3,
  Target,
} from "lucide-react"

const artifacts = [
  {
    label: "Test Plans",
    icon: FileText,
    href: "https://docs.google.com/document/d/1_tVQjg26c509b6NH6hE0ahBZ5vsuWy88G1JdqDpmmsY/edit?usp=drive_link",
  },
  {
    label: "Test Cases",
    icon: FileCheck2,
    href: "https://docs.google.com/spreadsheets/d/11fp6ExztSBAeXmGcuvsLSa1rbYYZ-j5iUE3TjDqIzOk/edit?usp=drive_link",
  },
  {
    label: "Bug Reports",
    icon: Bug,
    href: "https://docs.google.com/document/d/1nLQJmRZeVgZgYcwn2gei0ukE-sV2aNKj26LYC--vgu8/edit?usp=drive_link",
  },
  {
    label: "API Collections",
    icon: Network,
    href: "https://your-link-here.com/api-collections",
  },
  {
    label: "Automation Reports",
    icon: BarChart3,
    href: "https://your-link-here.com/automation-reports",
  },
  {
    label: "Test Strategies",
    icon: Target,
    href: "https://your-link-here.com/test-strategies",
  },
]

export function Artifacts() {
  return (
    <section id="artifacts" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          index="03"
          title="Testing Artifacts"
          subtitle="Deliverables I produce and maintain"
        />

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {artifacts.map((a) => (
            <a
              key={a.label}
              href={a.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/50"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-accent/15 text-accent">
                <a.icon
                  className="h-4.5 w-4.5"
                  aria-hidden="true"
                />
              </span>

              <span className="text-sm font-medium text-foreground">
                {a.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}