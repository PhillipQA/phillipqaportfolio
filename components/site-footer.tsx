export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>Phillip Val Cabalo · QA Engineer and Business Analyst</p>
        <p>© {new Date().getFullYear()}</p>
      </div>
    </footer>
  )
}
