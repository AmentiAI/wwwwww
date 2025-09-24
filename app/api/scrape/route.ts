import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractDomain, scrapeDomainForEmails } from '@/lib/domain-scraper'

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json()

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'URLs array is required' }, { status: 400 })
    }

    const results = {
      domainsProcessed: 0,
      emailsFound: 0,
      domainsAdded: 0,
      emailsAdded: 0,
    }

    // Extract unique domains from URLs
    const domains = [...new Set(urls.map(extractDomain).filter(Boolean))]
    
    for (const domain of domains) {
      try {
        results.domainsProcessed++

        // Check if domain already exists
        let domainRecord = await prisma.domain.findUnique({
          where: { url: domain }
        })

        if (!domainRecord) {
          domainRecord = await prisma.domain.create({
            data: { url: domain }
          })
          results.domainsAdded++
        }

        // Scrape for emails
        const scrapedEmails = await scrapeDomainForEmails(domain)
        
        for (const scrapedEmail of scrapedEmails) {
          try {
            results.emailsFound++

            // Check if email already exists
            const existingEmail = await prisma.email.findUnique({
              where: { address: scrapedEmail.email }
            })

            if (!existingEmail) {
              await prisma.email.create({
                data: {
                  address: scrapedEmail.email,
                  domainId: domainRecord.id,
                }
              })
              results.emailsAdded++
            }
          } catch (emailError) {
            console.error(`Failed to save email ${scrapedEmail.email}:`, emailError)
          }
        }

      } catch (domainError) {
        console.error(`Failed to process domain ${domain}:`, domainError)
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Scraping API error:', error)
    return NextResponse.json(
      { error: 'Failed to scrape domains' },
      { status: 500 }
    )
  }
}
