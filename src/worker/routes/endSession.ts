import { endSession } from '../services/mockSessionService'
import { json } from './json'

export async function handleEndSession(sessionId: string) {
  return json(await endSession({ sessionId }))
}
