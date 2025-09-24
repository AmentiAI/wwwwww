import { NextRequest, NextResponse } from 'next/server'
import { analyzeWebsite, extractDomain } from '@/lib/domain-scraper'
import { prisma } from '@/lib/prisma'

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
    
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const domain = extractDomain(url)
    
    // Check if domain already exists
    let domainRecord = await prisma.domain.findUnique({
      where: { url: domain }
    })

    if (!domainRecord) {
      domainRecord = await prisma.domain.create({
        data: { url: domain }
      })
    }

    // Check if analysis already exists
    const existingAnalysis = await prisma.websiteAnalysis.findUnique({
      where: { domainId: domainRecord.id }
    })

    const analysis = await analyzeWebsite(url)

    // Save emails found during analysis
    for (const email of analysis.contactInfo.emails) {
      try {
        await prisma.email.upsert({
          where: { address: email },
          update: {},
          create: {
            address: email,
            domainId: domainRecord.id,
          }
        })
      } catch (error) {
        console.log(`Email ${email} already exists or failed to save`)
      }
    }

    // Save or update analysis in database
    const savedAnalysis = await prisma.websiteAnalysis.upsert({
      where: { domainId: domainRecord.id },
      update: {
        title: analysis.title,
        description: analysis.description,
        keywords: analysis.keywords,
        socialMedia: analysis.socialMedia,
        contactInfo: analysis.contactInfo,
        technicalInfo: analysis.technicalInfo,
        contentAnalysis: analysis.contentAnalysis,
        seoAnalysis: analysis.seoAnalysis,
        recommendations: analysis.recommendations,
        priorityFixes: analysis.priorityFixes,
        analysisDate: new Date(),
      },
      create: {
        domainId: domainRecord.id,
        title: analysis.title,
        description: analysis.description,
        keywords: analysis.keywords,
        socialMedia: analysis.socialMedia,
        contactInfo: analysis.contactInfo,
        technicalInfo: analysis.technicalInfo,
        contentAnalysis: analysis.contentAnalysis,
        seoAnalysis: analysis.seoAnalysis,
        recommendations: analysis.recommendations,
        priorityFixes: analysis.priorityFixes,
      }
    })
    
    return NextResponse.json({ 
      analysis,
      saved: true,
      analysisId: savedAnalysis.id
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Website analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze website' },
      { status: 500 }
    )
  }
}
