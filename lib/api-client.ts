export interface ApiEnvelope<T> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return typeof value === 'object' && value !== null && ('success' in value || 'error' in value || 'data' in value)
}

export async function apiRequestRaw<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  const payload: unknown = await response.json()

  if (!response.ok) {
    const errorMessage =
      isApiEnvelope<unknown>(payload) && typeof payload.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}`
    throw new ApiError(errorMessage, response.status)
  }

  if (isApiEnvelope<T>(payload) && payload.success === false) {
    throw new ApiError(payload.error || 'Request failed', response.status)
  }

  return payload as T
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const payload = await apiRequestRaw<T | ApiEnvelope<T>>(path, init)

  if (isApiEnvelope<T>(payload)) {
    if (payload.success === false) {
      throw new ApiError(payload.error || 'Request failed', 500)
    }

    if ('data' in payload) {
      return payload.data as T
    }
  }

  return payload as T
}
