"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  CheckCircle2,
  CircleDot,
  ExternalLink,
  Loader2,
  Play,
  TerminalSquare,
  XCircle,
} from "lucide-react"

type RunStatus = {
  id: number
  runNumber: number
  status: string
  conclusion: string | null
  htmlUrl: string
  createdAt: string
  updatedAt: string
  branch: string
  commit: string
}

type JobStep = {
  name: string
  number: number
  status: string
  conclusion: string | null
  startedAt?: string | null
  completedAt?: string | null
}

type JobStatus = {
  id: number
  name: string
  status: string
  conclusion: string | null
  steps: JobStep[]
}

type TestItem = {
  id: string
  title: string
  project: string
  file: string
  status: string
  duration?: number
  retry?: number
  error?: string
  sequence?: number
}

type TestProgress = {
  total: number
  completed: number
  passed: number
  failed: number
  skipped: number
  running: number
  suiteStatus: string
  tests: TestItem[]
  consoleLines: string[]
}

type LiveData = {
  job: JobStatus | null
  progress: TestProgress
  reportAvailable: boolean
}

type RunResponse = {
  ok: boolean
  run?: RunStatus
  job?: JobStatus | null
  progress?: TestProgress
  reportAvailable?: boolean
  message?: string
  error?: string
  retryAfterSeconds?: number
}

type GroupStatus = "passed" | "failed" | "running" | "pending"

type SuiteGroup = {
  key: string
  label: string
  matcher: (project: string) => boolean
}

const runnerUrl = (process.env.NEXT_PUBLIC_QA_RUNNER_URL || "").replace(/\/$/, "")
const actionsUrl = "https://github.com/PhillipQA/playwright-automation-project/actions"
const repoUrl = "https://github.com/PhillipQA/playwright-automation-project"

const suiteGroups: SuiteGroup[] = [
  { key: "setup", label: "Authentication setup", matcher: (project) => project === "setup" },
  { key: "login", label: "Login & negative cases", matcher: (project) => project === "unauthenticated" },
  { key: "chromium", label: "Chromium E2E", matcher: (project) => project.includes("chromium") },
  { key: "firefox", label: "Firefox E2E", matcher: (project) => project.includes("firefox") },
  { key: "webkit", label: "WebKit E2E", matcher: (project) => project.includes("webkit") },
  { key: "api", label: "API checks", matcher: (project) => project === "api" },
]

const browserKeys = ["chromium", "firefox", "webkit"]

function consoleLineClass(line: string) {
  if (line.startsWith("✓")) return "text-accent"
  if (line.startsWith("✕")) return "text-destructive"
  if (line.startsWith("▶")) return "text-primary"
  if (line.startsWith("  ↳")) return "text-destructive/90"
  if (line.startsWith("$")) return "text-foreground"
  return "text-muted-foreground"
}

function getGroupSummary(tests: TestItem[], group: SuiteGroup) {
  const items = tests.filter((test) => group.matcher(test.project || ""))
  const failed = items.filter((test) => ["failed", "timedOut", "interrupted"].includes(test.status)).length
  const running = items.filter((test) => test.status === "running").length
  const completed = items.filter((test) => ["passed", "failed", "timedOut", "interrupted", "skipped"].includes(test.status)).length

  let status: GroupStatus = "pending"
  if (failed > 0) status = "failed"
  else if (running > 0) status = "running"
  else if (items.length > 0 && completed === items.length) status = "passed"

  return {
    ...group,
    status,
    total: items.length,
    completed,
  }
}

function GroupIcon({ status }: { status: GroupStatus }) {
  if (status === "passed") {
    return (
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent/10 text-accent">
        <CheckCircle2 className="h-4 w-4" />
      </span>
    )
  }

  if (status === "failed") {
    return (
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <XCircle className="h-4 w-4" />
      </span>
    )
  }

  if (status === "running") {
    return (
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
        <Loader2 className="h-4 w-4 animate-spin" />
      </span>
    )
  }

  return (
    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-muted text-muted-foreground">
      <CircleDot className="h-4 w-4" />
    </span>
  )
}

