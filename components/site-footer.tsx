export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row sm:px-6">
        <p className="font-mono text-sm text-muted-foreground">
          <span className="text-primary">$</span> echo &quot;built with precision&quot;
        </p>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Phillip Val Cabalo
        </p>
      </div>
    </footer>
  )
}
