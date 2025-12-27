/**
 * Environment variable validation
 * Import this file early in the app lifecycle to fail fast on missing config
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

const optionalEnvVars = [
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
  'OPENAI_MODEL',
  'OPENAI_IMAGE_BASE_URL',
  'YUNWU_API_KEY',
  'YUNWU_BASE_URL',
] as const

type RequiredEnvVar = typeof requiredEnvVars[number]
type OptionalEnvVar = typeof optionalEnvVars[number]

interface EnvConfig {
  // Required
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  // Optional
  OPENAI_API_KEY?: string
  OPENAI_BASE_URL?: string
  OPENAI_MODEL?: string
  OPENAI_IMAGE_BASE_URL?: string
  YUNWU_API_KEY?: string
  YUNWU_BASE_URL?: string
}

function validateEnv(): EnvConfig {
  const missing: string[] = []

  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\nPlease check your .env.local file.`
    )
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    OPENAI_IMAGE_BASE_URL: process.env.OPENAI_IMAGE_BASE_URL,
    YUNWU_API_KEY: process.env.YUNWU_API_KEY,
    YUNWU_BASE_URL: process.env.YUNWU_BASE_URL,
  }
}

// Validate on import (server-side only)
let env: EnvConfig

if (typeof window === 'undefined') {
  env = validateEnv()
} else {
  // Client-side: only expose public vars
  env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  }
}

export { env }

/**
 * Helper to check if a feature is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_token_here')
}

export function isYunwuConfigured(): boolean {
  return !!(process.env.YUNWU_API_KEY && process.env.YUNWU_API_KEY !== 'sk-placeholder')
}
