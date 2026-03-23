import type { SubmitAnswerRequest } from '../../shared/types'
import { submitAnswer } from '../services/mockSessionService'
import { json } from './json'

export async function handleSubmitAnswer(request: Request, sessionId: string) {
  const payload = (await request.json()) as SubmitAnswerRequest
  return json(
    await submitAnswer({
      ...payload,
      sessionId,
    }),
  )
}
