/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENVIRONMENT: 'development' | 'testing' | 'production';
  readonly VITE_APP_TIMEZONE: string;
  readonly VITE_SESSION_TIMEOUT_MINUTES: string;
  readonly VITE_SESSION_WARNING_MINUTES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
