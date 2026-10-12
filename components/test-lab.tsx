"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowUpRight, Check, ChevronDown, ChevronUp, Code2, FileText, Loader2, Play, RefreshCw, Terminal } from "lucide-react"
import { createLabController, groupSummary, resultStatus, type LabController, type LabState, type ResultStatus } from "@/lib/live-qa-controller.mjs"

const runnerUrl = (process.env.NEXT_PUBLIC_QA_RUNNER_URL || "").replace(/\/$/, "")
const repositoryUrl = "https://github.com/PhillipQA/playwright-automation-project"
const groups = [
  { key: "setup", name: "Authentication", detail: "Session setup" },
  { key: "login", name: "Login validation", detail: "Positive & negative cases" },
  { key: "chromium", name: "Chromium", detail: "Shopping & checkout" },
  { key: "firefox", name: "Firefox", detail: "Shopping & checkout" },
  { key: "webkit", name: "WebKit", detail: "Shopping & checkout" },
  { key: "api", name: "API checks", detail: "Response validation" },
]
const labels = { passed: "Passed", failed: "Failed", running: "Running", skipped: "Skipped", pending: "Waiting" }
const symbols = { passed: "✓", failed: "×", running: "◌", skipped: "−", pending: "·" }
const connectionLabels: Record<string, string> = { connecting: "Connecting…", live: "Live stream", polling: "Polling · 3s", reconnecting: "Reconnecting…", complete: "Run complete", offline: "Runner unavailable", ready: "Runner ready" }
const initialState: LabState = { run: null, job: null, progress: { total: 0, completed: 0, passed: 0, failed: 0, skipped: 0, running: 0, suiteStatus: "", tests: [], consoleLines: [] }, reportAvailable: false, dispatching: false, loading: true, connection: "connecting", error: "", notice: "", updatedAt: 0, cooldownUntil: 0 }

