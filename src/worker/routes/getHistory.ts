import { listHistory } from '../db/interviewRepository'
import type { WorkerEnv } from '../index'
import { json } from './json'

export async function handleGetHistory(env: WorkerEnv) {
  return json({
    items: await listHistory(env.DB),
    transport: 'worker',
  })
}
