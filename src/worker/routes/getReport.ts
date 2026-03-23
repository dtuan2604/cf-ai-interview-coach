import { getReport } from '../db/interviewRepository'
import type { WorkerEnv } from '../index'
import { json } from './json'

export async function handleGetReport(env: WorkerEnv, sessionId: string) {
  return json({
    report: await getReport(env.DB, sessionId),
    transport: 'worker',
  })
}
