import type { SubmitAnswerRequest } from '../../shared/types'
import { submitAnswer } from '../services/durableSessionService'
import type { WorkerEnv } from '../index'
import { json } from './json'

export async function handleSubmitAnswer(
  request: Request,
  env: WorkerEnv,
  sessionId: string,
) {
  const payload = (await request.json()) as SubmitAnswerRequest
  return json(
    await submitAnswer(env, {
      ...payload,
      sessionId,
    }),
  )
}
