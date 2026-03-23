import type { StartSessionRequest } from '../../shared/types'
import { startSession } from '../services/mockSessionService'
import { json } from './json'

export async function handleStartSession(request: Request) {
  const payload = (await request.json()) as StartSessionRequest
  return json(await startSession(payload))
}
