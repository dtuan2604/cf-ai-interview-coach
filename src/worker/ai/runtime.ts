import type { WorkerEnv } from '../index'

export function getAiRuntimeMode(env: Pick<WorkerEnv, 'AI_RUNTIME_MODE'>) {
  return env.AI_RUNTIME_MODE === 'workers' ? 'workers' : 'mock'
}
