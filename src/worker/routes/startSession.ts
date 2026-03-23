import type { StartSessionRequest } from '../../shared/types'
import { startSession } from '../services/durableSessionService'
import type { WorkerEnv } from '../index'
import { json } from './json'

export async function handleStartSession(request: Request, env: WorkerEnv) {
  const payload = (await request.json()) as StartSessionRequest
  return json(await startSession(env, payload))
}
