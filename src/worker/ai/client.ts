import type { WorkerEnv } from '../index'

type AiTextResponse =
  | string
  | {
      response?: string
      text?: string
      result?: { response?: string; text?: string }
    }

export function extractResponseText(response: AiTextResponse): string {
  if (typeof response === 'string') {
    return response
  }

  if (response.response) {
    return response.response
  }

  if (response.text) {
    return response.text
  }

  if (response.result?.response) {
    return response.result.response
  }

  if (response.result?.text) {
    return response.result.text
  }

  throw new Error('Workers AI returned an unsupported response shape.')
}

export function parseJsonObject<T>(text: string): T {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed) as T
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as T
    }

    throw new Error('Workers AI did not return valid JSON.')
  }
}

export async function runTextModel(
  env: WorkerEnv,
  model: string,
  prompt: string,
) {
  if (!env.AI) {
    throw new Error('Workers AI binding is not configured.')
  }

  const response = await env.AI.run(model, {
    prompt,
  })

  return extractResponseText(response as AiTextResponse)
}
