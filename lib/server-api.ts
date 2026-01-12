import { NextRequest } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL && typeof window === "undefined" && process.env.NODE_ENV !== 'production') {
  console.warn("WARNING: BACKEND_URL is not defined in development")
}

export const getTokenFromRequest = async (request: NextRequest): Promise<string | null> => {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

export const proxyToBackend = async (
  request: NextRequest,
  endpoint: string,
  options: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
  } = {}
): Promise<Response> => {
  const token = await getTokenFromRequest(request)

  if (!token) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const cleanBackendUrl = (BACKEND_URL || '').replace(/\/$/, '')
  const absoluteUrl = `${cleanBackendUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  }

  const fetchOptions: RequestInit = {
    method: options.method || request.method,
  }

  if (options.body) {
    if (options.body instanceof FormData) {
      fetchOptions.body = options.body
    } else {
      headers['Content-Type'] = 'application/json'
      fetchOptions.body = JSON.stringify(options.body)
    }
  } else if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      const body = await request.json()
      headers['Content-Type'] = 'application/json'
      fetchOptions.body = JSON.stringify(body)
    } catch {
    }
  }

  fetchOptions.headers = headers

  try {
    const response = await fetch(absoluteUrl, fetchOptions)
    const data = await response.json().catch(() => ({ error: 'Invalid response' }))

    return Response.json(data, { status: response.status })
  } catch (error) {
    console.error('Error proxying to backend:', error)
    return Response.json(
      { error: 'Failed to connect to backend' },
      { status: 500 }
    )
  }
}

