import http from "node:http"
import path from "node:path"
import AdmZip from "adm-zip"

const port = Number(process.env.PORT || 3000)
const demoEnabled = (process.env.DEMO_ENABLED || "true").toLowerCase() === "true"
const owner = process.env.GITHUB_OWNER || "PhillipQA"
const repo = process.env.GITHUB_REPO || "playwright-automation-project"
const workflow = process.env.GITHUB_WORKFLOW || "portfolio-demo.yml"
const ref = process.env.GITHUB_REF || "main"
const token = process.env.GITHUB_TOKEN || ""
const ipCooldownMs = Number(process.env.IP_COOLDOWN_MS || 120000)
const globalCooldownMs = Number(process.env.GLOBAL_COOLDOWN_MS || 30000)
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
)

let lastGlobalRunAt = 0
const lastRunByIp = new Map()
const liveCache = new Map()
const reportCache = new Map()
const artifactAvailabilityCache = new Map()

function json(res, status, body, origin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  }
  if (origin && isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin
    headers["Vary"] = "Origin"
  }
  res.writeHead(status, headers)
  res.end(JSON.stringify(body))
}

function isOriginAllowed(origin) {
  if (!origin) return true
  if (allowedOrigins.size === 0) return false
  return allowedOrigins.has(origin)
}

function requestIp(req) {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded) return forwarded.split(",")[0].trim()
  return req.socket.remoteAddress || "unknown"
}

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "phillip-portfolio-qa-runner",
  }
}

async function githubResponse(apiPath, options = {}) {
  if (!token) throw new Error("GITHUB_TOKEN is not configured.")
  return fetch(`https://api.github.com${apiPath}`, {
    redirect: "follow",
    ...options,
    headers: { ...githubHeaders(), ...(options.headers || {}) },
  })
}

async function parseGithubError(response) {
  const text = await response.text()
  if (!text) return `GitHub API returned ${response.status}`
  try {
    const data = JSON.parse(text)
    return data?.message || `GitHub API returned ${response.status}`
  } catch {
    return text.slice(0, 500)
  }
}

async function github(apiPath, options = {}) {
  const response = await githubResponse(apiPath, options)
  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }
  if (!response.ok) {
    const error = new Error(data?.message || `GitHub API returned ${response.status}`)
    error.status = response.status
    throw error
  }
  return data
}

async function githubText(apiPath) {
  const response = await githubResponse(apiPath)
  if (response.status === 404 || response.status === 409) return ""
  if (!response.ok) {
    const error = new Error(await parseGithubError(response))
    error.status = response.status
    throw error
  }
  return response.text()
}

async function githubBuffer(apiPath) {
  const response = await githubResponse(apiPath)
  if (!response.ok) {
    const error = new Error(await parseGithubError(response))
    error.status = response.status
    throw error
  }
  return Buffer.from(await response.arrayBuffer())
}

function normalizeRun(run) {
  if (!run) return null
  return {
    id: run.id,
    runNumber: run.run_number,
    status: run.status,
    conclusion: run.conclusion,
    htmlUrl: run.html_url,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    branch: run.head_branch || ref,
    commit: run.head_sha || "",
  }
}

function normalizeJob(job) {
  if (!job) return null
  return {
    id: job.id,
    name: job.name,
    status: job.status,
    conclusion: job.conclusion,
    startedAt: job.started_at,
    completedAt: job.completed_at,
    steps: Array.isArray(job.steps)
      ? job.steps.map((step) => ({
          name: step.name,
          number: step.number,
          status: step.status,
          conclusion: step.conclusion,
          startedAt: step.started_at,
          completedAt: step.completed_at,
        }))
      : [],
  }
}

async function latestRun() {
  const data = await github(
    `/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(workflow)}/runs?event=workflow_dispatch&per_page=1`,
  )
  return normalizeRun(data?.workflow_runs?.[0])
}

