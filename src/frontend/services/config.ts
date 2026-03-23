export const appConfig = {
  title: import.meta.env.VITE_APP_TITLE ?? 'AI Interview Coach',
  apiTransport:
    import.meta.env.VITE_API_TRANSPORT === 'mock' ? 'mock' : 'worker',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/',
  defaultModelLabel:
    import.meta.env.VITE_DEFAULT_MODEL_LABEL ?? 'Configured in Worker environment',
} as const
