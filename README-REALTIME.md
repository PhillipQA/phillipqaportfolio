# Portfolio v0.4.1 — True real-time QA telemetry

This patch upgrades the Live QA Test Lab from GitHub polling to push-based live test events.

## Changed files
- components/test-lab.tsx
- integrations/playwright-runner/server.mjs
- integrations/playwright-runner/package.json

## What changes
- Playwright test events are pushed directly from GitHub Actions to the Render runner.
- The browser dashboard receives them over Server-Sent Events (SSE).
- Pass/fail/running counters, progress bar, latest tests, and CLI console update immediately.
- A 5-second polling fallback remains if SSE is interrupted.
- GitHub workflow status and the final HTML report still come from GitHub Actions.

## Required Render variable
Add:
TELEMETRY_TOKEN=<a long random value>

Use the exact same value for the GitHub repository secret:
PORTFOLIO_TELEMETRY_TOKEN