export function TestLab() {
  const [run, setRun] = useState<RunStatus | null>(null)
  const [live, setLive] = useState<LiveData | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<EventSource | null>(null)
  const consoleRef = useRef<HTMLDivElement | null>(null)
  const configured = Boolean(runnerUrl)

  const progress = live?.progress
  const tests = progress?.tests || []
  const total = progress?.total || 0
  const passed = progress?.passed || 0
  const failed = progress?.failed || 0
  const running = progress?.running || 0

  const groups = useMemo(
    () => suiteGroups.map((group) => getGroupSummary(tests, group)),
    [tests],
  )

  const passingBrowsers = groups.filter(
    (group) => browserKeys.includes(group.key) && group.status === "passed",
  ).length

  const reportUrl = run && live?.reportAvailable
    ? `${runnerUrl}/api/qa/report/${run.id}/`
    : ""

  const visibleConsoleLines = (progress?.consoleLines || []).slice(-14)

  const runnerStatus = !run
    ? "Ready"
    : run.status !== "completed"
      ? "Live · GitHub Actions"
      : run.conclusion === "success"
        ? "Last run · Passed"
        : "Last run · Failed"

  const summaryText = !run
    ? "Ready to run the regression suite."
    : run.status !== "completed"
      ? `Running: ${passed}/${total || "—"} passed${failed ? ` · ${failed} failed` : ""}${running ? ` · ${running} active` : ""}.`
      : run.conclusion === "success"
        ? `${passed}/${total || passed} tests passed successfully.`
        : `${passed}/${total || "—"} passed · ${failed} failed.`

  const applyLiveData = (data: RunResponse) => {
    if (!data.run || !data.progress) return
    setRun(data.run)
    setLive({
      job: data.job || null,
      progress: data.progress,
      reportAvailable: Boolean(data.reportAvailable),
    })
    if (data.run.status === "completed") setLoading(false)
  }

  const stopLiveUpdates = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.close()
      streamRef.current = null
    }
  }

  const loadLive = async (id: number, silent = true) => {
    if (!configured) return null
    try {
      const response = await fetch(`${runnerUrl}/api/qa/live/${id}`, { cache: "no-store" })
      const data = (await response.json()) as RunResponse
      if (!response.ok || !data.ok || !data.run || !data.progress) {
        throw new Error(data.error || "Unable to load live test output.")
      }
      applyLiveData(data)
      return data
    } catch (error) {
      if (!silent) {
        setMessage(error instanceof Error ? error.message : "Unable to load live test output.")
      }
      return null
    }
  }

  const startPollingFallback = (id: number) => {
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      const data = await loadLive(id, true)
      if (data?.run?.status === "completed") {
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = null
      }
    }, 5000)
  }

  const startStream = (id: number) => {
    stopLiveUpdates()

    if (typeof EventSource === "undefined") {
      startPollingFallback(id)
      return
    }

    const source = new EventSource(`${runnerUrl}/api/qa/stream/${id}`)
    streamRef.current = source

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RunResponse
        if (!data.ok || !data.run || !data.progress) return
        applyLiveData(data)

        if (data.run.status === "completed") {
          source.close()
          if (streamRef.current === source) streamRef.current = null
        }
      } catch {
        // Wait for the next valid snapshot.
      }
    }

    source.onerror = () => {
      source.close()
      if (streamRef.current === source) streamRef.current = null
      startPollingFallback(id)
    }
  }

  const loadLatest = async () => {
    if (!configured) return
    try {
      const response = await fetch(`${runnerUrl}/api/qa/latest`, { cache: "no-store" })
      const data = (await response.json()) as RunResponse
      if (!response.ok || !data.ok) return

      if (data.run) {
        setRun(data.run)
        const liveData = await loadLive(data.run.id, true)
        if (liveData?.run?.status !== "completed") startStream(data.run.id)
      }
    } catch {
      // Keep the portfolio usable if the free runner is waking up.
    }
  }

  const runTests = async () => {
    if (!configured || loading) return

    setLoading(true)
    setMessage("")
    setLive(null)

    try {
      const response = await fetch(`${runnerUrl}/api/qa/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suite: "full" }),
      })

      const data = (await response.json()) as RunResponse

      if (!response.ok || !data.ok) {
        const cooldown = data.retryAfterSeconds
          ? ` Try again in ${data.retryAfterSeconds}s.`
          : ""
        throw new Error(`${data.error || "Unable to start the Playwright run."}${cooldown}`)
      }

      if (data.run) {
        setRun(data.run)
        await loadLive(data.run.id, true)
        startStream(data.run.id)
      } else {
        setMessage(data.message || "Workflow accepted. Waiting for GitHub Actions.")
        setTimeout(loadLatest, 5000)
        setLoading(false)
      }
    } catch (error) {
      setLoading(false)
      setMessage(error instanceof Error ? error.message : "Unable to start the Playwright run.")
    }
  }

  useEffect(() => {
    if (configured) loadLatest()
    return stopLiveUpdates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [progress?.consoleLines.length])

  return (
    <section id="test-lab" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="overflow-hidden rounded-[28px] border border-primary/25 bg-card">
          <div className="grid gap-7 px-6 py-7 sm:px-8 sm:py-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Live QA Test Lab · Playwright E2E automation
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Quality in action.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Run my public regression suite and watch the Playwright results arrive test by test in real time.
              </p>
              {run ? (
                <div className="mt-3 font-mono text-[11px] text-muted-foreground">
                  Run #{run.runNumber} · {run.branch || "main"} · {run.commit ? run.commit.slice(0, 7) : "—"}
                </div>
              ) : null}
            </div>

            <div className="grid min-w-0 grid-cols-3 overflow-hidden rounded-lg border border-border">
              <div className="min-w-0 px-4 py-4 text-center sm:px-5">
                <div className="truncate font-mono text-2xl font-semibold text-primary sm:text-3xl">
                  {passed}/{total || "—"}
                </div>
                <div className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tests passed
                </div>
              </div>
              <div className="min-w-0 border-x border-border px-4 py-4 text-center sm:px-5">
                <div className="font-mono text-2xl font-semibold text-primary sm:text-3xl">3</div>
                <div className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Browsers
                </div>
              </div>
              <div className="min-w-0 px-4 py-4 text-center sm:px-5">
                <div className="font-mono text-2xl font-semibold text-primary sm:text-3xl">
                  {passingBrowsers}/3
                </div>
                <div className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Passing
                </div>
              </div>
            </div>
          </div>

          <div className="grid border-t border-border lg:grid-cols-[0.78fr_1.22fr]">
            <div className="divide-y divide-border bg-primary/[0.035] px-5 sm:px-7">
              {groups.map((group) => (
                <div key={group.key} className="flex items-center gap-3 py-4">
                  <GroupIcon status={group.status} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{group.label}</div>
                  </div>
                  <div className="flex-none font-mono text-[11px] text-muted-foreground">
                    {group.total
                      ? group.status === "running"
                        ? `${group.completed}/${group.total}`
                        : `${group.total} test${group.total === 1 ? "" : "s"}`
                      : "waiting"}
                  </div>
                </div>
              ))}
            </div>

            <div className="min-w-0 border-t border-border bg-[#090b0d] lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7">
                <div className="flex min-w-0 items-center gap-2 font-mono text-xs text-foreground">
                  <span className={`h-2 w-2 flex-none rounded-full ${run && run.status !== "completed" ? "animate-pulse bg-primary" : "bg-muted-foreground/50"}`} />
                  <span className="truncate">PLAYWRIGHT RUNNER</span>
                </div>
                <span className="flex-none font-mono text-[10px] text-muted-foreground">
                  {runnerStatus}
                </span>
              </div>

              <div
                ref={consoleRef}
                className="h-64 overflow-y-auto px-5 py-4 font-mono text-[11px] leading-6 sm:px-7"
                aria-live="polite"
              >
                {(visibleConsoleLines.length
                  ? visibleConsoleLines
                  : ["› Waiting for a Playwright run..."]
                ).map((line, index) => (
                  <div
                    key={`${index}-${line}`}
                    className={`whitespace-pre-wrap break-words ${consoleLineClass(line)}`}
                  >
                    {line}
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 px-5 py-4 sm:px-7">
                {message ? (
                  <div className="mb-3 text-xs leading-5 text-destructive">{message}</div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={runTests}
                    disabled={!configured || loading}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {loading ? "RUNNING..." : "RUN TEST SUITE"}
                  </button>

                  <span className="text-xs text-muted-foreground">{summaryText}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Full regression suite · {total || "—"} tests
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
              {reportUrl ? (
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  View Playwright report <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}

              {run?.htmlUrl ? (
                <a
                  href={run.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  GitHub Actions <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}

              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                Repository <ExternalLink className="h-3.5 w-3.5" />
              </a>

              {!run?.htmlUrl ? (
                <a
                  href={actionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  Actions <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {!configured ? (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            The QA runner is not configured for this deployment.
          </p>
        ) : null}
      </div>
    </section>
  )
}
