import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Script-Based Video Editor',
  description: 'AI-powered video editor with transcript-based editing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}