import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET user settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id }
    })

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          // All defaults are set in the schema
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH update user settings
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const updates = await req.json()

    // Validate updates with proper typing
    const allowedFields = [
      'filter', 'sortBy', 'priorityFirst', 'advancedRecommendations', 'statsForNerds', 'hideScheduledTasks',
      'numCategories', 'useCustomBase', 'customBase', 'useHalfWeight',
      'lastRecommendedTodoId', 'lastRecommendationTime',
      'lastRandomNumber', 'lastSelectedCategory', 'lastGeneratedSum', 
      'lastGeneratedRandomValue', 'lastGeneratedAt', 'lastSettingsSnapshot'
    ] as const

    const filteredUpdates: any = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedFields.includes(key as any))
    )

    // Validate specific fields
    if (filteredUpdates.filter && !['all', 'active', 'completed', 'overdue'].includes(filteredUpdates.filter as string)) {
      return NextResponse.json({ error: 'Invalid filter value' }, { status: 400 })
    }

    if (filteredUpdates.sortBy && !['created', 'dueDate'].includes(filteredUpdates.sortBy as string)) {
      return NextResponse.json({ error: 'Invalid sortBy value' }, { status: 400 })
    }

    if (filteredUpdates.numCategories && (typeof filteredUpdates.numCategories === 'number' && (filteredUpdates.numCategories < 2 || filteredUpdates.numCategories > 10))) {
      return NextResponse.json({ error: 'numCategories must be between 2 and 10' }, { status: 400 })
    }

    if (filteredUpdates.customBase && (typeof filteredUpdates.customBase === 'number' && (filteredUpdates.customBase < 0.1 || filteredUpdates.customBase > 20))) {
      return NextResponse.json({ error: 'customBase must be between 0.1 and 20' }, { status: 400 })
    }

    // Convert date strings to Date objects
    if (filteredUpdates.lastRecommendationTime && typeof filteredUpdates.lastRecommendationTime === 'string') {
      filteredUpdates.lastRecommendationTime = new Date(filteredUpdates.lastRecommendationTime)
    }
    if (filteredUpdates.lastGeneratedAt && typeof filteredUpdates.lastGeneratedAt === 'string') {
      filteredUpdates.lastGeneratedAt = new Date(filteredUpdates.lastGeneratedAt)
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: filteredUpdates,
      create: {
        userId: session.user.id,
        ...filteredUpdates,
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating user settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}