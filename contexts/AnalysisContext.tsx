'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface SiteAnalysis {
  domain: string
  title: string
  description: string
  keywords: string[]
  socialMedia: {
    facebook?: string
    twitter?: string
    linkedin?: string
    instagram?: string
  }
  contactInfo: {
    emails: string[]
    phones: string[]
    addresses: string[]
  }
  technicalInfo: {
    hasSSL: boolean
    hasContactForm: boolean
    hasAboutPage: boolean
    hasPrivacyPolicy: boolean
    hasTermsOfService: boolean
    pageLoadSpeed: 'fast' | 'medium' | 'slow'
    mobileFriendly: boolean
    hasGoogleAnalytics: boolean
    hasFacebookPixel: boolean
    hasChatWidget: boolean
    hasNewsletter: boolean
  }
  contentAnalysis: {
    wordCount: number
    hasBlog: boolean
    hasNews: boolean
    hasPortfolio: boolean
    hasTestimonials: boolean
    hasFAQ: boolean
    hasPricing: boolean
    hasGallery: boolean
  }
  seoAnalysis: {
    hasMetaDescription: boolean
    hasMetaKeywords: boolean
    hasOpenGraph: boolean
    hasTwitterCards: boolean
    hasCanonical: boolean
    hasRobotsTxt: boolean
    hasSitemap: boolean
  }
  recommendations: string[]
  priorityFixes: string[]
  scrapedAt: string
}

interface AnalysisContextType {
  currentAnalysis: SiteAnalysis | null
  setCurrentAnalysis: (analysis: SiteAnalysis | null) => void
  clearAnalysis: () => void
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined)

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [currentAnalysis, setCurrentAnalysis] = useState<SiteAnalysis | null>(null)

  const clearAnalysis = () => {
    setCurrentAnalysis(null)
  }

  return (
    <AnalysisContext.Provider value={{
      currentAnalysis,
      setCurrentAnalysis,
      clearAnalysis
    }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis() {
  const context = useContext(AnalysisContext)
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider')
  }
  return context
}
