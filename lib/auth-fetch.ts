import { getAuthToken, BACKEND_URL } from './api-client'
import { ApiError, parseApiError } from './api-error'

export interface AuthFetchOptions extends RequestInit {
  throwOnError?: boolean
}

export const authFetch = async (
  url: string,
  options: AuthFetchOptions = {}
): Promise<Response> => {
  const { throwOnError = false, ...fetchOptions } = options
  const token = await getAuthToken()

  if (!token) {
    if (throwOnError) {
      throw new ApiError({ error: 'Not authenticated', code: 'AUTH_001' }, 401)
    }
    throw new Error('Not authenticated')
  }

  const isFormData = fetchOptions.body instanceof FormData

  let hasContentType = false
  if (fetchOptions.headers) {
    if (fetchOptions.headers instanceof Headers) {
      hasContentType = fetchOptions.headers.has('Content-Type') || fetchOptions.headers.has('content-type')
    } else if (Array.isArray(fetchOptions.headers)) {
      hasContentType = fetchOptions.headers.some(([key]) =>
        key.toLowerCase() === 'content-type'
      )
    } else {
      hasContentType = 'Content-Type' in fetchOptions.headers || 'content-type' in fetchOptions.headers
    }
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    ...(fetchOptions.headers instanceof Headers
      ? Object.fromEntries(fetchOptions.headers.entries())
      : Array.isArray(fetchOptions.headers)
        ? Object.fromEntries(fetchOptions.headers)
        : fetchOptions.headers || {}),
  }

  if (!isFormData && !hasContentType) {
    headers['Content-Type'] = 'application/json'
  }

  const cleanBackendUrl = (BACKEND_URL || '').replace(/\/$/, '')

  const absoluteUrl = url.startsWith('http')
    ? url
    : url.startsWith('/api')
      ? `${cleanBackendUrl}${url.substring(4)}`
      : url.startsWith('/')
        ? `${cleanBackendUrl}${url}`
        : `${cleanBackendUrl}/${url}`

  const response = await fetch(absoluteUrl, {
    ...fetchOptions,
    headers,
  })


  if (throwOnError && !response.ok) {
    const error = await parseApiError(response)

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }

    throw error
  }

  return response
}

export async function authFetchJson<T>(
  url: string,
  options: Omit<AuthFetchOptions, 'throwOnError'> = {}
): Promise<T> {
  const response = await authFetch(url, { ...options, throwOnError: true })
  return response.json()
}


export async function getErrorFromResponse(response: Response): Promise<{ error: string; code?: string; details?: string }> {
  try {
    return await response.json()
  } catch {
    return { error: 'An unexpected error occurred' }
  }
}
