import type { Metadata } from 'next'
import { Manrope, Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const manrope = Manrope({ subsets: ["latin"], variable: '--font-heading' });
const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'University of Perpetual Help System - Manila',
  description: 'University Leave Balance Tracking and Management System',
  icons: {
    icon: [
      {
        url: '/logo.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/logo.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/logo.png',
        type: 'image/png',
      },
    ],
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${inter.variable} bg-background`}>
      <head>
        <meta name="theme-color" content="#1A1D2E" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#F8F9FB" media="(prefers-color-scheme: light)" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
