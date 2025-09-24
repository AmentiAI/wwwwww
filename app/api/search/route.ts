import { NextRequest, NextResponse } from 'next/server'
import { searchGoogle } from '@/lib/google-search'

// Force dynamic rendering and prevent static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const dynamicParams = true

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Check for build environment
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ error: 'Build phase - not executed' }, { status: 400 })
    }
    
    // Require ?run=1 to prevent build-time execution
    if (searchParams.get('run') !== '1') {
      return NextResponse.json({ error: 'Add ?run=1 to execute' }, { status: 400 })
    }
  } catch (buildError) {
    return NextResponse.json({ error: 'Build-time error prevented' }, { status: 400 })
  }
  
  return NextResponse.json({ message: 'This endpoint only accepts POST requests' }, { status: 405 })
}

export async function POST(request: NextRequest) {
  let searchParams: URLSearchParams
  try {
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
    return NextResponse.json({ error: 'Build-time error prevented' }, { status: 400 })
  }
  
  try {
    
    const { query, numResults } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Default to 100 results (10 pages deep) if not specified
    const requestedResults = numResults || 100
    console.log(`Searching for "${query}" with ${requestedResults} results requested`)
    
    const results = await searchGoogle(query, requestedResults)
    
    console.log(`Returning ${results.length} results to client`)
    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
}
