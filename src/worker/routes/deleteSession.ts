import { deleteSession } from '../services/durableSessionService'
import type { WorkerEnv } from '../index'
import { json } from './json'

export async function handleDeleteSession(env: WorkerEnv, sessionId: string) {
  return json(await deleteSession(env, { sessionId }))
}
