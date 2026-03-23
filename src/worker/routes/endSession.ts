import { endSession } from '../services/durableSessionService'
import type { WorkerEnv } from '../index'
import { json } from './json'

export async function handleEndSession(env: WorkerEnv, sessionId: string) {
  return json(await endSession(env, { sessionId }))
}
