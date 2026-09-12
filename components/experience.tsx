import { SectionHeading } from "@/components/section-heading"

const roles = [
  {
    company: "iRipple",
    title: "Software QA Specialist",
    period: "2023 – 2025",
    points: [
      "Led test strategy and automation for core product releases.",
      "Built and maintained Playwright end-to-end and API test suites.",
      "Partnered with developers to shift quality left and reduce escaped defects.",
    ],
  },
  {
    company: "iRipple",
    title: "QA Tester",
    period: "2021 – 2023",
    points: [
      "Executed manual functional and regression testing across web applications.",
      "Authored detailed test cases and reproducible bug reports.",
      "Performed database validation with SQL to verify data integrity.",
    ],
  },
  {
    company: "ComServices",
    title: "QA Tester",
    period: "2020 – 2021",
    points: [
      "Executed manual functional and regression testing across web applications.",
      "Authored detailed test cases and reproducible bug reports.",
      "Performed database validation with SQL to verify data integrity.",
    ],
  },
]

export function Experience() {
  return (
    <section id="experience" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading index="04" title="Experience" subtitle="Where I've shipped quality" />
        <ol className="mt-8 space-y-6 border-l border-border pl-6">
          {roles.map((role, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[1.6875rem] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {role.title}
                  <span className="text-muted-foreground"> · {role.company}</span>
                </h3>
                <span className="font-mono text-sm text-primary">{role.period}</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {role.points.map((p, j) => (
                  <li key={j} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-1 text-primary">▸</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
