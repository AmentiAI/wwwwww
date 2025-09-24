import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AnalysisProvider } from '@/contexts/AnalysisContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Domain Email Scraper',
  description: 'Search, scrape, and outreach tool for domain emails',
}
  
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AnalysisProvider>
          {children}
        </AnalysisProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
