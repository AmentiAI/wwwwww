import { NextRequest, NextResponse } from 'next/server'
import { searchGoogle } from '@/lib/google-search'

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
