import { CheckCircle2 } from "lucide-react"

const coverage = [
  "Login and authentication",
  "Negative and edge-case scenarios",
  "Sorting, cart, and checkout journeys",
  "API responses and payloads",
  "SQL data integrity",
  "Regression across releases",
]

export function Hero() {
  return (
    <section id="top" className="border-b border-border">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div>
          <p className="text-sm font-medium text-accent">Phillip Val Cabalo · QA Engineer</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            I find the defects before your users do, and automate the checks that keep them from coming back.
          </h1>
          <p className="mt-5 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Five-plus years testing web applications: Playwright and TypeScript automation, API testing, SQL data
            validation, and regression cycles. Everything on this page is real work you can open, read, or run.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#test-lab" className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              Run the live test suite
            </a>
            <a href="#artifacts" className="rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary/50">
              Read test plans and bug reports
            </a>
          </div>
          <p className="mt-6 max-w-xl border-l-2 border-accent pl-4 text-sm leading-relaxed text-muted-foreground">
            I&apos;m also a Business Analyst (promoted from QA in 2025). I write the acceptance criteria I test against,
            so my test cases start from what the requirement actually meant.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">What my automation covers</h2>
          <p className="mt-1 text-sm text-muted-foreground">From the public Playwright + TypeScript project</p>
          <ul className="mt-4 space-y-2.5">
            {coverage.map((c) => (
              <li key={c} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-accent" aria-hidden="true" />
                {c}
              </li>
            ))}
          </ul>
          <a
            href="https://github.com/PhillipQA/playwright-automation-project"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block text-sm font-medium underline underline-offset-4 hover:text-accent"
          >
            Browse the repository
          </a>
        </div>
      </div>
    </section>
  )
}
