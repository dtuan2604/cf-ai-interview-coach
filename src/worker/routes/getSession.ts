import { getSession } from '../services/durableSessionService'
import type { WorkerEnv } from '../index'
import { json } from './json'

export async function handleGetSession(env: WorkerEnv, sessionId: string) {
  try {
    return json(await getSession(env, sessionId))
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to load session.',
      },
      { status: 404 },
    )
  }
}
