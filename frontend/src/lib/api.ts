import type { User as FirebaseUser } from 'firebase/auth'

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? '/api'
    : 'http://localhost:8000'

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  firebaseUser?: FirebaseUser | null,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (firebaseUser) {
    try {
      headers.set('Authorization', `Bearer ${await firebaseUser.getIdToken()}`)
    } catch {
      // Non-blocking token retrieval
    }
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const targetUrl = API_URL ? `${API_URL}${cleanPath}` : cleanPath

  let response: Response
  try {
    response = await fetch(targetUrl, {
      ...options,
      headers,
    })
  } catch (err: any) {
    // If external URL failed in browser, retry with relative path fallback
    if (API_URL && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      try {
        response = await fetch(cleanPath, {
          ...options,
          headers,
        })
      } catch {
        throw new Error('Unable to connect to Hiring Wallah services. Please check your connection.')
      }
    } else {
      throw new Error(`Connection error (${err.message || 'Failed to fetch'}). Please ensure backend services are active.`)
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const payload = await response.json()
      message = payload.detail || payload.message || message
    } catch {
      // Keep HTTP status message
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}
