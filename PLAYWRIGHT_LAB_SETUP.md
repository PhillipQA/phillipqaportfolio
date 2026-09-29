# Live QA Test Lab — Setup

This feature connects the static portfolio to `PhillipQA/playwright-automation-project` without exposing GitHub credentials in the browser.

## 1. Patch the Playwright repository

Copy:

`integrations/playwright-workflow/portfolio-demo.yml`

to this location in the Playwright repository:

`.github/workflows/portfolio-demo.yml`

Commit and push it to the repository's default `main` branch. GitHub requires a `workflow_dispatch` workflow to exist on the default branch before it can be triggered manually/API-side.

## 2. Create a fine-grained GitHub token

Create a fine-grained token scoped only to:

`PhillipQA/playwright-automation-project`

Repository permission required:

- Actions: Read and write

Keep this token private. Do not add it to the portfolio repository and never use a `NEXT_PUBLIC_` variable for it.

## 3. Deploy the secure runner on Render

Create a Render Web Service from the portfolio repository.

- Root Directory: `integrations/playwright-runner`
- Runtime: Node
- Start Command: `npm start`

Environment variables:

```text
DEMO_ENABLED=true
GITHUB_TOKEN=<your fine-grained token>
GITHUB_OWNER=PhillipQA
GITHUB_REPO=playwright-automation-project
GITHUB_WORKFLOW=portfolio-demo.yml
GITHUB_REF=main
ALLOWED_ORIGINS=<your exact portfolio URL>,http://localhost:3000
IP_COOLDOWN_MS=120000
GLOBAL_COOLDOWN_MS=30000
```

Render supplies `PORT` automatically.

Check the service after deployment:

`https://YOUR-RUNNER.onrender.com/health`

It should return JSON with `ok: true`.

## 4. Connect the portfolio build

In the portfolio repository:

**Settings → Secrets and variables → Actions → Variables → New repository variable**

Name:

`NEXT_PUBLIC_QA_RUNNER_URL`

Value:

`https://YOUR-RUNNER.onrender.com`

This URL is intentionally public; it contains no secret. The actual GitHub token stays on Render.

Push to `main` or manually rerun the portfolio deployment workflow. The GitHub Pages build will embed the runner URL and activate the Test Lab controls.

## 5. Test the flow

Open the portfolio and go to **Live QA Test Lab**.

1. Click **Run Playwright tests**.
2. The dashboard should move from Ready → Queued/Running.
3. It polls every five seconds while the test runs.
4. When completed, it shows Passed or the GitHub conclusion.
5. Click **Open run** to inspect logs and the Playwright HTML report artifact in GitHub Actions.

## Why there is a runner

The portfolio uses `output: 'export'` and is hosted on GitHub Pages. It has no private server runtime. Calling the GitHub workflow API directly from the browser would expose the GitHub token to every visitor, so the Render bridge is required for a public Run button.
