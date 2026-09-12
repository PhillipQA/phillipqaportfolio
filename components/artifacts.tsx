import { SectionHeading } from "@/components/section-heading"
import { FileText, FileCheck2, Bug, Network, BarChart3, Target } from "lucide-react"

const artifacts = [
  { label: "Test Plans", icon: FileText },
  { label: "Test Cases", icon: FileCheck2 },
  { label: "Bug Reports", icon: Bug },
  { label: "API Collections", icon: Network },
  { label: "Automation Reports", icon: BarChart3 },
  { label: "Test Strategies", icon: Target },
]

export function Artifacts() {
  return (
    <section id="artifacts" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading index="03" title="Testing Artifacts" subtitle="Deliverables I produce and maintain" />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {artifacts.map((a) => (
            <div
              key={a.label}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/50"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-accent/15 text-accent">
                <a.icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-foreground">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
