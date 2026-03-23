import { appConfig } from './config'

export function buildApiUrl(path: string) {
  return new URL(path, appConfig.apiBaseUrl).toString()
}
