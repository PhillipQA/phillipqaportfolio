import { SectionHeading } from "@/components/section-heading"
import { Code2, Briefcase, Mail, ArrowUpRight } from "lucide-react"

const links = [
  { label: "GitHub", value: "github.com/pvcabalo", href: "https://github.com/PhillipQA/playwright-automation-project", icon: Code2 },
  { label: "LinkedIn", value: "linkedin.com/in/pvcabalo", href: "https://www.linkedin.com/in/pcabalo/", icon: Briefcase },
  { label: "Email", value: "phillip.cabalo@email.com", href: "mailto:phillip.cabalo@email.com", icon: Mail },
]

export function Contact() {
  return (
    <section id="contact">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading index="05" title="Contact" subtitle="Let's talk about shipping better software" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="group flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <l.icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <span className="mt-4 text-sm font-medium text-foreground">{l.label}</span>
              <span className="font-mono text-xs text-muted-foreground">{l.value}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
