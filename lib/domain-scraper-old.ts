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
  }
  contentAnalysis: {
    wordCount: number
    hasBlog: boolean
    hasNews: boolean
    hasPortfolio: boolean
    hasTestimonials: boolean
  }
  recommendations: string[]
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

export async function scrapeDomainForEmails(domain: string): Promise<ScrapedEmail[]> {
  const emails: ScrapedEmail[] = []
  const baseUrl = `https://${domain}`
  
  // Common contact/about page paths
  const contactPaths = [
    '',
    '/contact',
    '/contact-us',
    '/about',
    '/about-us',
    '/contact.html',
    '/about.html',
  ]

  for (const path of contactPaths.slice(0, 3)) { // Limit to 3 pages as requested
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
      const text = html.replace(/<[^>]*>/g, ' ') // Simple HTML tag removal
      const foundEmails = extractEmailsFromText(text)

      for (const email of foundEmails) {
        emails.push({
          email: email.toLowerCase(),
          domain,
          foundOn: url,
        })
      }

      // Also check for email links using regex
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

    } catch (error) {
      console.log(`Failed to scrape ${domain}${path}:`, error.message)
      continue
    }
  }

  return emails
}

export function extractPhones(text: string): string[] {
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g
  return text.match(phoneRegex) || []
}

export function extractAddresses(text: string): string[] {
  // Simple address detection - looks for common address patterns
  const addressRegex = /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Place|Pl)/gi
  return text.match(addressRegex) || []
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
      mobileFriendly: false
    },
    contentAnalysis: {
      wordCount: 0,
      hasBlog: false,
      hasNews: false,
      hasPortfolio: false,
      hasTestimonials: false
    },
    recommendations: [],
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
    const text = html.replace(/<[^>]*>/g, ' ') // Simple HTML tag removal

    // Basic page info using regex
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    analysis.title = titleMatch ? titleMatch[1].trim() : 'No title found'
    
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
    analysis.description = descMatch ? descMatch[1].trim() : ''
    
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']*)["']/i)
    analysis.keywords = keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : []

    // Social media links using regex
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

    // Technical analysis using regex
    analysis.technicalInfo.hasContactForm = /<form[^>]*>/i.test(html)
    analysis.technicalInfo.hasAboutPage = /<a[^>]*href=["'][^"']*about[^"']*["'][^>]*>/i.test(html)
    analysis.technicalInfo.hasPrivacyPolicy = /<a[^>]*href=["'][^"']*privacy[^"']*["'][^>]*>/i.test(html)
    analysis.technicalInfo.hasTermsOfService = /<a[^>]*href=["'][^"']*terms[^"']*["'][^>]*>/i.test(html)
    analysis.technicalInfo.mobileFriendly = /<meta[^>]*name=["']viewport["'][^>]*>/i.test(html)

    // Content analysis
    analysis.contentAnalysis.wordCount = text.split(/\s+/).length
    analysis.contentAnalysis.hasBlog = /<a[^>]*href=["'][^"']*blog[^"']*["'][^>]*>/i.test(html)
    analysis.contentAnalysis.hasNews = /<a[^>]*href=["'][^"']*news[^"']*["'][^>]*>/i.test(html)
    analysis.contentAnalysis.hasPortfolio = /<a[^>]*href=["'][^"']*portfolio[^"']*["'][^>]*>/i.test(html)
    analysis.contentAnalysis.hasTestimonials = /testimonial|review/i.test(text)

    // Generate recommendations
    analysis.recommendations = generateRecommendations(analysis)

  } catch (error) {
    console.error(`Failed to analyze ${url}:`, error)
    analysis.recommendations.push('Unable to fully analyze website - check if site is accessible')
  }

  return analysis
}

function generateRecommendations(analysis: SiteAnalysis): string[] {
  const recommendations: string[] = []

  if (!analysis.technicalInfo.hasSSL) {
    recommendations.push('🔒 Consider implementing SSL certificate for better security and SEO')
  }

  if (!analysis.technicalInfo.hasContactForm) {
    recommendations.push('📧 Add a contact form to make it easier for customers to reach you')
  }

  if (!analysis.technicalInfo.hasAboutPage) {
    recommendations.push('ℹ️ Create an "About Us" page to build trust with visitors')
  }

  if (!analysis.technicalInfo.hasPrivacyPolicy) {
    recommendations.push('📋 Add a privacy policy page for legal compliance')
  }

  if (!analysis.technicalInfo.mobileFriendly) {
    recommendations.push('📱 Optimize website for mobile devices')
  }

  if (analysis.technicalInfo.pageLoadSpeed === 'slow') {
    recommendations.push('⚡ Improve page loading speed for better user experience')
  }

  if (analysis.contactInfo.emails.length === 0) {
    recommendations.push('📬 Add contact email address to your website')
  }

  if (analysis.contactInfo.phones.length === 0) {
    recommendations.push('📞 Display phone number for customer inquiries')
  }

  if (analysis.contentAnalysis.wordCount < 300) {
    recommendations.push('📝 Add more content to improve SEO and provide value to visitors')
  }

  if (!analysis.contentAnalysis.hasBlog) {
    recommendations.push('📰 Consider adding a blog to share industry insights and improve SEO')
  }

  if (Object.keys(analysis.socialMedia).length === 0) {
    recommendations.push('🔗 Add social media links to increase engagement')
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Your website looks well-optimized!')
  }

  return recommendations
}
