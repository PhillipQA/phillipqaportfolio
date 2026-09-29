# Phillip Val Cabalo — BA + QA Portfolio

Personal portfolio highlighting my progression from QA testing and automation into Business Analysis, requirements design, delivery coordination, and AI-assisted workflow automation.

## Focus Areas

- Business analysis and requirements gathering
- BRD / FSD documentation and acceptance criteria
- Requirements traceability and UAT support
- Manual, exploratory, functional, and regression testing
- Playwright + TypeScript test automation
- API testing and SQL / data validation
- AI-assisted document and requirements workflows
- Product workflow and integration design

## Featured Case Studies

### BA Client Ops Tracker
A private multi-module operations platform designed around Business Analyst and QA workflows, including clients, projects, tasks, RTM, communication integrations, document creation, sign-off flows, and reporting.

### Playwright Automation Framework
Public Playwright + TypeScript automation project with Page Objects, reusable fixtures, data-driven testing, UI journeys, and API validation.

Repository: https://github.com/PhillipQA/playwright-automation-project

### AI Document & Requirements Automation
A case study covering document parsing, BRD-to-FSD mapping, OCR-assisted DRF extraction, scope controls, supporting files, reset workflows, validation, and traceability.

### QA Engineering Case Study
Test planning, test cases, reproducible defect reporting, regression, UAT support, API validation, and SQL-backed verification.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Lucide icons
- GitHub Pages static export

## Development

```bash
pnpm install
pnpm dev
```

## Production Build

```bash
pnpm build
```

The project exports a static site to `out/` and includes a GitHub Actions workflow for GitHub Pages deployment.

## Links

- GitHub: https://github.com/PhillipQA
- LinkedIn: https://www.linkedin.com/in/pcabalo/

## Live QA Test Lab (v0.3.0)

The portfolio includes a **Live QA Test Lab** that can trigger the public Playwright repository through GitHub Actions and display queued/running/completed status.

Because this portfolio is exported as a static GitHub Pages site, GitHub credentials must **not** be stored in the browser. The integration is split into three pieces:

1. `components/test-lab.tsx` — public dashboard in the portfolio.
2. `integrations/playwright-runner/` — small Node service intended for Render; stores the GitHub token server-side, applies cooldowns, triggers the workflow, and returns status.
3. `integrations/playwright-workflow/portfolio-demo.yml` — copy this into the Playwright repository as `.github/workflows/portfolio-demo.yml`.

### Setup

1. Copy `integrations/playwright-workflow/portfolio-demo.yml` into the Playwright repo at `.github/workflows/portfolio-demo.yml` and push it to `main`.
2. Deploy `integrations/playwright-runner` as a Render Web Service.
3. Create a fine-grained GitHub token restricted to the Playwright repo with **Actions: Read and write** and save it only as the Render `GITHUB_TOKEN` environment variable.
4. Set `ALLOWED_ORIGINS` on Render to the exact portfolio URL (plus localhost for development).
5. In the portfolio GitHub repository, create an Actions repository variable named `NEXT_PUBLIC_QA_RUNNER_URL` containing the Render service URL.
6. Re-run or push the portfolio deployment. The static build will embed the runner URL and activate the **Run Playwright tests** button.

The first version intentionally exposes only one predefined full-suite command. It does not accept arbitrary shell commands or arbitrary test paths from visitors.
