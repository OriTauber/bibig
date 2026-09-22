import 'dotenv/config'
import { z } from 'zod'

const configSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3001),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Comma-separated allowlist. GOOGLE_CLIENT_ID remains supported for existing setups.
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_IDS: z.string().min(1).optional(),
  CORS_ORIGINS: z.string().default('http://localhost,http://localhost:5173,http://127.0.0.1:5173,https://localhost,capacitor://localhost'),
})

export type AppConfig = z.infer<typeof configSchema>
export function getConfig(environment = process.env): AppConfig { return configSchema.parse(environment) }
