import test from 'node:test';
import assert from 'node:assert/strict';
import { createLabController, groupSummary, resultStatus } from '../lib/live-qa-controller.mjs';

const run = (status = 'completed', conclusion = 'success', id = 12) => ({ id, runNumber: 5, status, conclusion, createdAt: '2026-10-12T12:00:00Z', updatedAt: '2026-10-12T12:02:00Z', branch: 'main', commit: 'abcdef12345' });
const progress = (tests = []) => ({ total: tests.length, passed: tests.filter(t => t.status === 'passed').length, failed: tests.filter(t => t.status === 'failed').length, skipped: tests.filter(t => t.status === 'skipped').length, running: tests.filter(t => t.status === 'running').length, completed: tests.filter(t => t.status !== 'running').length, tests, consoleLines: tests.map(t => (t.status === 'passed' ? '✓ PASSED ' : '✕ FAILED ') + t.title) });
const snapshot = (r = run(), tests = [], reportAvailable = true) => ({ ok: true, run: r, progress: progress(tests), reportAvailable });
const response = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
function harness(fetcher) {
  const streams = [], timers = [], calls = [];
  const app = createLabController({ fetch: async (url, options) => { calls.push({ url, options }); return fetcher(url, options); }, openStream: url => { const s = { url, closed: false, close() { this.closed = true; } }; streams.push(s); return s; }, setTimeout: (fn, delay) => { const t = { fn, delay, cancelled: false }; timers.push(t); return t; }, clearTimeout: t => { t.cancelled = true; }, now: () => 1791808000000 });
  return { app, streams, timers, calls };
}

test('load restores actual latest results and HTML report availability', async () => {
  const h = harness(url => response(url.endsWith('latest') ? { ok: true, run: run() } : snapshot(run(), [{ id: 'a', project: 'api', title: 'GET user', status: 'passed' }])));
  await h.app.load();
  assert.equal(h.app.state.progress.passed, 1); assert.equal(h.app.state.reportAvailable, true); assert.equal(h.app.state.connection, 'complete'); assert.equal(h.app.state.loading, false); h.app.dispose();
});
test('start is click driven, prevents duplicate dispatch, and clears old report only after acceptance', async () => {
  let resolveStart;
  const h = harness(url => url.endsWith('run') ? new Promise(resolve => { resolveStart = resolve; }) : response(url.endsWith('latest') ? { ok: true, run: run() } : snapshot()));
  await h.app.load();
  const pending = h.app.start(); assert.equal(h.app.state.dispatching, true); assert.equal(h.app.state.reportAvailable, true);
  assert.equal(await h.app.start(), false); resolveStart(response({ ok: true, run: run('queued', null, 13) })); assert.equal(await pending, true);
  assert.equal(h.calls.filter(c => c.url.endsWith('/run')).length, 1); assert.equal(h.app.state.reportAvailable, false); assert.equal(h.streams[0].url, '/api/qa/stream/13'); h.app.dispose();
});
test('individual streamed test events update counts while the run is active', async () => {
  const h = harness(url => response(url.endsWith('latest') ? { ok: true, run: run('in_progress', null) } : snapshot(run('in_progress', null), [], false)));
  await h.app.load(); const s = h.streams[0]; s.onopen();
  s.onmessage({ data: JSON.stringify(snapshot(run('in_progress', null), [{ id: 'a', title: 'Login', project: 'unauthenticated', status: 'passed' }, { id: 'b', title: 'Cart', project: 'authenticated-chromium', status: 'running' }], false)) });
  assert.equal(h.app.state.progress.passed, 1); assert.equal(h.app.state.progress.running, 1); assert.equal(h.app.state.connection, 'live');
  s.onmessage({ data: '{broken' }); assert.equal(h.app.state.progress.passed, 1); h.app.dispose();
});
test('wrong-run snapshots are ignored and reconnect closes the old stream', async () => {
  const h = harness(url => response(url.endsWith('latest') ? { ok: true, run: run('in_progress', null) } : snapshot(run('in_progress', null), [], false)));
  await h.app.load(); const old = h.streams[0]; old.onmessage({ data: JSON.stringify(snapshot(run('completed', 'success', 999))) });
  assert.equal(h.app.state.run.id, 12); await h.app.reconnect(); assert.equal(old.closed, true); assert.equal(h.streams.length, 2); h.app.dispose();
});
test('stream failure falls back to nonoverlapping polling and retains progress', async () => {
  const r = run('in_progress', null);
  const h = harness(url => response(url.endsWith('latest') ? { ok: true, run: r } : snapshot(r, [{ status: 'passed', title: 'Login', project: 'unauthenticated' }], false)));
  await h.app.load(); h.streams[0].onerror(); assert.equal(h.app.state.connection, 'polling'); assert.equal(h.streams[0].closed, true);
  await h.timers[0].fn(); assert.equal(h.app.state.progress.passed, 1); assert.equal(h.timers[1].delay, 3000); h.app.dispose();
});
test('completed suite waits for actual uploaded report before enabling report link', async () => {
  let available = false;
  const h = harness(url => response(url.endsWith('latest') ? { ok: true, run: run('in_progress', null) } : snapshot(run('in_progress', null), [], available)));
  await h.app.load(); h.streams[0].onmessage({ data: JSON.stringify(snapshot(run(), [], false)) });
  assert.equal(h.streams[0].closed, true); assert.equal(h.app.state.reportAvailable, false);
  available = true; await h.timers[0].fn(); assert.equal(h.app.state.reportAvailable, true); h.app.dispose();
});
test('cooldown errors preserve the previous evidence and block repeat requests', async () => {
  const h = harness(url => response(url.endsWith('/run') ? { ok: false, error: 'Cooldown', retryAfterSeconds: 120 } : url.endsWith('latest') ? { ok: true, run: run() } : snapshot(), url.endsWith('/run') ? 429 : 200));
  await h.app.load(); assert.equal(await h.app.start(), false); assert.equal(h.app.state.reportAvailable, true); assert.equal(h.app.state.error, 'Cooldown');
  assert.equal(await h.app.start(), false); assert.equal(h.calls.filter(c => c.url.endsWith('/run')).length, 1); h.app.dispose();
});
test('runner errors keep usable latest evidence and can be reconnected', async () => {
  let fail = false;
  const h = harness(url => { if (fail) throw new Error('network down'); return response(url.endsWith('latest') ? { ok: true, run: run() } : snapshot()); });
  await h.app.load(); fail = true; await h.app.reconnect(); assert.equal(h.app.state.connection, 'offline'); assert.equal(h.app.state.reportAvailable, true);
  fail = false; await h.app.reconnect(); assert.equal(h.app.state.connection, 'complete'); assert.equal(h.app.state.error, ''); h.app.dispose();
});
test('suite grouping distinguishes failed, skipped, running, and pending', () => {
  assert.equal(groupSummary([{ project: 'api', status: 'skipped' }], 'api').status, 'skipped');
  assert.equal(groupSummary([{ project: 'api', status: 'timedOut' }], 'api').status, 'failed');
  assert.equal(groupSummary([], 'webkit').status, 'pending');
  assert.equal(groupSummary([{ project: 'authenticated-webkit', status: 'running' }], 'webkit').status, 'running');
  assert.equal(resultStatus('interrupted'), 'failed');
});

