export type WorkerRoute = {
  method: string
  path: string
}

export const workerRoutes: WorkerRoute[] = [
  { method: 'GET', path: '/api/health' },
  { method: 'GET', path: '/api/history' },
  { method: 'GET', path: '/api/reports/:sessionId' },
  { method: 'GET', path: '/api/sessions/:sessionId' },
  { method: 'POST', path: '/api/sessions/start' },
  { method: 'POST', path: '/api/sessions/:sessionId/answer' },
  { method: 'POST', path: '/api/sessions/:sessionId/end' },
]
