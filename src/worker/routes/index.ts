export type WorkerRoute = {
  method: string
  path: string
}

export const workerRoutes: WorkerRoute[] = [
  { method: 'GET', path: '/api/health' },
]
