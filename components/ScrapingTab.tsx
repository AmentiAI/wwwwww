'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Mail, Globe, Search, FileText, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAnalysis } from '@/contexts/AnalysisContext'

interface Domain {
  id: string
  url: string
  contacted: boolean
  emails: Email[]
  createdAt: string
}

interface Email {
  id: string
  address: string
  contacted: boolean
  createdAt: string
}

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

export default function ScrapingTab() {
  const { currentAnalysis, setCurrentAnalysis } = useAnalysis()
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [manualUrl, setManualUrl] = useState('')
  const [stats, setStats] = useState({
    totalDomains: 0,
    contactedDomains: 0,
    totalEmails: 0,
    contactedEmails: 0,
  })

  const fetchDomains = async (contacted?: boolean) => {
    setLoading(true)
    try {
      const url = contacted !== undefined 
        ? `/api/domains?contacted=${contacted}&includeEmails=true`
        : '/api/domains?includeEmails=true'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setDomains(data.domains)
        updateStats(data.domains)
      } else {
        toast.error(data.error || 'Failed to fetch domains')
      }
    } catch (error) {
      toast.error('Failed to fetch domains')
    } finally {
      setLoading(false)
    }
  }

  const updateStats = (domains: Domain[]) => {
    const totalDomains = domains.length
    const contactedDomains = domains.filter(d => d.contacted).length
    const totalEmails = domains.reduce((sum, d) => sum + d.emails.length, 0)
    const contactedEmails = domains.reduce((sum, d) => sum + d.emails.filter(e => e.contacted).length, 0)
    
    setStats({
      totalDomains,
      contactedDomains,
      totalEmails,
      contactedEmails,
    })
  }

  const analyzeWebsite = async () => {
    if (!manualUrl.trim()) {
      toast.error('Please enter a URL to analyze')
      return
    }

    setAnalyzing(true)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: manualUrl })
      })

      const data = await response.json()
      
      if (response.ok) {
        setCurrentAnalysis(data.analysis)
        toast.success('Website analysis completed!')
        // Refresh domains list to show new emails
        fetchDomains()
      } else {
        toast.error(data.error || 'Analysis failed')
      }
    } catch (error) {
      toast.error('Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const downloadReport = () => {
    if (!currentAnalysis) return

    const report = `
# Website Analysis Report for ${currentAnalysis.domain}

## Basic Information
- **Title**: ${currentAnalysis.title}
- **Description**: ${currentAnalysis.description}
- **Keywords**: ${currentAnalysis.keywords.join(', ') || 'None found'}
- **Analysis Date**: ${new Date(currentAnalysis.scrapedAt).toLocaleDateString()}

## Contact Information
- **Emails**: ${currentAnalysis.contactInfo.emails.join(', ') || 'None found'}
- **Phones**: ${currentAnalysis.contactInfo.phones.join(', ') || 'None found'}
- **Addresses**: ${currentAnalysis.contactInfo.addresses.join(', ') || 'None found'}

## Social Media
- **Facebook**: ${currentAnalysis.socialMedia.facebook || 'Not found'}
- **Twitter**: ${currentAnalysis.socialMedia.twitter || 'Not found'}
- **LinkedIn**: ${currentAnalysis.socialMedia.linkedin || 'Not found'}
- **Instagram**: ${currentAnalysis.socialMedia.instagram || 'Not found'}

## Technical Analysis
- **SSL Certificate**: ${currentAnalysis.technicalInfo.hasSSL ? '✅ Yes' : '❌ No'}
- **Contact Form**: ${currentAnalysis.technicalInfo.hasContactForm ? '✅ Yes' : '❌ No'}
- **About Page**: ${currentAnalysis.technicalInfo.hasAboutPage ? '✅ Yes' : '❌ No'}
- **Privacy Policy**: ${currentAnalysis.technicalInfo.hasPrivacyPolicy ? '✅ Yes' : '❌ No'}
- **Terms of Service**: ${currentAnalysis.technicalInfo.hasTermsOfService ? '✅ Yes' : '❌ No'}
- **Page Load Speed**: ${currentAnalysis.technicalInfo.pageLoadSpeed}
- **Mobile Friendly**: ${currentAnalysis.technicalInfo.mobileFriendly ? '✅ Yes' : '❌ No'}
- **Google Analytics**: ${currentAnalysis.technicalInfo.hasGoogleAnalytics ? '✅ Yes' : '❌ No'}
- **Facebook Pixel**: ${currentAnalysis.technicalInfo.hasFacebookPixel ? '✅ Yes' : '❌ No'}
- **Chat Widget**: ${currentAnalysis.technicalInfo.hasChatWidget ? '✅ Yes' : '❌ No'}
- **Newsletter**: ${currentAnalysis.technicalInfo.hasNewsletter ? '✅ Yes' : '❌ No'}

## Content Analysis
- **Word Count**: ${currentAnalysis.contentAnalysis.wordCount}
- **Has Blog**: ${currentAnalysis.contentAnalysis.hasBlog ? '✅ Yes' : '❌ No'}
- **Has News**: ${currentAnalysis.contentAnalysis.hasNews ? '✅ Yes' : '❌ No'}
- **Has Portfolio**: ${currentAnalysis.contentAnalysis.hasPortfolio ? '✅ Yes' : '❌ No'}
- **Has Testimonials**: ${currentAnalysis.contentAnalysis.hasTestimonials ? '✅ Yes' : '❌ No'}
- **Has FAQ**: ${currentAnalysis.contentAnalysis.hasFAQ ? '✅ Yes' : '❌ No'}
- **Has Pricing**: ${currentAnalysis.contentAnalysis.hasPricing ? '✅ Yes' : '❌ No'}
- **Has Gallery**: ${currentAnalysis.contentAnalysis.hasGallery ? '✅ Yes' : '❌ No'}

## SEO Analysis
- **Meta Description**: ${currentAnalysis.seoAnalysis.hasMetaDescription ? '✅ Yes' : '❌ No'}
- **Meta Keywords**: ${currentAnalysis.seoAnalysis.hasMetaKeywords ? '✅ Yes' : '❌ No'}
- **Open Graph**: ${currentAnalysis.seoAnalysis.hasOpenGraph ? '✅ Yes' : '❌ No'}
- **Twitter Cards**: ${currentAnalysis.seoAnalysis.hasTwitterCards ? '✅ Yes' : '❌ No'}
- **Canonical URL**: ${currentAnalysis.seoAnalysis.hasCanonical ? '✅ Yes' : '❌ No'}

## 🚨 PRIORITY FIXES (Address These First!)
${currentAnalysis.priorityFixes.map(fix => `- ${fix}`).join('\n')}

## 📋 RECOMMENDATIONS
${currentAnalysis.recommendations.map(rec => `- ${rec}`).join('\n')}

---
Generated by Domain Email Scraper
    `.trim()

    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentAnalysis.domain}-analysis-report.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    fetchDomains()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Domain Scraping & Analysis</h2>
        <p className="text-gray-600">Analyze websites manually or view scraped domains and emails</p>
      </div>

      {/* Manual Website Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Manual Website Analysis
        </h3>
        
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <input
              type="url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="Enter website URL (e.g., https://example.com)"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={analyzeWebsite}
            disabled={analyzing}
            className="btn-primary flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {analyzing ? 'Analyzing...' : 'Analyze Website'}
          </button>
        </div>

                {currentAnalysis && (
          <div className="mt-6 space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-gray-900">Analysis Report for {currentAnalysis.domain}</h4>
              <button
                onClick={downloadReport}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Basic Information</h5>
                <p className="text-sm text-gray-600 mb-1"><strong>Title:</strong> {currentAnalysis.title}</p>
                <p className="text-sm text-gray-600 mb-1"><strong>Description:</strong> {currentAnalysis.description || 'None'}</p>
                <p className="text-sm text-gray-600"><strong>Keywords:</strong> {currentAnalysis.keywords.join(', ') || 'None'}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Contact Information</h5>
                <p className="text-sm text-gray-600 mb-1"><strong>Emails:</strong> {currentAnalysis.contactInfo.emails.join(', ') || 'None found'}</p>
                <p className="text-sm text-gray-600 mb-1"><strong>Phones:</strong> {currentAnalysis.contactInfo.phones.join(', ') || 'None found'}</p>
                <p className="text-sm text-gray-600"><strong>Addresses:</strong> {currentAnalysis.contactInfo.addresses.join(', ') || 'None found'}</p>
              </div>
            </div>

            {/* Technical Analysis */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-3">Technical Analysis</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className={currentAnalysis.technicalInfo.hasSSL ? 'text-green-600' : 'text-red-600'}>
                    {currentAnalysis.technicalInfo.hasSSL ? '✅' : '❌'}
                  </span>
                  <span>SSL Certificate</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={currentAnalysis.technicalInfo.hasContactForm ? 'text-green-600' : 'text-red-600'}>
                    {currentAnalysis.technicalInfo.hasContactForm ? '✅' : '❌'}
                  </span>
                  <span>Contact Form</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={currentAnalysis.technicalInfo.hasAboutPage ? 'text-green-600' : 'text-red-600'}>
                    {currentAnalysis.technicalInfo.hasAboutPage ? '✅' : '❌'}
                  </span>
                  <span>About Page</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={currentAnalysis.technicalInfo.mobileFriendly ? 'text-green-600' : 'text-red-600'}>
                    {currentAnalysis.technicalInfo.mobileFriendly ? '✅' : '❌'}
                  </span>
                  <span>Mobile Friendly</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">⚡</span>
                  <span>Load Speed: {currentAnalysis.technicalInfo.pageLoadSpeed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">📝</span>
                  <span>Word Count: {currentAnalysis.contentAnalysis.wordCount}</span>
                </div>
              </div>
            </div>

            {/* Priority Fixes */}
            {currentAnalysis.priorityFixes.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h5 className="font-medium text-red-900 mb-3">🚨 Priority Fixes (Address These First!)</h5>
                <ul className="space-y-2">
                  {currentAnalysis.priorityFixes.map((fix, index) => (
                    <li key={index} className="text-sm text-red-800 bg-red-100 p-2 rounded">{fix}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-3">📋 Recommendations</h5>
              <ul className="space-y-1">
                {currentAnalysis.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-blue-800">{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total Domains</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">{stats.totalDomains}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Contacted</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-1">{stats.contactedDomains}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Total Emails</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 mt-1">{stats.totalEmails}</p>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Contacted</span>
          </div>
          <p className="text-2xl font-bold text-orange-900 mt-1">{stats.contactedEmails}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => fetchDomains()}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            loading ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          disabled={loading}
        >
          All
        </button>
        <button
          onClick={() => fetchDomains(false)}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            loading ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          disabled={loading}
        >
          Not Contacted
        </button>
        <button
          onClick={() => fetchDomains(true)}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            loading ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          disabled={loading}
        >
          Contacted
        </button>
        <button
          onClick={() => fetchDomains()}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Domains List */}
      <div className="space-y-4">
        {domains.map((domain) => (
          <div key={domain.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{domain.url}</span>
                {domain.contacted && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Contacted
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(domain.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            {domain.emails.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Emails ({domain.emails.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {domain.emails.map((email) => (
                    <div
                      key={email.id}
                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                        email.contacted ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Mail className="w-3 h-3" />
                      <span>{email.address}</span>
                      {email.contacted && (
                        <span className="text-xs bg-green-200 text-green-800 px-1 rounded">
                          Contacted
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {domains.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No domains found. Use the Search tab to find and scrape domains.
        </div>
      )}
    </div>
  )
}

