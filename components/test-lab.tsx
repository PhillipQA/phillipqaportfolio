"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  ExternalLink,
  FileBarChart2,
  GitBranch,
  Loader2,
  Play,
  RefreshCcw,
  ShieldCheck,
  TerminalSquare,
  XCircle,
} from "lucide-react"
import { SectionHeading } from "@/components/section-heading"

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

const runnerUrl = (process.env.NEXT_PUBLIC_QA_RUNNER_URL || "").replace(/\/$/, "")
const actionsUrl = "https://github.com/PhillipQA/playwright-automation-project/actions"
const repoUrl = "https://github.com/PhillipQA/playwright-automation-project"

function formatDate(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDuration(value?: number) {
  if (!value || value < 1) return "—"
  return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`
}

function statusMeta(run: RunStatus | null) {
  if (!run) {
    return {
      label: "Ready",
      detail: "Run the public demo suite to see live execution status.",
      icon: CircleDot,
      textClass: "text-muted-foreground",
      borderClass: "border-border",
    }
  }

  if (run.status !== "completed") {
    return {
      label: run.status === "queued" ? "Queued" : "Running",
      detail: "GitHub Actions is executing the Playwright suite. Live test events appear below.",
      icon: Loader2,
      textClass: "text-primary",
      borderClass: "border-primary/40",
    }
  }

  if (run.conclusion === "success") {
    return {
      label: "Passed",
      detail: "The latest Playwright demo run completed successfully.",
      icon: CheckCircle2,
      textClass: "text-accent",
      borderClass: "border-accent/40",
    }
  }

  return {
    label: run.conclusion ? run.conclusion.replaceAll("_", " ") : "Completed",
    detail: "The run completed with failures. Inspect the failed tests or open the full Playwright report below.",
    icon: XCircle,
    textClass: "text-destructive",
    borderClass: "border-destructive/40",
  }
}

function testStatusClass(status: string) {
  if (status === "passed") return "text-accent"
  if (["failed", "timedOut", "interrupted"].includes(status)) return "text-destructive"
  if (status === "running") return "text-primary"
  return "text-muted-foreground"
}

function consoleLineClass(line: string) {
  if (line.startsWith("✓")) return "text-accent"
  if (line.startsWith("✕")) return "text-destructive"
  if (line.startsWith("▶")) return "text-primary"
  if (line.startsWith("  ↳")) return "text-destructive/90"
  if (line.startsWith("$")) return "text-foreground"
  return "text-muted-foreground"
}

export function TestLab() {
  const [run, setRun] = useState<RunStatus | null>(null)
  const [live, setLive] = useState<LiveData | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState<string>("")
  const [showReport, setShowReport] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const consoleRef = useRef<HTMLDivElement | null>(null)
  const configured = Boolean(runnerUrl)
  const meta = useMemo(() => statusMeta(run), [run])
  const StatusIcon = meta.icon

  const progress = live?.progress
  const total = progress?.total || 0
  const completed = progress?.completed || 0
  const progressPercent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0
  const recentTests = [...(progress?.tests || [])].reverse().slice(0, 10)
  const reportUrl = run && live?.reportAvailable ? `${runnerUrl}/api/qa/report/${run.id}/` : ""

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
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
      setRun(data.run)
      setLive({
        job: data.job || null,
        progress: data.progress,
        reportAvailable: Boolean(data.reportAvailable),
      })
      if (data.run.status === "completed") setLoading(false)
      return data
    } catch (error) {
      if (!silent) setMessage(error instanceof Error ? error.message : "Unable to load live test output.")
      return null
    }
  }

  const pollRun = (id: number) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      const data = await loadLive(id, true)
      if (data?.run?.status === "completed") {
        stopPolling()
        setLoading(false)
        setTimeout(() => loadLive(id, true), 1500)
      }
    }, 3500)
  }

  const loadLatest = async (silent = false) => {
    if (!configured) return
    if (!silent) setRefreshing(true)
    try {
      const response = await fetch(`${runnerUrl}/api/qa/latest`, { cache: "no-store" })
      const data = (await response.json()) as RunResponse
      if (!response.ok || !data.ok) throw new Error(data.error || "Unable to load the latest run.")
      if (data.run) {
        setRun(data.run)
        const liveData = await loadLive(data.run.id, true)
        if (liveData?.run?.status !== "completed") pollRun(data.run.id)
      }
    } catch (error) {
      if (!silent) setMessage(error instanceof Error ? error.message : "Unable to load the latest run.")
    } finally {
      if (!silent) setRefreshing(false)
    }
  }

  const runTests = async () => {
    if (!configured || loading) return
    setLoading(true)
    setMessage("")
    setShowReport(false)
    setLive(null)
    try {
      const response = await fetch(`${runnerUrl}/api/qa/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suite: "full" }),
      })
      const data = (await response.json()) as RunResponse
      if (!response.ok || !data.ok) {
        const cooldown = data.retryAfterSeconds ? ` Try again in ${data.retryAfterSeconds}s.` : ""
        throw new Error(`${data.error || "Unable to start the Playwright run."}${cooldown}`)
      }
      if (data.run) {
        setRun(data.run)
        await loadLive(data.run.id, true)
        pollRun(data.run.id)
      } else {
        setMessage(data.message || "Run accepted. Waiting for GitHub Actions to create the workflow run.")
        setTimeout(() => loadLatest(true), 5000)
        setLoading(false)
      }
    } catch (error) {
      setLoading(false)
      setMessage(error instanceof Error ? error.message : "Unable to start the Playwright run.")
    }
  }

  useEffect(() => {
    if (configured) loadLatest(true)
    return stopPolling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight
  }, [progress?.consoleLines.length])

  return (
    <section id="test-lab" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          index="03"
          title="Live QA Test Lab"
          subtitle="Run my Playwright suite, follow each test in a live CLI-style console, and inspect the HTML report"
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs text-primary">
                  <TerminalSquare className="h-4 w-4" />
                  playwright-automation-project
                </div>
                <h3 className="mt-3 text-xl font-semibold text-foreground">Interactive regression demo</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Start the CI suite from this portfolio. While GitHub Actions runs, this dashboard follows the workflow step, individual Playwright tests, pass/fail state, retries, and the final report.
                </p>
              </div>
              <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 font-mono text-xs text-primary">
                full suite
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-border bg-background/40 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <GitBranch className="h-3.5 w-3.5" /> Branch
                </div>
                <div className="mt-2 font-mono text-sm text-foreground">{run?.branch || "main"}</div>
              </div>
              <div className="rounded-md border border-border bg-background/40 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" /> Run
                </div>
                <div className="mt-2 font-mono text-sm text-foreground">{run ? `#${run.runNumber}` : "not started"}</div>
              </div>
              <div className="rounded-md border border-border bg-background/40 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" /> Updated
                </div>
                <div className="mt-2 font-mono text-xs text-foreground">{formatDate(run?.updatedAt)}</div>
              </div>
            </div>

            <div className={`mt-5 rounded-lg border ${meta.borderClass} bg-background/50 p-4`}>
              <div className="flex items-start gap-3">
                <StatusIcon
                  className={`mt-0.5 h-5 w-5 ${meta.textClass} ${run && run.status !== "completed" ? "animate-spin" : ""}`}
                />
                <div className="min-w-0 flex-1">
                  <div className={`font-mono text-sm font-medium capitalize ${meta.textClass}`}>{meta.label}</div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{meta.detail}</p>
                  {run?.commit ? <p className="mt-2 font-mono text-xs text-muted-foreground">commit {run.commit.slice(0, 7)}</p> : null}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-background/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-xs text-primary">test progress</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {total ? `${completed} of ${total} completed` : "Waiting for test telemetry"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 font-mono text-xs">
                  <span className="rounded border border-accent/30 px-2 py-1 text-accent">{progress?.passed || 0} passed</span>
                  <span className="rounded border border-destructive/30 px-2 py-1 text-destructive">{progress?.failed || 0} failed</span>
                  <span className="rounded border border-primary/30 px-2 py-1 text-primary">{progress?.running || 0} running</span>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-lg border border-border bg-[#090b0d]">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2 font-mono text-xs text-foreground">
                  <TerminalSquare className="h-4 w-4 text-primary" /> live execution console
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {live?.job?.steps.find((step) => step.status === "in_progress")?.name || live?.job?.status || "idle"}
                </span>
              </div>
              <div ref={consoleRef} className="h-72 overflow-y-auto px-4 py-3 font-mono text-xs leading-6" aria-live="polite">
                {(progress?.consoleLines.length ? progress.consoleLines : ["$ waiting for Playwright output..."]).map((line, index) => (
                  <div key={`${index}-${line}`} className={`whitespace-pre-wrap break-words ${consoleLineClass(line)}`}>
                    {line}
                  </div>
                ))}
              </div>
            </div>

            {recentTests.length ? (
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="font-mono text-xs text-primary">latest tests</div>
                  <span className="text-xs text-muted-foreground">updates every few seconds</span>
                </div>
                <div className="space-y-2">
                  {recentTests.map((test) => (
                    <div key={`${test.id}-${test.retry || 0}`} className="rounded-md border border-border bg-background/40 px-3 py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm text-foreground">{test.title}</div>
                          <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{test.project || "default"}</div>
                        </div>
                        <div className={`flex-none font-mono text-xs uppercase ${testStatusClass(test.status)}`}>
                          {test.status}{test.duration ? ` · ${formatDuration(test.duration)}` : ""}
                        </div>
                      </div>
                      {test.error ? <div className="mt-2 line-clamp-2 text-xs leading-relaxed text-destructive">{test.error}</div> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {message ? (
              <div className="mt-4 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">{message}</div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={runTests}
                disabled={!configured || loading}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {loading ? "test running" : "run Playwright tests"}
              </button>

              <button
                type="button"
                onClick={() => loadLatest(false)}
                disabled={!configured || refreshing}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background/30 px-4 py-2.5 font-mono text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                refresh status
              </button>

              {run?.htmlUrl ? (
                <a
                  href={run.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background/30 px-4 py-2.5 font-mono text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" /> open GitHub run
                </a>
              ) : null}
            </div>

            {!configured ? (
              <div className="mt-5 rounded-md border border-accent/30 bg-accent/5 p-4 text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Demo runner not connected yet.</span>{" "}
                Set <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">NEXT_PUBLIC_QA_RUNNER_URL</code> to enable the live lab.
              </div>
            ) : null}
          </div>

          <aside className="space-y-5">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" /> Safe public demo
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <li>• Visitors can trigger only the predefined full suite.</li>
                <li>• GitHub credentials remain on the server-side runner.</li>
                <li>• Per-IP and global cooldowns reduce repeated triggering.</li>
                <li>• Test output comes from GitHub Actions; browsers still run in CI.</li>
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <div className="font-mono text-xs text-primary">workflow steps</div>
              <div className="mt-3 space-y-2">
                {(live?.job?.steps || []).map((step) => (
                  <div key={step.number} className="flex items-center justify-between gap-3 rounded border border-border bg-background/40 px-3 py-2 text-xs">
                    <span className="min-w-0 truncate text-muted-foreground">{step.name}</span>
                    <span className={`flex-none font-mono ${testStatusClass(step.status === "completed" ? step.conclusion || "" : step.status)}`}>
                      {step.status === "completed" ? step.conclusion || "done" : step.status}
                    </span>
                  </div>
                ))}
                {!live?.job?.steps?.length ? <div className="text-sm text-muted-foreground">Workflow steps appear after the run starts.</div> : null}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <div className="font-mono text-xs text-primary">behind the dashboard</div>
              <div className="mt-3 space-y-3 font-mono text-xs text-muted-foreground">
                <div className="rounded border border-border bg-background/40 p-3">portfolio → secure runner</div>
                <div className="pl-5 text-primary/70">↓ workflow_dispatch</div>
                <div className="rounded border border-border bg-background/40 p-3">GitHub Actions → Playwright</div>
                <div className="pl-5 text-primary/70">↓ test events + report</div>
                <div className="rounded border border-border bg-background/40 p-3">live console → portfolio</div>
              </div>
              <div className="mt-5 flex flex-wrap gap-4">
                <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono text-xs text-foreground hover:text-primary">
                  repository <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
                <a href={actionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono text-xs text-foreground hover:text-primary">
                  actions <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-5 rounded-lg border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-primary">
                <FileBarChart2 className="h-4 w-4" /> Playwright HTML report
              </div>
              <h3 className="mt-2 text-lg font-semibold text-foreground">Inspect the same report produced by the CI run</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                After the workflow completes, the report artifact is served through the secure runner so visitors can review suites, projects, timings, failures, and traces without leaving the portfolio.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowReport((value) => !value)}
                disabled={!reportUrl}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileBarChart2 className="h-4 w-4" />
                {showReport ? "hide report" : "view report"}
              </button>
              {reportUrl ? (
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 font-mono text-sm text-muted-foreground hover:border-primary/40 hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" /> open full screen
                </a>
              ) : null}
            </div>
          </div>

          {!reportUrl ? (
            <div className="mt-5 rounded-md border border-border bg-background/40 p-4 text-sm text-muted-foreground">
              The HTML report becomes available after a new demo run finishes and GitHub uploads the <span className="font-mono text-foreground">playwright-report</span> artifact.
            </div>
          ) : null}

          {showReport && reportUrl ? (
            <div className="mt-5 overflow-hidden rounded-lg border border-border bg-background">
              <iframe
                key={reportUrl}
                src={reportUrl}
                title={`Playwright report for run ${run?.runNumber || "latest"}`}
                className="h-[680px] w-full bg-white"
                sandbox="allow-scripts allow-same-origin allow-downloads allow-popups"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
