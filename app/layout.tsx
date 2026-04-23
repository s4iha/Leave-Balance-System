import type { Metadata } from 'next'
import { Manrope, Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const manrope = Manrope({ subsets: ["latin"], variable: '--font-heading' });
const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'University of Perpetual Help System - Manila',
  description: 'University Leave Balance Tracking and Management System',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
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
      <body className="font-sans antialiased bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
