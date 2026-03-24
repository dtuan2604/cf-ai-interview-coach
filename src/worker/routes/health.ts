import type { HealthResponse } from '../../shared/types'
import type { WorkerEnv } from '../index'
import { json } from './json'

export function handleHealth(env?: WorkerEnv) {
  const response: HealthResponse = {
    ok: true,
    service: 'cf-ai-interview-coach-api',
    status: env?.AI_RUNTIME_MODE === 'workers' ? 'ok' : 'placeholder',
    transport: 'worker',
  }

  return json(response)
}
