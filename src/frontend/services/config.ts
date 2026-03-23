export const appConfig = {
  title: import.meta.env.VITE_APP_TITLE ?? 'AI Interview Coach',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8787',
  defaultModelLabel:
    import.meta.env.VITE_DEFAULT_MODEL_LABEL ?? 'Configured in Worker environment',
} as const
