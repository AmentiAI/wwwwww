import { NextRequest, NextResponse } from 'next/server'
import { searchGoogle } from '@/lib/google-search'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ message: 'This endpoint only accepts POST requests' }, { status: 405 })
}

export async function POST(request: NextRequest) {
  try {
    const { query, numResults } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const results = await searchGoogle(query, numResults || 10)
    
    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
}
