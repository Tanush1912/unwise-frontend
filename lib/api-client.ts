import { supabase } from './supabase'

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL && typeof window === "undefined" && process.env.NODE_ENV !== 'production') {
  console.warn("WARNING: BACKEND_URL is not defined in development")
}

export interface ApiError {
  error: string
}

export const getAuthToken = async (retries = 3): Promise<string | null> => {
  try {
    const { data: { session: initialSession }, error } = await supabase.auth.getSession()

    if (error) {
      return null
    }

    let session = initialSession

    if (!session) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 200))
        return getAuthToken(retries - 1)
      }
      return null
    }

    if (!session.access_token) {
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError) {
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 200))
          return getAuthToken(retries - 1)
        }
        return null
      }

      session = refreshedSession
    }

    if (!session?.access_token) {
      return null
    }

    return session.access_token
  } catch {
    return null
  }
}

export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  const url = `${BACKEND_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export const apiRequestFormData = async <T = unknown>(
  endpoint: string,
  formData: FormData
): Promise<T> => {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  const url = `${BACKEND_URL}${endpoint}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

