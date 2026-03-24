import type { SubmitVoiceTurnRequest } from '../../shared/types'
import { submitVoiceTurn } from '../services/durableSessionService'
import type { WorkerEnv } from '../index'
import { json } from './json'

export async function handleSubmitVoiceTurn(
  request: Request,
  env: WorkerEnv,
  sessionId: string,
) {
  const payload = (await request.json()) as SubmitVoiceTurnRequest
  return json(
    await submitVoiceTurn(env, {
      ...payload,
      sessionId,
    }),
  )
}
