# Portfolio v0.4.0 — Live QA Console patch

Apply this ZIP to the root of `phillipqaportfolio`.

Changed files:
- `components/test-lab.tsx`
- `integrations/playwright-runner/server.mjs`
- `integrations/playwright-runner/package.json`

What changes:
- Live CLI-style Playwright execution console
- Individual test pass/fail/running state
- Progress counts and progress bar
- GitHub Actions step status
- Embedded Playwright HTML report after a run completes
- Secure report serving through the existing Render runner
- The existing run/status endpoints remain backward compatible

Important:
- The Render runner now uses the `adm-zip` dependency. Your existing Render Build Command of `npm install` will install it automatically.
- Keep `GITHUB_TOKEN` scoped to `playwright-automation-project` with Actions Read and write.
- No new Render environment variable is required.
