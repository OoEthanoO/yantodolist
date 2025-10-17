import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST save algorithm results
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      randomNumber,
      selectedCategory,
      generatedSum,
      generatedRandomValue,
      generatedAt,
      settingsSnapshot
    } = await req.json()

    // Validate required fields
    if (
      typeof randomNumber !== 'number' ||
      typeof selectedCategory !== 'number' ||
      typeof generatedSum !== 'number' ||
      typeof generatedRandomValue !== 'number' ||
      !generatedAt ||
      !settingsSnapshot
    ) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      )
    }

    const parsedGeneratedAt = new Date(generatedAt)

    // Save algorithm results to settings
    await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        lastRandomNumber: randomNumber,
        lastSelectedCategory: selectedCategory,
        lastGeneratedSum: generatedSum,
        lastGeneratedRandomValue: generatedRandomValue,
        lastGeneratedAt: parsedGeneratedAt,
        lastSettingsSnapshot: settingsSnapshot,
      },
      create: {
        userId: session.user.id,
        lastRandomNumber: randomNumber,
        lastSelectedCategory: selectedCategory,
        lastGeneratedSum: generatedSum,
        lastGeneratedRandomValue: generatedRandomValue,
        lastGeneratedAt: parsedGeneratedAt,
        lastSettingsSnapshot: settingsSnapshot,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Algorithm results saved successfully'
    })

  } catch (error) {
    console.error('Error saving algorithm results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}