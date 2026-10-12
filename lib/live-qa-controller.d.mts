export type TestItem = {
  id: string; title: string; project: string; file: string; status: string;
  duration?: number; retry?: number; error?: string; sequence?: number;
};
export type RunStatus = {
  id: number; runNumber: number; status: string; conclusion: string | null;
  htmlUrl: string; createdAt: string; updatedAt: string; branch: string; commit: string;
};
export type TestProgress = {
  total: number; completed: number; passed: number; failed: number; skipped: number;
  running: number; suiteStatus: string; tests: TestItem[]; consoleLines: string[];
};
export type LabState = {
  run: RunStatus | null;
  job: { steps: { name: string; status: string; conclusion: string | null }[] } | null;
  progress: TestProgress; reportAvailable: boolean; dispatching: boolean; loading: boolean;
  connection: string; error: string; notice: string; updatedAt: number; cooldownUntil: number;
};
type StreamLike = {
  close(): void;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
};
export type LabController = {
  state: LabState; load(): Promise<void>; start(): Promise<boolean | undefined>;
  reconnect(): Promise<void>; subscribe(listener: (state: LabState) => void): () => void;
  dispose(): void;
};
export function createLabController(io: {
  fetch(url: string, options?: RequestInit): Promise<Response>;
  openStream?(url: string): StreamLike;
  setTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout>;
  clearTimeout(timer: ReturnType<typeof setTimeout>): void;
  now?(): number;
}): LabController;
export type ResultStatus = 'passed' | 'failed' | 'running' | 'skipped' | 'pending';
export function resultStatus(status: string): ResultStatus;
export function groupSummary(tests: TestItem[], key: string): {
  total: number; passed: number; failed: number; running: number; skipped: number;
  completed: number; status: ResultStatus;
};
