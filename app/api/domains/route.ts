import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering and prevent static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const dynamicParams = true

export async function GET(request: NextRequest) {
  // Immediate build-time protection
  let searchParams: URLSearchParams
  try {
    // Multiple checks to prevent build-time execution
    searchParams = request.nextUrl.searchParams
    
    // Check for build environment
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ error: 'Build phase - not executed' }, { status: 400 })
    }
    
    // Require ?run=1 to prevent build-time execution
    if (searchParams.get('run') !== '1') {
      return NextResponse.json({ error: 'Add ?run=1 to execute' }, { status: 400 })
    }
  } catch (buildError) {
    // If anything fails during build, return immediately
    return NextResponse.json({ error: 'Build-time error prevented' }, { status: 400 })
  }
  
  try {
    // Lazy import prisma only when actually needed
    const { prisma } = await import('@/lib/prisma')
    
    const contacted = searchParams.get('contacted')
    const includeEmails = searchParams.get('includeEmails') === 'true'

    const where = contacted !== null ? { contacted: contacted === 'true' } : {}

    const domains = await prisma.domain.findMany({
      where,
      include: {
        emails: includeEmails ? {
          where: contacted !== null ? { contacted: contacted === 'true' } : {}
        } : false,
        analysis: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ domains })
  } catch (error) {
    console.error('Domains API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  // Immediate build-time protection
  let searchParams: URLSearchParams
  try {
    // Multiple checks to prevent build-time execution
    searchParams = request.nextUrl.searchParams
    
    // Check for build environment
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ error: 'Build phase - not executed' }, { status: 400 })
    }
    
    // Require ?run=1 to prevent build-time execution
    if (searchParams.get('run') !== '1') {
      return NextResponse.json({ error: 'Add ?run=1 to execute' }, { status: 400 })
    }
  } catch (buildError) {
    // If anything fails during build, return immediately
    return NextResponse.json({ error: 'Build-time error prevented' }, { status: 400 })
  }
  
  try {
    // Lazy import prisma only when actually needed
    const { prisma } = await import('@/lib/prisma')
    
    const domainId = searchParams.get('id')
    const deleteAll = searchParams.get('all') === 'true'

    if (deleteAll) {
      // Delete all domains and related data
      console.log('🗑️ DEV DEBUG: Deleting ALL domains and related data')
      
      // Delete in order due to foreign key constraints
      await prisma.email.deleteMany({})
      await prisma.websiteAnalysis.deleteMany({})
      await prisma.domain.deleteMany({})
      
      console.log('✅ DEV DEBUG: All domains, emails, and analyses deleted')
      return NextResponse.json({ 
        success: true, 
        message: 'All domains and related data deleted successfully' 
      })
    }

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 })
    }

    console.log(`🗑️ DEV DEBUG: Deleting domain ${domainId}`)

    // Delete domain and all related data (emails, analysis)
    const deletedDomain = await prisma.domain.delete({
      where: { id: domainId },
      include: {
        emails: true,
        analysis: true
      }
    })

    console.log(`✅ DEV DEBUG: Deleted domain ${deletedDomain.url} with ${deletedDomain.emails.length} emails`)

    return NextResponse.json({ 
      success: true, 
      message: `Domain ${deletedDomain.url} and related data deleted successfully`,
      deletedEmails: deletedDomain.emails.length,
      hadAnalysis: !!deletedDomain.analysis
    })
  } catch (error) {
    console.error('Delete domains API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete domain(s)' },
      { status: 500 }
    )
  }
}