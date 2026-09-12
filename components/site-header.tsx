import { TerminalSquare } from "lucide-react"

const nav = [
  { label: "expertise", href: "#expertise" },
  { label: "projects", href: "#projects" },
  { label: "artifacts", href: "#artifacts" },
  { label: "experience", href: "#experience" },
  { label: "contact", href: "#contact" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#top" className="flex items-center gap-2 font-mono text-sm font-medium">
          <TerminalSquare className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="text-foreground">pvc</span>
          <span className="text-primary">@</span>
          <span className="text-muted-foreground">qa</span>
        </a>
        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-mono text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <span className="text-primary/60">./</span>
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href="#contact"
          className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          get in touch
        </a>
      </div>
    </header>
  )
}