async function dispatchRun() {
  const startedAt = Date.now()
  const data = await github(
    `/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref, inputs: { source: "portfolio" } }),
    },
  )

  if (data?.workflow_run_id) {
    const run = await github(`/repos/${owner}/${repo}/actions/runs/${data.workflow_run_id}`)
    return normalizeRun(run)
  }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const run = await latestRun()
    if (run && new Date(run.createdAt).getTime() >= startedAt - 5000) return run
  }
  return null
}

function stripAnsi(value) {
  return value.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, "")
}

function portfolioEvents(logText) {
  if (!logText) return []
  const events = []
  for (const rawLine of logText.split(/\r?\n/)) {
    const line = stripAnsi(rawLine)
    const marker = "PORTFOLIO_EVENT "
    const markerIndex = line.indexOf(marker)
    if (markerIndex === -1) continue
    const payload = line.slice(markerIndex + marker.length).trim()
    try {
      const event = JSON.parse(payload)
      if (event && typeof event === "object" && event.type) events.push(event)
    } catch {
      // Ignore partial log lines while GitHub is still streaming output.
    }
  }
  return events
}

function fallbackConsoleLines(logText) {
  if (!logText) return []
  return stripAnsi(logText)
    .split(/\r?\n/)
    .map((line) => line.replace(/^\d{4}-\d{2}-\d{2}T[^ ]+Z\s?/, "").trim())
    .filter((line) =>
      /Running \d+ tests|\[\d+\/\d+\]|\d+ passed|\d+ failed|Error:|Process completed|npx playwright test/i.test(line),
    )
    .slice(-80)
}

function buildProgress(events, logText) {
  let total = 0
  let suiteStatus = ""
  let sequence = 0
  const tests = new Map()
  const consoleLines = []

  for (const event of events) {
    sequence += 1
    if (event.type === "suiteBegin") {
      total = Number(event.total) || total
      consoleLines.push(`$ npx playwright test`)
      if (total) consoleLines.push(`Running ${total} tests using GitHub Actions`)
      continue
    }

    if (event.type === "testBegin") {
      const previous = tests.get(event.id) || {}
      tests.set(event.id, {
        ...previous,
        id: event.id,
        title: event.title || previous.title || "Unnamed test",
        project: event.project || previous.project || "",
        file: event.file || previous.file || "",
        status: "running",
        retry: Number(event.retry) || 0,
        sequence,
      })
      const retryLabel = Number(event.retry) > 0 ? ` retry #${event.retry}` : ""
      consoleLines.push(`▶ [${event.project || "default"}] ${event.title || "Unnamed test"}${retryLabel}`)
      continue
    }

    if (event.type === "testEnd") {
      const previous = tests.get(event.id) || {}
      const status = event.status || "unknown"
      tests.set(event.id, {
        ...previous,
        id: event.id,
        title: event.title || previous.title || "Unnamed test",
        project: event.project || previous.project || "",
        file: event.file || previous.file || "",
        status,
        duration: Number(event.duration) || 0,
        retry: Number(event.retry) || 0,
        error: event.error || "",
        sequence,
      })
      const symbol = status === "passed" ? "✓" : status === "skipped" ? "○" : "✕"
      const duration = Number(event.duration) > 0 ? ` ${(Number(event.duration) / 1000).toFixed(1)}s` : ""
      consoleLines.push(`${symbol} ${status.toUpperCase()} [${event.project || "default"}] ${event.title || "Unnamed test"}${duration}`)
      if (event.error) consoleLines.push(`  ↳ ${String(event.error).replace(/\s+/g, " ").slice(0, 260)}`)
      continue
    }

    if (event.type === "suiteEnd") {
      suiteStatus = event.status || ""
      const duration = Number(event.duration) > 0 ? ` in ${(Number(event.duration) / 1000).toFixed(1)}s` : ""
      consoleLines.push(`— suite ${String(event.status || "completed").toUpperCase()}${duration}`)
    }
  }

  const testList = [...tests.values()].sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
  const passed = testList.filter((test) => test.status === "passed").length
  const failed = testList.filter((test) => ["failed", "timedOut", "interrupted"].includes(test.status)).length
  const skipped = testList.filter((test) => test.status === "skipped").length
  const running = testList.filter((test) => test.status === "running").length
  const completed = passed + failed + skipped

  if (consoleLines.length === 0) consoleLines.push(...fallbackConsoleLines(logText))

  return {
    total: total || testList.length,
    completed,
    passed,
    failed,
    skipped,
    running,
    suiteStatus,
    tests: testList.slice(-60),
    consoleLines: consoleLines.slice(-100),
  }
}

