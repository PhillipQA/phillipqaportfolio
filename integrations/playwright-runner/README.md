# Portfolio Playwright Runner

Small server-side bridge between the static GitHub Pages portfolio and GitHub Actions.

The browser never receives the GitHub token. The service exposes only three QA endpoints:

- `POST /api/qa/run` — triggers the predefined full Playwright suite.
- `GET /api/qa/latest` — returns the newest portfolio-triggered run.
- `GET /api/qa/status/:id` — returns live status for one run.

## Deploy on Render

1. Create a new **Web Service** from this repository.
2. Set **Root Directory** to `integrations/playwright-runner`.
3. Runtime: Node.
4. Build command: leave blank or use `npm install`.
5. Start command: `npm start`.
6. Add the environment variables from `.env.example`.
7. Set `GITHUB_TOKEN` to a fine-grained GitHub token restricted to `PhillipQA/playwright-automation-project` with **Actions: Read and write**.
8. Set `ALLOWED_ORIGINS` to the exact portfolio URL plus `http://localhost:3000` while developing.

Do **not** put the token in `NEXT_PUBLIC_*`, the portfolio source, or GitHub Pages JavaScript.

## Portfolio connection

After Render gives you a URL such as:

`https://phillip-qa-runner.onrender.com`

create this repository variable in the portfolio GitHub repository:

`NEXT_PUBLIC_QA_RUNNER_URL=https://phillip-qa-runner.onrender.com`

The included portfolio deployment workflow passes that value into `next build`.
