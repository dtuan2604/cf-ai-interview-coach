import { appConfig } from './config'

export function buildApiUrl(path: string) {
  if (appConfig.apiBaseUrl === '/') {
    return path
  }

  if (appConfig.apiBaseUrl.startsWith('http')) {
    return new URL(path, appConfig.apiBaseUrl).toString()
  }

  return `${appConfig.apiBaseUrl.replace(/\/$/, '')}${path}`
}