async function getRunJobs(runId) {
  const data = await github(`/repos/${owner}/${repo}/actions/runs/${runId}/jobs?per_page=100`)
  return Array.isArray(data?.jobs) ? data.jobs : []
}

async function artifactInfo(runId, maxAgeMs = 15000) {
  const cached = artifactAvailabilityCache.get(runId)
  if (cached && Date.now() - cached.at < maxAgeMs) return cached.artifact
  const data = await github(`/repos/${owner}/${repo}/actions/runs/${runId}/artifacts?per_page=100`)
  const artifact = Array.isArray(data?.artifacts)
    ? data.artifacts.find((item) => !item.expired && String(item.name || "").startsWith("playwright-report")) || null
    : null
  artifactAvailabilityCache.set(runId, { at: Date.now(), artifact })
  return artifact
}

async function liveSnapshot(runId) {
  const cached = liveCache.get(runId)
  if (cached && Date.now() - cached.at < 2500) return cached.data

  const [rawRun, jobs] = await Promise.all([
    github(`/repos/${owner}/${repo}/actions/runs/${runId}`),
    getRunJobs(runId),
  ])
  const run = normalizeRun(rawRun)
  const rawJob = jobs.find((job) => job.name === "Full Playwright suite") || jobs[0] || null
  const job = normalizeJob(rawJob)
  let logText = ""
  if (rawJob?.id) {
    try {
      logText = await githubText(`/repos/${owner}/${repo}/actions/jobs/${rawJob.id}/logs`)
    } catch (error) {
      console.warn("Unable to read live job log:", error instanceof Error ? error.message : error)
    }
  }

  const events = portfolioEvents(logText)
  const progress = buildProgress(events, logText)
  let reportAvailable = false
  if (run?.status === "completed") {
    try {
      reportAvailable = Boolean(await artifactInfo(runId))
    } catch (error) {
      console.warn("Unable to check report artifact:", error instanceof Error ? error.message : error)
    }
  }

  const data = { run, job, progress, reportAvailable }
  liveCache.set(runId, { at: Date.now(), data })
  return data
}

function contentType(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".zip": "application/zip",
    ".txt": "text/plain; charset=utf-8",
    ".webm": "video/webm",
  }
  return types[ext] || "application/octet-stream"
}

async function reportFiles(runId) {
  const cached = reportCache.get(runId)
  if (cached && Date.now() - cached.at < 15 * 60 * 1000) return cached.files

  const artifact = await artifactInfo(runId, 0)
  if (!artifact) {
    const error = new Error("Playwright HTML report is not available for this run yet.")
    error.status = 404
    throw error
  }

  const archive = await githubBuffer(`/repos/${owner}/${repo}/actions/artifacts/${artifact.id}/zip`)
  const zip = new AdmZip(archive)
  const files = new Map()
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue
    let name = entry.entryName.replace(/\\/g, "/").replace(/^\/+/, "")
    if (name.startsWith("playwright-report/")) name = name.slice("playwright-report/".length)
    if (!name || name.includes("../")) continue
    files.set(name, entry.getData())
  }
  reportCache.set(runId, { at: Date.now(), files })
  if (reportCache.size > 4) {
    const oldest = [...reportCache.entries()].sort((a, b) => a[1].at - b[1].at)[0]
    if (oldest) reportCache.delete(oldest[0])
  }
  return files
}

