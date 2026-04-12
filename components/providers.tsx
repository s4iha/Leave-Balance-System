'use client'

import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from 'next-themes'
import { Analytics } from '@vercel/analytics/next'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </AuthProvider>
    </ThemeProvider>
  )
}
