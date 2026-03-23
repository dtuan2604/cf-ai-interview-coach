export type WorkerModelConfig = {
  interview?: string
  evaluation?: string
  report?: string
  transcription?: string
}

export function getConfiguredModels(env: WorkerModelConfig) {
  return {
    interview: env.interview,
    evaluation: env.evaluation ?? env.interview,
    report: env.report ?? env.evaluation ?? env.interview,
    transcription: env.transcription,
  }
}
