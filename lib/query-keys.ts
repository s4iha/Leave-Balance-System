export const queryKeys = {
  users: {
    all: ['users'] as const,
    list: (params?: string) => ['users', 'list', params ?? ''] as const,
    history: (userId: string) => ['users', 'history', userId] as const,
  },
  departments: {
    all: ['departments'] as const,
    list: (params?: string) => ['departments', 'list', params ?? ''] as const,
    detail: (id: string) => ['departments', id] as const,
  },
  employees: {
    all: ['employees'] as const,
    list: (params?: string) => ['employees', 'list', params ?? ''] as const,
    detail: (id: string) => ['employees', id] as const,
  },
  leaveTypes: {
    all: ['leave-types'] as const,
    list: (params?: string) => ['leave-types', 'list', params ?? ''] as const,
    detail: (id: string) => ['leave-types', id] as const,
  },
  requests: {
    all: ['requests'] as const,
    list: (params?: string) => ['requests', 'list', params ?? ''] as const,
    detail: (id: string) => ['requests', id] as const,
    approvals: (params?: string) => ['requests', 'approvals', params ?? ''] as const,
    action: (id: string, action: string) => ['requests', id, 'action', action] as const,
  },
  adjustments: {
    all: ['adjustments'] as const,
    list: (params?: string) => ['adjustments', 'list', params ?? ''] as const,
    detail: (id: string) => ['adjustments', id] as const,
  },
  auditLogs: {
    all: ['audit-logs'] as const,
    list: (params?: string) => ['audit-logs', 'list', params ?? ''] as const,
  },
  reports: {
    all: ['reports'] as const,
    summary: (params?: string) => ['reports', 'summary', params ?? ''] as const,
    list: (params?: string) => ['reports', 'list', params ?? ''] as const,
  },
  balances: {
    all: ['balances'] as const,
    list: (params?: string) => ['balances', 'list', params ?? ''] as const,
    detail: (id: string) => ['balances', id] as const,
  },
  settings: {
    all: ['settings'] as const,
    list: (params?: string) => ['settings', 'list', params ?? ''] as const,
    detail: (key: string) => ['settings', key] as const,
  },
} as const
