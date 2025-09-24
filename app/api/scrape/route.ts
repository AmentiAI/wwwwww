import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractDomain, scrapeDomainForEmails } from '@/lib/domain-scraper'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // Require ?run=1 to prevent build-time execution
  if (searchParams.get('run') !== '1') {
    return NextResponse.json({ error: 'Add ?run=1 to execute' }, { status: 400 })
  }
  
  return NextResponse.json({ message: 'This endpoint only accepts POST requests' }, { status: 405 })
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    
    // Require ?run=1 to prevent build-time execution
    if (searchParams.get('run') !== '1') {
      return NextResponse.json({ error: 'Add ?run=1 to execute' }, { status: 400 })
    }
    
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
    const domains = Array.from(new Set(urls.map(extractDomain).filter(Boolean)))
    console.log(`🚀 DEV DEBUG: Starting concurrent scraping of ${domains.length} domains`)
    
    // Process domains in batches of 10 concurrent scrapes
    const batchSize = 10
    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize)
      console.log(`📦 DEV DEBUG: Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(domains.length/batchSize)} (${batch.length} domains)`)
      
      // Process batch concurrently
      const batchPromises = batch.map(async (domain) => {
        try {
          console.log(`🔍 DEV DEBUG: Starting scrape of ${domain}`)
          
          // Check if domain already exists
          let domainRecord = await prisma.domain.findUnique({
            where: { url: domain }
          })

          if (!domainRecord) {
            domainRecord = await prisma.domain.create({
              data: { url: domain }
            })
            console.log(`➕ DEV DEBUG: Created new domain record for ${domain}`)
          } else {
            console.log(`♻️ DEV DEBUG: Using existing domain record for ${domain}`)
          }

          // Scrape for emails (pass prisma for DB checking)
          const scrapedEmails = await scrapeDomainForEmails(domain, prisma)
          console.log(`📧 DEV DEBUG: Found ${scrapedEmails.length} emails for ${domain}`)
          
          let domainEmailsAdded = 0
          for (const scrapedEmail of scrapedEmails) {
            try {
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
                domainEmailsAdded++
              }
            } catch (emailError) {
              console.error(`Failed to save email ${scrapedEmail.email}:`, emailError)
            }
          }

          console.log(`✅ DEV DEBUG: Completed ${domain} - added ${domainEmailsAdded} new emails`)
          
          return {
            domain,
            success: true,
            emailsFound: scrapedEmails.length,
            emailsAdded: domainEmailsAdded,
            wasNewDomain: !domainRecord || domainRecord.id
          }

        } catch (domainError) {
          console.error(`❌ DEV DEBUG: Failed to process domain ${domain}:`, domainError)
          return {
            domain,
            success: false,
            emailsFound: 0,
            emailsAdded: 0,
            wasNewDomain: false,
            error: domainError instanceof Error ? domainError.message : String(domainError)
          }
        }
      })

      // Wait for all domains in this batch to complete
      const batchResults = await Promise.all(batchPromises)
      
      // Update results
      for (const result of batchResults) {
        results.domainsProcessed++
        if (result.success) {
          if (result.wasNewDomain) results.domainsAdded++
          results.emailsFound += result.emailsFound
          results.emailsAdded += result.emailsAdded
        }
      }
      
      console.log(`🎯 DEV DEBUG: Batch completed. Progress: ${results.domainsProcessed}/${domains.length} domains`)
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
