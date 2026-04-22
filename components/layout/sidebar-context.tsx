'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'sidebar-collapsed'

type SidebarContextValue = {
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
  toggleCollapsed: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsedState] = useState(false)
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)
    if (saved !== null) {
      setIsCollapsedState(saved === 'true')
    }
    setHasHydrated(true)
  }, [])

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isCollapsed))
    document.body.dataset.sidebarCollapsed = String(isCollapsed)

    return () => {
      delete document.body.dataset.sidebarCollapsed
    }
  }, [hasHydrated, isCollapsed])

  const value = useMemo<SidebarContextValue>(
    () => ({
      isCollapsed,
      setIsCollapsed: setIsCollapsedState,
      toggleCollapsed: () => setIsCollapsedState((current) => !current),
    }),
    [isCollapsed]
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebarLayout() {
  const context = useContext(SidebarContext)

  if (!context) {
    throw new Error('useSidebarLayout must be used within a SidebarProvider')
  }

  return context
}
