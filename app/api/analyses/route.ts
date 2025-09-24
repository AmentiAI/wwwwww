import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const domainId = searchParams.get('domainId')

    if (domainId) {
      // Get specific analysis
      const analysis = await prisma.websiteAnalysis.findUnique({
        where: { domainId },
        include: {
          domain: true
        }
      })

      if (!analysis) {
        return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
      }

      return NextResponse.json({ analysis })
    } else {
      // Get all analyses
      const analyses = await prisma.websiteAnalysis.findMany({
        include: {
          domain: true
        },
        orderBy: { analysisDate: 'desc' }
      })

      return NextResponse.json({ analyses })
    }
  } catch (error) {
    console.error('Analyses API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    )
  }
}
