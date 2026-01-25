import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

/**
 * TYPOGRAPHY - Rententio Brand Fonts
 * Per Lightweight Brand Kit typography section
 */
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

/**
 * METADATA - Rententio Brand
 * Per Lightweight Brand Kit: retention-first positioning
 */
export const metadata: Metadata = {
  title: 'Rententio - AI Video Editing That Keeps Viewers Watching',
  description: 'Upload clips and get a retention-optimized cut in minutes. AI-powered video editor focused on improving viewer retention.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
