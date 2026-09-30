import { SectionHeading } from "@/components/section-heading"

const roles = [
  {
    company: "iRipple",
    title: "Business Analyst (Promoted from Software QA Specialist)",
    period: "2025 – Present",
    points: [
      "Gather and analyze business requirements, workflows, constraints, and stakeholder needs.",
      "Translate requirements into process flows, functional documentation, acceptance criteria, and implementation-ready details.",
      "Coordinate with developers and QA throughout delivery to clarify scope, validate behavior, and reduce requirement gaps during UAT.",
    ],
  },
  {
    company: "iRipple",
    title: "Software QA Specialist",
    period: "2023 – 2025",
    points: [
      "Led test planning and execution for product enhancements, fixes, and regression cycles.",
      "Created and maintained functional, regression, API, and data-validation test coverage.",
      "Worked closely with developers and stakeholders to reproduce issues, verify fixes, and improve release quality.",
    ],
  },
  {
    company: "iRipple",
    title: "QA Tester",
    period: "2021 – 2023",
    points: [
      "Executed manual functional, exploratory, and regression testing across web applications.",
      "Authored detailed test cases and reproducible bug reports with clear expected and actual results.",
      "Performed SQL-based data validation to verify application behavior and data integrity.",
    ],
  },
  {
    company: "ComServices",
    title: "QA Tester — Freelance",
    period: "2020 – 2021",
    points: [
      "Performed functional, regression, and exploratory testing for web workflows.",
      "Created test cases, documented defects, and verified fixes across iterative releases.",
      "Validated user journeys, edge cases, and expected behavior before delivery.",
    ],
  },
]

export function Experience() {
  return (
    <section id="experience" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading index="05" title="Experience" subtitle="Five years in QA, now extending into business analysis" />
        <ol className="mt-8 space-y-6 border-l border-border pl-6">
          {roles.map((role, i) => (
            <li key={`${role.company}-${role.title}-${i}`} className="relative">
              <span className="absolute -left-[1.6875rem] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {role.title}
                  <span className="text-muted-foreground"> · {role.company}</span>
                </h3>
                <span className="text-sm text-primary">{role.period}</span>
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
