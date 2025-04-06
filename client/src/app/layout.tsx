import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'InterviewIQ',
  description: 'Created by Luddy Students for Luddy Students',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light">
      <body>
        <main className="bg-background">
          {children}
        </main>
      </body>
    </html>
  )
}
