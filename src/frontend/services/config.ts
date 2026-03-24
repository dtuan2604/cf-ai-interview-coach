export const appConfig = {
  title: import.meta.env.VITE_APP_TITLE ?? 'AI Interview Coach',
  apiTransport:
    import.meta.env.VITE_API_TRANSPORT === 'mock' ? 'mock' : 'worker',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/',
} as const
