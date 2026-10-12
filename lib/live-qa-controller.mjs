// Shared execution controller from the validated private lab prototype.
export function createLabController(io) {
  const empty = () => ({ total: 0, completed: 0, passed: 0, failed: 0, skipped: 0, running: 0, suiteStatus: '', tests: [], consoleLines: [] });
  const state = { run: null, job: null, progress: empty(), reportAvailable: false, dispatching: false, loading: true, connection: 'connecting', error: '', notice: '', updatedAt: 0, cooldownUntil: 0 };
  let stream = null, timer = null, disposed = false, generation = 0, failures = 0;
  const listeners = new Set();
  const now = () => io.now ? io.now() : Date.now();
  const notify = () => { if (!disposed) for (const listener of listeners) listener(state); };
  const stop = () => { generation++; if (stream) stream.close(); stream = null; if (timer) io.clearTimeout(timer); timer = null; };
  async function request(path, options = {}) {
    const response = await io.fetch(path, { cache: 'no-store', ...options });
    let data;
    try { data = await response.json(); } catch { throw new Error('The runner returned an unreadable response. Try reconnecting.'); }
    if (!response.ok || !data.ok) {
      if (data.retryAfterSeconds) state.cooldownUntil = now() + Number(data.retryAfterSeconds) * 1000;
      throw new Error(data.error || 'The QA runner is unavailable. Try reconnecting.');
    }
    return data;
  }
  function apply(data) {
    if (!data.run || !data.progress || disposed) return false;
    if (state.run && String(data.run.id) !== String(state.run.id)) return false;
    state.run = data.run; state.job = data.job || null; state.progress = { ...empty(), ...data.progress };
    state.reportAvailable = Boolean(data.reportAvailable); state.updatedAt = now(); state.error = ''; state.loading = false; failures = 0; notify(); return true;
  }
  function schedulePoll(id, token, delay = 3000, reportDeadline = now() + 90000) {
    if (token !== generation || disposed) return;
    timer = io.setTimeout(async () => {
      if (token !== generation || disposed) return;
      try {
        const data = await request('/api/qa/live/' + id);
        if (token !== generation || disposed) return;
        apply(data);
        if (data.run?.status === 'completed') {
          state.connection = 'complete';
          if (!state.reportAvailable && now() < reportDeadline) schedulePoll(id, token, 4000, reportDeadline);
          else if (!state.reportAvailable) state.notice = 'No HTML report is available yet. Reconnect to check again, or inspect the Actions run.';
        } else schedulePoll(id, token, 3000, now() + 90000);
      } catch (error) {
        if (token !== generation || disposed) return;
        failures++; state.connection = 'reconnecting'; state.error = 'Live connection interrupted. Retrying; the tests continue in GitHub Actions.';
        schedulePoll(id, token, Math.min(15000, 3000 * failures), reportDeadline);
      }
      notify();
    }, delay);
  }
  function watch(id) {
    stop(); const token = generation; state.connection = 'connecting';
    if (!io.openStream) { state.connection = 'polling'; schedulePoll(id, token, 0); notify(); return; }
    stream = io.openStream('/api/qa/stream/' + id);
    stream.onopen = () => { if (token === generation) { state.connection = 'live'; notify(); } };
    stream.onmessage = event => {
      if (token !== generation || disposed) return;
      let data; try { data = JSON.parse(event.data); } catch { return; }
      if (!data.ok || !apply(data)) return;
      state.connection = 'live';
      if (state.run.status === 'completed') {
        if (stream) stream.close(); stream = null; state.connection = 'complete';
        if (!state.reportAvailable) schedulePoll(id, token, 1500);
      }
      notify();
    };
    stream.onerror = () => {
      if (token !== generation || disposed) return;
      if (stream) stream.close(); stream = null; state.connection = 'polling';
      state.notice = 'Stream interrupted. Checking actual test results every 3 seconds.';
      schedulePoll(id, token, 0); notify();
    };
    notify();
  }
  async function load() {
    stop(); const token = generation;
    state.loading = true; state.error = ''; state.notice = ''; state.connection = 'connecting'; notify();
    try {
      const latest = await request('/api/qa/latest');
      if (token !== generation || disposed) return;
      if (latest.run) {
        state.run = latest.run;
        const data = await request('/api/qa/live/' + latest.run.id);
        if (token !== generation || disposed) return;
        apply(data);
        if (state.run.status !== 'completed') watch(state.run.id);
        else { state.connection = 'complete'; if (!state.reportAvailable) schedulePoll(state.run.id, token, 2000); }
      } else { state.run = null; state.progress = empty(); state.reportAvailable = false; state.connection = 'ready'; }
    } catch (error) {
      if (token !== generation || disposed) return;
      state.error = error.message; state.connection = 'offline';
    } finally { if (!disposed && token === generation) { state.loading = false; notify(); } }
  }
  async function start() {
    if (state.dispatching || state.loading || now() < state.cooldownUntil || (state.run && state.run.status !== 'completed')) return false;
    state.dispatching = true; state.error = ''; state.notice = ''; notify();
    const startedAt = now(), previousId = state.run?.id;
    try {
      const data = await request('/api/qa/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ suite: 'full' }) });
      if (disposed) return false;
      let run = data.run;
      if (!run) {
        state.notice = 'GitHub accepted the workflow. Waiting for its run ID…'; notify();
        for (let attempt = 0; attempt < 15 && !disposed; attempt++) {
          await new Promise(resolve => io.setTimeout(resolve, 2000));
          const latest = await request('/api/qa/latest');
          if (latest.run && latest.run.id !== previousId && new Date(latest.run.createdAt).getTime() >= startedAt - 5000) { run = latest.run; break; }
        }
      }
      if (!run) throw new Error('The workflow was accepted, but its run ID has not arrived. Reconnect to find it; avoid triggering another run.');
      state.run = run; state.job = null; state.progress = empty(); state.reportAvailable = false; state.notice = ''; state.updatedAt = now();
      watch(run.id); return true;
    } catch (error) { if (!disposed) { state.error = error.message; return false; } }
    finally { state.dispatching = false; notify(); }
  }
  async function reconnect() {
    if (state.dispatching) return;
    if (!state.run) return load();
    stop(); const token = generation;
    state.error = ''; state.notice = ''; state.connection = 'connecting'; notify();
    try {
      const data = await request('/api/qa/live/' + state.run.id);
      if (token !== generation || disposed) return;
      apply(data);
      if (state.run.status !== 'completed') watch(state.run.id);
      else { state.connection = 'complete'; if (!state.reportAvailable) schedulePoll(state.run.id, token, 1000); }
    } catch (error) { if (token === generation) { state.error = error.message; state.connection = 'offline'; } }
    notify();
  }
  return { state, load, start, reconnect, subscribe(listener) { listeners.add(listener); listener(state); return () => listeners.delete(listener); }, dispose() { disposed = true; stop(); listeners.clear(); } };
}

export function groupSummary(tests, key) {
  const items = tests.filter(t => key === 'setup' ? t.project === 'setup' : key === 'login' ? t.project === 'unauthenticated' : key === 'api' ? t.project === 'api' : String(t.project).includes(key));
  const count = status => items.filter(t => status.includes(t.status)).length;
  const failed = count(['failed', 'timedOut', 'interrupted']), running = count(['running']), passed = count(['passed']), skipped = count(['skipped']);
  return { total: items.length, passed, failed, running, skipped, completed: passed + failed + skipped, status: running ? 'running' : failed ? 'failed' : items.length && passed === items.length ? 'passed' : items.length && passed + skipped === items.length ? 'skipped' : 'pending' };
}

export function resultStatus(status) {
  return ['failed', 'timedOut', 'interrupted'].includes(status) ? 'failed' : ['passed', 'running', 'skipped'].includes(status) ? status : 'pending';
}

