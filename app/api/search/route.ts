import { NextRequest, NextResponse } from 'next/server'
import { searchGoogle } from '@/lib/google-search'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  return NextResponse.json({ message: 'This endpoint only accepts POST requests' }, { status: 405 })
}

export async function POST(request: NextRequest) {
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
