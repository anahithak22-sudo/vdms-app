import { z } from 'zod';

/**
 * Central, validated access to environment variables.
 * Fails fast at startup if required configuration is missing or malformed,
 * so misconfiguration never surfaces as a confusing runtime error later.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
  VITE_APP_VERSION: z.string().default('0.0.0'),
  VITE_ENVIRONMENT: z.enum(['development', 'testing', 'production']).default('development'),
  VITE_APP_TIMEZONE: z.string().default('Europe/Moscow'),
  VITE_SESSION_TIMEOUT_MINUTES: z.coerce.number().int().positive().default(30),
  VITE_SESSION_WARNING_MINUTES: z.coerce.number().int().positive().default(5),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

const data = parsed.data;

export const env = {
  supabaseUrl: data.VITE_SUPABASE_URL,
  supabaseAnonKey: data.VITE_SUPABASE_ANON_KEY,
  appVersion: data.VITE_APP_VERSION,
  environment: data.VITE_ENVIRONMENT,
  timezone: data.VITE_APP_TIMEZONE,
  sessionTimeoutMinutes: data.VITE_SESSION_TIMEOUT_MINUTES,
  sessionWarningMinutes: data.VITE_SESSION_WARNING_MINUTES,
  isProduction: data.VITE_ENVIRONMENT === 'production',
  isDevelopment: data.VITE_ENVIRONMENT === 'development',
} as const;

export type Env = typeof env;
