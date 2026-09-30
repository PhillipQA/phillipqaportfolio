"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  ExternalLink,
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

type RunResponse = {
  ok: boolean
  run?: RunStatus
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
      detail: "GitHub Actions is executing the Playwright suite.",
      icon: Loader2,
      textClass: "text-muted-foreground",
      borderClass: "border-border",
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
    detail: "The run completed. Open GitHub Actions for logs, traces, screenshots, and the HTML report artifact.",
    icon: XCircle,
    textClass: "text-destructive",
    borderClass: "border-destructive/40",
  }
}

export function TestLab() {
  const [run, setRun] = useState<RunStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState<string>("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const configured = Boolean(runnerUrl)
  const meta = useMemo(() => statusMeta(run), [run])
  const StatusIcon = meta.icon

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const loadLatest = async (silent = false) => {
    if (!configured) return
    if (!silent) setRefreshing(true)
    try {
      const response = await fetch(`${runnerUrl}/api/qa/latest`, { cache: "no-store" })
      const data = (await response.json()) as RunResponse
      if (!response.ok || !data.ok) throw new Error(data.error || "Unable to load the latest run.")
      if (data.run) setRun(data.run)
    } catch (error) {
      if (!silent) setMessage(error instanceof Error ? error.message : "Unable to load the latest run.")
    } finally {
      if (!silent) setRefreshing(false)
    }
  }

  const pollRun = (id: number) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${runnerUrl}/api/qa/status/${id}`, { cache: "no-store" })
        const data = (await response.json()) as RunResponse
        if (!response.ok || !data.ok || !data.run) return
        setRun(data.run)
        if (data.run.status === "completed") {
          stopPolling()
          setLoading(false)
        }
      } catch {
        // Keep polling. A transient network error should not cancel a live run.
      }
    }, 5000)
  }

  const runTests = async () => {
    if (!configured || loading) return
    setLoading(true)
    setMessage("")
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
        pollRun(data.run.id)
      } else {
        setMessage(data.message || "Run accepted. Refresh the latest run in a few seconds.")
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

  return (
    <section id="test-lab" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          index="03"
          title="Live QA Test Lab"
          subtitle="Run my public Playwright suite on GitHub Actions and watch the result come back here"
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs text-primary">
                  <TerminalSquare className="h-4 w-4" />
                  playwright-automation-project
                </div>
                <h3 className="mt-3 text-xl font-semibold text-foreground">Public regression demo</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  This launches the repository&apos;s Playwright test suite on GitHub Actions. The browser session runs in CI—not inside your device—and the result is reported back here.
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
                  {run?.commit ? (
                    <p className="mt-2 font-mono text-xs text-muted-foreground">commit {run.commit.slice(0, 7)}</p>
                  ) : null}
                </div>
              </div>
            </div>

            {message ? (
              <div className="mt-4 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {message}
              </div>
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
                  <ExternalLink className="h-4 w-4" /> open run
                </a>
              ) : null}
            </div>

            {!configured ? (
              <div className="mt-5 rounded-md border border-accent/30 bg-accent/5 p-4 text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Demo runner not connected yet.</span>{" "}
                Add the included Render runner and set the portfolio repository variable
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">NEXT_PUBLIC_QA_RUNNER_URL</code>
                to enable the button. The dashboard itself is already ready.
              </div>
            ) : null}
          </div>

          <aside className="space-y-5">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" /> Safe public demo
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <li>• Visitors can run only the predefined full test suite.</li>
                <li>• GitHub credentials stay on the server-side runner.</li>
                <li>• Per-IP and global cooldowns reduce repeated triggering.</li>
                <li>• Logs and Playwright report artifacts remain attached to the GitHub Actions run.</li>
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <div className="font-mono text-xs text-primary">behind the dashboard</div>
              <div className="mt-3 space-y-3 font-mono text-xs text-muted-foreground">
                <div className="rounded border border-border bg-background/40 p-3">portfolio → secure runner</div>
                <div className="pl-5 text-primary/70">↓ workflow_dispatch</div>
                <div className="rounded border border-border bg-background/40 p-3">GitHub Actions → Playwright</div>
                <div className="pl-5 text-primary/70">↓ status + report</div>
                <div className="rounded border border-border bg-background/40 p-3">live status → portfolio</div>
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
      </div>
    </section>
  )
}
