import { SectionHeading } from "@/components/section-heading"

const qa = [
  "Manual Testing",
  "Functional Testing",
  "Regression Testing",
  "API Testing",
  "Database Testing",
  "Test Automation",
]

const automation = ["Playwright", "Cypress", "Selenium"]

function Tree({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="font-mono text-sm text-primary">{title}/</p>
      <ul className="mt-3 font-mono text-sm">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={item} className="flex items-center py-1 text-foreground">
              <span className="text-muted-foreground">{last ? "└──" : "├──"}</span>
              <span className="ml-3">{item}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Expertise() {
  return (
    <section id="expertise" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading index="01" title="Expertise" subtitle="What I bring to a quality team" />
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Tree title="qa-expertise" items={qa} />
          <Tree title="automation" items={automation} />
        </div>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Comfortable across the full quality lifecycle — from writing test plans and exploratory
          manual testing to building maintainable automation frameworks and validating data at the
          database layer.
        </p>
      </div>
    </section>
  )
}
