import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
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