async function serveReport(res, runId, filePath, origin) {
  const files = await reportFiles(runId)
  const normalized = decodeURIComponent(filePath || "index.html").replace(/^\/+/, "") || "index.html"
  if (normalized.includes("..")) return json(res, 400, { ok: false, error: "Invalid report path." }, origin)
  const body = files.get(normalized)
  if (!body) return json(res, 404, { ok: false, error: "Report file not found." }, origin)

  const headers = {
    "Content-Type": contentType(normalized),
    "Cache-Control": "public, max-age=300",
    "X-Content-Type-Options": "nosniff",
  }
  const frameAncestors = ["'self'", ...allowedOrigins]
  if (normalized.endsWith(".html")) headers["Content-Security-Policy"] = `frame-ancestors ${frameAncestors.join(" ")}`
  if (origin && isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin
    headers["Vary"] = "Origin"
  }
  res.writeHead(200, headers)
  res.end(body)
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = ""
    req.on("data", (chunk) => {
      raw += chunk
      if (raw.length > 16_384) {
        reject(new Error("Request body too large."))
        req.destroy()
      }
    })
    req.on("end", () => {
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error("Invalid JSON body."))
      }
    })
    req.on("error", reject)
  })
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || ""
  if (origin && !isOriginAllowed(origin)) {
    return json(res, 403, { ok: false, error: "Origin is not allowed." })
  }

  if (req.method === "OPTIONS") {
    const headers = {
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    }
    if (origin && isOriginAllowed(origin)) {
      headers["Access-Control-Allow-Origin"] = origin
      headers["Vary"] = "Origin"
    }
    res.writeHead(204, headers)
    return res.end()
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`)

  try {
    if (req.method === "GET" && url.pathname === "/health") {
      return json(res, 200, { ok: true, demoEnabled, repo: `${owner}/${repo}`, workflow }, origin)
    }

    if (req.method === "GET" && url.pathname === "/api/qa/latest") {
      return json(res, 200, { ok: true, run: await latestRun() }, origin)
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/qa/live/")) {
      const id = url.pathname.split("/").pop()
      if (!/^\d+$/.test(id || "")) return json(res, 400, { ok: false, error: "Invalid run id." }, origin)
      return json(res, 200, { ok: true, ...(await liveSnapshot(id)) }, origin)
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/qa/status/")) {
      const id = url.pathname.split("/").pop()
      if (!/^\d+$/.test(id || "")) return json(res, 400, { ok: false, error: "Invalid run id." }, origin)
      const run = await github(`/repos/${owner}/${repo}/actions/runs/${id}`)
      return json(res, 200, { ok: true, run: normalizeRun(run) }, origin)
    }

    const reportMatch = url.pathname.match(/^\/api\/qa\/report\/(\d+)(?:\/(.*))?$/)
    if (req.method === "GET" && reportMatch) {
      return serveReport(res, reportMatch[1], reportMatch[2] || "index.html", origin)
    }

    if (req.method === "POST" && url.pathname === "/api/qa/run") {
      if (!demoEnabled) return json(res, 503, { ok: false, error: "The public demo is temporarily disabled." }, origin)

      const body = await readJson(req)
      if (body?.suite && body.suite !== "full") {
        return json(res, 400, { ok: false, error: "Only the predefined full suite can be triggered." }, origin)
      }

      const ip = requestIp(req)
      const now = Date.now()
      const ipLast = lastRunByIp.get(ip) || 0
      const ipRemaining = ipCooldownMs - (now - ipLast)
      const globalRemaining = globalCooldownMs - (now - lastGlobalRunAt)
      const remaining = Math.max(ipRemaining, globalRemaining)

      if (remaining > 0) {
        return json(
          res,
          429,
          {
            ok: false,
            error: "A demo run was triggered recently.",
            retryAfterSeconds: Math.ceil(remaining / 1000),
          },
          origin,
        )
      }

      lastRunByIp.set(ip, now)
      lastGlobalRunAt = now

      try {
        const run = await dispatchRun()
        if (!run) {
          return json(
            res,
            202,
            { ok: true, message: "Workflow accepted. The run will appear in the dashboard shortly." },
            origin,
          )
        }
        return json(res, 200, { ok: true, run }, origin)
      } catch (error) {
        lastRunByIp.delete(ip)
        lastGlobalRunAt = 0
        throw error
      }
    }

    return json(res, 404, { ok: false, error: "Not found." }, origin)
  } catch (error) {
    console.error(error)
    const status = Number(error?.status) || 500
    return json(
      res,
      status >= 400 && status < 600 ? status : 500,
      { ok: false, error: error instanceof Error ? error.message : "Unexpected server error." },
      origin,
    )
  }
})

server.listen(port, () => {
  console.log(`QA runner listening on port ${port}`)
})
