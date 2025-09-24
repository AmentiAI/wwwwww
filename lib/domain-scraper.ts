import axios from 'axios'

export interface ScrapedEmail {
  email: string
  domain: string
  foundOn: string
}

export interface SiteAnalysis {
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

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return ''
  }
}

export function extractEmailsFromText(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  return text.match(emailRegex) || []
}

export function extractPhones(text: string): string[] {
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g
  return text.match(phoneRegex) || []
}

export function extractAddresses(text: string): string[] {
  const addressRegex = /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Place|Pl)/gi
  return text.match(addressRegex) || []
}

export async function scrapeDomainForEmails(domain: string): Promise<ScrapedEmail[]> {
  const emails: ScrapedEmail[] = []
  const baseUrl = `https://${domain}`
  
  const contactPaths = [
    '',
    '/contact',
    '/contact-us',
    '/about',
    '/about-us',
    '/contact.html',
    '/about.html',
  ]

  for (const path of contactPaths.slice(0, 3)) {
    try {
      const url = `${baseUrl}${path}`
      console.log(`Scraping: ${url}`)
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      const html = response.data
      const text = html.replace(/<[^>]*>/g, ' ')
      const foundEmails = extractEmailsFromText(text)

      for (const email of foundEmails) {
        emails.push({
          email: email.toLowerCase(),
          domain,
          foundOn: url,
        })
      }

      const mailtoMatches = html.match(/<a[^>]*href=["']mailto:([^"']*)["'][^>]*>/gi)
      if (mailtoMatches) {
        for (const match of mailtoMatches) {
          const emailMatch = match.match(/mailto:([^"'\s&]+)/i)
          if (emailMatch) {
            const email = emailMatch[1].toLowerCase()
            if (email.includes('@')) {
              emails.push({
                email,
                domain,
                foundOn: url,
              })
            }
          }
        }
      }

    } catch (error: any) {
      console.log(`Failed to scrape ${domain}${path}:`, error.message)
      continue
    }
  }

  return emails
}

export async function analyzeWebsite(url: string): Promise<SiteAnalysis> {
  const domain = extractDomain(url)
  const analysis: SiteAnalysis = {
    domain,
    title: '',
    description: '',
    keywords: [],
    socialMedia: {},
    contactInfo: {
      emails: [],
      phones: [],
      addresses: []
    },
    technicalInfo: {
      hasSSL: url.startsWith('https://'),
      hasContactForm: false,
      hasAboutPage: false,
      hasPrivacyPolicy: false,
      hasTermsOfService: false,
      pageLoadSpeed: 'medium',
      mobileFriendly: false,
      hasGoogleAnalytics: false,
      hasFacebookPixel: false,
      hasChatWidget: false,
      hasNewsletter: false
    },
    contentAnalysis: {
      wordCount: 0,
      hasBlog: false,
      hasNews: false,
      hasPortfolio: false,
      hasTestimonials: false,
      hasFAQ: false,
      hasPricing: false,
      hasGallery: false
    },
    seoAnalysis: {
      hasMetaDescription: false,
      hasMetaKeywords: false,
      hasOpenGraph: false,
      hasTwitterCards: false,
      hasCanonical: false,
      hasRobotsTxt: false,
      hasSitemap: false
    },
    recommendations: [],
    priorityFixes: [],
    scrapedAt: new Date().toISOString()
  }

  try {
    const startTime = Date.now()
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    const loadTime = Date.now() - startTime
    analysis.technicalInfo.pageLoadSpeed = loadTime < 2000 ? 'fast' : loadTime < 5000 ? 'medium' : 'slow'

    const html = response.data
    const text = html.replace(/<[^>]*>/g, ' ')

    // Basic page info
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    analysis.title = titleMatch ? titleMatch[1].trim() : 'No title found'
    
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
    analysis.description = descMatch ? descMatch[1].trim() : ''
    analysis.seoAnalysis.hasMetaDescription = !!descMatch
    
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']*)["']/i)
    analysis.keywords = keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : []
    analysis.seoAnalysis.hasMetaKeywords = !!keywordsMatch

    // Social media links
    const facebookMatch = html.match(/<a[^>]*href=["']([^"']*facebook\.com[^"']*)["'][^>]*>/i)
    if (facebookMatch) analysis.socialMedia.facebook = facebookMatch[1]
    
    const twitterMatch = html.match(/<a[^>]*href=["']([^"']*(?:twitter\.com|x\.com)[^"']*)["'][^>]*>/i)
    if (twitterMatch) analysis.socialMedia.twitter = twitterMatch[1]
    
    const linkedinMatch = html.match(/<a[^>]*href=["']([^"']*linkedin\.com[^"']*)["'][^>]*>/i)
    if (linkedinMatch) analysis.socialMedia.linkedin = linkedinMatch[1]
    
    const instagramMatch = html.match(/<a[^>]*href=["']([^"']*instagram\.com[^"']*)["'][^>]*>/i)
    if (instagramMatch) analysis.socialMedia.instagram = instagramMatch[1]

    // Contact information
    analysis.contactInfo.emails = extractEmailsFromText(text)
    analysis.contactInfo.phones = extractPhones(text)
    analysis.contactInfo.addresses = extractAddresses(text)

    // Technical analysis
    analysis.technicalInfo.hasContactForm = /<form[^>]*>/i.test(html)
    analysis.technicalInfo.hasAboutPage = /<a[^>]*href=["'][^"']*about[^"']*["'][^>]*>/i.test(html)
    analysis.technicalInfo.hasPrivacyPolicy = /<a[^>]*href=["'][^"']*privacy[^"']*["'][^>]*>/i.test(html)
    analysis.technicalInfo.hasTermsOfService = /<a[^>]*href=["'][^"']*terms[^"']*["'][^>]*>/i.test(html)
    analysis.technicalInfo.mobileFriendly = /<meta[^>]*name=["']viewport["'][^>]*>/i.test(html)
    analysis.technicalInfo.hasGoogleAnalytics = /google-analytics|gtag|ga\(/i.test(html)
    analysis.technicalInfo.hasFacebookPixel = /facebook.*pixel|fbq\(/i.test(html)
    analysis.technicalInfo.hasChatWidget = /chat|livechat|intercom|zendesk/i.test(html)
    analysis.technicalInfo.hasNewsletter = /newsletter|subscribe|mailchimp/i.test(html)

    // Content analysis
    analysis.contentAnalysis.wordCount = text.split(/\s+/).length
    analysis.contentAnalysis.hasBlog = /<a[^>]*href=["'][^"']*blog[^"']*["'][^>]*>/i.test(html)
    analysis.contentAnalysis.hasNews = /<a[^>]*href=["'][^"']*news[^"']*["'][^>]*>/i.test(html)
    analysis.contentAnalysis.hasPortfolio = /<a[^>]*href=["'][^"']*portfolio[^"']*["'][^>]*>/i.test(html)
    analysis.contentAnalysis.hasTestimonials = /testimonial|review/i.test(text)
    analysis.contentAnalysis.hasFAQ = /<a[^>]*href=["'][^"']*faq[^"']*["'][^>]*>/i.test(html)
    analysis.contentAnalysis.hasPricing = /<a[^>]*href=["'][^"']*pricing[^"']*["'][^>]*>/i.test(html)
    analysis.contentAnalysis.hasGallery = /<a[^>]*href=["'][^"']*gallery[^"']*["'][^>]*>/i.test(html)

    // SEO analysis
    analysis.seoAnalysis.hasOpenGraph = /<meta[^>]*property=["']og:/i.test(html)
    analysis.seoAnalysis.hasTwitterCards = /<meta[^>]*name=["']twitter:/i.test(html)
    analysis.seoAnalysis.hasCanonical = /<link[^>]*rel=["']canonical["'][^>]*>/i.test(html)

    // Generate recommendations and priority fixes
    const { recommendations, priorityFixes } = generateDetailedRecommendations(analysis)
    analysis.recommendations = recommendations
    analysis.priorityFixes = priorityFixes

  } catch (error) {
    console.error(`Failed to analyze ${url}:`, error)
    analysis.recommendations.push('Unable to fully analyze website - check if site is accessible')
    analysis.priorityFixes.push('Fix website accessibility issues')
  }

  return analysis
}

function generateDetailedRecommendations(analysis: SiteAnalysis): { recommendations: string[], priorityFixes: string[] } {
  const recommendations: string[] = []
  const priorityFixes: string[] = []

  // Priority fixes (critical issues)
  if (!analysis.technicalInfo.hasSSL) {
    priorityFixes.push('🔒 CRITICAL: Implement SSL certificate immediately - affects security and SEO rankings')
  }

  if (!analysis.seoAnalysis.hasMetaDescription) {
    priorityFixes.push('📝 HIGH: Add meta description tag - essential for search engine results')
  }

  if (analysis.technicalInfo.pageLoadSpeed === 'slow') {
    priorityFixes.push('⚡ HIGH: Optimize page loading speed - affects user experience and SEO')
  }

  if (!analysis.technicalInfo.mobileFriendly) {
    priorityFixes.push('📱 HIGH: Add responsive design viewport meta tag - critical for mobile users')
  }

  if (analysis.contactInfo.emails.length === 0) {
    priorityFixes.push('📧 MEDIUM: Add contact email address - customers need a way to reach you')
  }

  // Detailed recommendations
  if (!analysis.technicalInfo.hasContactForm) {
    recommendations.push('📧 Add a contact form to make it easier for customers to reach you')
  }

  if (!analysis.technicalInfo.hasAboutPage) {
    recommendations.push('ℹ️ Create an "About Us" page to build trust and credibility with visitors')
  }

  if (!analysis.technicalInfo.hasPrivacyPolicy) {
    recommendations.push('📋 Add a privacy policy page for legal compliance and user trust')
  }

  if (!analysis.technicalInfo.hasTermsOfService) {
    recommendations.push('📄 Add terms of service page for legal protection')
  }

  if (analysis.contentAnalysis.wordCount < 300) {
    recommendations.push('📝 Add more content to improve SEO and provide value to visitors (currently only ' + analysis.contentAnalysis.wordCount + ' words)')
  }

  if (!analysis.contentAnalysis.hasBlog) {
    recommendations.push('📰 Consider adding a blog to share industry insights, improve SEO, and establish authority')
  }

  if (!analysis.contentAnalysis.hasTestimonials) {
    recommendations.push('⭐ Add customer testimonials or reviews to build social proof')
  }

  if (!analysis.contentAnalysis.hasFAQ) {
    recommendations.push('❓ Create an FAQ section to address common customer questions')
  }

  if (!analysis.contentAnalysis.hasPricing) {
    recommendations.push('💰 Add pricing information to help customers make decisions')
  }

  if (Object.keys(analysis.socialMedia).length === 0) {
    recommendations.push('🔗 Add social media links to increase engagement and brand visibility')
  }

  if (!analysis.technicalInfo.hasGoogleAnalytics) {
    recommendations.push('📊 Install Google Analytics to track website performance and user behavior')
  }

  if (!analysis.technicalInfo.hasChatWidget) {
    recommendations.push('💬 Consider adding a live chat widget for instant customer support')
  }

  if (!analysis.technicalInfo.hasNewsletter) {
    recommendations.push('📧 Add newsletter signup to build an email list for marketing')
  }

  if (!analysis.seoAnalysis.hasOpenGraph) {
    recommendations.push('🔗 Add Open Graph meta tags for better social media sharing')
  }

  if (!analysis.seoAnalysis.hasTwitterCards) {
    recommendations.push('🐦 Add Twitter Card meta tags for better Twitter sharing')
  }

  if (!analysis.seoAnalysis.hasCanonical) {
    recommendations.push('🔗 Add canonical URL tags to prevent duplicate content issues')
  }

  if (analysis.contactInfo.phones.length === 0) {
    recommendations.push('📞 Display phone number for customer inquiries')
  }

  if (analysis.contactInfo.addresses.length === 0) {
    recommendations.push('📍 Add business address for local SEO and customer trust')
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Your website looks well-optimized! Consider A/B testing for further improvements.')
  }

  return { recommendations, priorityFixes }
}
