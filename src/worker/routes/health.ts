import type { HealthResponse } from '../../shared/types'
import { json } from './json'

export function handleHealth() {
  const response: HealthResponse = {
    ok: true,
    service: 'cf-ai-interview-coach-api',
    status: 'placeholder',
    transport: 'worker',
  }

  return json(response)
}
