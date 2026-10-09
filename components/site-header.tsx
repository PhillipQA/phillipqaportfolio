const basePath = process.env.NEXT_PUBLIC_BASE_PATH || (process.env.GITHUB_ACTIONS === "true" ? "/phillipqaportfolio" : "")

const nav = [
  { label: "Test lab", href: "#test-lab" },
  { label: "Projects", href: "#projects" },
  { label: "QA Services", href: `${basePath}/services/` },
  { label: "Skills", href: "#expertise" },
  { label: "Artifacts", href: "#artifacts" },
  { label: "Experience", href: "#experience" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#top" className="font-semibold tracking-tight">
          Phillip Val Cabalo
          <span className="ml-2 hidden font-normal text-muted-foreground sm:inline">QA Engineer</span>
        </a>
        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {item.label}
            </a>
          ))}
        </nav>
        <a href="#contact" className="rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
          Contact
        </a>
      </div>
    </header>
  )
}
