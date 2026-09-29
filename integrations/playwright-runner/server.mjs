import http from "node:http"

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
    "X-GitHub-Api-Version": "2026-03-10",
    "User-Agent": "phillip-portfolio-qa-runner",
  }
}

async function github(path, options = {}) {
  if (!token) throw new Error("GITHUB_TOKEN is not configured.")
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: { ...githubHeaders(), ...(options.headers || {}) },
  })
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
    const message = data?.message || `GitHub API returned ${response.status}`
    const error = new Error(message)
    error.status = response.status
    throw error
  }
  return data
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

  // Compatibility fallback for GitHub API responses that acknowledge dispatch
  // before returning a run id. Find the fresh workflow_dispatch run.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const run = await latestRun()
    if (run && new Date(run.createdAt).getTime() >= startedAt - 5000) return run
  }
  return null
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

    if (req.method === "GET" && url.pathname.startsWith("/api/qa/status/")) {
      const id = url.pathname.split("/").pop()
      if (!/^\d+$/.test(id || "")) return json(res, 400, { ok: false, error: "Invalid run id." }, origin)
      const run = await github(`/repos/${owner}/${repo}/actions/runs/${id}`)
      return json(res, 200, { ok: true, run: normalizeRun(run) }, origin)
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

      // Reserve cooldown before the network call so simultaneous requests cannot fan out.
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
        // Release the cooldown on a failed dispatch so configuration errors can be retried immediately.
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