export function TestLab() {
  const [state, setState] = useState<LabState>(initialState)
  const [tab, setTab] = useState<"console" | "results">("console")
  const [filter, setFilter] = useState("all")
  const [group, setGroup] = useState("all")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [autoScroll, setAutoScroll] = useState(true)
  const [now, setNow] = useState(0)
  const controllerRef = useRef<LabController | null>(null)
  const consoleRef = useRef<HTMLDivElement>(null)
  const consoleTabRef = useRef<HTMLButtonElement>(null)
  const resultsTabRef = useRef<HTMLButtonElement>(null)
  const configured = Boolean(runnerUrl)

  useEffect(() => {
    if (!configured) { setState(s => ({ ...s, loading: false, connection: "offline", error: "The QA runner is not configured for this deployment." })); return }
    const controller = createLabController({
      fetch: (path, options) => fetch(runnerUrl + path, { ...options, signal: AbortSignal.timeout(50000) }),
      ...(typeof EventSource !== "undefined" ? { openStream: (path: string) => new EventSource(runnerUrl + path) } : {}),
      setTimeout, clearTimeout,
    })
    controllerRef.current = controller
    const unsubscribe = controller.subscribe(s => setState({ ...s, progress: { ...s.progress } }))
    void controller.load()
    return () => { unsubscribe(); controller.dispose(); if (controllerRef.current === controller) controllerRef.current = null }
  }, [configured])

  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  useEffect(() => { if (autoScroll && consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight }, [state.progress.consoleLines, autoScroll])

  const { progress: p, run } = state
  const active = Boolean(run && run.status !== "completed")
  const cooldown = Math.max(0, Math.ceil((state.cooldownUntil - now) / 1000))
  const busy = state.dispatching || active
  const filteredTests = useMemo(() => p.tests.filter(test => (filter === "all" || resultStatus(test.status) === filter) && (group === "all" || groupSummary([test], group).total)), [p.tests, filter, group])
  const percentage = p.total ? Math.min(100, Math.round(p.completed / p.total * 100)) : 0
  const elapsed = run ? Math.max(0, Math.round(((active ? now : new Date(run.updatedAt).getTime()) - new Date(run.createdAt).getTime()) / 1000)) : 0
  let status: ResultStatus = "pending"
  let statusText = "Ready"
  if (state.loading) statusText = "Connecting"
  else if (state.dispatching) { status = "running"; statusText = "Starting" }
  else if (active) { status = "running"; statusText = p.suiteStatus ? "Finishing" : p.total ? "Running" : "Queued / preparing" }
  else if (run) { status = run.conclusion === "success" ? "passed" : "failed"; statusText = run.conclusion === "cancelled" ? "Cancelled" : labels[status] }
  const summary = state.dispatching ? "Requesting a new GitHub Actions run." : active ? p.suiteStatus ? "Tests finished. GitHub is packaging the Playwright report." : p.total ? "Test events arrive as Playwright executes the suite." : (state.job?.steps.find(step => step.status === "in_progress")?.name || "GitHub Actions is preparing your test environment.") : run ? p.total ? `${p.passed} passed · ${p.failed} failed${p.skipped ? ` · ${p.skipped} skipped` : ""}` : "CI finished without test telemetry. Inspect the Actions run." : "Run real tests against SauceDemo. Results appear here as they execute."
  const reportUrl = run && state.reportAvailable ? `${runnerUrl}/api/qa/report/${run.id}/` : undefined

  const start = () => {
    setTab("console"); setFilter("all"); setGroup("all"); setExpanded(new Set())
    void controllerRef.current?.start()
  }
  const toggleDetail = (id: string) => setExpanded(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next })

  return (
    <section id="test-lab" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-5 flex items-end justify-between gap-5">
          <div><div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Test automation, in action</div><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Live QA Test Lab.</h2><p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-sm">Run my regression suite. Watch real results arrive test by test.<br />Then inspect the evidence in the full Playwright report.</p></div>
          <div className="hidden flex-none text-right text-[11px] text-muted-foreground md:block"><div className="mb-1 flex items-center justify-end gap-1.5 font-medium text-foreground"><Check className="h-3 w-3 text-accent" />Real execution. Real evidence.</div><div className="font-mono text-[10px]">Playwright + TypeScript · GitHub Actions</div></div>
        </div>
        <div className="live-qa-lab">
          <div className="qa-toolbar"><div><div className="qa-suite-title"><Code2 size={17} />SauceDemo regression suite</div><div className="qa-suite-sub">Authentication, cart, checkout & API · 3 browsers</div></div><div className="qa-toolbar-actions"><span className={`qa-badge qa-${status}`} role="status">{symbols[status]} {statusText}</span><button type="button" className="qa-run-button" onClick={start} disabled={!configured || busy || state.loading || cooldown > 0}>{busy ? <Loader2 className="qa-spin" size={13} /> : <Play size={13} fill="currentColor" />}<span>{state.dispatching ? "Starting run…" : active ? "Suite running…" : cooldown ? `Run again in ${cooldown}s` : "Run test suite"}</span></button></div></div>
          <div className="qa-stats"><div className="qa-stat-items">{([['passed', p.passed], ['failed', p.failed], ['running', p.running], ['skipped', p.skipped]] as [ResultStatus, number][]).map(([key, count]) => <div className="qa-stat" key={key}><b className={`qa-${key}`}>{count}</b><span>{labels[key]}</span></div>)}</div><div className="qa-progress"><span>{p.total ? `${p.completed} / ${p.total} completed` : active ? "Preparing browsers & dependencies" : state.loading ? "Connecting to runner…" : "Ready for execution"}</span><div className="qa-progress-bar" role="progressbar" aria-label="Tests completed" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><div className={p.failed ? "qa-progress-fill has-failures" : "qa-progress-fill"} style={{ width: `${percentage}%` }} /></div></div></div>
          <div className="qa-body-grid"><aside className="qa-suite-sidebar" aria-label="Filter results by suite"><div className="qa-sidebar-heading"><span>TEST COVERAGE</span><span>{p.total ? `${p.total} tests` : "Full regression"}</span></div><div className="qa-groups">{groups.map(item => { const g = groupSummary(p.tests, item.key); return <button type="button" key={item.key} className={`qa-group ${group === item.key ? "selected" : ""}`} aria-pressed={group === item.key} onClick={() => { setGroup(group === item.key ? "all" : item.key); setTab("results") }}><span className={`qa-group-icon qa-${g.status}`} aria-hidden="true">{symbols[g.status]}</span><span className="qa-group-name">{item.name}<small>{item.detail}</small></span><span className={`qa-group-count qa-${g.status}`} aria-label={labels[g.status]}>{g.total ? `${g.completed}/${g.total}` : "—"}</span></button> })}</div><p className="qa-sidebar-note">Click a suite to inspect its tests.<br />Every result comes from Playwright.</p></aside>
            <div className="qa-workspace"><div className="qa-workspace-header"><div className="qa-tabs" role="tablist" aria-label="Test output" onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); const next = tab === "console" ? "results" : "console"; setTab(next); (next === "console" ? consoleTabRef : resultsTabRef).current?.focus() } }}><button type="button" ref={consoleTabRef} className={`qa-tab ${tab === "console" ? "active" : ""}`} id="qa-console-tab" role="tab" aria-controls="qa-console-panel" aria-selected={tab === "console"} tabIndex={tab === "console" ? 0 : -1} onClick={() => setTab("console")}><Terminal size={12} />Live console</button><button type="button" ref={resultsTabRef} className={`qa-tab ${tab === "results" ? "active" : ""}`} id="qa-results-tab" role="tab" aria-controls="qa-results-panel" aria-selected={tab === "results"} tabIndex={tab === "results" ? 0 : -1} onClick={() => setTab("results")}>Test results <span className="qa-count">{p.tests.length}</span></button></div><span className={`qa-connection ${state.connection === "live" ? "live" : ""}`}>{connectionLabels[state.connection] || "Ready"}</span></div>
              <div role="tabpanel" id="qa-console-panel" aria-labelledby="qa-console-tab" hidden={tab !== "console"}><div className="qa-console-tools"><span>playwright / output</span><label><input type="checkbox" checked={autoScroll} onChange={event => setAutoScroll(event.target.checked)} />Auto-scroll</label></div><div ref={consoleRef} className="qa-console-output" role="log" aria-label="Live Playwright output" aria-live="polite">{p.consoleLines.length ? p.consoleLines.map((line, index) => <div key={`${index}-${line}`} className={`qa-log-line ${line.startsWith('✓') ? 'qa-passed' : line.startsWith('✕') || line.startsWith('  ↳') ? 'qa-failed' : line.startsWith('▶') ? 'qa-running' : ''}`}><span className="qa-line-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span>{line}</span></div>) : <div className="qa-console-empty"><span className="qa-prompt">$</span> npx playwright test<br /><span>{active ? "Waiting for Playwright test telemetry…" : "Start a run to watch actual test output."}</span></div>}</div></div>
              <div role="tabpanel" id="qa-results-panel" aria-labelledby="qa-results-tab" hidden={tab !== "results"}><div className="qa-filters"><span>{filteredTests.length} of {p.tests.length} tests{group !== "all" ? ` · ${groups.find(item => item.key === group)?.name}` : ""}</span><div>{group !== "all" && <button type="button" className="qa-link-button" onClick={() => setGroup("all")}>Clear suite</button>}<select aria-label="Filter tests by status" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All results</option>{(['passed', 'failed', 'running', 'skipped'] as const).map(key => <option value={key} key={key}>{labels[key]}</option>)}</select></div></div><div className="qa-test-list">{filteredTests.length ? filteredTests.map(test => { const outcome = resultStatus(test.status); const open = expanded.has(test.id); return <div className="qa-test-row" key={test.id}><button type="button" className="qa-test-toggle" onClick={() => toggleDetail(test.id)} aria-expanded={open}><span className={`qa-test-icon qa-${outcome}`} aria-hidden="true">{symbols[outcome]}</span><span className="qa-test-title">{test.title}<small>{test.project}{test.retry ? ` · retry ${test.retry}` : ""}</small></span><span className={`qa-badge qa-${outcome}`}>{labels[outcome]}</span><span className="qa-duration">{typeof test.duration === "number" ? `${(test.duration / 1000).toFixed(2)}s` : "—"}</span>{open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}</button>{open && <div className="qa-test-detail"><span>{test.file.split("/").pop()}</span>{test.error ? <pre className="qa-failed">{test.error}</pre> : <p>{outcome === "passed" ? "All assertions passed." : outcome === "running" ? "Playwright is executing this test." : "No error details were reported."}</p>}</div>}</div> }) : <div className="qa-empty-results">{p.tests.length ? "No tests match this filter." : active ? "Tests will appear when Playwright starts." : "Your test results will appear here."}</div>}</div></div>
              <div className="qa-summary-row"><p role="status">{summary}</p><button type="button" className="qa-link-button" onClick={() => void controllerRef.current?.reconnect()} disabled={!configured || state.dispatching}><RefreshCw size={10} />Reconnect</button></div>
            </div></div>
          {(state.error || state.notice) && <div className="qa-alerts">{state.error && <p className="qa-failed" role="alert">{state.error}</p>}{state.notice && <p className="qa-skipped" role="status">{state.notice}</p>}</div>}
          <div className="qa-lab-footer"><div className="qa-run-meta"><span>{run ? `Run #${run.runNumber}` : "No run yet"}</span><i /><span>{run?.branch || "main"}</span><span>{run?.commit.slice(0, 7) || "—"}</span><i /><span>{run ? `${elapsed}s` : "—"}</span>{run && <time dateTime={run.createdAt}>{new Date(run.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time>}</div><div className="qa-footer-links">{run && <a href={`${repositoryUrl}/actions/runs/${run.id}`} target="_blank" rel="noopener noreferrer">Actions run <ArrowUpRight size={11} /></a>}<a className={`qa-report-link ${!reportUrl ? "disabled" : ""}`} href={reportUrl} aria-disabled={!reportUrl} onClick={event => { if (!reportUrl) event.preventDefault() }} target="_blank" rel="noopener noreferrer"><FileText size={12} />{reportUrl ? "Open Playwright report" : run?.status === "completed" ? "Report not ready · reconnect" : "Report available after run"}<ArrowUpRight size={11} /></a></div></div>
        </div>
        <div className="mt-3 flex justify-between gap-4 text-[10px] leading-4 text-muted-foreground"><p>A full CI run usually takes 2–3 minutes.<br />Browser setup comes first; test output follows.</p><a href={repositoryUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 self-start text-foreground hover:underline">View test source <ArrowUpRight className="h-3 w-3" /></a></div>
      </div>
    </section>
  )
}
