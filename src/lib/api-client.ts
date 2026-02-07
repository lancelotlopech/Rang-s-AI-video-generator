/**
 * Unified API client with retry logic
 */

export interface FetchWithRetryOptions extends RequestInit {
  maxRetries?: number
  retryDelay?: number
  retryOn?: (response: Response) => boolean
}

const DEFAULT_MAX_RETRIES = 3
const DEFAULT_RETRY_DELAY = 2000

/**
 * Fetch with automatic retry for transient errors
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    retryOn = defaultRetryCondition,
    ...fetchOptions
  } = options

  let lastError: Error | null = null
  let lastResponse: Response | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[API_CLIENT] Retry attempt ${attempt + 1}/${maxRetries}...`)
        await sleep(retryDelay)
      }

      const response = await fetch(url, fetchOptions)

      if (response.ok) {
        return response
      }

      lastResponse = response

      // Check if we should retry
      if (!retryOn(response)) {
        return response // Don't retry, return as-is
      }

      console.warn(`[API_CLIENT] Request failed with ${response.status}, will retry...`)
    } catch (error) {
      console.error(`[API_CLIENT] Network error on attempt ${attempt + 1}:`, error)
      lastError = error as Error
    }
  }

  // All retries exhausted
  if (lastResponse) {
    return lastResponse
  }

  throw lastError || new Error('Max retries reached with no response')
}

/**
 * Default retry condition: retry on 429 (rate limit) or 5xx (server errors)
 */
function defaultRetryCondition(response: Response): boolean {
  return response.status === 429 || response.status >= 500
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * JSON POST helper with retry
 */
export async function postJSON<T = unknown>(
  url: string,
  body: unknown,
  options: Omit<FetchWithRetryOptions, 'method' | 'body'> & { headers?: Record<string, string> } = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
      ...options,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        data: null,
        error: errorText || `HTTP ${response.status}`,
        status: response.status,
      }
    }

    const data = await response.json()
    return { data, error: null, status: response.status }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 0,
    }
  }
}

/**
 * Create an API client with base URL and default headers
 */
export function createAPIClient(baseURL: string, defaultHeaders: Record<string, string> = {}) {
  return {
    post: <T = unknown>(path: string, body: unknown, options: Omit<FetchWithRetryOptions, 'method' | 'body'> = {}) =>
      postJSON<T>(`${baseURL}${path}`, body, {
        ...options,
        headers: { ...defaultHeaders, ...(options.headers as Record<string, string>) },
      }),

    get: async <T = unknown>(path: string, options: Omit<FetchWithRetryOptions, 'method' | 'body'> = {}) => {
      try {
        const response = await fetchWithRetry(`${baseURL}${path}`, {
          method: 'GET',
          headers: { ...defaultHeaders, ...(options.headers as Record<string, string>) },
          ...options,
        })

        if (!response.ok) {
          const errorText = await response.text()
          return {
            data: null as T | null,
            error: errorText || `HTTP ${response.status}`,
            status: response.status,
          }
        }

        const data = await response.json()
        return { data: data as T, error: null, status: response.status }
      } catch (error) {
        return {
          data: null as T | null,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 0,
        }
      }
    },
  }
}
