export interface ApiEnvelope<T> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

export interface OffsetPaginationMeta {
  total: number
  page: number
  pageSize: number
}

export interface PagePaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

export type PaginatedCollectionResponse<TCollectionKey extends string, TItem> = Record<TCollectionKey, TItem[]> &
  OffsetPaginationMeta

export interface ReportResponse<TData> extends ApiEnvelope<TData> {
  reportType: string
  filters: Record<string, string | null | undefined>
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
